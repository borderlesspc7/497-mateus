import type { ReactNode } from "react";
import { panelClass } from "./list-panel-classes";

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
      <div className="flex flex-col gap-3 border-b border-zinc-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="shrink-0 text-sm font-semibold text-zinc-900">{title}</h2>
        {toolbar ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {toolbar}
          </div>
        ) : null}
      </div>

      {error ? <div className="border-b border-zinc-100 px-6 py-3">{error}</div> : null}

      <div className="px-6 py-4">{children}</div>
    </div>
  );
}
