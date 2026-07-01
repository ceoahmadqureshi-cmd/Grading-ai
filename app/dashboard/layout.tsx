import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopNavbar from "@/components/TopNavbar";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("display_name, centre_id, centres(name)")
    .eq("id", user.id)
    .single();
  const profile = profileRaw as {
    display_name: string;
    centre_id: string;
    centres: { name: string } | null;
  } | null;

  const displayName = profile?.display_name ?? "老師";
  const centreName = profile?.centres?.name ?? "未知中心";

  return (
    <div className="min-h-screen bg-paper">
      <TopNavbar displayName={displayName} centreName={centreName} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:px-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
