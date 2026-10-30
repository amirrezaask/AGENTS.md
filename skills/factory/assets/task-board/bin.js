#!/usr/bin/env node
// Node refuses to strip types inside node_modules, so compile server.ts beside itself and run that.
import { build } from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, ".server.mjs");

await build({
  entryPoints: [join(here, "server.ts")],
  outfile: out,
  bundle: true,
  packages: "external",
  platform: "node",
  format: "esm",
  target: "node24",
  logLevel: "error",
});

await import(pathToFileURL(out).href);
