import { User } from "@/types/user";

export const DEMO_PERSONAS: Record<string, User> = {
  executive: {
    id: "user_executive",
    email: "david.roberts@cyberaegis.com",
    full_name: "David Roberts",
    role: "Chief Financial Officer (CFO)",
    department: "Executive Committee",
    organization_id: "org_default",
    organization_name: "CyberAegis Financial Global",
    avatar_initials: "DR",
  },
  risk_lead: {
    id: "user_risk_lead",
    email: "priya.sharma@cyberaegis.com",
    full_name: "Priya Sharma",
    role: "Lead Risk Officer",
    department: "Enterprise Risk & Compliance",
    organization_id: "org_default",
    organization_name: "CyberAegis Financial Global",
    avatar_initials: "PS",
  },
  analyst: {
    id: "user_analyst",
    email: "marcus.vance@cyberaegis.com",
    full_name: "Marcus Vance",
    role: "Senior Cyber Risk Analyst",
    department: "Security Operations & Quant",
    organization_id: "org_default",
    organization_name: "CyberAegis Financial Global",
    avatar_initials: "MV",
  },
  board: {
    id: "user_board",
    email: "sarah.chen@board.cyberaegis.com",
    full_name: "Sarah Chen",
    role: "Audit & Risk Committee Director",
    department: "Board of Directors",
    organization_id: "org_default",
    organization_name: "CyberAegis Financial Global",
    avatar_initials: "SC",
  },
};

const STORAGE_KEY = "aegis_auth_user";

export function getCurrentUser(): User {
  if (typeof window === "undefined") {
    return DEMO_PERSONAS.executive;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // fallback
  }
  return DEMO_PERSONAS.executive;
}

export function setCurrentUser(user: User): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("aegis_auth_changed"));
  } catch (e) {
    console.error("Failed to set auth user", e);
  }
}

export function clearCurrentUser(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("aegis_auth_changed"));
  } catch (e) {
    console.error("Failed to clear auth user", e);
  }
}
