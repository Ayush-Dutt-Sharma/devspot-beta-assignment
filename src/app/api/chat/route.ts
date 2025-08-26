import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";
import InstanceCache from "@/lib/InstanceCache";
import {
  CHALLENGE_CREATION_STEPS,
  CHALLENGE_DATA_INDEX,
  CLARIFING_CHALLENGE_QUESTION,
  CLARIFING_HACKATHON_QUESTION,
  HACKATHON_DATA_INDEX,
  HACKATHON_STEPS,
} from "@/lib/constants";
import {
  isISO8601Flexible,
  isValidStringAdvanced,
  manualParsingArray,
  parseCurrencyAdvanced,
} from "@/lib/validation";
import { getResourcesArrayFromResponseWithAI, getSponsorsArrayFromResponseWithAI, resolveDateWithAI } from "@/lib/ai/AIConnect";

type Message = {
  id: number;
  sender: "bot" | "user";
  content: string;
};

const conversationsMemoryData = {};
const hackathonMemoryData = {};
const challengesMemoryData = {}

export async function POST(request: NextRequest) {
  console.time("Total API Time");
  try {
    console.time("Check User Login");
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.timeEnd("Check User Login");
    const reqBody = await request.json();
    const { message, conversationId, mode, currentQuestion } = reqBody;

    if (!message || !mode || !currentQuestion) {
      return NextResponse.json(
        { error: "Current Question, Message and mode are required" },
        { status: 400 }
      );
    }

    let conversation;
    let hackathonData;
    const supabase = await createAdminClient();
    console.time("Fetch User Data");
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
          current_step: "title",
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
    console.timeEnd("Fetch User Data");

    console.time("NEW USER DATA HANDLING");
    function checkInArrays(currentQuestion: string, ...args) {
      if (args.length) {
        for (let i = 0; i < args.length; i++) {
          for (let j = 0; j < args[i].length; j++) {
            if (currentQuestion.includes(args[i][j]) && args[i][j] !== '') {
              return { clarificationQuestionIndex: j, arr: args[i] };
            }
          }
        }
      }
      return { clarificationQuestionIndex: -1, arr: [] };
    }
  async function nextQuestion(currentQuestion: string, message: string) {
  const ret: any = {};

  const { clarificationQuestionIndex, arr } = checkInArrays(
    currentQuestion,
    CLARIFING_HACKATHON_QUESTION,
    CLARIFING_CHALLENGE_QUESTION
  );
  const afterSplit =
    clarificationQuestionIndex > -1
      ? currentQuestion.split(", ")[1]
      : currentQuestion;
  let index = HACKATHON_STEPS.indexOf(afterSplit);
  if (index > -1) {
    ret["isHackathonData"] = true;
    ret["isChallengeData"] = false;
  } else {
    ret["isChallengeData"] = true;
    ret["isHackathonData"] = false;
    index = CHALLENGE_CREATION_STEPS.indexOf(afterSplit);
  }

  ret["isPrevClarificationQuestion"] = clarificationQuestionIndex > -1;
  ret["isNextClarificationQuestion"] = "";
  ret["index"] = index;
  ret["userQuestion"] =
    clarificationQuestionIndex > -1
      ? ret["isHackathonData"]
        ? HACKATHON_STEPS[clarificationQuestionIndex]
        : CHALLENGE_CREATION_STEPS[clarificationQuestionIndex]
      : currentQuestion;
  if (ret["isHackathonData"]) {
    if ([0, 1].includes(index)) {
      let userInput = isValidStringAdvanced(message);
      if (userInput) {
        ret["nextHackathonQuestion"] = HACKATHON_STEPS[index + 1];
        hackathonMemoryData[hackathonData.id] = {
          ...hackathonMemoryData[hackathonData.id],
          [HACKATHON_DATA_INDEX[index]]: message,
        };
      } else {
        ret[
          "isNextClarificationQuestion"
        ] = `${CLARIFING_HACKATHON_QUESTION[0]}, ${HACKATHON_STEPS[index]}`;
      }
    } else if ([2, 3, 4].includes(index)) {
      const aiDateresponse = await resolveDateWithAI(message);
      if (isISO8601Flexible(aiDateresponse)) {
        if (
          (index === 2 && new Date(aiDateresponse) >= new Date()) ||
          ([3, 4].includes(index) &&
            new Date(aiDateresponse) >=
              new Date(
                hackathonMemoryData[hackathonData.id][
                  HACKATHON_DATA_INDEX[index - 1]
                ].toString()
              ))
        ) {
          ret["nextHackathonQuestion"] = HACKATHON_STEPS[index + 1];
          hackathonMemoryData[hackathonData.id] = {
            ...hackathonMemoryData[hackathonData.id],
            [HACKATHON_DATA_INDEX[index]]: new Date(aiDateresponse),
          };
        } else {
          ret[
            "isNextClarificationQuestion"
          ] = `${CLARIFING_HACKATHON_QUESTION[index]}, ${HACKATHON_STEPS[index]}`;
        }
      } else {
        ret[
          "isNextClarificationQuestion"
        ] = `${CLARIFING_HACKATHON_QUESTION[0]}, ${HACKATHON_STEPS[index]}`;
      }
    } else if ([5, 6].includes(index)) {
      const userInput = parseCurrencyAdvanced(message);
      if (userInput) {
        if (index === 5) {
          if (userInput >= 20000) {
            ret["nextHackathonQuestion"] = HACKATHON_STEPS[index + 1];
            hackathonMemoryData[hackathonData.id] = {
              ...hackathonMemoryData[hackathonData.id],
              [HACKATHON_DATA_INDEX[index]]: userInput,
            };
          } else {
            ret[
              "isNextClarificationQuestion"
            ] = `${CLARIFING_HACKATHON_QUESTION[index]}, ${HACKATHON_STEPS[index]}`;
          }
        } else if (index === 6) {
          if (userInput >= 2) {
            ret["nextHackathonQuestion"] = HACKATHON_STEPS[index + 1];
            hackathonMemoryData[hackathonData.id] = {
              ...hackathonMemoryData[hackathonData.id],
              [HACKATHON_DATA_INDEX[index]]: userInput,
            };
          } else {
            ret[
              "isNextClarificationQuestion"
            ] = `${CLARIFING_HACKATHON_QUESTION[index]}, ${HACKATHON_STEPS[index]}`;
          }
        }
        
      } else {
        ret[
          "isNextClarificationQuestion"
        ] = `${CLARIFING_HACKATHON_QUESTION[0]}, ${HACKATHON_STEPS[index]}`;
      }
    }else if([7, 8].includes(index)){

      if(message.toLowerCase().includes('successfully') || message.toLowerCase().includes('skip')){
        ret["nextHackathonQuestion"] = HACKATHON_STEPS[index + 1];
            if (index === HACKATHON_STEPS.length - 1) {
          ret["nextHackathonQuestion"] = CHALLENGE_CREATION_STEPS[0];
          ret["isHackathonLastIndex"] = true;
          }

        }
    }
  } else if (ret["isChallengeData"]) {
    if (!challengesMemoryData[hackathonData.id]) {
      challengesMemoryData[hackathonData.id] = { currentChallengeIndex: 0, challenges: [{}] };
    }
    const currentChallengeIndex = challengesMemoryData[hackathonData.id]['currentChallengeIndex'];
    let currentObj = challengesMemoryData[hackathonData.id]['challenges'][currentChallengeIndex] || {};

    if ([0, 1].includes(index)) {
      let userInput = isValidStringAdvanced(message);
      if (userInput) {
        ret["nextHackathonQuestion"] = CHALLENGE_CREATION_STEPS[index + 1];
        currentObj = { ...currentObj, [CHALLENGE_DATA_INDEX[index]]: message };
        // Update challenges array
        challengesMemoryData[hackathonData.id]['challenges'][currentChallengeIndex] = currentObj;
      } else {
        ret[
          "isNextClarificationQuestion"
        ] = `${CLARIFING_CHALLENGE_QUESTION[0]}, ${CHALLENGE_CREATION_STEPS[index]}`;
      }
    } else if (index === 2) {
      let userInput = parseCurrencyAdvanced(message);
      if (userInput) {
        if (userInput < hackathonData.total_budget) {
          ret["nextHackathonQuestion"] = CHALLENGE_CREATION_STEPS[index + 1];
          currentObj = { ...currentObj, [CHALLENGE_DATA_INDEX[index]]:  userInput};
          challengesMemoryData[hackathonData.id]['challenges'][currentChallengeIndex] = currentObj;
        } else {
          ret[
            "isNextClarificationQuestion"
          ] = `${CLARIFING_CHALLENGE_QUESTION[index]}, ${CHALLENGE_CREATION_STEPS[index]}`;
        }
      } else {
        ret[
          "isNextClarificationQuestion"
        ] = `${CLARIFING_CHALLENGE_QUESTION[0]}, ${CHALLENGE_CREATION_STEPS[index]}`;
      }
    } else if (index === 3) {
      let userInputArray = await getSponsorsArrayFromResponseWithAI(message);
      if (userInputArray && userInputArray[0] !== 'INVALID') {
        //@ts-ignore
        userInputArray = manualParsingArray(userInputArray)
        ret["nextHackathonQuestion"] = CHALLENGE_CREATION_STEPS[index + 1];
        currentObj = { ...currentObj, [CHALLENGE_DATA_INDEX[index]]: userInputArray };
        challengesMemoryData[hackathonData.id]['challenges'][currentChallengeIndex] = currentObj;
      } else {
        ret[
          "isNextClarificationQuestion"
        ] = `${CLARIFING_CHALLENGE_QUESTION[0]}, ${CHALLENGE_CREATION_STEPS[index]}`;
      }
    } else if (index === 4) {
      let userInputArray = message
      if (userInputArray.length >= 4) {
        ret["nextHackathonQuestion"] = CHALLENGE_CREATION_STEPS[index + 1];
        currentObj = { ...currentObj, [CHALLENGE_DATA_INDEX[index]]: userInputArray };
        challengesMemoryData[hackathonData.id]['challenges'][currentChallengeIndex] = currentObj;
      } else {
        ret[
          "isNextClarificationQuestion"
        ] = `${CLARIFING_CHALLENGE_QUESTION[0]}, ${CHALLENGE_CREATION_STEPS[index]}`;
      }
    } else if (index === 5) {
      let userInputArray = await getResourcesArrayFromResponseWithAI(message);
      if (userInputArray && userInputArray[0] !== 'INVALID') {
        //@ts-ignore
        userInputArray = manualParsingArray(userInputArray)
        ret["nextHackathonQuestion"] = CHALLENGE_CREATION_STEPS[0];
        currentObj = { ...currentObj, [CHALLENGE_DATA_INDEX[index]]: userInputArray };
        challengesMemoryData[hackathonData.id]['challenges'][currentChallengeIndex] = currentObj;
        ret['isChallengeLastIndex'] = true;
      } else {
        ret[
          "isNextClarificationQuestion"
        ] = `${CLARIFING_CHALLENGE_QUESTION[0]}, ${CHALLENGE_CREATION_STEPS[index]}`;
      }
    }
  }
  return ret;
}
    const nextQuestionRes = await nextQuestion(currentQuestion, message);
    const newBotMessage: Message = {
      id: Date.now() + 1,
      sender: "bot",
      content: currentQuestion,
    };
    conversationsMemoryData[conversation.id] =
      conversationsMemoryData[conversation.id] || [];
    conversationsMemoryData[conversation.id].push(newBotMessage);
    conversationsMemoryData[conversation.id].push(reqBody);
    console.timeEnd("NEW USER DATA HANDLING");
    console.timeEnd("Total API Time");
    if(nextQuestionRes['isHackathonLastIndex']){

          const res = await supabase
                .from("hackathons")
                .update(hackathonMemoryData[hackathonData.id])
                .eq("id", hackathonData.id);
            
                console.log("Hackathon Res",res)
          challengesMemoryData[hackathonData.id] = {currentChallengeIndex:0, challenges:[{}]}


              
    }
    if(nextQuestionRes['isChallengeLastIndex']){
      const currentChallengeIndex = challengesMemoryData[hackathonData.id]['currentChallengeIndex']
                const challengeData = {
                  ...challengesMemoryData[hackathonData.id]['challenges'][currentChallengeIndex],
                  hackathon_id:hackathonData.id,
                  order_index:currentChallengeIndex
                }
                 const res = await supabase.from("challenges").upsert(challengeData, {
                onConflict: "id",
                ignoreDuplicates: false,
              });
              console.log(res)

if(currentChallengeIndex+1 >= hackathonData.challenges_count){
  await supabase.from("conversations").update({conversation_data:{messages:conversationsMemoryData[conversation.id]}}).eq("id",conversation.id)
  return NextResponse.json({
      response: "Let's proceed to finalize your hackathon! You can review all the details and make any last adjustments before publishing.",
      conversationId: conversation.id,
      paymentRequired:true,
      hackathonData

    });
}
      challengesMemoryData[hackathonData.id]['currentChallengeIndex']++
    }
    if (nextQuestionRes["isNextClarificationQuestion"]) {
      return NextResponse.json({
        response: nextQuestionRes["isNextClarificationQuestion"],
        conversationId: conversation.id,
        hackathonData
      });
    }
    return NextResponse.json({
      response: nextQuestionRes["nextHackathonQuestion"],
      conversationId: conversation.id,
      hackathonData
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

