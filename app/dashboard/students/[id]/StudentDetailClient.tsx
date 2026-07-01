"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import UploadWidget from "@/components/UploadWidget";
import GradingResults from "@/components/GradingResults";
import type { GradingResultRow, Student } from "@/types/database";

export default function StudentDetailClient({
  student,
  initialResults,
}: {
  student: Pick<Student, "id" | "name" | "grade_level">;
  initialResults: GradingResultRow[];
}) {
  const [results, setResults] = useState<GradingResultRow[]>(initialResults);
  const supabase = createClient();

  // Realtime: any teacher device grading this student sees updates live.
  useEffect(() => {
    const channel = supabase
      .channel(`grading_results:student:${student.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "grading_results",
          filter: `student_id=eq.${student.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setResults((prev) => [
              payload.new as GradingResultRow,
              ...prev,
            ]);
          } else if (payload.eventType === "UPDATE") {
            setResults((prev) =>
              prev.map((r) =>
                r.id === (payload.new as GradingResultRow).id
                  ? (payload.new as GradingResultRow)
                  : r
              )
            );
          } else if (payload.eventType === "DELETE") {
            setResults((prev) =>
              prev.filter((r) => r.id !== (payload.old as GradingResultRow).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [student.id, supabase]);

  async function refresh() {
    const { data } = await supabase
      .from("grading_results")
      .select("*")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false });
    if (data) setResults(data);
  }

  return (
    <div className="pb-20 md:pb-0 space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">
          {student.name}
        </h1>
        {student.grade_level && (
          <p className="text-sm text-ink/50">{student.grade_level}</p>
        )}
      </div>

      <UploadWidget studentId={student.id} onGraded={refresh} />

      <div>
        <h2 className="text-sm font-semibold text-ink/70 mb-2">批改紀錄</h2>
        <GradingResults results={results} />
      </div>
    </div>
  );
}
