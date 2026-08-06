import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";
import { UserStory, StoryStatus } from "../types";
import { UserProfile } from "../components/AuthModal";

// Database row interface matching PostgreSQL schema
export interface SupabaseUserStoryRow {
  id?: string;
  user_id?: string | null;
  title: string;
  role: string;
  want: string;
  so_that: string;
  context: string;
  acceptance_criteria: any[];
  business_rules: any[];
  bdd_scenarios: any[];
  epic_note?: string | null;
  clarification_questions?: string[] | null;
  raw_markdown: string;
  project_name: string;
  epic_name: string;
  requester?: string | null;
  status: string;
  story_points?: number | null;
  tags: string[];
  audit?: any | null;
  validation_report?: any | null;
  attached_file_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseProfileRow {
  id?: string;
  email: string;
  name: string;
  role?: string;
  avatar_color?: string;
  created_at?: string;
  updated_at?: string;
}

// Convert DB row to UserStory model
export function mapRowToUserStory(row: SupabaseUserStoryRow): UserStory {
  return {
    id: row.id || `story-${Date.now()}`,
    title: row.title,
    story: {
      role: row.role,
      want: row.want,
      soThat: row.so_that,
    },
    context: row.context || "",
    acceptanceCriteria: Array.isArray(row.acceptance_criteria) ? row.acceptance_criteria : [],
    businessRules: Array.isArray(row.business_rules) ? row.business_rules : [],
    bddScenarios: Array.isArray(row.bdd_scenarios) ? row.bdd_scenarios : [],
    epicNote: row.epic_note || "",
    clarificationQuestions: Array.isArray(row.clarification_questions) ? row.clarification_questions : [],
    rawMarkdown: row.raw_markdown || "",
    projectName: row.project_name || "Geral",
    epicName: row.epic_name || "Geral",
    requester: row.requester || "",
    status: (row.status as StoryStatus) || "draft",
    storyPoints: row.story_points || 3,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    tags: Array.isArray(row.tags) ? row.tags : [],
    audit: row.audit || undefined,
    validationReport: row.validation_report || undefined,
    attachedFileName: row.attached_file_name || undefined,
  };
}

// Convert UserStory model to DB row
export function mapUserStoryToRow(story: UserStory, userId?: string | null): SupabaseUserStoryRow {
  const row: SupabaseUserStoryRow = {
    title: story.title,
    role: story.story.role,
    want: story.story.want,
    so_that: story.story.soThat,
    context: story.context || "",
    acceptance_criteria: story.acceptanceCriteria || [],
    business_rules: story.businessRules || [],
    bdd_scenarios: story.bddScenarios || [],
    epic_note: story.epicNote || "",
    clarification_questions: story.clarificationQuestions || [],
    raw_markdown: story.rawMarkdown || "",
    project_name: story.projectName || "Geral",
    epic_name: story.epicName || "Geral",
    requester: story.requester || "",
    status: story.status || "draft",
    story_points: story.storyPoints || 3,
    tags: story.tags || [],
    audit: story.audit || null,
    validation_report: story.validationReport || null,
    attached_file_name: story.attachedFileName || null,
  };

  if (userId) {
    row.user_id = userId;
  }

  // Check if string is valid UUID
  const isValidUuid = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  if (story.id && isValidUuid(story.id)) {
    row.id = story.id;
  }

  return row;
}

/**
 * Fetch all user stories from Supabase
 */
export async function fetchStoriesFromSupabase(userId?: string): Promise<{
  stories: UserStory[];
  isSupabase: boolean;
  error?: string;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { stories: [], isSupabase: false };
  }

  try {
    let query = supabase.from("user_stories").select("*").order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Supabase] Error fetching stories:", error);
      return { stories: [], isSupabase: true, error: error.message };
    }

    const stories = (data || []).map(mapRowToUserStory);
    return { stories, isSupabase: true };
  } catch (err: any) {
    console.error("[Supabase] Unexpected error fetching stories:", err);
    return { stories: [], isSupabase: true, error: err.message || "Erro desconhecido" };
  }
}

/**
 * Insert or update a story in Supabase
 */
export async function saveStoryToSupabase(
  story: UserStory,
  userId?: string
): Promise<{ story: UserStory; isSupabase: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { story, isSupabase: false };
  }

  try {
    const row = mapUserStoryToRow(story, userId);

    const { data, error } = await supabase
      .from("user_stories")
      .upsert(row, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      console.error("[Supabase] Error saving story:", error);
      return { story, isSupabase: true, error: error.message };
    }

    const savedStory = mapRowToUserStory(data);
    return { story: savedStory, isSupabase: true };
  } catch (err: any) {
    console.error("[Supabase] Unexpected error saving story:", err);
    return { story, isSupabase: true, error: err.message || "Erro ao salvar no banco" };
  }
}

/**
 * Update status of a story in Supabase
 */
export async function updateStoryStatusInSupabase(
  id: string,
  newStatus: StoryStatus
): Promise<{ isSupabase: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { isSupabase: false };
  }

  try {
    const { error } = await supabase
      .from("user_stories")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("[Supabase] Error updating story status:", error);
      return { isSupabase: true, error: error.message };
    }

    return { isSupabase: true };
  } catch (err: any) {
    console.error("[Supabase] Error updating story status:", err);
    return { isSupabase: true, error: err.message };
  }
}

/**
 * Delete a story from Supabase
 */
export async function deleteStoryFromSupabase(
  id: string
): Promise<{ isSupabase: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { isSupabase: false };
  }

  try {
    const { error } = await supabase.from("user_stories").delete().eq("id", id);

    if (error) {
      console.error("[Supabase] Error deleting story:", error);
      return { isSupabase: true, error: error.message };
    }

    return { isSupabase: true };
  } catch (err: any) {
    console.error("[Supabase] Error deleting story:", err);
    return { isSupabase: true, error: err.message };
  }
}

/**
 * Clear all stories from Supabase
 */
export async function clearAllStoriesFromSupabase(
  userId?: string
): Promise<{ isSupabase: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { isSupabase: false };
  }

  try {
    let query = supabase.from("user_stories").delete();
    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all
    }

    const { error } = await query;
    if (error) {
      console.error("[Supabase] Error clearing stories:", error);
      return { isSupabase: true, error: error.message };
    }

    return { isSupabase: true };
  } catch (err: any) {
    return { isSupabase: true, error: err.message };
  }
}

/**
 * Upsert or login profile in Supabase
 */
export async function syncUserProfileWithSupabase(
  profile: UserProfile
): Promise<{ profile: UserProfile; isSupabase: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { profile, isSupabase: false };
  }

  try {
    const payload = {
      email: profile.email,
      name: profile.name,
      role: profile.role,
      avatar_color: profile.avatarColor || "from-indigo-500 to-indigo-700",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "email" })
      .select("*")
      .single();

    if (error) {
      console.error("[Supabase] Error syncing profile:", error);
      return { profile, isSupabase: true, error: error.message };
    }

    const syncedProfile: UserProfile = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role || "Product Owner",
      avatarColor: data.avatar_color,
    };

    return { profile: syncedProfile, isSupabase: true };
  } catch (err: any) {
    console.error("[Supabase] Error in syncUserProfileWithSupabase:", err);
    return { profile, isSupabase: true, error: err.message };
  }
}

/**
 * Fetch all registered profiles from Supabase for RBAC Admin Panel
 */
export async function fetchAllProfilesFromSupabase(): Promise<{
  profiles: UserProfile[];
  isSupabase: boolean;
  error?: string;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { profiles: [], isSupabase: false };
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Supabase] Error fetching profiles:", error);
      return { profiles: [], isSupabase: true, error: error.message };
    }

    const profiles: UserProfile[] = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role || "Product Owner",
      avatarColor: row.avatar_color || "from-indigo-500 to-indigo-700",
    }));

    return { profiles, isSupabase: true };
  } catch (err: any) {
    console.error("[Supabase] Error fetching profiles:", err);
    return { profiles: [], isSupabase: true, error: err.message || "Erro desconhecido" };
  }
}

/**
 * Update a user's role in Supabase
 */
export async function updateUserRoleInSupabase(
  email: string,
  newRole: string
): Promise<{ isSupabase: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { isSupabase: false };
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("email", email);

    if (error) {
      console.error("[Supabase] Error updating user role:", error);
      return { isSupabase: true, error: error.message };
    }

    return { isSupabase: true };
  } catch (err: any) {
    console.error("[Supabase] Error updating user role:", err);
    return { isSupabase: true, error: err.message };
  }
}

