import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

// Contenedor de campo de formulario con etiqueta clara y mensaje de error accesible
export default function FormField({
  label,
  htmlFor,
  error,
  description,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-ink">
        {label}
      </label>
      {description && <p className="text-[11px] text-muted">{description}</p>}
      {children}
      {error && <p className="text-[11px] font-medium text-danger">{error}</p>}
    </div>
  );
}
