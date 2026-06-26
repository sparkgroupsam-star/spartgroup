import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles, User, AlertCircle, MessageSquare, HelpCircle, Loader2 } from "lucide-react";
import { ChatMessage, CRMClient } from "../types";

interface AIChatSidebarProps {
  clients: CRMClient[];
}

export default function AIChatSidebar({ clients }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<{ title: string; desc: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcome message in English
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "system",
        text: `Hello! I am your **Cloud CRM AI Assistant**. I have analyzed your active client database in real-time (${clients.length} contacts) and I am ready to help you manage and organize your sales relationships.

You can ask me questions like:
* *"How is my current sales funnel distributed?"*
* *"Which clients have pending follow-up tasks for today/tomorrow?"*
* *"Write a personalized email template for a client in the negotiation stage."*
* *"Give me a general health analysis of my sales pipeline."*`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setApiKeyError(null);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue("");
    setApiKeyError(null);

    // Create user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Map live cloud client dataset to columns/rows for the backend chat prompt
      const mappedColumns = [
        { name: "Client Name", key: "name", type: "string" },
        { name: "Company / Business", key: "company", type: "string" },
        { name: "Email", key: "email", type: "string" },
        { name: "Phone", key: "phone", type: "string" },
        { name: "Estimated Value ($)", key: "value", type: "number" },
        { name: "Sales Stage", key: "stage", type: "string" },
        { name: "Registration Date", key: "createdAt", type: "date" },
        { name: "History Notes", key: "notes", type: "string" },
        { name: "Follow-up Tasks", key: "tasks", type: "string" }
      ];

      const mappedRows = clients.map((c) => ({
        "Client Name": c.name,
        "Company / Business": c.company || "Personal",
        "Email": c.email || "Not registered",
        "Phone": c.phone || "Not registered",
        "Estimated Value ($)": c.value || 0,
        "Sales Stage": c.stage,
        "Registration Date": c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US") : "No date",
        "History Notes": c.notes?.slice(0, 3).map(n => `[${n.createdAt}] ${n.text}`).join(" // ") || "No notes",
        "Follow-up Tasks": c.tasks?.filter(t => !t.completed).map(t => `${t.title} (Due: ${t.dueDate})`).join(" // ") || "None"
      }));

      // Send chat history and current spreadsheet data representation
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages.filter(m => m.id !== "welcome"), userMessage].map((m) => ({
            role: m.role,
            text: m.text,
          })),
          sheetName: "Cloud CRM Clients",
          columns: mappedColumns,
          rows: mappedRows,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Gemini API Key not configured" || data.error === "API Key de Gemini no configurada" || response.status === 400) {
          setApiKeyError({
            title: "Configuration Required",
            desc: data.message || "Please configure your GEMINI_API_KEY in the Secrets tab of AI Studio to activate AI features.",
          });
        } else {
          throw new Error(data.error || "Server communication error");
        }
        setIsLoading(false);
        return;
      }

      // Create model response
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "model",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error("Error chating with AI:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "model",
          text: `⚠️ **Connection Error:** Sorry, I couldn't communicate with my AI brain. Detail: ${err.message || "Unknown error"}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100" id="ai-chat-sidebar-wrapper">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between" id="ai-sidebar-header">
        <div className="flex items-center gap-2" id="ai-header-title">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/10 animate-pulse" id="ai-avatar-wrapper">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white" id="ai-assistant-name">AI Assistant (CRM)</h3>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-bold" id="ai-status">
              ● Online (Gemini 3.5)
            </span>
          </div>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin" id="messages-list-container">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const isSystem = msg.role === "system";

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
              id={`message-bubble-${msg.id}`}
            >
              {/* Avatar indicator */}
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser 
                    ? "bg-slate-700 text-slate-100" 
                    : isSystem 
                      ? "bg-indigo-900/40 text-indigo-400 border border-indigo-800/60" 
                      : "bg-indigo-600 text-white"
                }`}
                id={`message-avatar-${msg.id}`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message text bubble */}
              <div
                className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-tr-none shadow-sm shadow-indigo-600/10"
                    : isSystem
                      ? "bg-slate-950 border border-slate-800/80 text-slate-300 rounded-tl-none font-sans"
                      : "bg-slate-800 text-slate-200 rounded-tl-none shadow-sm"
                }`}
                id={`message-text-wrapper-${msg.id}`}
              >
                {/* Simplified markdown parser for bold, italics, code and bullets */}
                <div className="whitespace-pre-wrap text-[11px] md:text-xs" id={`message-text-${msg.id}`}>
                  {msg.text.split("\n").map((line, lIdx) => {
                    // Check for bold points/list
                    if (line.startsWith("* ") || line.startsWith("- ")) {
                      const content = line.substring(2);
                      return (
                        <li key={lIdx} className="ml-2 list-disc mt-1" id={`bullet-${msg.id}-${lIdx}`}>
                          {parseLineText(content)}
                        </li>
                      );
                    }
                    return (
                      <p key={lIdx} className="min-h-[1rem] mt-1" id={`para-${msg.id}-${lIdx}`}>
                        {parseLineText(line)}
                      </p>
                    );
                  })}
                </div>
                <span className="text-[9px] text-slate-400/80 mt-2 block text-right font-mono" id={`message-time-${msg.id}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* AI Key Error Panel */}
        {apiKeyError && (
          <div className="p-4 bg-amber-950/40 border border-amber-900/60 rounded-xl flex items-start gap-3 text-amber-200" id="api-key-error-panel">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" id="api-err-icon" />
            <div id="api-err-content">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider" id="api-err-title">{apiKeyError.title}</h4>
              <p className="text-[11px] text-amber-300/90 mt-1 leading-normal" id="api-err-desc">
                {apiKeyError.desc}
              </p>
              <div className="mt-3 p-2.5 bg-slate-950 rounded-lg text-[10px] font-mono text-slate-400 border border-slate-800" id="api-err-guide">
                1. Go to the <b>Settings (⚙️)</b> menu<br />
                2. Select <b>Secrets</b><br />
                3. Add the variable:<br />
                <span className="text-amber-400 font-bold">GEMINI_API_KEY</span>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex gap-3 max-w-[80%]" id="loading-message-bubble">
            <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center animate-pulse" id="loading-avatar">
              <Bot className="h-4 w-4" />
            </div>
            <div className="p-4 bg-slate-800 text-slate-400 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs" id="loading-spinner">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              <span>Gemini analyzing cloud pipeline...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Quick Panel */}
      {messages.length === 1 && !isLoading && (
        <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-1.5" id="quick-suggestions-panel">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
            <HelpCircle className="h-3.5 w-3.5 text-indigo-400" /> Suggested Questions:
          </span>
          <div className="flex flex-col gap-1.5" id="suggestions-list">
            <button
              onClick={() => suggestQuestion("Give me a general health analysis of my current pipeline.")}
              className="text-left text-[11px] px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-lg text-slate-300 hover:text-indigo-400 transition-colors"
              id="sug-btn-1"
            >
              📊 Pipeline health analysis
            </button>
            <button
              onClick={() => suggestQuestion("Write a persuasive follow-up email for my client in the negotiation stage.")}
              className="text-left text-[11px] px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-lg text-slate-300 hover:text-indigo-400 transition-colors"
              id="sug-btn-2"
            >
              ✉️ Email template (Negotiation)
            </button>
          </div>
        </div>
      )}

      {/* Chat Input Area */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2" id="chat-input-form">
        <input
          type="text"
          placeholder="Ask AI about your cloud pipeline..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50"
          id="chat-text-input"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-40"
          id="send-chat-btn"
        >
          <Send className="h-4 w-4" id="send-icon" />
        </button>
      </form>
    </div>
  );
}

// Simple text formatter for bold "**text**" tags inside markdown strings
function parseLineText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="text-white font-extrabold">
          {part.substring(2, part.length - 2)}
        </strong>
      );
    }
    return part;
  });
}
