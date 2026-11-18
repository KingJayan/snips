import type { Metadata } from "next";
import { Space_Grotesk, Syne, JetBrains_Mono } from "next/font/google";
import { AccessibilitySettings } from "@/components/accessibility-settings";
import { DevDebugPanel } from "@/components/dev-debug-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { VfxCursorTracker } from "@/components/vfx-cursor-tracker";
import { VimShortcutsManager } from "@/components/vim-shortcuts-manager";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "snips - code snippet library",
  description: "personal vault for reusable code",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try {
    var root = document.documentElement;
    var ls = window.localStorage;
    var stored = ls.getItem('snips.theme');
    var dark = stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', dark);
    var flags = {
      'snips.a11y.reduced-motion': 'a11y-reduce-motion',
      'snips.a11y.larger-text': 'a11y-large-text',
      'snips.a11y.stronger-focus': 'a11y-strong-focus',
      'snips.pref.compact-layout': 'pref-compact'
    };
    for (var k in flags) if (ls.getItem(k) === '1') root.classList.add(flags[k]);
    if (ls.getItem('snips.pref.ui-density') === 'compact') root.classList.add('pref-density-compact');
    var anim = ls.getItem('snips.pref.animation-level');
    if (anim === 'reduced') root.classList.add('pref-anim-reduced');
    if (anim === 'minimal') root.classList.add('pref-anim-minimal');
    var mode = ls.getItem('snips.perf.low-hardware');
    var low = ['low-hw-no-cursor-tracking', 'low-hw-no-backdrop-filter', 'low-hw-no-shadows', 'low-hw-no-sheen', 'low-hw-reduce-animations'];
    if (mode === 'custom') {
      var c = JSON.parse(ls.getItem('snips.perf.custom-profile') || '{}');
      [c.disableCursorTracking, c.disableBackdropFilter, c.disableShadows, c.disableSheenEffects, c.reduceAnimationDuration].forEach(function(on, i){ if (on) root.classList.add(low[i]); });
      return;
    }
    var lowEnd = mode === 'low' || (mode !== 'normal' && ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4)));
    if (lowEnd) low.forEach(function(cls){ root.classList.add(cls); });
  } catch (e) {}
})();`,
          }}
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <TooltipProvider delayDuration={200}>
          <VfxCursorTracker />
          <VimShortcutsManager />
          {children}
          <DevDebugPanel />
          <AccessibilitySettings />
          <ThemeToggle />
        </TooltipProvider>
      </body>
    </html>
  );
}
