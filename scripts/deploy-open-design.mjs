import { cpSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const buildDirectory = resolve(projectDirectory, "dist-open-design");
const openDesignDirectory = resolve(projectDirectory, "..");

for (const generatedDirectory of ["react-assets", "new-world"]) {
  rmSync(resolve(openDesignDirectory, generatedDirectory), {
    recursive: true,
    force: true,
  });
}

for (const entry of readdirSync(buildDirectory)) {
  cpSync(resolve(buildDirectory, entry), resolve(openDesignDirectory, entry), {
    recursive: true,
    force: true,
  });
}

console.log(`Deployed React preview to ${openDesignDirectory}`);
