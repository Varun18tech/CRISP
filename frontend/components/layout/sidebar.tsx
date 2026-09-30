"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ShieldAlert,
  LayoutDashboard,
  FileSpreadsheet,
  Server,
  Bug,
  Settings,
  Sparkles,
  DollarSign,
  KeyRound,
  LogOut,
  UserCheck,
  ClipboardCheck,
  BarChart3,
  Calculator
} from "lucide-react";
import { getCurrentUser, DEMO_PERSONAS } from "@/lib/auth";
import { User } from "@/types/user";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: "CRISP Workspace",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Summary", href: "/summary", icon: BarChart3 },
    ],
  },
  {
    title: "Company Data",
    items: [
      { title: "Risks", href: "/risks", icon: FileSpreadsheet },
      { title: "Assets", href: "/assets", icon: Server },
      { title: "Vulnerabilities", href: "/vulnerabilities", icon: Bug },
    ],
  },
  {
    title: "Decision Support",
    items: [
      { title: "Budget Optimizer", href: "/budget-optimizer", icon: Calculator },
      { title: "Investments", href: "/investments", icon: DollarSign },
      { title: "Data Quality", href: "/data-quality", icon: ClipboardCheck },
    ],
  },
  {
    title: "Administration",
    items: [
      { title: "Settings & Weights", href: "/settings", icon: Settings },
      { title: "Sign In / Switch User", href: "/login", icon: KeyRound },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User>(DEMO_PERSONAS.executive);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener("aegis_auth_changed", handleAuthChange);
    return () => window.removeEventListener("aegis_auth_changed", handleAuthChange);
  }, []);

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl flex flex-col h-dvh fixed inset-y-0 left-0 z-40 select-none">
      {/* Platform Branding */}
      <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-slate-100 flex items-center gap-1.5">
              CRISP
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">v1</span>
            </div>
            <p className="text-[10px] text-slate-400 font-normal">Cyber Risk Intelligence</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {navigation.map((section) => (
          <div key={section.title} className="space-y-1">
            <h4 className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {section.title}
            </h4>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                    isActive
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-300")} />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Spacer for bottom-left mini robot companion */}
      <div className="p-4 border-t border-slate-800/40 h-24 shrink-0" />
    </aside>
  );
}
