"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";


const ROLES = [
  { value: "student", label: "Élève",          emoji: "🎒"  },
  { value: "teacher", label: "Enseignant",     emoji: "👩‍🏫" },
  { value: "admin",   label: "Administrateur", emoji: "🛡️"  },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { user, ready, signIn } = useAuth();

  const [role, setRole] = useState<"student"|"teacher"|"admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [serverReady, setServerReady] = useState(false);
  const warmupDone = useRef(false);

  useEffect(() => {
    if (ready && user) router.replace("/");
  }, [ready, user, router]);

  // Réveille Supabase dès l'ouverture de la page
  useEffect(() => {
    if (warmupDone.current) return;
    warmupDone.current = true;
    const wake = async () => {
      try {
        await Promise.race([
          supabase.from("profiles").select("id").limit(1),
          new Promise((_, r) => setTimeout(() => r(new Error("t")), 30000)),
        ]);
      } catch { /* ignore */ }
      setServerReady(true);
    };
    wake();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !email.trim() || !password.trim()) return;
    setSubmitting(true);
    setError(null);
    setStatus("Connexion en cours…");

    const err = await signIn(email.trim(), password);

    if (!err) {
      setStatus("Connecté !");
      router.replace("/");
      return;
    }

    if (err === "WAKING_UP") {
      setError("Le serveur redémarre. Attends 30 secondes et réessaie.");
    } else if (err.includes("Invalid") || err.includes("invalid_credentials")) {
      setError("Email ou mot de passe incorrect. Contacte l'administrateur si tu n'as pas encore de compte.");
    } else {
      setError(err);
    }

    setSubmitting(false);
    setStatus("");
  }

  return (
    <div className="bg-mesh relative min-h-dvh flex items-center justify-center px-5 py-10 overflow-hidden">
      <FloatingBlobs />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        className="glass relative w-full max-w-md rounded-3xl p-7 sm:p-9"
      >
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 grid place-items-center text-white text-xl shadow-lg shadow-emerald-500/30">
            🌴
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Les Palmiers</h1>
            <p className="text-xs text-slate-500">Connectez-vous pour continuer</p>
          </div>
        </motion.div>

        {/* Indicateur réveil serveur */}
        <AnimatePresence>
          {!serverReady && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-700"
            >
              <Spinner />
              Démarrage du serveur… (peut prendre 30s la première fois)
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sélecteur de rôle */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">Je suis…</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => {
                const active = r.value === role;
                return (
                  <motion.button
                    type="button"
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    whileTap={{ scale: 0.96 }}
                    className={`relative rounded-2xl p-3 text-left border transition-colors ${
                      active ? "border-indigo-500/60 bg-white" : "border-transparent bg-white/50 hover:bg-white/80"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="role-ring"
                        className="absolute inset-0 rounded-2xl ring-2 ring-indigo-500/70"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className="text-xl">{r.emoji}</div>
                    <div className="mt-1 text-xs font-semibold">{r.label}</div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <Field label="Email" value={email} onChange={setEmail}
            type="email" autoComplete="email" placeholder="exemple@email.com" />

          <Field label="Mot de passe" value={password} onChange={setPassword}
            type="password" placeholder="••••••" autoComplete="current-password" />

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={submitting || !email.trim() || !password.trim() || !serverReady}
            whileHover={{ scale: submitting ? 1 : 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-3 font-semibold shadow-lg shadow-emerald-600/30 disabled:opacity-70"
          >
            <AnimatePresence mode="wait" initial={false}>
              {submitting ? (
                <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-2">
                  <Spinner /> {status || "Connexion en cours…"}
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Se connecter
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          École Les Palmiers · Contactez l&apos;administrateur pour obtenir vos identifiants.
        </p>
      </motion.div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", autoComplete, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; autoComplete?: string; hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 mb-1.5 block">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        type={type} autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent" />
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function FloatingBlobs() {
  return (
    <>
      <motion.div className="blob bg-emerald-400 h-[320px] w-[320px] -left-20 -top-20"
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="blob bg-cyan-400 h-[360px] w-[360px] -right-24 top-1/3"
        animate={{ x: [0, -25, 0], y: [0, 35, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="blob bg-amber-300 h-[280px] w-[280px] left-1/4 -bottom-24"
        animate={{ x: [0, 20, 0], y: [0, -20, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} />
    </>
  );
}

