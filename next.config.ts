import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import { version } from "./package.json";

const git = (args: string) => {
  try {
    return execSync(`git ${args}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};

const sha = (process.env.VERCEL_GIT_COMMIT_SHA ?? git("rev-parse HEAD")).slice(0, 7);
const count = git("rev-parse --is-shallow-repository") === "false" ? git("rev-list --count HEAD") : "";
const build = [count, sha].filter(Boolean).join(".");

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: `v${version}${build ? `+${build}` : ""}` },
  // reactCompiler breaks @react-three/fiber (useFrame direct DOM mutation pattern)  
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei", "@react-three/postprocessing"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
