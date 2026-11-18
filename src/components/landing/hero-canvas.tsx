"use client";

import dynamic from "next/dynamic";

export const HeroCanvas = dynamic(
  () => import("@/components/landing/hero-scene").then((m) => ({ default: m.HeroScene })),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0" style={{ background: "#09090b" }} />,
  }
);
