import Link from "next/link";

// Logotipo adaptable a la nueva paleta clara
export default function Brand() {
  return (
    <Link href="/" className="text-base font-semibold tracking-tight text-ink font-heading">
      <span className="font-normal text-muted">co-</span>space
    </Link>
  );
}
