"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TopNavbar({
  displayName,
  centreName,
}: {
  displayName: string;
  centreName: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 bg-ink text-white">
      <div className="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display font-bold text-base shrink-0">
            批改通
          </span>
          <span className="text-white/30 shrink-0">|</span>
          <span className="text-sm text-white/90 truncate">{centreName}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-white/80 hidden sm:inline">
            {displayName}
          </span>
          <button
            onClick={logout}
            className="text-xs border border-white/30 rounded-md px-2.5 py-1.5 hover:bg-white/10"
          >
            登出
          </button>
        </div>
      </div>
    </header>
  );
}
