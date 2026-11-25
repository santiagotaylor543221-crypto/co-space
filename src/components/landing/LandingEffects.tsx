"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function LandingEffects({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const targets = element.querySelectorAll<HTMLElement>("main section h2, main section li, .closing-panel");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove("reveal-pending");
        entry.target.classList.add("reveal-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    if (!motion.matches) targets.forEach((target) => {
      // Keep already visible content stable, and leave content readable without JS.
      if (target.getBoundingClientRect().top < window.innerHeight) return;
      target.classList.add("reveal-pending");
      observer.observe(target);
    });
    const resetMotion = () => targets.forEach((target) => target.classList.remove("reveal-pending"));
    motion.addEventListener("change", resetMotion);
    return () => {
      observer.disconnect();
      resetMotion();
      motion.removeEventListener("change", resetMotion);
    };
  }, []);

  return <div ref={root} className="landing flex min-h-screen flex-col">{children}</div>;
}
