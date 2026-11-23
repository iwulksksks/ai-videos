// npm run setup:voice
// Installs Piper (free text-to-speech) into a private Python folder (.venv) and downloads the two voices.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const isWin = process.platform === "win32";
const venv = path.join(root, ".venv");
const py = path.join(venv, isWin ? "Scripts" : "bin", isWin ? "python.exe" : "python");
const voicesDir = path.join(root, "voices");

try {
  process.loadEnvFile?.(".env.local");
} catch {}

const VOICES = [
  process.env.PIPER_NARRATOR_VOICE || "en_US-lessac-medium",
  process.env.PIPER_CHARACTER_VOICE || "en_US-libritts_r-medium",
];

function run(cmd, args) {
  console.log(`> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  return r.status === 0;
}

function findPython() {
  for (const c of isWin ? ["py", "python", "python3"] : ["python3", "python"]) {
    const r = spawnSync(c, ["--version"], { encoding: "utf8" });
    if (r.status === 0 && /Python 3\.(9|1\d)/.test(r.stdout + r.stderr)) return c;
  }
  return null;
}

function voiceUrl(name, ext) {
  // en_US-lessac-medium -> en/en_US/lessac/medium/en_US-lessac-medium.onnx
  const [locale, speaker, quality] = name.split("-");
  const lang = locale.split("_")[0];
  return `https://huggingface.co/rhasspy/piper-voices/resolve/main/${lang}/${locale}/${speaker}/${quality}/${name}${ext}`;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  const tmp = `${dest}.part`;
  fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  fs.renameSync(tmp, dest);
}

if (!fs.existsSync(py)) {
  const sys = findPython();
  if (!sys) {
    console.error("!! Python 3 was not found. Install it from https://www.python.org (tick 'Add python.exe to PATH'), then run this again.");
    process.exit(1);
  }
  if (!run(sys, ["-m", "venv", venv])) process.exit(1);
}
if (!run(py, ["-m", "pip", "install", "--upgrade", "--quiet", "pip"])) process.exit(1);
if (!run(py, ["-m", "pip", "install", "--quiet", "piper-tts"])) {
  console.error("!! Could not install Piper. Check your internet connection and try again.");
  process.exit(1);
}

fs.mkdirSync(voicesDir, { recursive: true });
for (const v of VOICES) {
  for (const ext of [".onnx", ".onnx.json"]) {
    const dest = path.join(voicesDir, v + ext);
    if (fs.existsSync(dest)) continue;
    console.log(`Downloading voice ${v}${ext}...`);
    try {
      await download(voiceUrl(v, ext), dest);
    } catch (e) {
      console.error(`!! Could not download ${v}${ext}: ${e.message}`);
      process.exit(1);
    }
  }
}
console.log("Voices are ready.");
