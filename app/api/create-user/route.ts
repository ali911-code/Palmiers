import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
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

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
    id: data.user.id,
    name,
    role,
    classe_id: classeId || null,
    teacher_id: teacherId || null,
  });

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const { userId, name, role, classeId, teacherId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId manquant" }, { status: 400 });

  const supabaseAdmin = adminClient();

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

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId manquant" }, { status: 400 });

  const supabaseAdmin = adminClient();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
