import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: authData, error: authError }, { data: profiles }] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    supabaseAdmin.from("profiles").select("*"),
  ]);

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  const enriched = (authData?.users ?? []).map((u) => {
    const profile = profiles?.find((p) => p.id === u.id);
    return {
      id: u.id,
      email: u.email ?? "",
      name: profile?.name ?? u.user_metadata?.name ?? "",
      role: profile?.role ?? u.user_metadata?.role ?? "student",
      classeId: profile?.classe_id ?? null,
      teacherId: profile?.teacher_id ?? null,
      createdAt: u.created_at,
    };
  });

  return NextResponse.json({ users: enriched });
}
