/** Classes compartilhadas para painéis de listagem (Server e Client). */

export function panelClass() {
  return "overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm";
}

/** Painéis de formulário — sem overflow-hidden para não cortar dropdowns/autocomplete. */
export function formSectionClass() {
  return "rounded-2xl border border-zinc-200 bg-white shadow-sm";
}

/** Padding horizontal padrão de painéis (listas, cabeçalhos, rodapés). */
export function panelInsetClass() {
  return "px-4 sm:px-6 lg:px-8";
}

export function formControlClass(width?: "sm" | "md" | "lg" | "search") {
  const w =
    width === "sm"
      ? "w-full sm:w-44"
      : width === "md"
        ? "w-full sm:w-52"
        : width === "lg" || width === "search"
          ? "w-full min-w-0 sm:min-w-[12rem] lg:flex-1 lg:basis-64"
          : "";
  return [
    "h-10 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 shadow-sm outline-none transition-colors",
    "placeholder:text-zinc-400",
    "focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-300/60",
    w,
  ]
    .filter(Boolean)
    .join(" ");
}

export function filterToolbarClass() {
  return "flex w-full min-w-0 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center";
}

export function tableWrapClass() {
  return "w-full overflow-x-auto overscroll-x-contain";
}

export function dataTableClass() {
  return "w-full min-w-full border-collapse text-left text-sm";
}

export function tableHeadCellClass() {
  return [
    "whitespace-nowrap pb-2.5 pr-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-500",
    "first:pl-4 last:pr-4 sm:first:pl-6 sm:last:pr-6 lg:first:pl-8 lg:last:pr-8",
  ].join(" ");
}

export function tableCellClass() {
  return [
    "border-t border-zinc-100 py-3 pr-4 align-middle text-zinc-700",
    "first:pl-4 last:pr-4 sm:first:pl-6 sm:last:pr-6 lg:first:pl-8 lg:last:pr-8",
  ].join(" ");
}

export function tableRowClass(index: number) {
  return index % 2 === 1 ? "bg-zinc-50/80" : "bg-white";
}

export function primaryActionClass() {
  return "inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400";
}

export function secondaryActionClass() {
  return "inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400";
}

export function dangerActionClass() {
  return "inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-white px-3.5 text-xs font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300";
}
