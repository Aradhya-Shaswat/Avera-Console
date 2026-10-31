import { Sidebar } from "@/components/layout/sidebar";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 h-screen overflow-hidden bg-background flex flex-col">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
