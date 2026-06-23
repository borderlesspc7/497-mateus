"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sincronizarTodasRealizacoes } from "@/actions/metas";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { secondaryActionClass } from "@/components/ui/list-panel-classes";

export type SincronizarButtonProps = {
  periodo: string;
};

export function SincronizarButton({ periodo }: SincronizarButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );

  async function onSync() {
    setLoading(true);
    setMessage(null);
    try {
      const result = await sincronizarTodasRealizacoes(periodo);
      if (!result.success) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setMessage({
        tone: "success",
        text: `${result.data.processadas} meta(s) sincronizada(s).${
          result.data.erros > 0 ? ` ${result.data.erros} erro(s).` : ""
        }`,
      });
      router.refresh();
    } catch (e) {
      setMessage({
        tone: "error",
        text: e instanceof Error ? e.message : "Erro ao sincronizar.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        className={secondaryActionClass()}
        onClick={() => void onSync()}
        disabled={loading}
      >
        <RefreshCw className={`mr-2 inline h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Sincronizando..." : "Sincronizar"}
      </button>
      {message ? (
        <AlertBanner tone={message.tone} className="w-full max-w-sm">
          {message.text}
        </AlertBanner>
      ) : null}
    </div>
  );
}
