"use client";

import type { GradingResultRow } from "@/types/database";

export default function GradingResults({
  results,
}: {
  results: GradingResultRow[];
}) {
  if (results.length === 0) {
    return (
      <p className="text-sm text-ink/50 text-center py-10">
        尚未有批改紀錄，上傳工作紙即可開始
      </p>
    );
  }

  const sorted = [...results].sort((a, b) =>
    a.question_number.localeCompare(b.question_number, "zh-Hant", {
      numeric: true,
    })
  );

  return (
    <ul className="space-y-2">
      {sorted.map((r) => (
        <li
          key={r.id}
          className="rounded-card border border-line bg-white p-4"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-ink">
              第 {r.question_number} 題
              {r.sub_question_blank ? ` (${r.sub_question_blank})` : ""}
            </span>
            <span className="text-xs text-ink/40">{r.subject}</span>
          </div>

          <p
            className={`text-sm ${
              r.is_correct ? "mark-correct" : "mark-incorrect"
            }`}
          >
            {r.is_correct ? "答對" : `答錯 — 正確答案：${r.correct_answer ?? "—"}`}
          </p>

          {r.explanation_cantonese && (
            <p className="mt-1 text-sm text-ink/70">
              {r.explanation_cantonese}
            </p>
          )}

          {r.topic_tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {r.topic_tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gold/10 text-gold border border-gold/30 rounded-full px-2 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
