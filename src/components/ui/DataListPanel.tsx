import type { ReactNode } from "react";
import { filterToolbarClass, panelClass, panelInsetClass } from "./list-panel-classes";

type DataListPanelProps = {
  title?: string;
  toolbar?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
};

export function DataListPanel({
  title = "Lista",
  toolbar,
  error,
  children,
}: DataListPanelProps) {
  return (
    <div className={panelClass()}>
      <div className={`border-b border-zinc-100 py-4 ${panelInsetClass()}`}>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Filtre, busque e gerencie os registros abaixo.
          </p>
        </div>
        {toolbar ? (
          <div className={`${filterToolbarClass()} mt-4`}>{toolbar}</div>
        ) : null}
      </div>

      {error ? (
        <div className={`border-b border-zinc-100 py-3 ${panelInsetClass()}`}>{error}</div>
      ) : null}

      <div className="py-3 sm:py-4">{children}</div>
    </div>
  );
}
