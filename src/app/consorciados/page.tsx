import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import ConsorciadosClient from "./ui/ConsorciadosClient";

export default function ConsorciadosPage() {
  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Consorciados" },
        ]}
        title="Central de consulta"
        description="Pesquise consorciados por nome, CPF, número do contrato, grupo ou cota e acesse a ficha completa com históricos."
      />

      <ConsorciadosClient />
    </>
  );
}
