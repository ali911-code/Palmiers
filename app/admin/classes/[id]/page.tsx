"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import TopBar from "../../../components/TopBar";
import { useAuth } from "../../../lib/auth";
import { useClasses } from "../../../lib/classes-store";
import { supabase } from "../../../lib/supabase";
import type { Course } from "../../../lib/mock-data";

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

const COURSE_ACCENTS = [
  "from-indigo-500 to-fuchsia-500",
  "from-emerald-500 to-cyan-500",
  "from-amber-500 to-red-500",
  "from-sky-500 to-indigo-500",
  "from-violet-500 to-purple-500",
  "from-rose-500 to-orange-500",
];

type ProfileRow = {
  id: string;
  name: string | null;
  role: "student" | "teacher" | "admin";
  classe_id: string | null;
};

export default function AdminClasseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, ready } = useAuth();
  const {
    findClasse,
    studentsByClasse,
    coursesByClasse,
    gradesByStudent,
    addCourse,
    removeCourse,
  } = useClasses();

  const [addingCourse, setAddingCourse] = useState(false);
  const [assigningStudent, setAssigningStudent] = useState(false);
  const [assigningTeacher, setAssigningTeacher] = useState(false);
  const [teacherProfiles, setTeacherProfiles] = useState<ProfileRow[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
    else if (ready && user && user.role !== "admin") router.replace("/");
  }, [ready, user, router]);

  // Fetch all teacher profiles (for this class and for picker)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, role, classe_id")
        .eq("role", "teacher");
      setTeacherProfiles((data ?? []) as ProfileRow[]);
    })();
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const classe = findClasse(id);
  if (ready && !classe) notFound();

  if (!ready || !user || user.role !== "admin" || !classe) {
    return (
      <div className="flex-1 grid place-items-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="text-sm text-slate-500"
        >
          Chargement…
        </motion.div>
      </div>
    );
  }

  const students = studentsByClasse(classe.id);
  const courses = coursesByClasse(classe.id);
  const teachersInClasse = teacherProfiles.filter((t) => t.classe_id === classe.id);

  async function assignUserToClass(userId: string, classeId: string | null) {
    const target = teacherProfiles.find((t) => t.id === userId);
    const body: Record<string, unknown> = { userId, classeId };
    if (target) {
      body.name = target.name ?? "";
      body.role = target.role;
    }
    const res = await fetch("/api/create-user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Erreur" }));
      alert(`Erreur: ${error ?? "inconnue"}`);
      return false;
    }
    return true;
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar />

      <div className={`relative bg-gradient-to-br ${classe.accent} text-white`}>
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-5 pb-10">
          <Link
            href="/admin/classes"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M12.7 4.3a1 1 0 0 1 0 1.4L8.4 10l4.3 4.3a1 1 0 1 1-1.4 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 0z" />
            </svg>
            Toutes les classes
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-4 flex items-start gap-4"
          >
            <div className="h-16 w-16 rounded-2xl bg-white/90 grid place-items-center text-3xl shadow-lg">
              {classe.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight drop-shadow">
                {classe.name}
              </h1>
              <p className="text-sm text-white/85">
                {classe.level} · {students.length} élèves · {teachersInClasse.length} enseignants · {courses.length} cours
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-10">
        {/* Cours */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cours ({courses.length})
            </h2>
            <button
              onClick={() => setAddingCourse(true)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              + Ajouter un cours
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 text-sm">
              Aucun cours dans cette classe.
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {courses.map((c) => (
                <motion.div
                  key={c.id}
                  variants={item}
                  className="relative rounded-2xl bg-white border border-slate-200/70 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`h-16 bg-gradient-to-br ${c.accent} relative`}>
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)]" />
                    <div className="absolute -bottom-4 right-3 h-10 w-10 rounded-2xl bg-white/90 grid place-items-center text-xl shadow">
                      {c.emoji}
                    </div>
                  </div>
                  <div className="p-4 pt-6">
                    <div className="font-semibold text-slate-900 truncate">{c.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{c.teacher || "À définir"}</div>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer le cours "${c.name}" ?`)) removeCourse(c.id);
                      }}
                      className="mt-3 text-[11px] text-rose-500 hover:text-rose-700"
                    >
                      Supprimer
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* Enseignants */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Enseignants ({teachersInClasse.length})
            </h2>
            <button
              onClick={() => setAssigningTeacher(true)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              + Ajouter un enseignant
            </button>
          </div>

          {teachersInClasse.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 text-sm">
              Aucun enseignant affecté à cette classe.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teachersInClasse.map((t) => (
                <div
                  key={t.id}
                  className="group relative rounded-2xl bg-white border border-slate-200/70 p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
                >
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 grid place-items-center text-xl shadow text-white">
                    🎓
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {t.name || "Sans nom"}
                    </div>
                    <div className="text-[11px] text-slate-500">Enseignant</div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm(`Retirer ${t.name || "cet enseignant"} de la classe ?`)) return;
                      const ok = await assignUserToClass(t.id, null);
                      if (ok) reload();
                    }}
                    className="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded-lg hover:bg-rose-50"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Élèves */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Élèves ({students.length})
            </h2>
            <button
              onClick={() => setAssigningStudent(true)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              + Ajouter un élève
            </button>
          </div>

          {students.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 text-sm">
              Aucun élève dans cette classe.
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {students.map((s) => {
                const scores = gradesByStudent(s.id).map((g) => g.score);
                const avg =
                  scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
                return (
                  <motion.div key={s.id} variants={item} whileHover={{ y: -3 }}>
                    <div className="relative group rounded-2xl bg-white border border-slate-200/70 p-4 shadow-sm hover:shadow-xl transition-shadow">
                      <Link href={`/student/${s.id}`} className="block">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${classe.accent} grid place-items-center text-2xl shadow`}>
                            {s.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 truncate">
                              {s.firstName} {s.lastName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{s.email}</div>
                          </div>
                          {avg !== null && (
                            <div className="text-right">
                              <div className="text-lg font-bold tabular-nums text-slate-800">
                                {avg.toFixed(1)}
                              </div>
                              <div className="text-[10px] text-slate-400">/ 20</div>
                            </div>
                          )}
                        </div>
                      </Link>
                      <button
                        onClick={async () => {
                          if (!confirm(`Retirer ${s.firstName} ${s.lastName} de la classe ?`)) return;
                          const ok = await assignUserToClass(s.id, null);
                          if (ok) window.location.reload();
                        }}
                        className="absolute top-2 right-2 text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded-lg hover:bg-rose-50"
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {addingCourse && (
          <CourseModal
            classeId={classe.id}
            onClose={() => setAddingCourse(false)}
            onSave={(data) => {
              addCourse(data);
              setAddingCourse(false);
            }}
          />
        )}
        {assigningStudent && (
          <UserPickerModal
            title="Ajouter un élève"
            role="student"
            classeId={classe.id}
            onClose={() => setAssigningStudent(false)}
            onPicked={async (userId) => {
              const ok = await assignUserToClass(userId, classe.id);
              setAssigningStudent(false);
              if (ok) window.location.reload();
            }}
          />
        )}
        {assigningTeacher && (
          <UserPickerModal
            title="Ajouter un enseignant"
            role="teacher"
            classeId={classe.id}
            onClose={() => setAssigningTeacher(false)}
            onPicked={async (userId) => {
              const ok = await assignUserToClass(userId, classe.id);
              setAssigningTeacher(false);
              if (ok) reload();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   User picker (students or teachers from profiles table)
   ============================================================ */
function UserPickerModal({
  title,
  role,
  classeId,
  onClose,
  onPicked,
}: {
  title: string;
  role: "student" | "teacher";
  classeId: string;
  onClose: () => void;
  onPicked: (userId: string) => void;
}) {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, role, classe_id")
        .eq("role", role);
      setProfiles((data ?? []) as ProfileRow[]);
      setLoading(false);
    })();
  }, [role]);

  const filtered = profiles
    .filter((p) => p.classe_id !== classeId) // exclude already in this class
    .filter((p) => (query ? (p.name ?? "").toLowerCase().includes(query.toLowerCase()) : true));

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
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6 max-h-[90vh] overflow-hidden flex flex-col"
      >
        <h2 className="text-lg font-bold tracking-tight mb-4">{title}</h2>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom…"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mb-3"
        />

        <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-2">
          {loading ? (
            <div className="text-center text-sm text-slate-500 py-8">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-sm text-slate-500 py-8">
              Aucun compte {role === "student" ? "élève" : "enseignant"} disponible.
              <br />
              <span className="text-xs text-slate-400">
                Crée d&apos;abord le compte via « Gérer les utilisateurs ».
              </span>
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => onPicked(p.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-200 text-left transition-colors"
              >
                <div className={`h-10 w-10 rounded-xl grid place-items-center text-lg shadow ${
                  role === "student"
                    ? "bg-gradient-to-br from-emerald-500 to-cyan-500"
                    : "bg-gradient-to-br from-violet-500 to-purple-500"
                } text-white`}>
                  {role === "student" ? "🧑‍🎓" : "🎓"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate text-sm">
                    {p.name || "Sans nom"}
                  </div>
                  {p.classe_id && p.classe_id !== classeId && (
                    <div className="text-[11px] text-amber-600">
                      Actuellement dans : {p.classe_id}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 text-sm font-semibold"
        >
          Fermer
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   Course modal (unchanged)
   ============================================================ */
function CourseModal({
  classeId,
  onClose,
  onSave,
}: {
  classeId: string;
  onClose: () => void;
  onSave: (data: Omit<Course, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [emoji, setEmoji] = useState("📘");
  const [accent, setAccent] = useState(COURSE_ACCENTS[0]);

  const canSave = name.trim();

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
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${accent} grid place-items-center text-2xl shadow-md`}>
            {emoji}
          </div>
          <h2 className="text-lg font-bold tracking-tight">Nouveau cours</h2>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Nom du cours</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="Ex. Mathématiques"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Enseignant (optionnel)</span>
            <input
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="Ex. M. Bernard"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Emoji</span>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xl text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </label>
          <div>
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Couleur</span>
            <div className="grid grid-cols-6 gap-2">
              {COURSE_ACCENTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAccent(a)}
                  className={`h-9 rounded-xl bg-gradient-to-br ${a} ${accent === a ? "ring-2 ring-offset-2 ring-slate-800" : ""}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 text-sm font-semibold"
          >
            Annuler
          </button>
          <motion.button
            disabled={!canSave}
            onClick={() =>
              canSave &&
              onSave({
                classeId,
                name: name.trim(),
                teacher: teacher.trim(),
                emoji,
                accent,
                progress: 0,
              })
            }
            whileTap={{ scale: 0.98 }}
            className={`flex-1 rounded-xl bg-gradient-to-r ${accent} text-white py-2.5 text-sm font-semibold shadow-md disabled:opacity-50`}
          >
            Créer
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
