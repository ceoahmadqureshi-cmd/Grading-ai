import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentDetailClient from "./StudentDetailClient";

export default async function StudentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, name, grade_level")
    .eq("id", params.id)
    .single();

  if (!student) notFound();

  const { data: results } = await supabase
    .from("grading_results")
    .select("*")
    .eq("student_id", params.id)
    .order("created_at", { ascending: false });

  return (
    <StudentDetailClient
      student={student}
      initialResults={results ?? []}
    />
  );
}
