import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
}

export default function FormField({ label, htmlFor, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-[10px] font-medium text-zinc-400">
        {label}
      </label>
      {children}
    </div>
  );
}
