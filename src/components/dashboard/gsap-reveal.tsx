"use client";

import * as React from "react";
import gsap from "gsap";

export function GsapReveal({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".sidebar",
        { x: -12, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.55, ease: "power2.out" },
      );

      gsap.fromTo(
        ".navbar",
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );

      gsap.fromTo(
        ".nav a",
        { x: -6, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.45,
          ease: "power2.out",
          stagger: 0.03,
          delay: 0.05,
        },
      );

      gsap.fromTo(
        ".reveal-card",
        { y: 10, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          ease: "power2.out",
          stagger: 0.06,
          delay: 0.1,
        },
      );
    }, ref);

    return () => ctx.revert();
  }, []);

  return <div ref={ref}>{children}</div>;
}

