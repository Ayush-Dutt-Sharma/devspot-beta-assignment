import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";
import InstanceCache from "@/lib/InstanceCache";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId, mode } = await request.json();

    if (!message || !mode) {
      return NextResponse.json(
        { error: "Message and mode are required" },
        { status: 400 }
      );
    }

    let conversation;
    let hackathonData;
    const supabase = await createAdminClient();
    if (conversationId) {
      const { data } = await supabase
        .from("conversations")
        .select("*, hackathons(*)")
        .eq("id", conversationId)
        .single();
      conversation = data;
      hackathonData = data?.hackathons;
    } else if (mode === "hackathon") {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", userId)
        .single();

      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const { data: newHackathon, error: hackathonError } = await supabase
        .from("hackathons")
        .insert({
          title: "Untitled Hackathon",
          status: "draft",
          creator_id: userData.id,
          event_size: 100,
          target_audience: "Developers",
          format: "virtual",
        })
        .select()
        .single();

      if (hackathonError) throw hackathonError;
      const { data: newConversation, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          user_id: userData.id,
          hackathon_id: newHackathon.id,
          current_step: "title + organization",
          conversation_data: {},
          method: "ai",
        })
        .select()
        .single();

      if (conversationError) throw conversationError;

      conversation = newConversation;
      hackathonData = newHackathon;
    }

    if (!conversation) {
      return NextResponse.json(
        { error: "Failed to create/find conversation" },
        { status: 500 }
      );
    }

    const memory = await InstanceCache.getConversationMemory(conversation.id);
    const conversationData = conversation.conversation_data || {};
    const currentStep = conversation.current_step || "title + organization";
    // Save user message to memory
    await memory.saveMessage("user", message);
    const extractor = InstanceCache.getExtractor();
    let extractedData: any = {};

    if (mode === "hackathon") {
      extractedData = await extractor.extractHackathonData(
        message,
        conversationData,
        hackathonData,
        currentStep
      );
    }

    const updatedData = { ...conversationData, ...extractedData };
    //@ts-ignore
    await memory.saveMessage("ai", extractedData);

    if (extractedData && Object.keys(extractedData).length > 0) {
      const {
        hackathon_data,
        shouldGoToNextStep,
        newInformationOrUpdate,
        clarificationQuestion,
        nextInformationQuestion,
        reasonForNextStepDecision,
        isComplete,
        nextPlannedStep,
        isHackathonDataComplete,
        isAllChallengesDataComplete,
        currentChallengeData,
        isHackathonStep,
        isChallengeStep,
        currentChallengeIndex,
        isPaymentRequired,
      } = extractedData;
      const {
        title,
        organization,
        registration_date,
        hacking_start,
        submission_deadline,
        total_budget,
      } = hackathon_data || {};

      await memory.updateCurrentStep(currentStep);

      if (!isHackathonDataComplete && isHackathonStep) {
        const hackathonUpdates: any = {};

        // Map conversation data to hackathon fields
        if (title) hackathonUpdates.title = title;
        if (organization) hackathonUpdates.organization = organization;
        if (registration_date)
          hackathonUpdates.registration_date = registration_date;
        if (hacking_start) hackathonUpdates.hacking_start = hacking_start;
        if (submission_deadline)
          hackathonUpdates.submission_deadline = submission_deadline;
        if (total_budget) {
          hackathonUpdates.total_budget = total_budget;
          hackathonUpdates.budget_currency = "USDC";
        }

        // Only update if we have changes
        if (Object.keys(hackathonUpdates).length > 0) {
          hackathonUpdates.updated_at = new Date().toISOString();

          await supabase
            .from("hackathons")
            .update(hackathonUpdates)
            .eq("id", hackathonData.id);
        }
      }
      if (isPaymentRequired) {
        const paymentSessionId = generatePaymentSessionId();
        return NextResponse.json({
          response:
            "Let's proceed to finalize your hackathon! You can review all the details and make any last adjustments before publishing.",
          conversationId: conversationId,
          currentStep: "payment_required",
          paymentRequired: true,
          paymentDetails: {
            sessionId: paymentSessionId,
            paymentUrl: `/api/payment/process/${paymentSessionId}`,
            amount: hackathonData?.total_budget || 20000,
            currency: "USDC",
            network: "base-sepolia",
            description: "Hackathon submission fee",
          },
          extractedData,
          hackathonData,
          message: "Please complete the payment to finalize your submission.",
        });
      }
      if (!isAllChallengesDataComplete && isChallengeStep) {
        if (
          currentChallengeData &&
          currentChallengeIndex !== null &&
          currentChallengeIndex !== undefined
        ) {
          const {
            title,
            judging_criteria,
            resources,
            prize_amount,
            sponsor,
            description,
          } = currentChallengeData;

          const { data: existingChallenges } = await supabase
            .from("challenges")
            .select("*")
            .eq("hackathon_id", hackathonData.id)
            .eq("order_index", currentChallengeIndex);

          const challengeData = {
            id: existingChallenges?.[0]?.id || undefined, // Include ID if updating
            hackathon_id: hackathonData.id,
            order_index: currentChallengeIndex,
            title: title || "Untitled Challenge",
            sponsor: sponsor || null,
            judging_criteria: judging_criteria || [],
            resources: resources || [],
            prize_amount: prize_amount || 1000,
            description: description || "",
            updated_at: new Date().toISOString(),
            created_at:
              existingChallenges?.[0]?.created_at || new Date().toISOString(),
          };

          await supabase.from("challenges").upsert(challengeData, {
            onConflict: "id",
            ignoreDuplicates: false,
          });
        }
      }

      if (isAllChallengesDataComplete) {
        return NextResponse.json({
          response:
            "Let's proceed to finalize your hackathon! You can review all the details and make any last adjustments before publishing.",
          conversationId: conversation.id,
          currentStep: currentStep,
          nextSteps: nextPlannedStep,
          extractedData,
          conversationData: updatedData,
        });
      }
      if (shouldGoToNextStep) {
        return NextResponse.json({
          response: nextInformationQuestion,
          conversationId: conversation.id,
          currentStep: currentStep,
          nextSteps: nextPlannedStep,
          extractedData,
          conversationData: updatedData,
        });
      } else if (clarificationQuestion) {
        return NextResponse.json({
          response: clarificationQuestion,
          conversationId: conversation.id,
          currentStep: currentStep,
          nextSteps: currentStep,
          extractedData,
          conversationData: updatedData,
        });
      }
    } else {
      return NextResponse.json(
        { error: "Failed to extract data from the message" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generatePaymentSessionId() {
  return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
