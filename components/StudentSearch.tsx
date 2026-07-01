"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Student } from "@/types/database";

export default function StudentSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Skip firing a search mid-IME-composition so partial Zhuyin/Pinyin
    // input doesn't trigger noisy requests while composing CJK text.
    if (isComposing) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.students ?? []);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(debounceRef.current);
  }, [query, isComposing]);

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={(e) => {
            setIsComposing(false);
            setQuery(e.currentTarget.value);
          }}
          placeholder="輸入學生姓名搜尋…"
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-base focus:border-gold outline-none"
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink/40">
            搜尋中…
          </span>
        )}
      </div>

      <ul className="mt-3 space-y-2">
        {results.map((student) => (
          <li key={student.id}>
            <Link
              href={`/dashboard/students/${student.id}`}
              className="flex items-center justify-between rounded-card border border-line bg-white px-4 py-3 hover:border-gold"
            >
              <span className="font-medium">{student.name}</span>
              {student.grade_level && (
                <span className="text-xs text-ink/50">
                  {student.grade_level}
                </span>
              )}
            </Link>
          </li>
        ))}
        {!loading && query && results.length === 0 && (
          <li className="text-sm text-ink/50 text-center py-6">
            找不到相關學生
          </li>
        )}
      </ul>
    </div>
  );
}
