"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function LandingEffects({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const targets = element.querySelectorAll<HTMLElement>(
      "main section h2:not(.closing-panel h2), main section li, .closing-panel",
    );
    const observer = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting, boundingClientRect, rootBounds } of entries) {
        // Move departing elements away from the edge they just crossed.
        const outside = boundingClientRect.bottom <= (rootBounds?.top ?? 0) ? "above" : "below";
        target.setAttribute("data-reveal", isIntersecting ? "visible" : outside);
      }
    }, { rootMargin: "0px 0px -32px 0px" });

    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      targets.forEach((target) => target.removeAttribute("data-reveal"));
    };
  }, []);

  return <div ref={root} className="landing flex min-h-screen flex-col">{children}</div>;
}
