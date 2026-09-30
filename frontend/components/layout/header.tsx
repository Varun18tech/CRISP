"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { PlusCircle, ChevronDown, Check, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, setCurrentUser, DEMO_PERSONAS } from "@/lib/auth";
import { User } from "@/types/user";

export function Header({ onOpenStudio }: { onOpenStudio?: () => void }) {
  const [currentUser, setCurrentUserState] = useState<User>(DEMO_PERSONAS.executive);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUserState(getCurrentUser());
    const handleAuthChange = () => {
      setCurrentUserState(getCurrentUser());
    };
    window.addEventListener("aegis_auth_changed", handleAuthChange);
    return () => window.removeEventListener("aegis_auth_changed", handleAuthChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPersona = (persona: User) => {
    setCurrentUser(persona);
    setCurrentUserState(persona);
    setDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-10 py-3 backdrop-blur-xl">
      <span className="hidden text-xs font-medium tracking-wide text-slate-400 sm:block">
        Company risk intelligence
      </span>

      <div className="ml-auto flex items-center gap-5">
        {onOpenStudio && (
          <Button
            size="sm"
            onClick={onOpenStudio}
            className="hidden bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold rounded-xl hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/20 sm:inline-flex"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            ADD DATA
          </Button>
        )}

        {/* User Profile Box (Top Right) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900 hover:border-slate-700 px-3.5 py-2 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm shadow-blue-500/30">
              {currentUser.avatar_initials || "DR"}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-xs font-semibold text-slate-100">{currentUser.full_name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{currentUser.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1 hidden sm:block" />
          </button>

          {/* Persona Switcher Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-64 rounded-2xl border border-slate-800 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl z-50">
              <div className="px-2.5 py-1.5 border-b border-slate-800/80 mb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Switch Executive Persona
                </p>
              </div>
              <div className="space-y-1">
                {Object.values(DEMO_PERSONAS).map((persona) => {
                  const isSelected = currentUser.id === persona.id;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => handleSelectPersona(persona)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors ${
                        isSelected
                          ? "bg-blue-600/15 text-blue-300 border border-blue-500/30"
                          : "hover:bg-slate-900 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {persona.avatar_initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{persona.full_name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{persona.role}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-slate-800/80">
                <Link
                  href="/login"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Full Access & Role Settings</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
