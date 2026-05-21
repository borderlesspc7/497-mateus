import Link from "next/link";
import { Suspense } from "react";
import { listAdministradoras } from "@/actions/administradoras";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { panelClass } from "@/components/ui/list-panel-classes";
import NovoPlanoForm from "../ui/NovoPlanoForm";

function NovoPlanoFallback() {
  return (
    <div className={`${panelClass()} px-6 py-10 text-center text-sm text-zinc-600`}>
      Carregando formulário…
    </div>
  );
}

export default async function NovoPlanoPage() {
  const administradoras = await listAdministradoras();

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Planos", href: "/planos" },
          { label: "Novo" },
        ]}
        title="Novo plano"
        description="Vincule o plano a uma administradora e defina tipo de bem, crédito e regras em JSON (evoluímos para formulários estruturados depois)."
        actions={
          <Link href="/planos" className={backLinkClass()}>
            Voltar à lista
          </Link>
        }
      />

      <Suspense fallback={<NovoPlanoFallback />}>
        <NovoPlanoForm
          administradoras={administradoras.map((a) => ({
            id: a.id,
            nome: a.nome,
            cnpj: a.cnpj,
          }))}
        />
      </Suspense>
    </>
  );
}
