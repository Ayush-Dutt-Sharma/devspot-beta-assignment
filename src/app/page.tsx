"use client";
import React, { useState, useRef, useEffect } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MessageBubble from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import ModeCard from "@/components/ui/ModelCard";
import PaymentPopup from "@/components/payment/PaymentPopup";
import { Zap, User, Compass } from "lucide-react";
import { useUser, SignInButton, SignInWithMetamaskButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { JUDGING_CRITERIA } from "@/lib/constants";

type Mode = "hackathon" | "profile" | "explore" | null;
type Message = {
  id: number;
  sender: "bot" | "user";
  content: string;
};

interface PaymentDetails {
  sessionId: string;
  paymentUrl: string;
  amount: string;
  currency: string;
  network: string;
  description: string;
}

const DevSpotChatInterface = () => {
  const [selectedMode, setSelectedMode] = useState<Mode>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hackathonId, setHackathonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDraftBtnVisible, setIsDraftBtnVisible] = useState<boolean>(false);
  const [isJudgingCriteriaVisible, setIsJudgingCriteriaVisible] = useState<boolean>(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      content:
        "Welcome to DevSpot! I can help you create your technology profile, host a hackathon, and more. What can I do for you?",
    },
  ]);

  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isLoaded, user } = useUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (isLoading) return;
    setSelectedMode("hackathon");

    const newUserMessage: Message = {
      id: Date.now(),
      sender: "user",
      content: message,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationId,
          mode: "hackathon",
        }),
      });

      if (response.ok) {
        const data = await response.json();

         
        if (data.paymentRequired) {


 if (data.hackathonData.id) {
            setHackathonId(data.hackathonData.id);
          }
          const newBotMessage: Message = {
            id: Date.now() + 1,
            sender: "bot",
            content: "Done with all the details, You can now move to the draft and make tha final payment.",
          };
          setIsDraftBtnVisible(true)
          setMessages((prev) => [...prev, newBotMessage]);
          setTimeout(()=>router.push(`/draft/${hackathonId}`),500)
        }
        else {
          const newBotMessage: Message = {
            id: Date.now() + 1,
            sender: "bot",
            content: data.response,
          };

          setMessages((prev) => [...prev, newBotMessage]);
        }

        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }

        console.log("Conversation progress:", data.progress);
        console.log("Extracted data:", data.extractedData);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: "bot",
        content: "I'm sorry, I encountered an error. Please try again.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  const showInitialOptions = selectedMode === null;

  if (isLoaded && !user) {
    return (
      <div className="h-screen bg-devspot-dark text-white flex flex-col">
        <Header onSearch={(query) => console.log("Search:", query)} />

        <div className="flex-1 flex">
          <Sidebar activeItem="Chat with Spot" />

          <div className="flex-1 flex items-center justify-center">
            <div className="card-primary max-w-md text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Sign In Required
              </h2>
              <p className="text-devspot-text-secondary mb-6">
                Please sign in to create hackathons and access all DevSpot
                features.
              </p>
              <SignInWithMetamaskButton mode="modal">
                <button className="btn-primary w-full">
                  Sign In to Continue
                </button>
              </SignInWithMetamaskButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-devspot-dark text-white flex flex-col">
      <Header onSearch={(query) => console.log("Search:", query)} />

      <div className="flex-1 flex">
        <Sidebar activeItem="Chat with Spot" />

        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {messages.map((message, index) => (
              <div key={message.id} className="w-full">
                <MessageBubble
                  message={message.content}
                  sender={message.sender}
                  isButtonVisible={false}
                  buttonText="Check and Pay"
                  onButtonClick={()=>router.push(`/draft/${hackathonId}`)}
                  selectableItems={JUDGING_CRITERIA}
                  showSelectableItems={isJudgingCriteriaVisible}

                />

                {message.sender === "bot" &&
                  index === 0 &&
                  showInitialOptions && (
                    <div className="flex justify-center items-center w-full mt-8 px-4">
                      <div className="w-full max-w-lg">
                        <ModeCard
                          icon={Zap}
                          title="Help me create a hackathon"
                          description="Get AI assistance to design your perfect hackathon event with intelligent recommendations and automated setup"
                          onClick={() =>
                            handleSendMessage("Start creating the hackathon")
                          }
                        />
                      </div>
                    </div>
                  )}
              </div>
            ))}

            <div ref={messagesEndRef} />

            {isLoading && (
              <div className="flex items-center gap-2 mt-2 text-devspot-text-secondary">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-devspot-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-devspot-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-devspot-blue-500 rounded-full animate-bounce"></div>
                </div>
                <span className="text-sm">Spot is thinking...</span>
              </div>
            )}
          </div>

          <ChatInput
            onSend={handleSendMessage}
            placeholder="Reply to Spot..."
            disabled={isLoading}
            isLoading={isLoading}
          />
        </div>
      </div>

    </div>
  );
};

export default DevSpotChatInterface;
