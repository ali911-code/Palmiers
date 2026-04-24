import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Config serveur manquante: NEXT_PUBLIC_SUPABASE_URL et/ou SUPABASE_SERVICE_ROLE_KEY absentes dans les variables d'environnement Vercel."
    );
  }
  return createClient(url, serviceKey);
}

function handleServerError(e: unknown) {
  const msg = e instanceof Error ? e.message : "Erreur serveur";
  return NextResponse.json({ error: msg }, { status: 500 });
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export async function POST(req: Request) {
  try {
  const { email, password, name, role, classeId, teacherId } = await req.json();

  if (!email || !password || !name || !role) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const supabaseAdmin = adminClient();

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data.user) return NextResponse.json({ error: "Erreur création compte" }, { status: 500 });

  const userId = data.user.id;

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
    id: userId,
    name,
    role,
    classe_id: classeId || null,
    teacher_id: teacherId || null,
  });

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  // Auto-créer la fiche élève dans la classe si role=student + classeId
  if (role === "student" && classeId) {
    const { firstName, lastName } = splitName(name);
    const { error: studentErr } = await supabaseAdmin.from("students").upsert({
      id: userId,
      first_name: firstName,
      last_name: lastName || firstName, // évite violation NOT NULL
      classe_id: classeId,
      emoji: "🧑‍🎓",
      birth_date: "2010-01-01",
      parent_name: "",
      parent_phone: "",
      email,
    });
    if (studentErr) {
      return NextResponse.json(
        { error: `Compte créé mais fiche élève échouée: ${studentErr.message}` },
        { status: 500 }
      );
    }

    // Incrémente le compteur d'élèves de la classe
    const { data: classe } = await supabaseAdmin
      .from("classes")
      .select("student_count")
      .eq("id", classeId)
      .single();
    if (classe) {
      await supabaseAdmin
        .from("classes")
        .update({ student_count: (classe.student_count ?? 0) + 1 })
        .eq("id", classeId);
    }
  }

  return NextResponse.json({ success: true });
  } catch (e) { return handleServerError(e); }
}

export async function PATCH(req: Request) {
  try {
  const { userId, name, role, classeId, teacherId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId manquant" }, { status: 400 });

  const supabaseAdmin = adminClient();

  // Profile patch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: any = {};
  if (name !== undefined) patch.name = name;
  if (role !== undefined) patch.role = role;
  if (classeId !== undefined) patch.classe_id = classeId || null;
  if (teacherId !== undefined) patch.teacher_id = teacherId || null;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update(patch)
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync la fiche élève si role=student
  if (role === "student" && classeId) {
    const { firstName, lastName } = splitName(name ?? "");
    // Check si une fiche existe déjà
    const { data: existing } = await supabaseAdmin
      .from("students")
      .select("id, classe_id")
      .eq("id", userId)
      .maybeSingle();

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const studentPatch: any = { classe_id: classeId };
      if (name) {
        studentPatch.first_name = firstName;
        studentPatch.last_name = lastName;
      }
      await supabaseAdmin.from("students").update(studentPatch).eq("id", userId);
    } else {
      // Récupère l'email depuis auth
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      await supabaseAdmin.from("students").insert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        classe_id: classeId,
        emoji: "🧑‍🎓",
        birth_date: "2010-01-01",
        parent_name: "",
        parent_phone: "",
        email: authUser?.user?.email ?? "",
      });
    }
  } else if (role && role !== "student") {
    // Si le rôle change et n'est plus élève, supprimer la fiche
    await supabaseAdmin.from("students").delete().eq("id", userId);
  }

  return NextResponse.json({ success: true });
  } catch (e) { return handleServerError(e); }
}

export async function DELETE(req: Request) {
  try {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId manquant" }, { status: 400 });

  const supabaseAdmin = adminClient();

  // Supprime la fiche élève associée si elle existe
  await supabaseAdmin.from("students").delete().eq("id", userId);

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
  } catch (e) { return handleServerError(e); }
}
