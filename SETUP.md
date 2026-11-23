# Setting up Reelhouse (plain-English guide)

Reelhouse runs on your own computer. Everything is free: the story AI (Ollama), the voices (Piper) and the music are all on your machine. This guide takes about 30 minutes the first time, mostly waiting for downloads.

## 1. Install three free programs

Install these once. Restart your computer after installing them.

1. **Node.js**: go to <https://nodejs.org> and download the button that says **LTS**. Open the file and click Next until it's done. Any version from 22.13 up works, including the newest one. You don't need Visual Studio or any build tools.
2. **Ollama** (the free story-writing AI): go to <https://ollama.com>, click **Download**, install it and open it once. On Windows it sits as a small llama icon near the clock. On a Mac it's a llama in the top menu bar.
3. **Python 3** (needed for the voices): go to <https://www.python.org/downloads>, download the latest Python 3.
   - **Windows: on the first install screen, tick the box "Add python.exe to PATH"** before clicking Install. This is the step people miss most.

If you skip Ollama, the studio still works with built-in demo stories. If you skip Python, videos are made without voices.

## 2. Download Reelhouse

1. Open the project page on GitHub, click the green **Code** button, then **Download ZIP**.
2. Unzip it somewhere **outside OneDrive, iCloud or Dropbox**, for example `C:\Reelhouse` on Windows or a `Reelhouse` folder in your home folder on a Mac. Keep the folder name short.

> **Why not OneDrive?** On many Windows computers, Documents and Desktop are inside OneDrive, so they sync to the cloud. Reelhouse installs tens of thousands of small files and makes big video files. OneDrive tries to upload all of them, which slows everything down and can lock files halfway through installing so it fails. If your folder is already in OneDrive, move it: in File Explorer, cut the whole Reelhouse folder and paste it into `C:\`, then delete the `node_modules` folder inside it and start again. The launcher warns you if it notices OneDrive.

## 3. Start it

- **Windows:** double-click **`Start Reelhouse.bat`**. If Windows shows "Windows protected your PC", click **More info**, then **Run anyway**.
- **Mac:** right-click **`Start Reelhouse.command`** and choose **Open** (only the first time, so the Mac lets it run). After that, a double-click works.

A black window opens and does everything by itself:

- installs the studio's parts,
- downloads the two voices (about 150 MB),
- downloads the story AI (about 4.7 GB, once only),
- opens the studio in your web browser at <http://localhost:3000>.

The first time takes 20 to 30 minutes. After that it opens in a minute or two.

**Keep the black window open.** Closing it closes the studio. Lines starting with `!!` tell you about anything missing and how to fix it.

## 4. Make your first video

1. Click the **Producer's Office** (Bea). Check the **Studio setup** box: green ticks mean everything is ready.
2. Click **Make a story now**. Watch the workers light up as the story moves from room to room.
3. When it's done, open the **Shipping Dock** (Hatch) to watch, download it, and copy the caption.

Videos are also saved in the `output` folder inside Reelhouse, one folder per story, with `video.mp4`, `caption.txt` and `story.json`.

Rendering happens on your computer's processor, so a 60 to 90 second story can take several minutes to make, and longer on older laptops. That's normal.

## 5. Autopilot (stories every day by themselves)

1. In the Producer's Office, write a **Channel brief** (for example "cozy, funny stories about animals and friendship").
2. Choose **Stories per day** (2 to 4 is a good start), then switch **Autopilot** on.

Autopilot keeps working with the browser closed, as long as the black window is open and the computer is awake.

### Start Reelhouse automatically when you log in

**Windows**

1. Press **Windows key + R**, type `shell:startup` and press Enter. A folder opens.
2. In another window, right-click **`Start Reelhouse.bat`** and choose **Show more options > Create shortcut**.
3. Drag the new shortcut into the startup folder.

**Mac**

1. Open **System Settings > General > Login Items**.
2. Under "Open at Login", click **+** and choose **`Start Reelhouse.command`**.

### Keep the computer awake

- **Windows:** Settings > System > Power > set "Make my device sleep after" to **Never** when plugged in.
- **Mac:** System Settings > Displays > Advanced (or Energy / Battery > Options) > turn on **Prevent automatic sleeping when the display is off**.

The screen can turn off; the computer just mustn't go to sleep.

## 6. Settings file (optional)

The launcher creates a file named `.env.local` in the Reelhouse folder. Open it with Notepad (Windows) or TextEdit (Mac) to change settings. Each line is explained in it. Restart Reelhouse after changing it.

Useful ones:

| Setting | What it does |
| --- | --- |
| `REELHOUSE_VOICE=0` | Turns voices off |
| `REELHOUSE_MUSIC=0` | Turns music off |
| `REELHOUSE_OUTPUT_DIR` | Where finished videos are saved |
| `REELHOUSE_PASSWORD` | Asks for a password before opening the studio (user name `reelhouse`) |

## 7. Optional: let Claude write the stories

Ollama is free and good. Claude writes noticeably better stories but costs a little per story.

1. Make an account at <https://console.anthropic.com>, add a small amount of credit, and create an **API key**.
2. Paste it in `.env.local` after `ANTHROPIC_API_KEY=`.
3. Restart Reelhouse. In the Producer's Office, set **Story writer** to **Automatic** (uses Ollama first, then Claude) or **Claude**.

## 8. Optional: post to TikTok automatically

See [TIKTOK.md](TIKTOK.md).

## 9. Optional: upload YouTube Shorts automatically

See [YOUTUBE.md](YOUTUBE.md). It works from this computer without a tunnel, uploads start out private, and Google allows about 6 a day.

## Fixing common problems

| Problem | Fix |
| --- | --- |
| `!! Node.js is not installed` | Install Node.js LTS (step 1), restart the computer, try again. |
| `!! Your Node.js is version ... too old` | Install the LTS version from <https://nodejs.org>, restart the computer, try again. |
| `!! Installing failed` | Read the first red `npm error` lines above it. Usually it's no internet, an antivirus blocking npm, or OneDrive locking files (move the folder out of OneDrive, see step 2). Then delete the `node_modules` folder and start again. |
| `gyp ERR!` or "Could not find any Visual Studio" | You have an old copy of Reelhouse. Download the latest ZIP (step 2), delete `node_modules`, and start again. Reelhouse no longer needs Visual Studio. |
| Files keep "syncing" or say "in use" | The folder is in OneDrive. Move it to `C:\Reelhouse` (step 2). |
| Studio setup says Ollama is not running | Open the Ollama app. On Windows, look for the llama near the clock. |
| Studio setup says the story model is missing | Open a terminal in the Reelhouse folder and run `npm run setup:ollama`, or just restart the launcher. |
| Videos have no voices | Install Python with "Add to PATH" ticked, then run `npm run setup:voice` in the Reelhouse folder. |
| The page says "This site can't be reached" | The black window was closed. Start Reelhouse again. |
| A story shows **Skipped** | It failed twice. Open the Edit Bay and click **Try again**, or check the Producer's activity log for the reason. |
| Rendering is very slow | Normal on older computers. Choose **Flat 2D** in the Producer's Office for faster renders, or fewer stories per day. |
| Port 3000 is already in use | Another Reelhouse window is already open. Close the extra one. |
