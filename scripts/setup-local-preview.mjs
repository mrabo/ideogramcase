// Prepares a self-contained local working copy of the app under .local-preview/app.
// Dependencies are installed into .local-preview/app/node_modules.

import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const previewRoot = join(root, ".local-preview");
const previewApp = join(previewRoot, "app");
const npmCache = join(previewRoot, "npm-cache");

const files = [
  "AGENTS.md",
  "index.html",
  "package-lock.json",
  "package.json",
  "tsconfig.app.json",
  "tsconfig.json",
  "tsconfig.node.json",
  "vite.config.ts",
];

const dirs = ["api", "src"];

async function copyIfPresent(source, destination) {
  try {
    await cp(source, destination, {
      errorOnExist: false,
      force: true,
      recursive: true,
    });
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: process.platform === "win32",
      stdio: "inherit",
      ...options,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

await mkdir(previewApp, { recursive: true });
await mkdir(npmCache, { recursive: true });

await rm(join(previewApp, "api"), { force: true, recursive: true });
await rm(join(previewApp, "netlify"), { force: true, recursive: true });
await rm(join(previewApp, "netlify.copied"), { force: true, recursive: true });
await rm(join(previewApp, "netlify.toml"), { force: true });
await rm(join(previewApp, "netlify.toml.copied"), { force: true });
await rm(join(previewApp, "src"), { force: true, recursive: true });

for (const file of files) {
  await copyIfPresent(join(root, file), join(previewApp, file));
}

for (const dir of dirs) {
  await copyIfPresent(join(root, dir), join(previewApp, dir));
}

await copyIfPresent(join(root, ".env"), join(previewApp, ".env"));
await copyIfPresent(join(root, ".env.local"), join(previewApp, ".env.local"));

await run("npm", ["ci", "--cache", npmCache], { cwd: previewApp });
