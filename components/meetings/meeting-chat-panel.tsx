"use client";

import { useState } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { AnimatedCard } from "@/components/motion/animated-card";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

interface MeetingChatPanelProps {
  meetingId: string;
}

export function MeetingChatPanel({ meetingId }: MeetingChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Ask me anything about this meeting's decisions, risks, owner assignments, or transcript quotes!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const queryText = input.trim();
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch(`/api/v1/meetings/${meetingId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: queryText }),
      });

      if (!res.ok) throw new Error("Failed to get answer");

      const data = await res.json();
      const aiAnswer = data.answer || data.response || "No response received.";

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: aiAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: `Sorry, I couldn't process your question: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatedCard variant="clay" className="flex flex-col h-[500px] p-4">
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 mb-3">
        <Sparkles className="w-4 h-4 text-brand-500" />
        <h3 className="text-sm font-bold font-heading">AI Assistant Q&A</h3>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2.5 max-w-[85%]",
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs",
                msg.sender === "user"
                  ? "bg-brand-500 text-white"
                  : "bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300"
              )}
            >
              {msg.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={cn(
                "p-3 rounded-2xl text-xs space-y-1 leading-relaxed",
                msg.sender === "user"
                  ? "bg-brand-500 text-white rounded-tr-none"
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-none"
              )}
            >
              <p>{msg.text}</p>
              <span
                className={cn(
                  "block text-[10px]",
                  msg.sender === "user" ? "text-brand-100 text-right" : "text-[var(--muted)]"
                )}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="mt-3 flex items-center gap-2 pt-2 border-t border-[var(--border)]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about meeting details..."
          className={cn(
            "flex-1 px-3 py-2 rounded-xl text-xs border border-[var(--border)]",
            "bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-1 focus:ring-brand-500"
          )}
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="p-2 rounded-xl text-white bg-brand-500 hover:bg-brand-600 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </AnimatedCard>
  );
}
