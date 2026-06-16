"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConsorciadoFichaResumo } from "@/components/consorciados/ConsorciadoFichaResumo";
import { ConsorciadoHistoricoTabs } from "@/components/consorciados/ConsorciadoHistoricoTabs";
import { ConsorciadoProdutosTable } from "@/components/consorciados/ConsorciadoProdutosTable";
import { VendaAtendimentoDrawer } from "@/components/vendas/VendaAtendimentoDrawer";
import { getConsorciado, listVendasByConsorciado } from "@/actions/consorciados";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { DetailPageSkeleton } from "@/components/ui/Skeleton";
import { panelClass, panelInsetClass, secondaryActionClass } from "@/components/ui/list-panel-classes";
import type { ConsorciadoRow, VendaRow } from "@/lib/types/domain";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";

type FichaConsorciadoProps = {
  id: string;
};

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-zinc-900">{value || "—"}</div>
    </div>
  );
}

export default function FichaConsorciado({ id }: FichaConsorciadoProps) {
  const [consorciado, setConsorciado] = useState<ConsorciadoRow | null>(null);
  const [vendas, setVendas] = useState<VendaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVenda, setSelectedVenda] = useState<VendaRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    void Promise.all([getConsorciado(id), listVendasByConsorciado(id)])
      .then(([item, cotas]) => {
        if (!alive) return;
        if (!item) {
          setNotFound(true);
          return;
        }
        setConsorciado(item);
        setVendas(cotas);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Erro ao carregar ficha.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  function openAtendimento(venda: VendaRow) {
    setSelectedVenda(venda);
    setDrawerOpen(true);
  }

  if (loading) {
    return <DetailPageSkeleton sections={4} />;
  }

  if (notFound || !consorciado) {
    return (
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Consorciados", href: "/consorciados" },
          { label: "Erro" },
        ]}
        title="Consorciado não encontrado"
        description="Não foi possível carregar este registro."
        actions={
          <Link href="/consorciados" className={backLinkClass()}>
            Voltar à consulta
          </Link>
        }
      />
    );
  }

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Consorciados", href: "/consorciados" },
          { label: consorciado.nome },
        ]}
        title="Ficha completa"
        description={`${consorciado.nome} — produtos contratados e históricos operacionais consolidados.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/consorciados" className={backLinkClass()}>
              Voltar à consulta
            </Link>
            <Link href={`/consorciados/${id}/editar`} className={secondaryActionClass()}>
              Editar dados
            </Link>
          </div>
        }
      />

      {error ? (
        <AlertBanner tone="error" className="mb-4">
          {error}
        </AlertBanner>
      ) : null}

      <ConsorciadoFichaResumo consorciado={consorciado} vendas={vendas} />

      <section className={`${panelClass()} mt-5`}>
        <div className={`py-5 ${panelInsetClass()}`}>
          <h2 className="text-base font-semibold text-zinc-900">Dados pessoais</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem label="Nome" value={consorciado.nome} />
            <DetailItem label="CPF / CNPJ" value={consorciado.cpf_cnpj} />
            <div>
              <div className="text-xs font-medium text-zinc-500">Telefone</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-900">
                  {consorciado.telefone || "—"}
                </span>
                <WhatsAppButton telefone={consorciado.telefone} nomeCliente={consorciado.nome} />
              </div>
            </div>
            <DetailItem label="E-mail" value={consorciado.email} />
            <DetailItem
              label="Cadastrado em"
              value={new Date(consorciado.criadoEm).toLocaleDateString("pt-BR")}
            />
          </div>
        </div>
      </section>

      <ConsorciadoProdutosTable
        consorciado={consorciado}
        vendas={vendas}
        onOpenAtendimento={openAtendimento}
      />

      <ConsorciadoHistoricoTabs vendas={vendas} />

      <VendaAtendimentoDrawer
        venda={selectedVenda}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        defaultTipoRegistro="POS_VENDA"
      />
    </>
  );
}
