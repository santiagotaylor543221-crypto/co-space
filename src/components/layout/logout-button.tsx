import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className = "" }: LogoutButtonProps) {
  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className={`inline-flex items-center gap-1.5 text-zinc-400 transition hover:text-white ${className}`}
      >
        <LogOut size={13} />
        Cerrar sesión
      </button>
    </form>
  );
}
