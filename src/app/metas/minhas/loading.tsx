import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { KpiCardSkeleton } from "@/components/ui/Skeleton";
import { panelClass } from "@/components/ui/list-panel-classes";

export default function MinhasMetasLoading() {
  return (
    <>
      <PageFlowHeader
        crumbs={[{ label: "Minhas Metas" }]}
        title="Minhas Metas"
        description="Carregando progresso..."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className={`${panelClass()} p-4`}>
          <KpiCardSkeleton />
        </div>
        <div className={`${panelClass()} p-4`}>
          <KpiCardSkeleton />
        </div>
        <div className={`${panelClass()} p-4`}>
          <KpiCardSkeleton />
        </div>
      </div>
    </>
  );
}
