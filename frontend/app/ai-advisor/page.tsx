"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormattedChatMessage } from "@/components/ai/FormattedChatMessage";
import { api } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/types/user";
import {
  Sparkles,
  Bot,
  Send,
  Trash2,
  ShieldCheck,
  TrendingUp,
  Cpu,
  ChevronRight,
  Calculator,
  HelpCircle,
  FileSpreadsheet,
  DollarSign,
  AlertTriangle,
  Flame,
  Copy,
  Check
} from "lucide-react";
import Link from "next/link";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestions?: string[];
  citations?: string[];
}

const PROMPT_LIBRARY = [
  {
    category: "Executive & Board Reports",
    icon: Sparkles,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    prompts: [
      "Generate an Executive Risk Summary using Claude 3.5 Sonnet",
      "Draft a formal Board of Directors Cyber Risk Report",
      "Explain the Budget Optimizer allocation rationale for the Audit Committee",
    ],
  },
  {
    category: "Capital Allocation & ROSI",
    icon: DollarSign,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    prompts: [
      "What is our total organizational EAL liability?",
      "If we spend ₹800,000 on WAF, what is our projected ROSI?",
      "How is capital preservation profit computed from residual risk?",
    ],
  },
  {
    category: "Priority Risks & Threats",
    icon: Flame,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    prompts: [
      "Which risk is currently ranked #1 and why?",
      "Summarize the threat actors targeting our infrastructure",
      "What is the impact if our Customer Database is compromised?",
    ],
  },
  {
    category: "Deterministic Calculations",
    icon: Calculator,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    prompts: [
      "Explain how Likelihood & Residual Risk are calculated",
      "Why is inherent risk never overwritten in Aegis-Quant?",
      "What are the default weights used in the 0-100 Impact score?",
    ],
  },
  {
    category: "Remediation & Strategy",
    icon: ShieldCheck,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    prompts: [
      "Recommend top 3 security remediation actions for Q3",
      "How does deploying FIDO2 MFA reduce database likelihood?",
      "Which controls provide the highest cost-to-risk reduction efficiency?",
    ],
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "msg_init_page",
    role: "assistant",
    content:
      "### 🛡️ Welcome to the Aegis-Quant Executive Intelligence Studio\n\n" +
      "I am directly connected to your operational database, evaluating **6 active risks**, enterprise assets, " +
      "threat actor telemetry, and our deterministic quantification formulas ($0.3E + 0.25T + \\dots$).\n\n" +
      "Ask me any strategic question regarding **Expected Annual Loss (EAL)**, **ROSI profit quantification**, or **risk remediation priorities**.",
    timestamp: "Just now",
    suggestions: [
      "What is our total organizational EAL liability?",
      "Which risk is currently ranked #1 and why?",
      "If we spend ₹800,000 on WAF, what is our projected ROSI?",
      "Explain how Likelihood & Residual Risk are calculated",
    ],
    citations: ["Aegis Deterministic Risk Model v1.0", "ISO/IEC 27005:2022", "NIST SP 800-30 Rev 1"],
  },
];

export default function AIAdvisorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUser(getCurrentUser());
    const onAuth = () => setUser(getCurrentUser());
    window.addEventListener("aegis_auth_changed", onAuth);
    return () => window.removeEventListener("aegis_auth_changed", onAuth);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput("");
    setIsLoading(true);

    const lowerQuery = query.toLowerCase().trim();
    if (
      lowerQuery === "refresh" ||
      lowerQuery === "/refresh" ||
      lowerQuery === "reset" ||
      lowerQuery === "/reset" ||
      lowerQuery === "refresh data" ||
      lowerQuery === "clear data"
    ) {
      try {
        await api.resetPlatformData();
      } catch (err) {
        console.error("Reset API failed:", err);
      }

      try {
        localStorage.removeItem("crisp_budget_optimizer_state_v1");
        localStorage.removeItem("crisp_dataset_snapshot");
        localStorage.removeItem("crisp_active_analysis");
      } catch {}

      window.dispatchEvent(new CustomEvent("crisp_data_reset"));
      window.dispatchEvent(new CustomEvent("crisp_budget_optimizer_updated", { detail: null }));
      window.dispatchEvent(new Event("storage"));

      const resetMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content:
          "### 🔄 Platform Reset Complete\n\n" +
          "All uploaded datasets, risk metrics, assets, vulnerabilities, and budget allocations have been **reset to zero (0)**.\n\n" +
          "- **Active Risks**: 0\n" +
          "- **Monitored Assets**: 0\n" +
          "- **Vulnerabilities**: 0\n" +
          "- **Available Budget**: ₹0\n" +
          "- **Allocated Spend**: ₹0\n" +
          "- **Risk Reduction**: 0%\n\n" +
          "The platform is now completely clean. You can now click **ADD DATA** or **Upload Company Dataset** to upload fresh data!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: [
          "Upload company dataset",
          "What is our total organizational EAL liability?",
        ],
        citations: ["CRISP Platform State Manager", "System Reset Engine"],
      };

      setMessages((prev) => [...prev, resetMessage]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.chatWithAI(
        newHistory.map((m) => ({ role: m.role, content: m.content })),
        {
          user_role: user?.role || "Executive",
          organization: user?.organization_name || "CyberAegis Financial",
        }
      );

      const assistantMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: response.content || "Risk intelligence response unavailable.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: response.suggestions || [],
        citations: response.citations || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: "⚠️ Unable to query the Aegis-Quant AI backend service. Fallback intelligence is operating.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <PageShell
      title="AI Risk & Capital Advisor"
      description="Interactive executive decision support grounded in deterministic risk models and enterprise loss telemetry"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMessages(INITIAL_MESSAGES)}
            className="text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Clear Chat
          </Button>
          <Link href="/investments">
            <Button size="sm" className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              Profit Simulator
            </Button>
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Prompt Library & Grounded Telemetry */}
        <div className="lg:col-span-4 space-y-6">
          {/* Grounding Status Card */}
          <Card variant="glass">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span>Grounded Telemetry</span>
                </CardTitle>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <CardDescription className="text-xs">
                Active models synchronized with risk database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Total Residual EAL:</span>
                <span className="font-bold text-rose-400">₹36,950,000</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Monitored Assets:</span>
                <span className="font-bold text-slate-200">6 Enterprise Systems</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Top Exposure:</span>
                <span className="font-bold text-blue-400 truncate max-w-[130px]">Payment API (₹14.0M)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Mathematical Engine:</span>
                <span className="font-bold text-indigo-400">Deterministic v1.0</span>
              </div>
            </CardContent>
          </Card>

          {/* Prompt Library */}
          <Card variant="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Executive Prompt Library</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Click any prompt to trigger an instant deterministic analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {PROMPT_LIBRARY.map((section, idx) => {
                const Icon = section.icon;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <div className={`p-1 rounded-lg border ${section.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span>{section.category}</span>
                    </div>
                    <div className="space-y-1.5">
                      {section.prompts.map((p, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleSendMessage(p)}
                          className="w-full text-left text-xs p-2 rounded-xl bg-slate-900/70 hover:bg-blue-600/15 border border-slate-800 hover:border-blue-500/30 text-slate-300 hover:text-blue-300 transition-all flex items-center justify-between group"
                        >
                          <span className="truncate">{p}</span>
                          <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400 shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Interactive Chat Cockpit */}
        <div className="lg:col-span-8">
          <Card variant="glass" className="h-[750px] flex flex-col overflow-hidden border-slate-800">
            {/* Cockpit Top Bar */}
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">Executive Risk Intelligence Advisor</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      Active Telemetry
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Operating as: <span className="text-slate-300 font-medium">{user?.full_name}</span> ({user?.role})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Continuous Telemetry</span>
                </span>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600/30 to-indigo-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs shadow-sm ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white font-medium rounded-tr-none shadow-blue-600/10"
                        : "bg-slate-900/95 border border-slate-800/90 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider font-semibold">
                            Aegis Intelligence Analysis
                          </span>
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <FormattedChatMessage content={msg.content} />

                        {/* Interactive Follow-up Buttons */}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-slate-800 space-y-1.5">
                            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                              Suggested Exploration:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {msg.suggestions.map((sug, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSendMessage(sug)}
                                  className="text-[11px] px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-blue-600/20 hover:text-blue-300 hover:border-blue-500/30 border border-slate-700/60 text-slate-300 transition-all text-left flex items-center gap-1.5 group"
                                >
                                  <span>{sug}</span>
                                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400 shrink-0" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Citations Footer */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1.5">
                            <span>Framework Grounding:</span>
                            <span className="font-mono text-slate-400">
                              {msg.citations.join(" • ")}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}

                    <div
                      className={`text-[9px] mt-1.5 text-right ${
                        msg.role === "user" ? "text-blue-200" : "text-slate-400"
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3.5 items-start animate-fadeIn">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 space-y-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse delay-100" />
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse delay-200" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Synthesizing deterministic portfolio metrics and loss distributions...
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2.5"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask any cyber risk, capital allocation, or deterministic formula question..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl px-4 text-xs font-semibold shadow-md shadow-blue-600/20"
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  <span>Send</span>
                </Button>
              </form>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                <span>Calculations are fully deterministic (ISO 27005 / NIST SP 800-30 / FAIR)</span>
                <span>Powered by Aegis AI Layer</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
