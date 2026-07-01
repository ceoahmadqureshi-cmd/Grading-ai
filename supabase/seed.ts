/**
 * Seeds two demo centres, two teacher logins, and one test student.
 *
 * Usage:
 *   1. cp .env.example .env.local and fill in SUPABASE_SERVICE_ROLE_KEY
 *   2. npx tsx supabase/seed.ts
 *
 * This uses the Supabase service-role key (server-only, bypasses RLS by
 * design for admin provisioning) — never expose that key to the browser.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment."
  );
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1. Create the two centres (tenants)
  const { data: centreA, error: centreAErr } = await admin
    .from("centres")
    .insert({ name: "Centre A · 甲教育中心" })
    .select()
    .single();
  if (centreAErr) throw centreAErr;

  const { data: centreB, error: centreBErr } = await admin
    .from("centres")
    .insert({ name: "Centre B · 乙教育中心" })
    .select()
    .single();
  if (centreBErr) throw centreBErr;

  // 2. Create the two demo teacher logins
  const { data: userA, error: userAErr } = await admin.auth.admin.createUser({
    email: "centre_a@demo.tutoros.hk",
    password: "ChangeMe123!", // change this immediately after first login
    email_confirm: true,
  });
  if (userAErr) throw userAErr;

  const { data: userB, error: userBErr } = await admin.auth.admin.createUser({
    email: "centre_b@demo.tutoros.hk",
    password: "ChangeMe123!",
    email_confirm: true,
  });
  if (userBErr) throw userBErr;

  // 3. Link each teacher to their centre via a profile row
  const { error: profAErr } = await admin.from("profiles").insert({
    id: userA.user.id,
    centre_id: centreA.id,
    display_name: "老師 A",
    role: "teacher",
  });
  if (profAErr) throw profAErr;

  const { error: profBErr } = await admin.from("profiles").insert({
    id: userB.user.id,
    centre_id: centreB.id,
    display_name: "老師 B",
    role: "teacher",
  });
  if (profBErr) throw profBErr;

  // 4. Seed exactly one test student into Centre A only
  const { error: studentErr } = await admin.from("students").insert({
    centre_id: centreA.id,
    name: "蘇卓怡",
    grade_level: "小五",
  });
  if (studentErr) throw studentErr;

  console.log("✅ Seed complete.");
  console.log("   Centre A login: centre_a@demo.tutoros.hk / ChangeMe123!");
  console.log("   Centre B login: centre_b@demo.tutoros.hk / ChangeMe123!");
  console.log("   Test student 蘇卓怡 created under Centre A only.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
