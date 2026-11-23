export type RoomId = "trends" | "producer" | "research" | "script" | "qa" | "voice" | "art" | "edit" | "ship";

export const ROOMS: { id: RoomId; name: string; agent: string; color: string; wall: string; job: string }[] = [
  { id: "trends", name: "Trend Lookout", agent: "Juno", color: "teal", wall: "#bfe8ff", job: "Checks what's popular this week" },
  { id: "producer", name: "Producer's Office", agent: "Bea", color: "yellow", wall: "#ffe9b0", job: "Runs autopilot and picks the best pitch" },
  { id: "research", name: "Research Desk", agent: "Pip", color: "green", wall: "#d4f5c9", job: "Turns themes into story pitches" },
  { id: "script", name: "Script Room", agent: "Quill", color: "purple", wall: "#e6dbff", job: "Writes the full story" },
  { id: "qa", name: "QA Lab", agent: "Vera", color: "blue", wall: "#d5e6ff", job: "Checks and fixes every story" },
  { id: "voice", name: "Sound Booth", agent: "Echo", color: "pink", wall: "#ffd9ec", job: "Records voices and makes music" },
  { id: "art", name: "Art Studio", agent: "Dot", color: "orange", wall: "#ffe0c4", job: "Stages scenes, cameras and depth" },
  { id: "edit", name: "Edit Bay", agent: "Splice", color: "red", wall: "#ffd6d6", job: "Animates and renders the video" },
  { id: "ship", name: "Shipping Dock", agent: "Hatch", color: "teal", wall: "#d2f3ef", job: "Saves and delivers finished videos" },
];

export const AGENT_COLORS: Record<string, string> = {
  yellow: "#ffd23f",
  pink: "#ff8fc7",
  blue: "#4f9dff",
  green: "#5ccf6b",
  orange: "#ff9a3c",
  purple: "#a77bff",
  red: "#ff5a5a",
  teal: "#2ec4b6",
};

export const STAGE_LABEL: Record<string, string> = {
  queued: "Waiting",
  script: "Writing",
  qa: "Checking",
  voice: "Recording",
  art: "Staging",
  edit: "Rendering",
  ship: "Shipping",
  done: "Done",
  failed: "Failed",
  skipped: "Skipped",
};
