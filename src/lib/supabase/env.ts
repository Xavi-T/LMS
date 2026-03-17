export const supabaseEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  bucketName:
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "lms-resources",
};

export const hasSupabasePublicEnv =
  Boolean(supabaseEnv.url) && Boolean(supabaseEnv.anonKey);
