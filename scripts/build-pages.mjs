import { spawnSync } from "node:child_process";
import { cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pagesDirectory = join(rootDirectory, "pages");
const buildDirectory = join(pagesDirectory, ".worker-build");
const outputDirectory = join(pagesDirectory, "dist");
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

await rm(buildDirectory, { recursive: true, force: true });
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(buildDirectory, { recursive: true });
await mkdir(outputDirectory, { recursive: true });

const buildResult = spawnSync(
  pnpmCommand,
  [
    "exec",
    "wrangler",
    "deploy",
    "src/pages-worker.ts",
    "--dry-run",
    "--outdir",
    buildDirectory,
    "--config",
    "wrangler.toml",
  ],
  {
    cwd: rootDirectory,
    stdio: "inherit",
  },
);

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

await cp(join(rootDirectory, "public"), outputDirectory, { recursive: true });
await rename(join(buildDirectory, "pages-worker.js"), join(outputDirectory, "_worker.js"));
await rename(join(buildDirectory, "pages-worker.js.map"), join(outputDirectory, "_worker.js.map"));

const workerPath = join(outputDirectory, "_worker.js");
const workerSource = await readFile(workerPath, "utf8");
await writeFile(
  workerPath,
  workerSource.replace(
    "//# sourceMappingURL=pages-worker.js.map",
    "//# sourceMappingURL=_worker.js.map",
  ),
);

await rm(buildDirectory, { recursive: true, force: true });

console.info(`Pages Functions output generated at ${outputDirectory}`);
