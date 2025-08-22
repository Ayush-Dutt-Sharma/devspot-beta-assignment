import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";
import {
  getConversationProgress,
  validateConversationData,
} from "@/lib/conversation-memory";
import {
  getNextQuestions,
  HackathonDataSchema,
} from "@/lib/data-extraction-utils";
import InstanceCache from "@/lib/InstanceCache";
import { generatePrompt } from "@/lib/prompts";
import { HACKATHON_STEPS } from "@/lib/constants";

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
      // Get existing conversation
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
      // Create new hackathon and conversation

      conversation = newConversation;
      hackathonData = newHackathon;
    }

    if (!conversation) {
      return NextResponse.json(
        { error: "Failed to create/find conversation" },
        { status: 500 }
      );
    }

    // Use cached memory instance and load existing data
    const memory = await InstanceCache.getConversationMemory(conversation.id);
    const conversationData = conversation.conversation_data || {};
    const currentStep = conversation.current_step || "title + organization";
    // Save user message to memory
    await memory.saveMessage("user", message);

    // Extract data from the message
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

    // Save the updated conversation data to memory
    // if (Object.keys(extractedData).length > 0) {
    //   await memory.saveConversationData(extractedData);
    // }

    // Generate AI prompt and response
    // const promptText = await generatePrompt(mode, updatedData, message);
    // const llm = InstanceCache.getLLM();
    // const response = await llm.invoke(promptText);

    // Save AI response to memory
    //@ts-ignore
    await memory.saveMessage("ai", extractedData);

    // Calculate progress and validation
    // const progress = getConversationProgress(updatedData, mode);
    // const validation = validateConversationData(updatedData, mode);
    // const nextQuestions = getNextQuestions(
    //   updatedData,
    //   HackathonDataSchema,
    //   mode
    // );

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
      } = extractedData;
      const {
        title,
        organization,
        registration_date,
        hacking_start,
        submission_deadline,
        total_budget,
      } = hackathon_data || {};

      // // Update current step in memory (this also updates the database)
      await memory.updateCurrentStep(currentStep);

      // Update hackathon table if this is a hackathon conversation and we have extracted data
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
        // // Return comprehensive response
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
