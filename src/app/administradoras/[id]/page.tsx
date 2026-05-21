import Link from "next/link";
import { getAdministradora } from "@/actions/administradoras";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import EditarAdministradoraForm from "../ui/EditarAdministradoraForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarAdministradoraPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getAdministradora(id);

  if (!item) {
    return (
      <>
        <PageFlowHeader
          crumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Administradoras", href: "/administradoras" },
            { label: "Erro" },
          ]}
          title="Administradora não encontrada"
          description="Não foi possível carregar este registro."
          actions={
            <Link href="/administradoras" className={backLinkClass()}>
              Voltar à lista
            </Link>
          }
        />
      </>
    );
  }

  return <EditarAdministradoraForm item={item} />;
}
