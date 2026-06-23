import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { KpiCardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { panelClass } from "@/components/ui/list-panel-classes";

export default function MetasLoading() {
  return (
    <>
      <PageFlowHeader
        crumbs={[{ label: "Metas & Gamificação" }]}
        title="Metas & Gamificação"
        description="Carregando metas e ranking..."
      />
      <div className={`${panelClass()} mb-6 p-4`}>
        <KpiCardSkeleton />
      </div>
      <div className={`${panelClass()} p-6`}>
        <TableSkeleton rows={5} columns={4} />
      </div>
    </>
  );
}
