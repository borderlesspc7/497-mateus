import Link from "next/link";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import NovaAdministradoraForm from "../ui/NovaAdministradoraForm";

export default function NovaAdministradoraPage() {
  return (
    <div className="space-y-6">
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Administradoras", href: "/administradoras" },
          { label: "Nova" },
        ]}
        title="Nova administradora"
        description="Cadastre uma nova administradora parceira com dados cadastrais e informações de contato."
        actions={
          <Link href="/administradoras" className={backLinkClass()}>
            Voltar à lista
          </Link>
        }
      />

      <NovaAdministradoraForm />
    </div>
  );
}
