"use client";

import { formatCnpj, stripCnpjDigits } from "@/lib/validators/cnpj";
import { formControlClass } from "@/components/ui/list-panel-classes";

type CnpjInputProps = {
  label?: string;
  value: string;
  onChange: (formatted: string) => void;
  required?: boolean;
  error?: string | null;
};

export function CnpjInput({
  label = "CNPJ",
  value,
  onChange,
  required,
  error,
}: CnpjInputProps) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-zinc-600">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </div>
      <input
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(formatCnpj(stripCnpjDigits(e.target.value)))}
        placeholder="00.000.000/0000-00"
        maxLength={18}
        className={[
          formControlClass(),
          error ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-200" : "",
        ].join(" ")}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </label>
  );
}

type CurrencyInputProps = {
  label: string;
  value: string;
  onChange: (masked: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
};

export function CurrencyInput({
  label,
  value,
  onChange,
  placeholder = "0,00",
  required,
  error,
}: CurrencyInputProps) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-zinc-600">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-500">
          R$
        </span>
        <input
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
            if (!digits) {
              onChange("");
              return;
            }
            const cents = Number(digits);
            onChange(
              (cents / 100).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            );
          }}
          placeholder={placeholder}
          className={[
            formControlClass(),
            "pl-10",
            error ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-200" : "",
          ].join(" ")}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </label>
  );
}
