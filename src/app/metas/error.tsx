"use client";

import { useEffect } from "react";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { primaryActionClass } from "@/components/ui/list-panel-classes";

export default function MetasError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PageFlowHeader
        crumbs={[{ label: "Metas & Gamificação" }]}
        title="Erro ao carregar metas"
      />
      <AlertBanner tone="error" title="Algo deu errado">
        {error.message || "Não foi possível carregar as metas."}
      </AlertBanner>
      <button type="button" className={`${primaryActionClass()} mt-4`} onClick={reset}>
        Tentar novamente
      </button>
    </>
  );
}
