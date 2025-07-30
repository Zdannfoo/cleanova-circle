import "@/app/globals.css";
import Navbar from "@/components/Navbar";
import { getServerSession, createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Get session from server cookies
  const session = await getServerSession();
  if (!session) redirect("/");
  // Use server-side supabase client
  const supabase = await createSupabaseServerClient();
  // Fetch user profile
  const { data: userProfile } = await supabase
    .from("users")
    .select("is_subscribed")
    .eq("id", session.user.id)
    .single();
  if (!userProfile || !userProfile.is_subscribed) redirect("/subscribe-info");
  // Fetch categories
  const { data: categories } = await supabase.from("categories").select("id, name");
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white font-sans">
      <Navbar userEmail={session.user.email} categories={categories || []} />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
} 