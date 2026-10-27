import type { InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export default function TextInput({ className = "", ...props }: TextInputProps) {
  return (
    <input
      className={`w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-xs text-white placeholder:text-zinc-500 outline-none transition focus:border-white/30 ${className}`}
      {...props}
    />
  );
}
