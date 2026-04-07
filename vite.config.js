import { defineConfig } from "vite"
import { fileURLToPath, URL } from "url"
import react from "@vitejs/plugin-react"
import webExtension from "vite-plugin-web-extension"
import path from "path"
import fs from "fs"

const target = process.env.BUILD_TARGET || "chrome"
const outDir = `dist/${target}`

// Transform the webextension Chrome manifest into a Firefox manifest
function firefoxManifestTransformPlugin(target) {
  return {
    name: 'extension-manifest-plugin',
    writeBundle(options, bundle) {
      if (target === 'firefox') {
        const manifestPath = path.resolve(options.dir, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          if (manifest.background?.service_worker) {
             manifest.background.scripts = [manifest.background.service_worker];
             delete manifest.background.service_worker;
          }
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
          console.log(`Successfully transformed manifest.json for ${target}`);
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    firefoxManifestTransformPlugin(target),
    webExtension({
      manifest: "public/manifest.json",
    }),
  ],
  build: {
    outDir,
    emptyOutDir: true,
    sourcemap: true
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url))
      },
    ]
  }
})
