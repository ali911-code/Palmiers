import type { Role } from "./auth";

export type Classe = {
  id: string;
  name: string;
  level: string;
  section: string;
  studentCount: number;
  accent: string;
  emoji: string;
};

export type Course = {
  id: string;
  classeId: string;
  name: string;
  teacher: string;
  accent: string;
  emoji: string;
  progress: number;
};

export type Announcement = {
  id: string;
  author: string;
  role: Role;
  body: string;
  when: string;
  classeId?: string;
  courseId?: string;
};

export type Assignment = {
  id: string;
  title: string;
  courseId: string;
  dueLabel: string;
  done: boolean;
};

export type StreamPost = {
  id: string;
  courseId: string;
  author: string;
  role: Role;
  when: string;
  body: string;
  kind: "announcement" | "assignment" | "material";
  title?: string;
};

export type Person = {
  id: string;
  name: string;
  role: Role;
};

export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  classeId: string;
  emoji: string;
  birthDate: string;
  parentName: string;
  parentPhone: string;
  email: string;
};

export type Grade = {
  studentId: string;
  assignmentId: string;
  score: number;
};

export type Teacher = {
  id: string;
  name: string;
  email: string;
  subjectSlug: string;
  classeIds: string[];
};

/* ============================================================
   AVAILABLE ACCENTS + EMOJIS for new classes
   ============================================================ */
export const ACCENT_OPTIONS = [
  "from-indigo-500 via-violet-500 to-fuchsia-500",
  "from-rose-500 via-pink-500 to-orange-400",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-amber-500 via-orange-500 to-red-500",
  "from-sky-500 via-blue-500 to-indigo-500",
  "from-fuchsia-500 via-purple-500 to-indigo-500",
  "from-lime-500 via-green-500 to-emerald-500",
  "from-yellow-500 via-amber-500 to-orange-500",
];

export const EMOJI_OPTIONS = ["🎓", "🎒", "🔬", "📖", "🧪", "📚", "🗺️", "✏️", "🌟", "🎯"];

/* ============================================================
   MOROCCAN 3AC CURRICULUM (3ème année collège)
   ============================================================ */
export type Subject = {
  slug: string;
  name: string;
  emoji: string;
  accent: string;
};

export const SUBJECTS_3AC: Subject[] = [
  { slug: "arabe",    name: "Langue Arabe",           emoji: "🇲🇦", accent: "from-red-500 via-rose-500 to-pink-500" },
  { slug: "francais", name: "Français",               emoji: "📘", accent: "from-indigo-500 via-blue-500 to-sky-500" },
  { slug: "anglais",  name: "Anglais",                emoji: "🇬🇧", accent: "from-rose-500 via-pink-500 to-orange-400" },
  { slug: "maths",    name: "Mathématiques",          emoji: "📐", accent: "from-indigo-500 via-violet-500 to-fuchsia-500" },
  { slug: "physique", name: "Physique-Chimie",        emoji: "⚛️", accent: "from-cyan-500 via-sky-500 to-blue-500" },
  { slug: "svt",      name: "SVT",                    emoji: "🌱", accent: "from-emerald-500 via-teal-500 to-cyan-500" },
  { slug: "hg",       name: "Histoire-Géographie",    emoji: "🗺️", accent: "from-amber-500 via-orange-500 to-red-500" },
  { slug: "islamique",name: "Éducation Islamique",    emoji: "🕌", accent: "from-emerald-600 via-green-600 to-teal-600" },
  { slug: "info",     name: "Informatique",           emoji: "💻", accent: "from-sky-500 via-blue-500 to-indigo-500" },
  { slug: "eps",      name: "Éducation Physique",     emoji: "⚽", accent: "from-lime-500 via-green-500 to-emerald-500" },
];

const TEACHERS_BY_CLASS: Record<string, Partial<Record<string, string>>> = {
  "3ac1": {
    arabe: "M. El Mansouri", francais: "Mme Bernard", anglais: "Mr Smith",
    maths: "Mme Okafor", physique: "M. Laurent", svt: "Dr Amari",
    hg: "M. Santos", islamique: "M. Benali", info: "Mme Chen", eps: "M. Diallo",
  },
  "3ac2": {
    arabe: "Mme El Alaoui", francais: "M. Patel", anglais: "Mr Smith",
    maths: "M. Dubois", physique: "Mme Fassi", svt: "Dr Amari",
    hg: "M. Santos", islamique: "M. Benali", info: "Mme Chen", eps: "M. Diallo",
  },
  "3ac3": {
    arabe: "M. El Mansouri", francais: "Mme Bernard", anglais: "Ms Taylor",
    maths: "Mme Okafor", physique: "M. Laurent", svt: "Mme Ziani",
    hg: "M. Alaoui", islamique: "M. Benali", info: "Mme Chen", eps: "M. Diallo",
  },
  "3ac4": {
    arabe: "Mme El Alaoui", francais: "M. Patel", anglais: "Ms Taylor",
    maths: "M. Dubois", physique: "Mme Fassi", svt: "Mme Ziani",
    hg: "M. Alaoui", islamique: "M. Benali", info: "Mme Chen", eps: "M. Diallo",
  },
};

/* deterministic pseudo-random progress from the course id */
export function hashProgress(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return 30 + Math.abs(h) % 60;
}

/* ============================================================
   SEED DATA
   ============================================================ */
export const CLASSES_SEED: Classe[] = [
  { id: "3ac1", name: "3AC 1", level: "3ème année collège", section: "1", studentCount: 28,
    accent: "from-indigo-500 via-violet-500 to-fuchsia-500", emoji: "🎓" },
  { id: "3ac2", name: "3AC 2", level: "3ème année collège", section: "2", studentCount: 30,
    accent: "from-rose-500 via-pink-500 to-orange-400", emoji: "🎒" },
  { id: "3ac3", name: "3AC 3", level: "3ème année collège", section: "3", studentCount: 26,
    accent: "from-emerald-500 via-teal-500 to-cyan-500", emoji: "🔬" },
  { id: "3ac4", name: "3AC 4", level: "3ème année collège", section: "4", studentCount: 24,
    accent: "from-amber-500 via-orange-500 to-red-500", emoji: "📖" },
];

export function buildCoursesForClasse(classe: Classe): Course[] {
  return SUBJECTS_3AC.map((s) => ({
    id: `${classe.id}-${s.slug}`,
    classeId: classe.id,
    name: s.name,
    teacher: TEACHERS_BY_CLASS[classe.id]?.[s.slug] ?? "À définir",
    accent: s.accent,
    emoji: s.emoji,
    progress: hashProgress(`${classe.id}-${s.slug}`),
  }));
}

export const COURSES_SEED: Course[] = CLASSES_SEED.flatMap(buildCoursesForClasse);

/* ============================================================
   Static content — announcements/assignments/stream reference seed course IDs.
   If a class is later deleted, we filter these out.
   ============================================================ */

export const ANNOUNCEMENTS_SEED: Announcement[] = [
  {
    id: "a1",
    author: "Directeur Adeyemi",
    role: "admin",
    body: "Réunions parents-professeurs vendredi. Inscrivez-vous via le portail.",
    when: "il y a 2 h",
  },
  {
    id: "a2",
    author: "Mme Okafor",
    role: "teacher",
    body: "Le contrôle de mathématiques est déplacé à jeudi. Révisez les exercices ce soir.",
    when: "hier",
    courseId: "3ac1-maths",
    classeId: "3ac1",
  },
  {
    id: "a3",
    author: "Dr Amari",
    role: "teacher",
    body: "Les comptes rendus de TP SVT sont à rendre lundi.",
    when: "il y a 2 jours",
    courseId: "3ac1-svt",
    classeId: "3ac1",
  },
  {
    id: "a4",
    author: "CPE Lambert",
    role: "admin",
    body: "Sortie pédagogique pour la 3AC 2 jeudi : autorisation parentale obligatoire.",
    when: "il y a 5 h",
    classeId: "3ac2",
  },
  {
    id: "a5",
    author: "M. El Mansouri",
    role: "teacher",
    body: "Dictée de langue arabe la semaine prochaine — révisez les règles de grammaire.",
    when: "hier",
    courseId: "3ac1-arabe",
    classeId: "3ac1",
  },
  {
    id: "a6",
    author: "M. Benali",
    role: "teacher",
    body: "Apprenez la sourate du cours avant la prochaine séance.",
    when: "il y a 3 jours",
    courseId: "3ac3-islamique",
    classeId: "3ac3",
  },
];

export const ASSIGNMENTS_SEED: Assignment[] = [
  { id: "t1",  title: "Exercices d'algèbre — identités remarquables", courseId: "3ac1-maths",    dueLabel: "Pour demain",   done: false },
  { id: "t2",  title: "Rédaction : un souvenir d'enfance",            courseId: "3ac1-francais", dueLabel: "Pour vendredi", done: false },
  { id: "t3",  title: "TP : la respiration cellulaire",               courseId: "3ac1-svt",      dueLabel: "Pour lundi",    done: false },
  { id: "t4",  title: "Lecture : chapitre 4 (Maroc contemporain)",    courseId: "3ac1-hg",       dueLabel: "Terminé",       done: true  },
  { id: "t5",  title: "Exercices de théorème de Thalès",              courseId: "3ac1-maths",    dueLabel: "Pour mercredi", done: false },
  { id: "t6",  title: "Quiz : loi d'Ohm",                             courseId: "3ac1-physique", dueLabel: "Pour jeudi",    done: false },
  { id: "t7",  title: "Mémorisation : sourate Al-Mulk",               courseId: "3ac1-islamique",dueLabel: "Pour vendredi", done: false },
  { id: "t8",  title: "Projet Scratch : jeu interactif",              courseId: "3ac1-info",     dueLabel: "Dans 2 semaines",done: false },
  { id: "t9",  title: "Reading : 'The Dream' (Unit 3)",               courseId: "3ac1-anglais",  dueLabel: "Terminé",       done: true  },
  { id: "t10", title: "Dictée de langue arabe",                       courseId: "3ac1-arabe",    dueLabel: "Pour lundi",    done: false },

  // 3AC 2
  { id: "t11", title: "Fonctions linéaires — exercices",              courseId: "3ac2-maths",    dueLabel: "Pour demain",   done: false },
  { id: "t12", title: "Expression écrite : l'amitié",                 courseId: "3ac2-francais", dueLabel: "Pour lundi",    done: false },
  { id: "t13", title: "Parcours d'endurance",                         courseId: "3ac2-eps",      dueLabel: "Pour mardi",    done: false },

  // 3AC 3
  { id: "t14", title: "Problème de géométrie dans l'espace",          courseId: "3ac3-maths",    dueLabel: "Pour lundi",    done: false },
  { id: "t15", title: "TP sur les forces",                            courseId: "3ac3-physique", dueLabel: "Pour mercredi", done: false },

  // 3AC 4
  { id: "t16", title: "Compréhension écrite : Unit 4",                courseId: "3ac4-anglais",  dueLabel: "Pour vendredi", done: false },
  { id: "t17", title: "Exposé sur le système solaire",                courseId: "3ac4-svt",      dueLabel: "Pour lundi",    done: false },
];

export const STREAM_SEED: StreamPost[] = [
  { id: "s1", courseId: "3ac1-maths", author: "Mme Okafor", role: "teacher", when: "il y a 2 h",
    kind: "assignment", title: "Exercices d'algèbre — identités remarquables",
    body: "Pour demain. Détaillez vos calculs pour avoir tous les points." },
  { id: "s2", courseId: "3ac1-maths", author: "Mme Okafor", role: "teacher", when: "hier",
    kind: "announcement",
    body: "Le contrôle est déplacé à jeudi — révisez les identités remarquables ce soir." },
  { id: "s3", courseId: "3ac1-maths", author: "Mme Okafor", role: "teacher", when: "il y a 3 jours",
    kind: "material", title: "Fiche des identités remarquables",
    body: "Imprimez la fiche jointe — elle est autorisée pendant le contrôle." },

  { id: "s4", courseId: "3ac1-arabe", author: "M. El Mansouri", role: "teacher", when: "il y a 3 h",
    kind: "assignment", title: "Dictée de langue arabe",
    body: "Révisez la leçon de la semaine dernière — dictée lundi." },
  { id: "s5", courseId: "3ac1-arabe", author: "M. El Mansouri", role: "teacher", when: "hier",
    kind: "material", title: "قصيدة للحفظ",
    body: "Mémorisez la poésie jointe pour la récitation de vendredi." },

  { id: "s6", courseId: "3ac1-francais", author: "Mme Bernard", role: "teacher", when: "il y a 1 h",
    kind: "assignment", title: "Rédaction : un souvenir d'enfance",
    body: "Trois paragraphes, à rendre vendredi. Attention au temps des verbes." },

  { id: "s7", courseId: "3ac1-svt", author: "Dr Amari", role: "teacher", when: "il y a 4 h",
    kind: "assignment", title: "TP : la respiration cellulaire",
    body: "Schéma à compléter + observations. À rendre lundi." },
  { id: "s8", courseId: "3ac1-svt", author: "Dr Amari", role: "teacher", when: "hier",
    kind: "announcement",
    body: "Blouse et lunettes obligatoires pour le TP de jeudi." },

  { id: "s9", courseId: "3ac1-physique", author: "M. Laurent", role: "teacher", when: "il y a 6 h",
    kind: "material", title: "Formulaire : électricité",
    body: "Formulaire pour le contrôle de la semaine prochaine." },

  { id: "s10", courseId: "3ac1-hg", author: "M. Santos", role: "teacher", when: "il y a 2 jours",
    kind: "material", title: "Carte : Maroc contemporain",
    body: "À étudier avant la discussion de mercredi." },

  { id: "s11", courseId: "3ac1-islamique", author: "M. Benali", role: "teacher", when: "il y a 2 jours",
    kind: "assignment", title: "Mémorisation : sourate Al-Mulk",
    body: "Apprenez les 10 premiers versets pour vendredi." },

  { id: "s12", courseId: "3ac1-info", author: "Mme Chen", role: "teacher", when: "il y a 30 min",
    kind: "announcement",
    body: "Bravo pour vos premiers projets Scratch ! Les retours sont publiés." },
  { id: "s13", courseId: "3ac1-info", author: "Mme Chen", role: "teacher", when: "il y a 3 jours",
    kind: "assignment", title: "Projet Scratch : jeu interactif",
    body: "Créez un petit jeu avec au moins 2 sprites et une variable score." },

  { id: "s14", courseId: "3ac1-anglais", author: "Mr Smith", role: "teacher", when: "hier",
    kind: "material", title: "Vocabulary list — Unit 3",
    body: "Learn the words for Friday's quiz." },

  { id: "s15", courseId: "3ac1-eps", author: "M. Diallo", role: "teacher", when: "il y a 2 jours",
    kind: "announcement",
    body: "Tenue de sport obligatoire mardi. Pensez à la bouteille d'eau." },

  { id: "s16", courseId: "3ac1-art", author: "—", role: "teacher", when: "", kind: "announcement", body: "" }, // dummy, filtered out below

  // 3AC 2
  { id: "s17", courseId: "3ac2-maths", author: "M. Dubois", role: "teacher", when: "il y a 3 h",
    kind: "assignment", title: "Fonctions linéaires",
    body: "Exercices 5 à 12 page 48. À rendre demain." },
  { id: "s18", courseId: "3ac2-eps", author: "M. Diallo", role: "teacher", when: "hier",
    kind: "announcement",
    body: "Tenue de sport obligatoire mardi. Pas d'exception." },

  // 3AC 3
  { id: "s19", courseId: "3ac3-maths", author: "Mme Okafor", role: "teacher", when: "il y a 2 h",
    kind: "assignment", title: "Problème de géométrie dans l'espace",
    body: "Problème 3 du manuel, à rendre lundi." },
  { id: "s20", courseId: "3ac3-islamique", author: "M. Benali", role: "teacher", when: "hier",
    kind: "announcement",
    body: "Apprenez la sourate du cours avant la prochaine séance." },

  // 3AC 4
  { id: "s21", courseId: "3ac4-anglais", author: "Ms Taylor", role: "teacher", when: "il y a 1 h",
    kind: "assignment", title: "Reading comprehension — Unit 4",
    body: "Read the text and answer the questions for Friday." },
];

export const PEOPLE_BY_COURSE_SEED: Record<string, Person[]> = {
  "3ac1-maths": [
    { id: "p1", name: "Mme Okafor", role: "teacher" },
    { id: "p2", name: "Amina Diallo", role: "student" },
    { id: "p3", name: "Youssef El Amrani", role: "student" },
    { id: "p4", name: "Sara Benjelloun", role: "student" },
    { id: "p5", name: "Ali Bennani", role: "student" },
    { id: "p6", name: "Khadija Zerouali", role: "student" },
  ],
  "3ac1-arabe": [
    { id: "p10", name: "M. El Mansouri", role: "teacher" },
    { id: "p11", name: "Amina Diallo", role: "student" },
    { id: "p12", name: "Youssef El Amrani", role: "student" },
    { id: "p13", name: "Hamza Tazi", role: "student" },
  ],
  "3ac1-francais": [
    { id: "p20", name: "Mme Bernard", role: "teacher" },
    { id: "p21", name: "Amina Diallo", role: "student" },
    { id: "p22", name: "Ines Cherkaoui", role: "student" },
    { id: "p23", name: "Rayan Alaoui", role: "student" },
  ],
  "3ac1-svt": [
    { id: "p30", name: "Dr Amari", role: "teacher" },
    { id: "p31", name: "Amina Diallo", role: "student" },
    { id: "p32", name: "Omar Idrissi", role: "student" },
    { id: "p33", name: "Salma Benslimane", role: "student" },
  ],
};

export const SCHOOL_STATS = {
  totalTeachers: 14,
};

/* ============================================================
   STUDENTS — realistic Moroccan names, ~10 per class
   ============================================================ */
const STUDENT_AVATARS = ["😀", "😎", "🤓", "😊", "🥰", "🤗", "🦊", "🐯", "🦁", "🐼", "🦉", "🐨", "🐸", "🦋", "🌟"];

const MA_FIRST_NAMES_M = ["Youssef", "Mehdi", "Ayoub", "Hamza", "Ilyas", "Omar", "Rayan", "Anas", "Adam", "Karim", "Reda", "Bilal"];
const MA_FIRST_NAMES_F = ["Amina", "Salma", "Ines", "Sara", "Khadija", "Hiba", "Lina", "Meryem", "Nour", "Yasmine", "Aya", "Fatima"];
const MA_LAST_NAMES = ["Diallo", "El Amrani", "Benjelloun", "Bennani", "Zerouali", "Cherkaoui", "Alaoui", "Tazi", "Idrissi", "Benslimane", "El Mansouri", "Fassi", "Berrada", "Chraibi", "Sbai", "Kabbaj", "Lahlou"];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function buildStudentsForClasse(classe: Classe): Student[] {
  const count = Math.min(classe.studentCount, 12);
  const out: Student[] = [];
  for (let i = 0; i < count; i++) {
    const seed = hashSeed(`${classe.id}-s-${i}`);
    const isFemale = i % 2 === 0;
    const first = pick(isFemale ? MA_FIRST_NAMES_F : MA_FIRST_NAMES_M, seed);
    const last = pick(MA_LAST_NAMES, seed >> 3);
    const avatar = pick(STUDENT_AVATARS, seed >> 5);
    const year = 2009 + (Math.abs(seed >> 7) % 2);
    const month = 1 + (Math.abs(seed >> 9) % 12);
    const day = 1 + (Math.abs(seed >> 11) % 28);
    out.push({
      id: `${classe.id}-st${i + 1}`,
      firstName: first,
      lastName: last,
      classeId: classe.id,
      emoji: avatar,
      birthDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      parentName: `${pick(MA_LAST_NAMES, seed >> 13)} (parent)`,
      parentPhone: `+212 6${String(Math.abs(seed) % 100000000).padStart(8, "0")}`,
      email: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s/g, "")}@eleves.lespalmiers.fr`,
    });
  }
  return out;
}

export const STUDENTS_SEED: Student[] = CLASSES_SEED.flatMap(buildStudentsForClasse);

export { buildStudentsForClasse };

/* ============================================================
   TEACHERS — flat list with which classes they teach
   ============================================================ */
function buildTeachersSeed(): Teacher[] {
  const map = new Map<string, Teacher>();
  for (const classe of CLASSES_SEED) {
    for (const subject of SUBJECTS_3AC) {
      const name = TEACHERS_BY_CLASS[classe.id]?.[subject.slug];
      if (!name || name === "À définir") continue;
      const key = `${name}|${subject.slug}`;
      const existing = map.get(key);
      if (existing) {
        existing.classeIds.push(classe.id);
      } else {
        const id = `t-${map.size + 1}`;
        map.set(key, {
          id,
          name,
          email: name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.+|\.+$/g, "") + "@lespalmiers.fr",
          subjectSlug: subject.slug,
          classeIds: [classe.id],
        });
      }
    }
  }
  return Array.from(map.values());
}

export const TEACHERS_SEED: Teacher[] = buildTeachersSeed();

/* ============================================================
   GRADES — deterministic starter grades per student × assignment
   ============================================================ */
export function buildGradesSeed(students: Student[], assignments: Assignment[]): Grade[] {
  const out: Grade[] = [];
  for (const a of assignments) {
    const classeId = a.courseId.split("-")[0];
    const classStudents = students.filter((s) => s.classeId === classeId);
    for (const s of classStudents) {
      const seed = Math.abs(hashSeed(`${s.id}-${a.id}`));
      if (seed % 3 === 0) continue; // not all assignments graded
      const score = 8 + (seed % 13); // 8..20
      out.push({ studentId: s.id, assignmentId: a.id, score });
    }
  }
  return out;
}

export const GRADES_SEED: Grade[] = buildGradesSeed(STUDENTS_SEED, ASSIGNMENTS_SEED);
