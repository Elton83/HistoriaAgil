import { UserProfile } from "../components/AuthModal";

export const DEFAULT_DEMO_PROFILES: UserProfile[] = [
  {
    id: "user-po-1",
    name: "Elton Rabelo",
    email: "elton.rabelo@agile.com",
    role: "Administrador / GPM",
    avatarColor: "from-indigo-500 to-indigo-700",
  },
  {
    id: "user-sm-2",
    name: "Ana Paula Costa",
    email: "ana.costa@agile.com",
    role: "Scrum Master & Agile Coach",
    avatarColor: "from-emerald-500 to-teal-700",
  },
  {
    id: "user-dev-3",
    name: "Carlos Eduardo",
    email: "carlos.dev@agile.com",
    role: "Tech Lead / Arquiteto",
    avatarColor: "from-amber-500 to-orange-700",
  },
];

const STORAGE_KEY = "agile_studio_profiles";

export function getLocalProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading agile_studio_profiles:", err);
  }
  // Initialize default demo profiles if local storage is empty
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_PROFILES));
  } catch (e) {
    // ignore
  }
  return DEFAULT_DEMO_PROFILES;
}

export function saveLocalProfiles(profiles: UserProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.error("Error saving agile_studio_profiles:", err);
  }
}

export function upsertLocalProfile(profile: UserProfile): UserProfile[] {
  const current = getLocalProfiles();
  const cleanEmail = profile.email.trim().toLowerCase();

  const index = current.findIndex((p) => p.email.trim().toLowerCase() === cleanEmail);
  let updated: UserProfile[];

  if (index >= 0) {
    updated = [...current];
    updated[index] = {
      ...updated[index],
      ...profile,
      email: cleanEmail,
    };
  } else {
    updated = [{ ...profile, email: cleanEmail }, ...current];
  }

  saveLocalProfiles(updated);
  return updated;
}

export function deleteLocalProfile(email: string): UserProfile[] {
  const current = getLocalProfiles();
  const cleanEmail = email.trim().toLowerCase();
  const updated = current.filter((p) => p.email.trim().toLowerCase() !== cleanEmail);
  saveLocalProfiles(updated);
  return updated;
}

export function mergeProfiles(dbProfiles: UserProfile[], localProfiles: UserProfile[]): UserProfile[] {
  const profileMap = new Map<string, UserProfile>();

  // Add local profiles first
  localProfiles.forEach((p) => {
    if (p.email) {
      profileMap.set(p.email.trim().toLowerCase(), p);
    }
  });

  // DB profiles take precedence for synced attributes
  dbProfiles.forEach((p) => {
    if (p.email) {
      const cleanEmail = p.email.trim().toLowerCase();
      const existingLocal = profileMap.get(cleanEmail);
      profileMap.set(cleanEmail, {
        id: p.id || existingLocal?.id || `u-${Date.now()}`,
        name: p.name || existingLocal?.name || "Usuário Ágil",
        email: cleanEmail,
        role: p.role || existingLocal?.role || "Product Owner",
        avatarColor: p.avatarColor || existingLocal?.avatarColor || "from-indigo-500 to-indigo-700",
      });
    }
  });

  const merged = Array.from(profileMap.values());
  saveLocalProfiles(merged);
  return merged;
}
