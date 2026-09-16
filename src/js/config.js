const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://zagtzosyqdeigffpdtym.supabase.co";

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "YOUR_SUPABASE_ANON_KEY";

export const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

export const ROUTE_COLORS = {
  A: "#0b4ea2",
  B: "#1a9e5c",
  C: "#f2a900"
};
