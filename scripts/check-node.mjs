// Checks that this computer's Node.js can run Reelhouse, and says what to do in plain words if not.
const [major, minor] = process.versions.node.split(".").map(Number);
const ok = major > 22 || (major === 22 && minor >= 13);
if (!ok) {
  console.error("");
  console.error(`!! Your Node.js is version ${process.versions.node}, which is too old for Reelhouse.`);
  console.error("!! Install the LTS version from https://nodejs.org (version 22.13 or newer), then try again.");
  console.error("");
  process.exit(1);
}
