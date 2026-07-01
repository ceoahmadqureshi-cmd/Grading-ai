import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function HistoryPage() {
  const supabase = createClient();

  const { data: results } = await supabase
    .from("grading_results")
    .select("id, question_number, subject, is_correct, created_at, student_id, students(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="pb-20 md:pb-0">
      <h1 className="font-display text-xl font-bold text-ink mb-4">
        批改紀錄
      </h1>

      {!results || results.length === 0 ? (
        <p className="text-sm text-ink/50 text-center py-10">
          尚未有批改紀錄
        </p>
      ) : (
        <ul className="space-y-2">
          {results.map((r: any) => (
            <li key={r.id}>
              <Link
                href={`/dashboard/students/${r.student_id}`}
                className="flex items-center justify-between rounded-card border border-line bg-white px-4 py-3 hover:border-gold"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {r.students?.name ?? "學生"}
                  </p>
                  <p className="text-xs text-ink/50">
                    {r.subject} · 第 {r.question_number} 題
                  </p>
                </div>
                <span
                  className={`text-xs font-medium ${
                    r.is_correct ? "text-jade" : "text-seal"
                  }`}
                >
                  {r.is_correct ? "答對" : "答錯"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
