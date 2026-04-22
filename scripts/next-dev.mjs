import net from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const portArg = process.argv[2];
const HOST = process.env.DEV_HOST || "0.0.0.0";

function portIsFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", (err) => {
      if (/** @type {NodeJS.ErrnoException} */ (err).code === "EADDRINUSE") {
        resolve(false);
        return;
      }
      resolve(false);
    });
    // Explicitly bind to the same host Next.js will use.
    // On Windows, checking only the port (without host) can produce false positives.
    srv.listen({ port, host: HOST, exclusive: true }, () => {
      srv.close(() => resolve(true));
    });
  });
}

async function pickPortAuto(start = 3000, end = 3100) {
  for (let p = start; p <= end; p += 1) {
    // Keep 3001 free for the backend API in this project.
    if (p === 3001) continue;
    // eslint-disable-next-line no-await-in-loop
    const ok = await portIsFree(p);
    if (ok) return p;
  }
  return null;
}

let PORT = Number(process.env.PORT || 3000);
if (portArg && portArg !== "auto") {
  PORT = Number(portArg);
} else if (portArg === "auto") {
  const picked = await pickPortAuto(3000, 3100);
  if (!picked) {
    console.error("No free port found in range 3000-3100.");
    process.exit(1);
  }
  PORT = picked;
  console.log(`[dev:auto] Using port ${PORT}`);
}

const free = await portIsFree(PORT);
if (!free) {
  console.error("");
  console.error("============================================================");
  console.error(`  PORT ${PORT} IS ALREADY IN USE (same as EADDRINUSE)`);
  console.error("============================================================");
  console.error("");
  console.error("  This always means something on THIS computer is listening");
  console.error(`  on port ${PORT} — not your collaborator's laptop.`);
  console.error("");
  console.error("  Common causes:");
  console.error("    • Another terminal still running: npm run dev");
  console.error("    • A background Node/Next process from an earlier run");
  console.error("");
  console.error("  What to do:");
  console.error("    • In the other terminal: press Ctrl+C to stop Next.js");
  console.error(`    • Or start on another port: npm run dev:3002`);
  console.error("      (uses a separate build folder so it can run alongside :3000)");
  console.error("");
  console.error("  Windows (find what is using the port):");
  console.error(
    `    Get-NetTCPConnection -LocalPort ${PORT} -State Listen | Select OwningProcess`
  );
  console.error("");
  process.exit(1);
}

const nextCli = join(root, "node_modules", "next", "dist", "bin", "next");
// Non-default dev ports use their own distDir so two `next dev` processes do not
// share `.next` (Windows often hits EPERM on `.next/trace` when both write there).
const env = { ...process.env };
if (PORT !== 3000) {
  env.NEXT_DEV_DIST_DIR = `.next-dev-${PORT}`;
}

const child = spawn(
  process.execPath,
  [nextCli, "dev", "-p", String(PORT), "-H", HOST],
  { stdio: "inherit", cwd: root, env }
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
