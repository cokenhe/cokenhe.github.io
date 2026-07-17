import { cpSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const buildDirectory = resolve(projectDirectory, "dist-site");

for (const generatedDirectory of ["assets", "new-world"]) {
  rmSync(resolve(projectDirectory, generatedDirectory), {
    recursive: true,
    force: true,
  });
}

for (const entry of readdirSync(buildDirectory)) {
  cpSync(resolve(buildDirectory, entry), resolve(projectDirectory, entry), {
    recursive: true,
    force: true,
  });
}

console.log(`Deployed repository preview to ${projectDirectory}`);
