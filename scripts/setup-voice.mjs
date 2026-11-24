// npm run setup:voice
// Installs Piper (free text-to-speech) into a private Python folder (.venv) and downloads the two voices.
//
// Piper needs onnxruntime, which only ships for certain Python versions (3.11 to 3.14 right now) and,
// on Windows, Piper itself only ships for 64-bit Intel/AMD Python. Brand-new Python releases (3.15+)
// often have no onnxruntime yet, which makes pip fail with "ResolutionImpossible".
// So: use a compatible Python if one is installed; otherwise fetch a private Python 3.12 with uv
// (open source, from astral.sh) into the .tools folder. Nothing on the computer is changed outside
// the Reelhouse folder.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const isWin = process.platform === "win32";
const venv = path.join(root, ".venv");
const binDir = (dir) => path.join(dir, isWin ? "Scripts" : "bin");
const py = path.join(binDir(venv), isWin ? "python.exe" : "python");
const toolsDir = path.join(root, ".tools");
const voicesDir = path.join(root, "voices");

// Python versions Piper (through onnxruntime) is known to install on.
const GOOD = ["3.12", "3.13", "3.11", "3.14"];
const FALLBACK_VERSION = "3.12";

try {
  process.loadEnvFile?.(".env.local");
} catch {}

const VOICES = [
  process.env.PIPER_NARRATOR_VOICE || "en_US-lessac-medium",
  process.env.PIPER_CHARACTER_VOICE || "en_US-libritts_r-medium",
];

function run(cmd, args, env) {
  console.log(`> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", env: env ? { ...process.env, ...env } : process.env });
  return r.status === 0;
}

const INFO = "import sys,struct,platform;print('%d.%d %d %s'%(sys.version_info[0],sys.version_info[1],struct.calcsize('P')*8,platform.machine()))";

// Returns { version: "3.12", bits: 64, machine: "AMD64" } or null.
function pythonInfo(cmd, preArgs = []) {
  const r = spawnSync(cmd, [...preArgs, "-c", INFO], { encoding: "utf8" });
  if (r.status !== 0 || !r.stdout) return null;
  const [version, bits, machine] = r.stdout.trim().split(/\s+/);
  return { version, bits: Number(bits), machine: (machine || "").toLowerCase() };
}

function isCompatible(info) {
  if (!info || !GOOD.includes(info.version) || info.bits !== 64) return false;
  // Piper's Windows build is for Intel/AMD (x64) only.
  if (isWin && !["amd64", "x86_64"].includes(info.machine)) return false;
  return true;
}

function describe(info) {
  if (!info) return "unknown";
  return `Python ${info.version} (${info.bits}-bit, ${info.machine})`;
}

// Candidate system Pythons, best first.
function candidates() {
  const list = [];
  if (isWin) {
    for (const v of GOOD) list.push({ cmd: "py", pre: [`-${v}`] });
    list.push({ cmd: "py", pre: [] }, { cmd: "python", pre: [] }, { cmd: "python3", pre: [] });
  } else {
    for (const v of GOOD) list.push({ cmd: `python${v}`, pre: [] });
    list.push({ cmd: "python3", pre: [] }, { cmd: "python", pre: [] });
  }
  return list;
}

function findPythons() {
  const found = [];
  for (const c of candidates()) {
    const info = pythonInfo(c.cmd, c.pre);
    if (info) found.push({ ...c, info });
  }
  return found;
}

function removeVenv() {
  try {
    fs.rmSync(venv, { recursive: true, force: true });
    return true;
  } catch (e) {
    console.error(`!! Could not delete the old .venv folder (${e.message}). Close Reelhouse, delete the .venv folder by hand, and run this again.`);
    return false;
  }
}

// Make a private Python with uv: install uv with whatever Python exists, then let uv download Python 3.12.
function venvWithUv(anyPython) {
  const uvVenv = path.join(toolsDir, "uv-env");
  const uv = path.join(binDir(uvVenv), isWin ? "uv.exe" : "uv");
  if (!fs.existsSync(uv)) {
    console.log(`Getting a helper (uv) that downloads a compatible Python ${FALLBACK_VERSION} just for Reelhouse...`);
    fs.mkdirSync(toolsDir, { recursive: true });
    if (!run(anyPython.cmd, [...anyPython.pre, "-m", "venv", uvVenv])) return false;
    const uvPy = path.join(binDir(uvVenv), isWin ? "python.exe" : "python");
    if (!run(uvPy, ["-m", "pip", "install", "--quiet", "uv"])) return false;
  }
  const request = isWin ? `cpython-${FALLBACK_VERSION}-windows-x86_64-none` : FALLBACK_VERSION;
  return run(uv, ["venv", "--seed", "--python", request, venv], {
    UV_PYTHON_INSTALL_DIR: path.join(toolsDir, "python"),
    UV_PYTHON_DOWNLOADS: "automatic",
  });
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

function fail(lines) {
  for (const l of lines) console.error(`!! ${l}`);
  console.error("!! Reelhouse still works, the videos just have no voices until this is fixed.");
  process.exit(1);
}

// 1. Throw away a private Python made with an incompatible version (for example from an earlier failed run).
if (fs.existsSync(py)) {
  const info = pythonInfo(py);
  if (!isCompatible(info)) {
    console.log(`The private Python folder uses ${describe(info)}, which the voice engine does not support. Rebuilding it...`);
    if (!removeVenv()) process.exit(1);
  }
}

// 2. Create the private Python folder.
if (!fs.existsSync(py)) {
  const pythons = findPythons();
  if (pythons.length === 0) {
    fail(["Python 3 was not found. Install it from https://www.python.org (tick 'Add python.exe to PATH'), then run this again."]);
  }
  const good = pythons.find((p) => isCompatible(p.info));
  if (good) {
    console.log(`Using ${describe(good.info)} for the voices.`);
    if (!run(good.cmd, [...good.pre, "-m", "venv", venv])) fail(["Could not create the private Python folder (.venv)."]);
  } else {
    console.log(`Your ${describe(pythons[0].info)} is too new or the wrong type for the voice engine (it needs Python 3.11 to 3.14, 64-bit).`);
    console.log("No need to change your Python. Reelhouse will fetch its own copy, about 30 MB, once.");
    if (!venvWithUv(pythons[0])) {
      removeVenv();
      fail([
        `Could not fetch a private Python ${FALLBACK_VERSION}. This step needs the internet, so check your connection and run this again.`,
        `If it keeps failing, install Python ${FALLBACK_VERSION} (64-bit) from https://www.python.org/downloads/windows/ next to your current one, then run this again.`,
      ]);
    }
  }
}

// 3. Install Piper.
run(py, ["-m", "pip", "install", "--upgrade", "--quiet", "pip"]);
if (!run(py, ["-m", "pip", "install", "--quiet", "piper-tts"])) {
  const info = pythonInfo(py);
  if (!isCompatible(info)) {
    removeVenv();
    fail([`Could not install the voice engine: it does not support ${describe(info)}. Run this again to get a compatible Python.`]);
  }
  fail([
    "Could not install the voice engine (Piper). Scroll up to the red ERROR lines for the reason.",
    "If they mention a connection, timeout or SSL, check your internet or antivirus and run this again.",
    "Otherwise, send a screenshot of the red lines.",
  ]);
}

// 4. Download the voices.
fs.mkdirSync(voicesDir, { recursive: true });
for (const v of VOICES) {
  for (const ext of [".onnx", ".onnx.json"]) {
    const dest = path.join(voicesDir, v + ext);
    if (fs.existsSync(dest)) continue;
    console.log(`Downloading voice ${v}${ext}...`);
    try {
      await download(voiceUrl(v, ext), dest);
    } catch (e) {
      fail([`Could not download ${v}${ext}: ${e.message}`, "Check your internet connection and run this again."]);
    }
  }
}
console.log("Voices are ready.");
