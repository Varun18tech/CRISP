"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Building2,
  CheckCircle2,
  Fingerprint,
  Cpu,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEMO_PERSONAS, setCurrentUser, getCurrentUser } from "@/lib/auth";
import { User } from "@/types/user";

export default function LoginPage() {
  const router = useRouter();

  // Selected persona key
  const [selectedPersonaKey, setSelectedPersonaKey] = useState<string>("executive");
  const [email, setEmail] = useState(DEMO_PERSONAS.executive.email);
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [enforceMfa, setEnforceMfa] = useState(true);

  // Auth flow states
  const [isLoading, setIsLoading] = useState(false);
  const [authStage, setAuthStage] = useState<string>("");
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Update form when persona selection changes
  const handleSelectPersona = (key: string) => {
    setSelectedPersonaKey(key);
    const p = DEMO_PERSONAS[key];
    if (p) {
      setEmail(p.email);
      setPassword("EnterprisePass2026!");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulated authentic enterprise zero-trust multi-step auth pipeline
    setAuthStage("Verifying credentials & cryptographic token...");
    await new Promise((r) => setTimeout(r, 450));

    if (enforceMfa) {
      setAuthStage("Validating FIDO2 / YubiKey Hardware Token...");
      await new Promise((r) => setTimeout(r, 400));
    }

    setAuthStage("Establishing RBAC session with Aegis Engine...");
    await new Promise((r) => setTimeout(r, 350));

    const selectedUser: User = DEMO_PERSONAS[selectedPersonaKey] || {
      id: `user_${Date.now()}`,
      email: email,
      full_name: email.split("@")[0].replace(".", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      role: "Security Executive",
      department: "Risk Management",
      organization_id: "org_default",
      organization_name: "CyberAegis Financial Global",
      avatar_initials: email.slice(0, 2).toUpperCase(),
    };

    setCurrentUser(selectedUser);
    setLoginSuccess(true);
    setAuthStage("Authentication successful. Redirecting to Executive Suite...");

    setTimeout(() => {
      router.push("/dashboard");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-blue-600/30">
      {/* Background Decorative Gradients & Mesh */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Top Brand Navigation */}
      <header className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-slate-800/40 backdrop-blur-md bg-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/30">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">Aegis-Quant</span>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-full">
                Deterministic v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Cyber Risk Intelligence & Capital Quantification</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Risk Engine: Operational</span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-1.5 text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>CyberAegis Financial Global</span>
          </div>
        </div>
      </header>

      {/* Main Login Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Value Proposition & Executive Context */}
          <div className="lg:col-span-5 space-y-6 hidden lg:block pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enterprise Financial Quantification</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-100 leading-tight">
                Turn Cyber Risk Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">Measurable Capital Return</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aegis-Quant replaces subjective color charts with rigorous mathematical formulas: Expected Annual Loss (EAL), Residual Exposure, and Return on Security Investment (ROSI).
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Executive Profit Simulator</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Live sliders compute capital preserved vs. budget spent in real-time.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Deterministic Mathematical Engine</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">100% reproducible Likelihood ($0.3E + 0.25T + \dots$) and Impact calculations.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Zero Trust Role-Based Access</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Role-tailored interfaces for CFO, CISO, Analysts, and Board Auditors.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Login Card */}
          <div className="lg:col-span-7">
            <Card variant="glass" className="border-slate-800/90 shadow-2xl shadow-blue-950/30 backdrop-blur-2xl">
              <CardHeader className="pb-4 border-b border-slate-800/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-100">Enterprise Sign In</CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-0.5">
                      Select an enterprise persona or sign in with your corporate credentials
                    </CardDescription>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                    <Fingerprint className="w-3.5 h-3.5 text-blue-400" />
                    <span>FIDO2 Ready</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-5 space-y-5">
                {/* Persona Quick Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Select Enterprise Role Context</label>
                    <span className="text-[10px] text-blue-400 font-medium">Click to fast-login</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(DEMO_PERSONAS).map(([key, persona]) => {
                      const isSelected = selectedPersonaKey === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSelectPersona(key)}
                          className={`p-2.5 rounded-xl border text-left transition-all relative ${
                            isSelected
                              ? "bg-blue-600/15 border-blue-500/50 shadow-sm shadow-blue-500/10 ring-1 ring-blue-500/30"
                              : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                                isSelected ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {persona.avatar_initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold truncate ${isSelected ? "text-blue-300" : "text-slate-200"}`}>
                                {persona.full_name}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">{persona.role}</p>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Corporate Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 text-xs bg-slate-900/80 border-slate-800"
                        placeholder="user@cyberaegis.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300">Password / Passkey</label>
                      <a href="#reset" onClick={(e) => { e.preventDefault(); alert("Password reset token dispatched to enterprise admin."); }} className="text-[11px] text-blue-400 hover:underline">
                        Forgot passkey?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-10 text-xs bg-slate-900/80 border-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Security Toggles */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span>Trust this terminal (30 days)</span>
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enforceMfa}
                        onChange={(e) => setEnforceMfa(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-indigo-400" />
                        <span>Require YubiKey / MFA</span>
                      </span>
                    </label>
                  </div>

                  {/* Dynamic Status Display during Authentication */}
                  {isLoading && (
                    <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-3 animate-fadeIn">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                      <span className="text-xs text-blue-300 font-medium">{authStage}</span>
                    </div>
                  )}

                  {loginSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs text-emerald-300 font-medium">Access Granted. Loading Executive Cockpit...</span>
                    </div>
                  )}

                  {/* Primary Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full h-11 text-xs font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/20"
                      disabled={isLoading || loginSuccess}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>Sign In as {DEMO_PERSONAS[selectedPersonaKey]?.full_name || "User"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </Button>
                  </div>

                  {/* SSO Option */}
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-800"></div>
                    <span className="flex-shrink mx-3 text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                      Or Federated SSO
                    </span>
                    <div className="flex-grow border-t border-slate-800"></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLogin({ preventDefault: () => {} } as any)}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 text-xs font-medium text-slate-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>Single Sign-On (Okta / Azure Active Directory / SAML 2.0)</span>
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer Security Badges */}
      <footer className="relative z-10 px-8 py-5 border-t border-slate-800/40 backdrop-blur-md bg-slate-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SOC2 Type II Certified</span>
          </span>
          <span className="flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
            <span>FIPS 140-3 Hardware Key Support</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>256-bit AES End-to-End Encryption</span>
          </span>
        </div>

        <p className="text-slate-400">
          © 2026 Aegis-Quant Platform. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
