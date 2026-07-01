import StudentSearch from "@/components/StudentSearch";

export default function DashboardHomePage() {
  return (
    <div className="pb-20 md:pb-0">
      <h1 className="font-display text-xl font-bold text-ink mb-4">
        學生搜尋
      </h1>
      <StudentSearch />
    </div>
  );
}
