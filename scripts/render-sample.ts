// npm run render:sample [twist|hook|cozy] [2.5d|flat]
// Renders a demo story end to end without the web app, to prove the video pipeline works.
import fs from "node:fs";
import path from "node:path";

try {
  process.loadEnvFile?.(".env.local");
} catch {
  /* no .env.local, that's fine */
}

async function main() {
  const { demoPitches, demoStory } = await import("../src/lib/writers/demo");
  const { ruleCheck } = await import("../src/lib/agents/qa");
  const { recordVoices, pickMood, makeMusic, makeSfx } = await import("../src/lib/agents/sound");
  const { stageStory } = await import("../src/lib/agents/art");
  const { renderVideo } = await import("../src/lib/agents/edit");
  const { shipStory, outputFolder } = await import("../src/lib/agents/ship");
  const { config } = await import("../src/lib/config");
  const { FPS } = await import("../src/lib/story");

  const arg = process.argv[2];
  const style = arg === "cozy" || arg === "hook" ? arg : "twist";
  const look = process.argv[3] === "flat" ? "flat" : "2.5d";
  const pitch = demoPitches(style, [])[0];
  console.log(`Script Room: writing "${pitch.title}" (${style}, ${look})`);
  const checked = ruleCheck(demoStory(pitch, style), style);
  if (checked.fatal.length) throw new Error(`QA rejected the demo story: ${checked.fatal.join("; ")}`);
  console.log(`QA Lab: ${checked.issues.length ? checked.issues.join("; ") : "approved"}`);

  const jobDir = path.join(config.dataDir, "jobs", `sample-${style}-${look}`);
  fs.rmSync(jobDir, { recursive: true, force: true });
  fs.mkdirSync(jobDir, { recursive: true });

  const voices = await recordVoices(checked.story, jobDir, (d, t) => process.stdout.write(`\rSound Booth: recording ${d}/${t}`), style);
  console.log(voices.voiced ? "\nSound Booth: voices recorded" : `Sound Booth: no voices. ${voices.problem}`);

  const plan = stageStory(checked.story, style, voices.audio);
  const seconds = plan.totalFrames / FPS;
  console.log(`Art Studio: ${plan.beats.length} scenes, ${seconds.toFixed(1)} seconds`);

  const mood = pickMood(checked.story, style);
  const music = makeMusic({ mood, seconds, seed: checked.story.title, jobDir });
  const sfxFile = makeSfx(plan, jobDir);
  console.log(`Sound Booth: music is ${music.source}${sfxFile ? ", with sound effects" : ""}`);

  const rendered = path.join(jobDir, "render.mp4");
  const started = Date.now();
  await renderVideo({
    jobDir,
    story: checked.story,
    style,
    look,
    plan,
    musicFile: music.file,
    sfxFile,
    musicMood: mood,
    outFile: rendered,
    onProgress: (p) => process.stdout.write(`\rEdit Bay: rendering ${Math.round(p * 100)}%   `),
  });
  console.log(`\nEdit Bay: rendered in ${Math.round((Date.now() - started) / 1000)}s`);
  const folder = shipStory({ renderedFile: rendered, story: checked.story, folder: outputFolder("sample", `${checked.story.title}-${style}-${look}`), extra: { style, look, mood } });
  console.log(`Shipping Dock: saved to ${folder}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
