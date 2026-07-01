import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  if (!q) {
    // Empty query -> return the most recently added students for this centre
    const { data, error } = await supabase
      .from("students")
      .select("id, name, grade_level")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ students: data });
  }

  // ILIKE handles CJK substring matching well for "search-as-you-type";
  // RLS automatically restricts this to the caller's own centre.
  const { data, error } = await supabase
    .from("students")
    .select("id, name, grade_level")
    .ilike("name", `%${q}%`)
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ students: data });
}
