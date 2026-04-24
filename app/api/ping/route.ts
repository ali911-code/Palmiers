import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

export const runtime = "edge";

export async function GET() {
  try {
    await supabase.from("classes").select("id").limit(1);
    return NextResponse.json({ ok: true, time: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
