"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (loginError || !data.session) {
      setError(loginError?.message || "Email atau password salah.");
      setLoading(false);
      return;
    }
    // Fetch user subscription status
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_subscribed")
      .eq("id", data.session.user.id)
      .single();
    if (userError || !userData) {
      setError(userError?.message || "Gagal memeriksa status langganan. (userData null)");
      setLoading(false);
      await supabase.auth.signOut();
      return;
    }
    if (userData.is_subscribed) {
      router.replace("/dashboard");
      // Fallback: force reload if router.replace fails
      setTimeout(() => { window.location.href = "/dashboard"; }, 500);
    } else {
      await supabase.auth.signOut();
      router.replace("/subscribe-info?msg=not-subscribed");
      setTimeout(() => { window.location.href = "/subscribe-info?msg=not-subscribed"; }, 500);
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleLogin}
      className="w-full max-w-sm bg-white rounded-lg shadow-md p-6 flex flex-col gap-4 border border-gray-100"
    >
      <h2 className="text-xl font-bold mb-2 text-center text-gray-800">Login ke Cleanova Circle</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="input input-bordered w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        className="input input-bordered w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition-colors disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Memproses..." : "Login"}
      </button>
    </form>
  );
} 