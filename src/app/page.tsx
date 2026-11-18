import { LandingNav } from "@/components/landing/landing-nav";
import { HeroOverlay } from "@/components/landing/hero-overlay";
import { FeaturesStrip } from "@/components/landing/features-strip";
import { LandingCta } from "@/components/landing/landing-cta";
import { HeroCanvas } from "@/components/landing/hero-canvas";
import { SignedInRedirect } from "@/components/landing/signed-in-redirect";

export default function LandingPage() {
  return (
    <main style={{ background: "#09090b", minHeight: "100svh" }}>
      <SignedInRedirect />
      <LandingNav />

      {/* ── Hero ── */}
      <section className="relative h-svh w-full overflow-hidden">
        {/* 3D canvas fills the full section */}
        <div className="absolute inset-0">
          <HeroCanvas />
        </div>

        {/* Headline + CTA overlaid above the canvas */}
        <HeroOverlay />

        {/* Bottom fade into the features section */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36"
          style={{
            background:
              "linear-gradient(to top, #09090b 0%, transparent 100%)",
          }}
        />
      </section>

      {/* ── Features ── */}
      <FeaturesStrip />

      {/* ── CTA + Footer ── */}
      <LandingCta />
    </main>
  );
}
