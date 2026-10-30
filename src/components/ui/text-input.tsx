import type { InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

// Campo de texto con borde fino, superficie blanca y foco con anillo en color acento
export default function TextInput({
  hasError = false,
  className = "",
  ...props
}: TextInputProps) {
  return (
    <input
      className={`w-full rounded-xl border bg-surface px-3.5 py-2.5 text-xs text-ink placeholder:text-muted outline-none transition ${
        hasError
          ? "border-danger focus:border-danger focus:ring-1 focus:ring-danger"
          : "border-line focus:border-accent focus:ring-1 focus:ring-accent"
      } ${className}`}
      {...props}
    />
  );
}
