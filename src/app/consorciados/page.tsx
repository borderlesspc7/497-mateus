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
        title="Consorciados"
        description="Cadastre e gerencie consorciados — base do CRM operacional do sistema."
      />

      <ConsorciadosClient />
    </>
  );
}
