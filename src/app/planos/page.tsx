import { Suspense } from "react";
import { listAdministradoras } from "@/actions/administradoras";
import { listPlanos } from "@/actions/planos";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { panelClass } from "@/components/ui/list-panel-classes";
import PlanosClient from "./ui/PlanosClient";

function PlanosFallback() {
  return (
    <div className={`${panelClass()} px-6 py-10 text-center text-sm text-zinc-600`}>
      Carregando planos…
    </div>
  );
}

export default async function PlanosPage() {
  const [items, administradoras] = await Promise.all([listPlanos(), listAdministradoras()]);

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Planos" },
        ]}
        title="Planos"
        description="Cadastre planos por administradora, com valor de crédito e regras de comissão, recebimento e estorno (JSON por enquanto). Você pode abrir esta página com ?administradoraId=… vindo da lista de administradoras."
      />

      <Suspense fallback={<PlanosFallback />}>
        <PlanosClient
          initialItems={items}
          initialAdministradoras={administradoras.map((a) => ({
            id: a.id,
            nome: a.nome,
            cnpj: a.cnpj,
          }))}
        />
      </Suspense>
    </>
  );
}
