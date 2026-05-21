import { listAdministradoras } from "@/actions/administradoras";
import { listVendas } from "@/actions/vendas";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import VendasClient from "./ui/VendasClient";

export default async function VendasPage() {
  const [items, administradoras] = await Promise.all([listVendas(), listAdministradoras()]);

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Vendas" },
        ]}
        title="Vendas"
        description="Cadastre e acompanhe vendas por administradora e plano. Use os filtros para localizar registros."
      />

      <VendasClient
        initialItems={items}
        initialAdministradoras={administradoras.map((a) => ({
          id: a.id,
          nome: a.nome,
          cnpj: a.cnpj,
        }))}
      />
    </>
  );
}
