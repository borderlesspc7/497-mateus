"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { VendaAtendimentoDrawer } from "@/components/vendas/VendaAtendimentoDrawer";
import { getConsorciado, listVendasByConsorciado } from "@/actions/consorciados";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  dataTableClass,
  panelClass,
  panelInsetClass,
  primaryActionClass,
  secondaryActionClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import type { ConsorciadoRow, VendaRow } from "@/lib/types/domain";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

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

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
        Carregando ficha do consorciado...
      </div>
    );
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
            Voltar à lista
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
        title={consorciado.nome}
        description="Ficha do consorciado com cotas (vendas) vinculadas."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/consorciados" className={backLinkClass()}>
              Voltar à lista
            </Link>
            <Link href={`/consorciados/${id}/editar`} className={secondaryActionClass()}>
              Editar dados
            </Link>
          </div>
        }
      />

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className={`${panelClass()} p-6`}>
        <h2 className="text-sm font-medium text-zinc-900">Dados pessoais</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem label="Nome" value={consorciado.nome} />
          <DetailItem label="CPF / CNPJ" value={consorciado.cpf_cnpj} />
          <div>
            <div className="text-xs font-medium text-zinc-500">Telefone</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-900">
                {consorciado.telefone || "—"}
              </span>
              <WhatsAppButton
                telefone={consorciado.telefone}
                nomeCliente={consorciado.nome}
              />
            </div>
          </div>
          <DetailItem label="E-mail" value={consorciado.email} />
          <DetailItem
            label="Cadastrado em"
            value={new Date(consorciado.criadoEm).toLocaleDateString("pt-BR")}
          />
        </div>
      </section>

      <section className={`${panelClass()} mt-5`}>
        <div
          className={`flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between ${panelInsetClass()}`}
        >
          <div>
            <h2 className="text-sm font-medium text-zinc-900">Cotas (vendas)</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {vendas.length === 0
                ? "Nenhuma cota vinculada a este consorciado."
                : `${vendas.length} cota(s) vinculada(s).`}
            </p>
          </div>
          <Link href="/vendas/nova" className={primaryActionClass()}>
            Nova venda
          </Link>
        </div>

        {vendas.length === 0 ? (
          <div className={`pb-5 ${panelInsetClass()}`}>
            <EmptyState
              title="Sem cotas cadastradas"
              description="Registre uma venda vinculada a este consorciado."
              action={
                <Link href="/vendas/nova" className={primaryActionClass()}>
                  Nova venda
                </Link>
              }
            />
          </div>
        ) : (
          <div className={tableWrapClass()}>
            <table className={dataTableClass()}>
              <thead>
                <tr>
                  <th className={tableHeadCellClass()}>Contrato</th>
                  <th className={tableHeadCellClass()}>Grupo</th>
                  <th className={tableHeadCellClass()}>Cota</th>
                  <th className={tableHeadCellClass()}>Vencimento</th>
                  <th className={tableHeadCellClass()}>Status</th>
                  <th className={tableHeadCellClass()}>Administradora</th>
                  <th className={tableHeadCellClass()}>Valor</th>
                  <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((venda, index) => (
                  <tr
                    key={venda.id}
                    className={`${tableRowClass(index)} cursor-pointer hover:bg-zinc-50/80`}
                    onClick={() => {
                      setSelectedVenda(venda);
                      setDrawerOpen(true);
                    }}
                  >
                    <td className={`${tableCellClass()} font-medium text-zinc-900`}>
                      {venda.numeroContrato}
                    </td>
                    <td className={tableCellClass()}>{venda.grupo}</td>
                    <td className={tableCellClass()}>{venda.cota}</td>
                    <td className={tableCellClass()}>Dia {venda.dataVencimento}</td>
                    <td className={tableCellClass()}>
                      <StatusBadge status={venda.statusOperacional} />
                    </td>
                    <td className={tableCellClass()}>{venda.administradora.nome}</td>
                    <td className={`${tableCellClass()} tabular-nums`}>
                      {formatMoneyPtBrFromCentavos(venda.valorCentavos)}
                    </td>
                    <td
                      className={`${tableCellClass()} pr-0 text-right`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <WhatsAppButton
                          telefone={consorciado.telefone}
                          nomeCliente={consorciado.nome}
                          numeroContrato={venda.numeroContrato}
                          statusOperacional={venda.statusOperacional}
                          vendaId={venda.id}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVenda(venda);
                            setDrawerOpen(true);
                          }}
                          className={secondaryActionClass()}
                        >
                          Timeline
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <VendaAtendimentoDrawer
        venda={selectedVenda}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        defaultTipoRegistro="POS_VENDA"
      />
    </>
  );
}
