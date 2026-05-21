import Link from "next/link";
import { listAdministradoras } from "@/actions/administradoras";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import NovaVendaForm from "../ui/NovaVendaForm";

export default async function NovaVendaPage() {
  const administradoras = await listAdministradoras();

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Vendas", href: "/vendas" },
          { label: "Nova venda" },
        ]}
        title="Nova venda"
        description="Cadastre uma venda vinculada a uma administradora e, opcionalmente, a um plano já cadastrado."
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
      />
    </>
  );
}
