import { listAdministradoras } from "@/actions/administradoras";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import AdministradorasClient from "./ui/AdministradorasClient";

export default async function AdministradorasPage() {
  const items = await listAdministradoras();

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Administradoras" },
        ]}
        title="Administradoras"
        description="Cadastre administradoras parceiras com dados cadastrais e regras específicas por parceiro."
      />

      <AdministradorasClient initialItems={items} />
    </>
  );
}
