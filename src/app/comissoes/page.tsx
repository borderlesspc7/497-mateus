import { Suspense } from "react";
import { redirect } from "next/navigation";
import { listExtratos } from "@/actions/comissoes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { PageLoading } from "@/components/ui/PageLoading";
import { canViewComissoes } from "@/lib/auth/roles";
import { getServerSessionUser } from "@/lib/auth/server";
import ComissoesClient from "./ui/ComissoesClient";

async function ComissoesData() {
  const items = await listExtratos();
  return <ComissoesClient initialItems={items} />;
}

export default async function ComissoesPage() {
  const session = await getServerSessionUser();
  if (!session || !canViewComissoes(session.role)) {
    redirect("/");
  }

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Comissões" },
        ]}
        title="Extratos de comissão"
        description="Parcelas geradas automaticamente ao registrar vendas ativas. Aprove liberações e registre pagamentos."
      />

      <Suspense fallback={<PageLoading rows={8} columns={5} withHeader={false} />}>
        <ComissoesData />
      </Suspense>
    </>
  );
}
