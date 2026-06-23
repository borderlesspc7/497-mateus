import { Suspense } from "react";
import { getDashboardRanking, getDashboardStats } from "@/actions/dashboard";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardMetaWidget } from "@/components/metas/DashboardMetaWidget";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { KpiCardSkeleton } from "@/components/ui/Skeleton";
import { panelClass } from "@/components/ui/list-panel-classes";
import { getServerSessionUser } from "@/lib/auth/server";

function DashboardFallback() {
  return (
    <>
      <PageFlowHeader
        crumbs={[{ label: "Dashboard" }]}
        title="Dashboard"
        description="Indicadores operacionais em tempo real a partir do Firestore."
      />
      <KpiCardSkeleton />
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className={`${panelClass()} p-6 lg:col-span-2`}>
          <div className="h-5 w-56 animate-pulse rounded bg-zinc-200" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-zinc-100" />
            ))}
          </div>
        </div>
        <div className={`${panelClass()} p-6`}>
          <div className="h-5 w-40 animate-pulse rounded bg-zinc-200" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 animate-pulse rounded-lg bg-zinc-100" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

async function DashboardContent() {
  const [stats, ranking, session] = await Promise.all([
    getDashboardStats(),
    getDashboardRanking(),
    getServerSessionUser(),
  ]);
  return (
    <>
      <div className="mb-6">
        <DashboardMetaWidget userRole={session?.role ?? null} />
      </div>
      <DashboardTabs stats={stats} ranking={ranking} userRole={session?.role ?? null} />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}
