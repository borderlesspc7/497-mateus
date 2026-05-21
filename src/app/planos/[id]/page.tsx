import Link from "next/link";
import { getPlano } from "@/actions/planos";
import { listAdministradoras } from "@/actions/administradoras";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import EditarPlanoForm from "../ui/EditarPlanoForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarPlanoPage({ params }: PageProps) {
  const { id } = await params;
  const [plano, administradoras] = await Promise.all([getPlano(id), listAdministradoras()]);

  if (!plano) {
    return (
      <>
        <PageFlowHeader
          crumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Planos", href: "/planos" },
            { label: "Erro" },
          ]}
          title="Plano não encontrado"
          description="Não foi possível carregar este registro."
          actions={
            <Link href="/planos" className={backLinkClass()}>
              Voltar à lista
            </Link>
          }
        />
      </>
    );
  }

  return (
    <EditarPlanoForm
      item={plano}
      administradoras={administradoras.map((a) => ({
        id: a.id,
        nome: a.nome,
        cnpj: a.cnpj,
      }))}
    />
  );
}
