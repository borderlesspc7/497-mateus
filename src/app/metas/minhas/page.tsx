import { getMinhaMetaPeriodo, listarConquistas } from "@/actions/metas";
import { MinhasMetasClient } from "@/app/metas/minhas/ui/MinhasMetasClient";
import { getServerSessionUser } from "@/lib/auth/server";
import { periodoAtual, periodoLabel } from "@/lib/periodo";

type PageProps = {
  searchParams: Promise<{ periodo?: string; vendedorId?: string }>;
};

export default async function MinhasMetasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const periodo = params.periodo ?? periodoAtual();
  const vendedorId = params.vendedorId;

  const session = await getServerSessionUser();
  if (!session) {
    throw new Error("Sessão inválida.");
  }

  const [result, conquistasResult] = await Promise.all([
    getMinhaMetaPeriodo(
      periodo,
      session.role !== "vendedor" ? vendedorId : undefined,
    ),
    listarConquistas(),
  ]);

  if (!result.success) throw new Error(result.error);
  if (!conquistasResult.success) throw new Error(conquistasResult.error);

  const titulo =
    session.role === "vendedor"
      ? `Minhas Metas — ${periodoLabel(periodo)}`
      : `Metas do Vendedor — ${periodoLabel(periodo)}`;

  return (
    <MinhasMetasClient
      meta={result.data.meta}
      realizacao={result.data.realizacao}
      ranking={result.data.ranking}
      conquistas={conquistasResult.data}
      periodoInicial={periodo}
      titulo={titulo}
    />
  );
}
