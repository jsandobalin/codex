export function getSupabaseConfig(config = window.AI_RADAR_CONFIG) {
  if (!config?.supabaseUrl || !config?.supabasePublishableKey) {
    return null;
  }

  return config;
}
