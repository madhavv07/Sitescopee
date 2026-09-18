import fs from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distServer = path.join(__dirname, "dist", "server.cjs");

// Automatically build frontend & server bundle if not present
if (!fs.existsSync(distServer)) {
  console.log("⚡ [SiteScope] dist/server.cjs not found. Running build...");
  execSync("npm run build", { stdio: "inherit" });
}

// Start the production server
import("./dist/server.cjs");
