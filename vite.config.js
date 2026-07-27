import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"
const repoRoot = fileURLToPath(new URL(".", import.meta.url))
const DEFAULTS_CONFIG = "van.defaults.json"

// Imported through a runtime-computed URL, not a static specifier: esbuild
// bundles this config file, and build-theme.mjs's shebang is a syntax error
// anywhere but line 1 of a module.
const themeGenerator = new URL("./scripts/build-theme.mjs", import.meta.url).href
const buildDefaults = async () =>
  (await import(/* @vite-ignore */ themeGenerator)).buildDefaults({ root: repoRoot })

/*
 * styles/globals.css @imports the generated styles/defaults.css, so it has to
 * exist and be current before vite resolves any CSS. The generator is
 * deterministic and takes milliseconds, so regenerating on every dev boot and
 * build is cheaper than a stale-output bug; the file is still committed so a
 * plain `vite` in a fresh checkout works. Editing van.defaults.json rebuilds
 * it in dev.
 */
function vanillinDefaults() {
  return {
    name: "vanillin-defaults",
    buildStart: buildDefaults,
    configureServer(server) {
      server.watcher.add(fileURLToPath(new URL(DEFAULTS_CONFIG, import.meta.url)))
    },
    async handleHotUpdate({ file }) {
      if (file.endsWith(DEFAULTS_CONFIG)) await buildDefaults()
    },
  }
}

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/vanillin/" : "/",
  root: "site",
  plugins: [vanillinDefaults(), react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
})
