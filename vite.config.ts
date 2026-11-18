import { execSync } from "node:child_process";
import adapter from "@sveltejs/adapter-vercel";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import pkg from "./package.json" with { type: "json" };

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

export default defineConfig({
  plugins: [tailwindcss(), sveltekit({ adapter: adapter() })],
  define: {
    __APP_VERSION__: JSON.stringify(`v${pkg.version}${build ? `+${build}` : ""}`),
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
