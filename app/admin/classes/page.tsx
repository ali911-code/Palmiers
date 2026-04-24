"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import TopBar from "../../components/TopBar";
import { useAuth } from "../../lib/auth";
import { useClasses } from "../../lib/classes-store";
import {
  ACCENT_OPTIONS,
  EMOJI_OPTIONS,
  type Classe,
} from "../../lib/mock-data";

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

type FormData = Omit<Classe, "id">;

const EMPTY_FORM: FormData = {
  name: "",
  level: "3ème année collège",
  section: "",
  studentCount: 25,
  accent: ACCENT_OPTIONS[0],
  emoji: EMOJI_OPTIONS[0],
};

export default function AdminClassesPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const { classes, addClasse, updateClasse, removeClasse, coursesByClasse, resetAll } = useClasses();

  const [editing, setEditing] = useState<Classe | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Classe | null>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
    else if (ready && user && user.role !== "admin") router.replace("/");
  }, [ready, user, router]);

  if (!ready || !user || user.role !== "admin") {
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

  return (
    <div className="flex-1 flex flex-col">
      <TopBar />

      <div className="relative bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-5 pb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M12.7 4.3a1 1 0 0 1 0 1.4L8.4 10l4.3 4.3a1 1 0 1 1-1.4 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 0z" />
            </svg>
            Tableau de bord
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-4 flex items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight drop-shadow">
                Gérer les classes
              </h1>
              <p className="text-sm text-white/85">
                {classes.length} classe{classes.length > 1 ? "s" : ""} · chaque nouvelle classe reçoit les 10 matières 3AC.
              </p>
            </div>
            <motion.button
              onClick={() => setCreating(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-4 py-2 text-sm font-semibold shadow-md"
            >
              <span className="text-lg leading-none">+</span> Nouvelle classe
            </motion.button>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {classes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="text-lg font-semibold">Aucune classe</div>
            <div className="text-sm text-slate-500 mt-1">
              Créez votre première classe pour commencer.
            </div>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {classes.map((c) => {
              const count = coursesByClasse(c.id).length;
              return (
                <motion.div
                  key={c.id}
                  variants={item}
                  whileHover={{ y: -3 }}
                  className="relative rounded-2xl bg-white border border-slate-200/70 overflow-hidden shadow-sm"
                >
                  <div className={`h-24 bg-gradient-to-br ${c.accent} relative`}>
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)]" />
                    <div className="absolute top-3 left-4 text-white">
                      <div className="text-xl font-bold drop-shadow">{c.name}</div>
                      <div className="text-xs opacity-90">{c.level}</div>
                    </div>
                    <div className="absolute -bottom-4 right-4 h-14 w-14 rounded-2xl bg-white/90 grid place-items-center text-2xl shadow-md">
                      {c.emoji}
                    </div>
                  </div>
                  <div className="p-4 pt-6">
                    <div className="grid grid-cols-2 gap-3 text-center mb-3">
                      <div>
                        <div className="text-xl font-bold text-slate-800">{c.studentCount}</div>
                        <div className="text-[11px] text-slate-500">Élèves</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-slate-800">{count}</div>
                        <div className="text-[11px] text-slate-500">Cours</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(c)}
                        className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium py-2 transition-colors"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => setConfirmDelete(c)}
                        className="flex-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-medium py-2 transition-colors"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              if (confirm("Réinitialiser toutes les classes aux valeurs par défaut ?")) resetAll();
            }}
            className="text-xs text-slate-400 hover:text-slate-600 underline"
          >
            Réinitialiser aux classes par défaut
          </button>
        </div>
      </div>

      <AnimatePresence>
        {(creating || editing) && (
          <ClasseFormModal
            initial={editing ?? EMPTY_FORM}
            title={editing ? "Modifier la classe" : "Nouvelle classe"}
            onClose={() => {
              setCreating(false);
              setEditing(null);
            }}
            onSubmit={async (data) => {
              if (editing) {
                updateClasse(editing.id, data);
              } else {
                const { error } = await addClasse(data);
                if (error) {
                  alert(`Erreur sauvegarde: ${error}\n\nVérifie que ton compte est bien admin dans Supabase.`);
                  return;
                }
              }
              setCreating(false);
              setEditing(null);
            }}
          />
        )}
        {confirmDelete && (
          <ConfirmModal
            title={`Supprimer ${confirmDelete.name} ?`}
            body="Cette action supprimera la classe et tous ses cours associés. Irréversible."
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => {
              removeClasse(confirmDelete.id);
              setConfirmDelete(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ClasseFormModal({
  initial,
  title,
  onClose,
  onSubmit,
}: {
  initial: FormData | Classe;
  title: string;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [level, setLevel] = useState(initial.level);
  const [section, setSection] = useState(initial.section);
  const [studentCount, setStudentCount] = useState(initial.studentCount);
  const [accent, setAccent] = useState(initial.accent);
  const [emoji, setEmoji] = useState(initial.emoji);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      level: level.trim() || "3ème année collège",
      section: section.trim(),
      studentCount: Math.max(0, studentCount || 0),
      accent,
      emoji,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <motion.form
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.25, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-lg rounded-3xl bg-white shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${accent} grid place-items-center text-2xl shadow-md`}>
            {emoji}
          </div>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        </div>

        <div className="space-y-4">
          <Field label="Nom de la classe">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. 3AC 5"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Niveau">
              <input
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </Field>
            <Field label="Section">
              <input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="1, 2, A…"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </Field>
          </div>

          <Field label="Nombre d'élèves">
            <input
              type="number"
              value={studentCount}
              min={0}
              onChange={(e) => setStudentCount(parseInt(e.target.value, 10) || 0)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </Field>

          <Field label="Emoji">
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`h-10 w-10 rounded-xl text-xl grid place-items-center transition ${
                    emoji === e ? "bg-slate-900 text-white scale-110" : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Couleur">
            <div className="grid grid-cols-4 gap-2">
              {ACCENT_OPTIONS.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setAccent(a)}
                  className={`h-10 rounded-xl bg-gradient-to-br ${a} transition ${
                    accent === a ? "ring-2 ring-offset-2 ring-slate-900 scale-105" : ""
                  }`}
                />
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 text-sm font-semibold transition-colors"
          >
            Annuler
          </button>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 rounded-xl bg-gradient-to-r ${accent} text-white py-2.5 text-sm font-semibold shadow-md`}
          >
            Enregistrer
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function ConfirmModal({
  title,
  body,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm grid place-items-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.25, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-6"
      >
        <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 grid place-items-center text-2xl mb-3">
          ⚠️
        </div>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-slate-600 mt-1">{body}</p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 text-sm font-semibold transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white py-2.5 text-sm font-semibold shadow-md"
          >
            Supprimer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
