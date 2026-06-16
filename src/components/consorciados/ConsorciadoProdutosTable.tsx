"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { InconsistenciaBadge } from "@/components/ui/InconsistenciaBadge";
import { PanelSectionHeader } from "@/components/ui/PanelSectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  dataTableClass,
  panelClass,
  panelInsetClass,
  secondaryActionClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import type { ConsorciadoRow, VendaRow } from "@/lib/types/domain";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

type ConsorciadoProdutosTableProps = {
  consorciado: ConsorciadoRow;
  vendas: VendaRow[];
  onOpenAtendimento: (venda: VendaRow) => void;
};

export function ConsorciadoProdutosTable({
  consorciado,
  vendas,
  onOpenAtendimento,
}: ConsorciadoProdutosTableProps) {
  return (
    <section className={`${panelClass()} mt-5`}>
      <PanelSectionHeader
        title="Produtos e cotas contratadas"
        description={
          vendas.length === 0
            ? "Nenhum produto ou cota vinculado a este consorciado."
            : `${vendas.length} produto(s)/cota(s). Clique em uma linha para abrir o atendimento.`
        }
      />

      {vendas.length === 0 ? (
        <div className={`pb-5 ${panelInsetClass()}`}>
          <EmptyState
            title="Sem produtos contratados"
            description="Quando houver vendas vinculadas a este consorciado, elas aparecerão aqui com status e histórico."
          />
        </div>
      ) : (
        <div className={tableWrapClass()}>
          <table className={dataTableClass()}>
            <thead>
              <tr>
                <th className={tableHeadCellClass()}>Contrato</th>
                <th className={tableHeadCellClass()}>Grupo / Cota</th>
                <th className={tableHeadCellClass()}>Produto / Plano</th>
                <th className={tableHeadCellClass()}>Vencimento</th>
                <th className={tableHeadCellClass()}>Status</th>
                <th className={tableHeadCellClass()}>Inconsistência</th>
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
                  onClick={() => onOpenAtendimento(venda)}
                >
                  <td className={`${tableCellClass()} font-medium text-zinc-900`}>
                    {venda.numeroContrato}
                  </td>
                  <td className={tableCellClass()}>
                    {venda.grupo} / {venda.cota}
                  </td>
                  <td className={tableCellClass()}>{venda.plano?.nome ?? "—"}</td>
                  <td className={tableCellClass()}>Dia {venda.dataVencimento}</td>
                  <td className={tableCellClass()}>
                    <StatusBadge status={venda.statusOperacional} />
                  </td>
                  <td className={tableCellClass()}>
                    <InconsistenciaBadge status={venda.statusInconsistencia} />
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
                        onClick={() => onOpenAtendimento(venda)}
                        className={secondaryActionClass()}
                      >
                        Atendimento
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
  );
}
