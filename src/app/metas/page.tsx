import { listEquipes } from "@/actions/equipes";
import {
  getRankingPeriodo,
  listarConquistas,
  listarMetasComRealizacao,
} from "@/actions/metas";
import { listVendedores } from "@/actions/vendedores";
import { MetasClient } from "@/app/metas/ui/MetasClient";
import { getServerSessionUser } from "@/lib/auth/server";
import { periodoAtual } from "@/lib/periodo";
import type { MetaTipo } from "@/types/metas";

type PageProps = {
  searchParams: Promise<{ periodo?: string; tipo?: string }>;
};

export default async function MetasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const periodo = params.periodo ?? periodoAtual();
  const tipo = (params.tipo === "EQUIPE" ? "EQUIPE" : "VENDEDOR") as MetaTipo;

  const [session, metasResult, rankingResult, conquistasResult, vendedores, equipes] =
    await Promise.all([
      getServerSessionUser(),
      listarMetasComRealizacao({ periodo, tipo }),
      getRankingPeriodo(periodo, tipo),
      listarConquistas(),
      listVendedores(),
      listEquipes(),
    ]);

  if (!metasResult.success) {
    throw new Error(metasResult.error);
  }
  if (!rankingResult.success) {
    throw new Error(rankingResult.error);
  }
  if (!conquistasResult.success) {
    throw new Error(conquistasResult.error);
  }

  return (
    <MetasClient
      initialMetas={metasResult.data}
      initialRanking={rankingResult.data}
      conquistas={conquistasResult.data}
      vendedores={vendedores.map((v) => ({ id: v.id, nome: v.nome }))}
      equipes={equipes.map((e) => ({ id: e.id, nome: e.nome }))}
      isAdmin={session?.role === "admin"}
      periodoInicial={periodo}
      tipoInicial={tipo}
    />
  );
}
