/** Classes compartilhadas para painéis de listagem (Server e Client). */

export function panelClass() {
  return "overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm";
}

export function formControlClass(width?: "sm" | "md" | "lg") {
  const w =
    width === "sm"
      ? "sm:w-44"
      : width === "md"
        ? "sm:w-56"
        : width === "lg"
          ? "sm:w-72"
          : "";
  return [
    "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition-colors",
    "focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-300/50",
    w,
  ]
    .filter(Boolean)
    .join(" ");
}

export function tableWrapClass() {
  return "-mx-6 overflow-x-auto px-6";
}

export function dataTableClass() {
  return "w-full min-w-[640px] border-collapse text-left text-sm";
}

export function tableHeadCellClass() {
  return "whitespace-nowrap pb-3 pr-4 text-xs font-medium text-zinc-500";
}

export function tableCellClass() {
  return "border-t border-zinc-100 py-3.5 pr-4 align-middle text-zinc-700";
}

export function tableEmptyCellClass() {
  return "border-t border-zinc-100 py-10 text-center text-sm text-zinc-500";
}

export function primaryActionClass() {
  return "inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400";
}

export function secondaryActionClass() {
  return "inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400";
}

export function dangerActionClass() {
  return "inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300";
}
