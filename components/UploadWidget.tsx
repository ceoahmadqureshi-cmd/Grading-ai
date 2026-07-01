"use client";

import { useRef, useState } from "react";

export default function UploadWidget({
  studentId,
  onGraded,
}: {
  studentId: string;
  onGraded: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);

    try {
      // Convert to a transient base64 string held only in this function's
      // memory. It is never written to Supabase Storage, disk, or any
      // browser storage (localStorage/sessionStorage/IndexedDB) — per the
      // zero-image-storage policy, only the AI's text output is persisted.
      const base64 = await fileToBase64(file);

      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          mimeType: file.type || "image/jpeg",
          imageBase64: base64,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "批改失敗");
      }

      onGraded();
    } catch (err: any) {
      setError(err.message ?? "批改失敗，請重試");
    } finally {
      setBusy(false);
      // Clear the file inputs so the same image object isn't retained.
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-card border border-line bg-white p-4">
      <p className="text-sm font-medium text-ink mb-3">上傳工作紙</p>
      <div className="grid grid-cols-2 gap-3">
        {/* Route 1: open device camera directly */}
        <button
          type="button"
          disabled={busy}
          onClick={() => cameraInputRef.current?.click()}
          className="rounded-md bg-ink text-white py-3 text-sm font-medium disabled:opacity-50"
        >
          📷 開始批改
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {/* Route 2: choose an existing photo from the gallery */}
        <button
          type="button"
          disabled={busy}
          onClick={() => galleryInputRef.current?.click()}
          className="rounded-md border border-ink text-ink py-3 text-sm font-medium disabled:opacity-50"
        >
          🖼️ 從相簿選擇
        </button>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {busy && (
        <p className="mt-3 text-sm text-ink/60 text-center">開始批改…</p>
      )}
      {error && <p className="mt-3 text-sm text-seal text-center">{error}</p>}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:image/...;base64," prefix — API wants raw base64.
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("讀取圖片失敗"));
    reader.readAsDataURL(file);
  });
}
