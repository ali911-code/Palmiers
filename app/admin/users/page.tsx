"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useClasses } from "../../lib/classes-store";
import TopBar from "../../components/TopBar";
import { useAuth } from "../../lib/auth";
import { useRouter } from "next/navigation";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: "student" | "teacher" | "admin";
  classeId?: string;
  teacherId?: string;
  createdAt: string;
};

const ROLE_LABELS = { student: "Élève", teacher: "Enseignant", admin: "Admin" };
const ROLE_COLORS = {
  student: "bg-emerald-100 text-emerald-700",
  teacher: "bg-indigo-100 text-indigo-700",
  admin: "bg-rose-100 text-rose-700",
};

export default function AdminUsersPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const { classes, teachers } = useClasses();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && (!user || user.role !== "admin")) router.replace("/");
  }, [ready, user, router]);

  async function loadUsers() {
    setLoading(true);
    const res = await fetch("/api/list-users");
    const data = await res.json();
    if (data.users) setUsers(data.users);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleDelete(userId: string) {
    if (!confirm("Supprimer ce compte ? Cette action est irréversible.")) return;
    setDeleting(userId);
    const res = await fetch("/api/create-user", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (data.error) { alert("Erreur : " + data.error); }
    else { await loadUsers(); }
    setDeleting(null);
  }

  const roleOf = (role: UserRow["role"]) =>
    role === "student" ? "👨‍🎓" : role === "teacher" ? "👩‍🏫" : "🛡️";

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <TopBar />
      <main className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-700 mb-1 block">← Retour</Link>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des comptes</h1>
            <p className="text-sm text-slate-500 mt-0.5">{users.length} comptes enregistrés</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2.5 text-sm font-semibold shadow-md shadow-cyan-500/30"
          >
            <span className="text-lg">+</span> Nouveau compte
          </motion.button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        {loading ? (
          <div className="grid place-items-center py-20 text-slate-400 text-sm">Chargement…</div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => {
              const classe = classes.find((c) => c.id === u.classeId);
              const teacher = teachers.find((t) => t.id === u.teacherId);
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 rounded-2xl bg-white border border-slate-200/70 p-4 shadow-sm"
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white grid place-items-center text-lg font-bold flex-shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{u.name || "—"}</span>
                      <span className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${ROLE_COLORS[u.role]}`}>
                        {roleOf(u.role)} {ROLE_LABELS[u.role]}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{u.email}</div>
                    {classe && <div className="text-xs text-slate-400">{classe.emoji} {classe.name}</div>}
                    {teacher && <div className="text-xs text-slate-400">👩‍🏫 {teacher.name}</div>}
                  </div>
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={deleting === u.id}
                    className="text-xs text-rose-500 hover:text-rose-700 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50"
                  >
                    {deleting === u.id ? "…" : "Supprimer"}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <AnimatePresence>
        {creating && (
          <CreateUserModal
            classes={classes}
            teachers={teachers}
            onClose={() => setCreating(false)}
            onCreated={async () => {
              setCreating(false);
              await loadUsers();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateUserModal({
  classes,
  teachers,
  onClose,
  onCreated,
}: {
  classes: { id: string; name: string; emoji: string }[];
  teachers: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [role, setRole] = useState<"student" | "teacher" | "admin">("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classeId, setClasseId] = useState(classes[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        classeId: role === "student" ? classeId : undefined,
        teacherId: role === "teacher" ? teacherId : undefined,
      }),
    });

    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setSubmitting(false);
    } else {
      onCreated();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 grid place-items-center text-2xl shadow-md">
            👤
          </div>
          <h2 className="text-lg font-bold tracking-tight">Nouveau compte</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role */}
          <div>
            <span className="text-xs font-medium text-slate-600 mb-2 block">Rôle</span>
            <div className="grid grid-cols-3 gap-2">
              {(["student", "teacher", "admin"] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-xl p-2.5 text-center border text-sm font-medium transition-colors ${
                    role === r
                      ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {r === "student" ? "🎒 Élève" : r === "teacher" ? "👩‍🏫 Prof" : "🛡️ Admin"}
                </button>
              ))}
            </div>
          </div>

          {/* Classe picker for student */}
          {role === "student" && classes.length > 0 && (
            <label className="block">
              <span className="text-xs font-medium text-slate-600 mb-1.5 block">Classe</span>
              <select
                value={classeId}
                onChange={(e) => setClasseId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </label>
          )}

          {/* Teacher picker for teacher */}
          {role === "teacher" && teachers.length > 0 && (
            <label className="block">
              <span className="text-xs font-medium text-slate-600 mb-1.5 block">Profil enseignant</span>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
          )}

          {/* Name */}
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Nom complet</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Amina Diallo"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </label>

          {/* Email */}
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="exemple@email.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </label>

          {/* Password */}
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Mot de passe</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Minimum 6 caractères"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </label>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 text-sm font-semibold"
            >
              Annuler
            </button>
            <motion.button
              type="submit"
              disabled={submitting || !name.trim() || !email.trim() || !password.trim()}
              whileTap={{ scale: 0.98 }}
              className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2.5 text-sm font-semibold shadow-md disabled:opacity-50"
            >
              {submitting ? "Création…" : "Créer le compte"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
