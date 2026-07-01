"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DEMO_LOGINS = [
  { label: "登入 Centre A", email: "centre_a@demo.tutoros.hk" },
  { label: "登入 Centre B", email: "centre_b@demo.tutoros.hk" },
];
const DEMO_PASSWORD = "ChangeMe123!";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn(loginEmail: string, loginPassword: string) {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      setError("登入失敗，請檢查電郵及密碼");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold text-ink text-center mb-1">
          批改通
        </h1>
        <p className="text-center text-sm text-ink/60 mb-8">
          衔接中心批改管理平台
        </p>

        <div className="bg-white border border-line rounded-card p-6 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              signIn(email, password);
            }}
            className="space-y-3"
          >
            <div>
              <label className="text-sm font-medium text-ink/80">電郵</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold outline-none"
                placeholder="you@centre.hk"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink/80">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold outline-none"
                required
              />
            </div>
            {error && <p className="text-sm text-seal">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-ink text-white py-2 text-sm font-medium hover:bg-ink/90 disabled:opacity-50"
            >
              {loading ? "登入中…" : "登入"}
            </button>
          </form>

          <div className="pt-4 border-t border-line">
            <p className="text-xs text-ink/50 mb-2">示範帳戶（測試用）</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_LOGINS.map((demo) => (
                <button
                  key={demo.email}
                  onClick={() => signIn(demo.email, DEMO_PASSWORD)}
                  disabled={loading}
                  className="rounded-md border border-line py-2 text-xs font-medium text-ink hover:border-gold hover:bg-gold/5 disabled:opacity-50"
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
