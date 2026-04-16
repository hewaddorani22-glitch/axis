import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Sidebar />
      <div className="lg:pl-[260px]">
        <Topbar />
        <main className="p-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
