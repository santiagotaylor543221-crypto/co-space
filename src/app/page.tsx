import Link from 'next/link';
import { ArrowRight, Calendar, CheckCircle2, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  title: string;
  desc: string;
  icon: LucideIcon;
}

const features: Feature[] = [
  { title: 'Horario amplio', desc: 'De 7:00 a 21:00', icon: Clock },
  { title: 'A tu medida', desc: 'Reservas de 1 a 4 horas', icon: Calendar },
  { title: 'Sin esperas', desc: 'Gestión inmediata', icon: CheckCircle2 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] px-4 py-4 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 sm:px-6">
          <Link href="/" className="text-base font-semibold text-white">
            <span className="text-zinc-400">Co</span>Space
          </Link>

          <nav className="flex items-center gap-4 text-[11px] text-zinc-300 sm:gap-5">
            <Link href="/dashboard" className="transition hover:text-white">
              Catálogo
            </Link>
            <Link href="/login" className="transition hover:text-white">
              Login
            </Link>
            <div className="flex items-center gap-2 text-[9px] font-semibold tracking-widest">
              <button type="button" className="text-zinc-500 transition hover:text-white">
                ES
              </button>
              <span className="h-3 w-px bg-white/20" />
              <button type="button" className="text-white">
                EN
              </button>
            </div>
          </nav>
        </header>

        <main>
          {/* Hero */}
          <section className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
            <p className="mb-6 flex items-center gap-3 text-[9px] uppercase tracking-[0.25em] text-zinc-500">
              <span className="h-px w-5 bg-zinc-600" />
              Espacios que trabajan contigo
            </p>

            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Encuentra tu lugar en <span className="text-zinc-500">CoSpace</span>
            </h1>

            <p className="mt-6 max-w-md text-xs leading-relaxed text-zinc-400 sm:text-sm">
              Reserva espacios excepcionales para trabajar, crear y conectar. Sin complicaciones.
            </p>

            {/* Si no hay sesión, el proxy lo enviará al login */}
            <Link
              href="/dashboard"
              className="mt-8 flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-xs font-semibold text-black transition hover:bg-zinc-200"
            >
              Explorar Espacios
              <ArrowRight size={14} />
            </Link>

            <p className="mt-24 flex items-center gap-3 text-[8px] uppercase tracking-[0.25em] text-zinc-600">
              Descubre más
              <span className="h-px w-10 bg-zinc-700" />
            </p>
          </section>

          {/* Features */}
          <section className="pb-16">
            <h2 className="mb-4 text-[8px] uppercase tracking-[0.25em] text-zinc-600">
              Pensado para ti
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </section>
        </main>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-8 text-center sm:flex-row sm:text-left">
          <p className="text-base font-semibold text-white">
            <span className="text-zinc-400">Co</span>Space
          </p>
          <p className="text-[9px] text-zinc-600">Trabaja mejor, a tu manera.</p>
          <p className="text-[8px] uppercase tracking-widest text-zinc-600">© 2025 CoSpace</p>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, icon: Icon }: Feature) {
  return (
    <article className="flex h-36 flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 sm:h-[146px]">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-zinc-300">
        <Icon size={13} />
      </span>
      <div>
        <h3 className="text-xs font-semibold text-white">{title}</h3>
        <p className="mt-1 text-[10px] text-zinc-500">{desc}</p>
      </div>
    </article>
  );
}