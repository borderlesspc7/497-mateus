import { Suspense } from "react";
import { listVendasPaginated } from "@/actions/vendas";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { PageLoading } from "@/components/ui/PageLoading";
import ControleCotasClient from "../ui/ControleCotasClient";

async function InadimplenciaData() {
  const page = await listVendasPaginated({ statusOperacional: "INADIMPLENTE" });
  return <ControleCotasClient modo="inadimplencia" initialPage={page} />;
}

export default function ControleInadimplenciaPage() {
  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Inadimplência" },
        ]}
        title="Controle de inadimplência"
        description="Monitore cotas por status operacional. Clique em uma linha para abrir a timeline de atendimento."
      />
      <Suspense fallback={<PageLoading rows={8} columns={5} withHeader={false} />}>
        <InadimplenciaData />
      </Suspense>
    </>
  );
}
