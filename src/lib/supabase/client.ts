import { createClient } from "@supabase/supabase-js";
import { hasSupabasePublicEnv, supabaseEnv } from "@/lib/supabase/env";

let browserClient: ReturnType<typeof createClient> | null = null;

export const getSupabaseBrowserClient = () => {
  if (!hasSupabasePublicEnv) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(supabaseEnv.url!, supabaseEnv.anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return browserClient;
};
