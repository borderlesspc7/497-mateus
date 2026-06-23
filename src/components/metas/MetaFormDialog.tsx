"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { criarMeta, editarMeta } from "@/actions/metas";
import { criarMetaSchema } from "@/lib/metas/schemas";
import type { Meta, MetaTipo } from "@/types/metas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertBanner } from "@/components/ui/AlertBanner";
import {
  formControlClass,
  primaryActionClass,
  secondaryActionClass,
} from "@/components/ui/list-panel-classes";
import { maskCurrencyInput, parseCurrencyToCentavos } from "@/lib/validators/currency";
import { periodoAtual } from "@/lib/periodo";
import { formatarMoedaInput } from "@/lib/format";

const formSchema = criarMetaSchema.omit({ referenciaId: true }).extend({
  referenciaId: z.string().min(1, "Selecione a referência."),
});

type ReferenciaOption = { id: string; nome: string };

export type MetaFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendedores: ReferenciaOption[];
  equipes: ReferenciaOption[];
  meta?: Meta | null;
  defaultPeriodo?: string;
};

export function MetaFormDialog({
  open,
  onOpenChange,
  vendedores,
  equipes,
  meta,
  defaultPeriodo,
}: MetaFormDialogProps) {
  const router = useRouter();
  const isEdit = Boolean(meta);

  const [tipo, setTipo] = useState<MetaTipo>("VENDEDOR");
  const [referenciaId, setReferenciaId] = useState("");
  const [periodo, setPeriodo] = useState(defaultPeriodo ?? periodoAtual());
  const [metaVendas, setMetaVendas] = useState("10");
  const [metaCredito, setMetaCredito] = useState("");
  const [metaAtivacao, setMetaAtivacao] = useState("80");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccess(null);
    if (meta) {
      setTipo(meta.tipo);
      setReferenciaId(meta.referenciaId);
      setPeriodo(meta.periodo);
      setMetaVendas(String(meta.metaVendas));
      setMetaCredito(formatarMoedaInput(meta.metaCreditoCentavos));
      setMetaAtivacao(String(meta.metaAtivacao));
    } else {
      setTipo("VENDEDOR");
      setReferenciaId("");
      setPeriodo(defaultPeriodo ?? periodoAtual());
      setMetaVendas("10");
      setMetaCredito("");
      setMetaAtivacao("80");
    }
  }, [open, meta, defaultPeriodo]);

  const referencias = useMemo(
    () => (tipo === "VENDEDOR" ? vendedores : equipes),
    [tipo, vendedores, equipes],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const creditoCentavos = parseCurrencyToCentavos(metaCredito);
      if (creditoCentavos === null || creditoCentavos <= 0) {
        setError("Informe a meta de crédito.");
        return;
      }

      const payload = {
        periodo,
        tipo,
        referenciaId,
        metaVendas: Number(metaVendas),
        metaCreditoCentavos: creditoCentavos,
        metaAtivacao: Number(metaAtivacao),
      };

      const parsed = formSchema.safeParse(payload);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
        return;
      }

      const result = isEdit && meta
        ? await editarMeta(meta.id, {
            metaVendas: parsed.data.metaVendas,
            metaCreditoCentavos: parsed.data.metaCreditoCentavos,
            metaAtivacao: parsed.data.metaAtivacao,
          })
        : await criarMeta(parsed.data);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(isEdit ? "Meta atualizada com sucesso." : "Meta criada com sucesso.");
      router.refresh();
      setTimeout(() => onOpenChange(false), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar meta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar meta" : "Nova meta"}</DialogTitle>
          <DialogDescription>
            Defina metas mensais de vendas, crédito e ativação.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          {!isEdit ? (
            <>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-600">Tipo</span>
                <select
                  value={tipo}
                  onChange={(e) => {
                    setTipo(e.target.value as MetaTipo);
                    setReferenciaId("");
                  }}
                  className={formControlClass()}
                >
                  <option value="VENDEDOR">Vendedor</option>
                  <option value="EQUIPE">Equipe</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-600">Referência</span>
                <select
                  value={referenciaId}
                  onChange={(e) => setReferenciaId(e.target.value)}
                  className={formControlClass()}
                  required
                >
                  <option value="">Selecione...</option>
                  {referencias.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-600">Período</span>
                <input
                  type="month"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className={formControlClass()}
                  required
                />
              </label>
            </>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600">Meta de vendas</span>
            <input
              type="number"
              min={1}
              value={metaVendas}
              onChange={(e) => setMetaVendas(e.target.value)}
              className={formControlClass()}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600">Meta de crédito (R$)</span>
            <input
              value={metaCredito}
              onChange={(e) => setMetaCredito(maskCurrencyInput(e.target.value))}
              placeholder="0,00"
              className={formControlClass()}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600">Meta de ativação (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={metaAtivacao}
              onChange={(e) => setMetaAtivacao(e.target.value)}
              className={formControlClass()}
              required
            />
          </label>

          {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}
          {success ? <AlertBanner tone="success">{success}</AlertBanner> : null}

          <DialogFooter>
            <button
              type="button"
              className={secondaryActionClass()}
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button type="submit" className={primaryActionClass()} disabled={saving}>
              {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar meta"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
