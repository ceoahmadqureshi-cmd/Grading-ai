import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { getGradingModel } from "@/lib/ai/provider";
import { GradingResponseSchema } from "@/lib/ai/schema";
import { GRADING_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * ZERO-IMAGE-STORAGE POLICY
 * -------------------------
 * The incoming image is a transient base64 string that exists only in this
 * request's memory. It is:
 *   1. never written to Supabase Storage,
 *   2. never written to any filesystem or cache,
 *   3. passed once to the LLM call below,
 *   4. dropped when this function returns (the `imageBase64` variable and
 *      the request body go out of scope — nothing image-related is ever
 *      referenced again after the AI call completes).
 * Only the AI's structured TEXT output is persisted to Postgres.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("centre_id")
    .eq("id", user.id)
    .single();
  const profile = profileRaw as { centre_id: string } | null;
  if (!profile) {
    return NextResponse.json({ error: "找不到使用者所屬中心" }, { status: 403 });
  }

  let imageBase64: string | null = null;
  let studentId: string;
  let mimeType: string;

  try {
    const body = await req.json();
    studentId = body.studentId;
    mimeType = body.mimeType ?? "image/jpeg";
    imageBase64 = body.imageBase64;

    if (!imageBase64 || !studentId) {
      return NextResponse.json({ error: "缺少學生或圖片資料" }, { status: 400 });
    }

    // Confirm the student belongs to the caller's own centre (RLS also
    // enforces this, but we check explicitly for a clean error message).
    const { data: studentRaw } = await supabase
      .from("students")
      .select("id, centre_id")
      .eq("id", studentId)
      .single();
    const student = studentRaw as { id: string; centre_id: string } | null;

    if (!student || student.centre_id !== profile.centre_id) {
      return NextResponse.json({ error: "學生不屬於你的中心" }, { status: 403 });
    }

    const result = await generateObject({
      model: getGradingModel(),
      schema: GradingResponseSchema,
      system: GRADING_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "請批改這份工作紙，並按規則輸出結構化 JSON。" },
            { type: "image", image: imageBase64, mimeType },
          ],
        },
      ],
    });

    // --- Discard the image now. Nothing below this line ever touches it. ---
    imageBase64 = null;

    const rows = result.object.items.map((item) => ({
      centre_id: profile.centre_id,
      student_id: studentId,
      created_by: user.id,
      question_number: item.question_number,
      sub_question_blank: item.sub_question_blank,
      subject: item.subject,
      student_answer: item.student_answer,
      correct_answer: item.correct_answer,
      is_correct: item.is_correct,
      explanation_cantonese: item.explanation_cantonese,
      topic_tags: item.topic_tags,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("grading_results")
      .insert(rows)
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ results: inserted });
  } catch (err) {
    imageBase64 = null; // ensure discard even on error paths
    console.error("Grading error:", err);
    return NextResponse.json({ error: "批改失敗，請重試" }, { status: 500 });
  } finally {
    // Belt-and-braces: guarantee the reference is cleared before GC.
    imageBase64 = null;
  }
}
