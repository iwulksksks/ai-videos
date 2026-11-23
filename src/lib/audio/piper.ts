// Echo's voices: Piper TTS, free and local. Narrator and characters use different voices.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config";

// Speakers from the multi-speaker LibriTTS-R voice that sound clear and distinct.
const CHARACTER_SPEAKERS = [14, 92, 248, 3, 160, 412, 57, 300];

function piperCommand(): { cmd: string; args: string[] } | null {
  const isWin = process.platform === "win32";
  const venvPython = path.join(config.root, ".venv", isWin ? "Scripts" : "bin", isWin ? "python.exe" : "python");
  if (fs.existsSync(venvPython)) return { cmd: venvPython, args: ["-m", "piper"] };
  const venvPiper = path.join(config.root, ".venv", isWin ? "Scripts" : "bin", isWin ? "piper.exe" : "piper");
  if (fs.existsSync(venvPiper)) return { cmd: venvPiper, args: [] };
  return null;
}

function voiceModel(name: string): string | null {
  const p = path.join(config.voicesDir, `${name}.onnx`);
  return fs.existsSync(p) && fs.existsSync(`${p}.json`) ? p : null;
}

export type VoiceStatus = { enabled: boolean; piper: boolean; narrator: boolean; characters: boolean };

export function voiceStatus(): VoiceStatus {
  return {
    enabled: config.voiceOn,
    piper: piperCommand() !== null,
    narrator: voiceModel(config.narratorVoice) !== null,
    characters: voiceModel(config.characterVoice) !== null,
  };
}

export function voiceReady(): boolean {
  const s = voiceStatus();
  return s.enabled && s.piper && s.narrator;
}

export function characterSpeaker(index: number): number {
  return CHARACTER_SPEAKERS[index % CHARACTER_SPEAKERS.length];
}

/** Speak `text` into `outFile`. `speaker` is only used for the multi-speaker character voice. */
export async function speak(
  text: string,
  outFile: string,
  who: "narrator" | { character: number },
  opts: { lengthScale?: number } = {},
): Promise<void> {
  const piper = piperCommand();
  if (!piper) throw new Error("Piper is not installed (run: npm run setup:voice)");
  let model = voiceModel(config.narratorVoice);
  const args = [...piper.args];
  if (who !== "narrator") {
    const charModel = voiceModel(config.characterVoice);
    if (charModel) {
      model = charModel;
      args.push("-s", String(characterSpeaker(who.character)));
    }
  }
  if (!model) throw new Error("No Piper voice downloaded (run: npm run setup:voice)");
  args.push("-m", model, "-f", outFile);
  if (opts.lengthScale) args.push("--length-scale", String(opts.lengthScale));
  await new Promise<void>((resolve, reject) => {
    const child = spawn(piper.cmd, args, { stdio: ["pipe", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 && fs.existsSync(outFile)) resolve();
      else reject(new Error(`Piper failed (${code}): ${err.slice(-400)}`));
    });
    child.stdin.write(text.replace(/\s+/g, " ").trim() + "\n");
    child.stdin.end();
  });
}
