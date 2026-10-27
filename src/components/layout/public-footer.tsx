import Brand from "@/components/layout/brand";

export default function PublicFooter() {
  return (
    <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-8 text-center sm:flex-row sm:text-left">
      <Brand />
      <p className="text-[9px] text-zinc-600">Trabaja mejor, a tu manera.</p>
      <p className="text-[8px] uppercase tracking-widest text-zinc-600">
        © {new Date().getFullYear()} CoSpace
      </p>
    </footer>
  );
}
