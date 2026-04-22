"use client";

import { motion } from "framer-motion";
import { useAuth, type Role } from "../lib/auth";
import { useClasses } from "../lib/classes-store";

function roleFr(role?: Role) {
  if (!role) return "";
  return role === "student" ? "Élève" : role === "teacher" ? "Enseignant" : "Admin";
}

export default function TopBar() {
  const { user, signOut } = useAuth();
  const { findClasse } = useClasses();
  const initial = (user?.name ?? "?").charAt(0).toUpperCase();
  const classe = findClasse(user?.classeId);

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      className="sticky top-0 z-20 backdrop-blur-md bg-white/70 border-b border-slate-200/70"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 grid place-items-center text-sm shadow-md shadow-emerald-500/30">
            🌴
          </div>
          <span className="font-semibold tracking-tight truncate">Les Palmiers</span>
          {classe && (
            <span className="ml-1 hidden sm:inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-semibold">
              <span>{classe.emoji}</span>
              <span>{classe.name}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-slate-500">
            {roleFr(user?.role)}
          </span>
          <button
            onClick={() => signOut()}
            className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white grid place-items-center text-sm font-semibold shadow hover:scale-105 transition-transform"
            title="Se déconnecter"
          >
            {initial}
          </button>
        </div>
      </div>
    </motion.header>
  );
}
