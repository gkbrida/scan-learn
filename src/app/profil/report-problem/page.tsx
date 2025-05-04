"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function ReportProblemPage() {
  const router = useRouter();
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        // On récupère le prénom depuis info_users
        const { data: userInfo } = await supabase
          .from("info_users")
          .select("prenom")
          .eq("user_id", user.id)
          .single();
        setPrenom(userInfo?.prenom || "");
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("https://n8n-tb3a.onrender.com/webhook/2165463d-9c0b-4045-b127-b6a8585c08d2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prenom, email, description })
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      router.push("/profil");
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-[#F3F0FF] p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto bg-white rounded-2xl p-8 shadow-md">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.push("/profil")}
            className="w-10 h-10 rounded-full bg-[#F3F0FF] flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Signaler un problème</h1>
          <div className="w-10 h-10" />
        </div>
        {success ? (
          <div className="text-center py-12">
            <div className="text-green-600 text-3xl mb-4">✅</div>
            <div className="text-lg font-medium mb-2">Merci pour ton retour !</div>
            <div className="text-gray-500">Nous avons bien reçu ton signalement.<br/>Redirection vers le profil...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
              <input
                type="text"
                value={prenom}
                readOnly
                className="w-full p-4 rounded-2xl bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full p-4 rounded-2xl bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Décris ton problème</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                rows={5}
                className="w-full p-4 rounded-2xl bg-white border border-gray-200"
                placeholder="Décris ici le problème rencontré..."
              />
            </div>
            <button
              type="submit"
              disabled={loading || !description}
              className={`w-full bg-black text-white p-4 rounded-2xl font-medium ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Envoi en cours...' : 'Envoyer'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 