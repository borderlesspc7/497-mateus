import Link from "next/link";
import { listConsorciadosMini } from "@/actions/consorciados";
import { listAdministradoras } from "@/actions/administradoras";
import { listEquipesMini } from "@/actions/equipes";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import NovaVendaForm from "../ui/NovaVendaForm";

export default async function NovaVendaPage() {
  const [administradoras, consorciados, equipes] = await Promise.all([
    listAdministradoras(),
    listConsorciadosMini(),
    listEquipesMini(),
  ]);

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Vendas", href: "/vendas" },
          { label: "Nova venda" },
        ]}
        title="Nova venda"
        description="Vincule um consorciado existente ou crie um novo, depois registre o contrato/cota com todos os dados operacionais."
        actions={
          <Link href="/vendas" className={backLinkClass()}>
            Voltar à lista
          </Link>
        }
      />

      <NovaVendaForm
        administradoras={administradoras.map((a) => ({
          id: a.id,
          nome: a.nome,
          cnpj: a.cnpj,
        }))}
        consorciados={consorciados}
        equipes={equipes}
      />
    </>
  );
}
