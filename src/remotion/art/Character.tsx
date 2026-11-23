// A round cartoon character, drawn in SVG. 2.5D look adds rounded shading, a rim light and a soft shadow.
import React from "react";
import type { Accessory, Action, Character as CharacterT, Expression, Look, TimeOfDay } from "../../lib/story";
import { CHAR_COLORS, SKY, shade } from "./palette";

type Props = {
  character: CharacterT;
  mood: Expression;
  action: Action;
  frame: number; // frame inside the beat
  look: Look;
  facing: 1 | -1;
  talking: boolean;
  time: TimeOfDay;
  id: string;
  seed: number;
};

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

export function motion(action: Action, frame: number, facing: 1 | -1, seed: number) {
  const ph = (seed % 100) / 10;
  let x = 0;
  let y = 0;
  let squash = 1;
  let tilt = Math.sin(frame / 20 + ph) * 2;
  switch (action) {
    case "idle":
      y = Math.sin(frame / 12 + ph) * 6;
      squash = 1 + Math.sin(frame / 12 + ph) * 0.015;
      break;
    case "enter": {
      const t = easeOut(frame / 18);
      x = -facing * 620 * (1 - t);
      y = frame < 18 ? -Math.abs(Math.sin(frame / 3)) * 22 : Math.sin(frame / 12) * 6;
      break;
    }
    case "jump": {
      const p = Math.abs(Math.sin(frame / 9 + ph));
      y = -p * 90;
      squash = p < 0.15 ? 0.9 : 1.04;
      break;
    }
    case "shake":
      x = Math.sin(frame * 1.9) * 12;
      tilt = Math.sin(frame * 1.9) * 4;
      break;
    case "walk":
      y = -Math.abs(Math.sin(frame / 5 + ph)) * 16;
      x = facing * Math.min(90, frame * 1.2) - facing * 40;
      tilt = Math.sin(frame / 5) * 4;
      break;
  }
  return { x, y, squash, tilt };
}

function Eyes({ mood, blink, look, talkingLook }: { mood: Expression; blink: boolean; look: Look; talkingLook: number }) {
  const big = mood === "surprised" || mood === "scared";
  const eyeRy = big ? 40 : 32;
  const pupilR = big ? 10 : 15;
  const dx = mood === "thinking" ? 10 : talkingLook;
  const dy = mood === "thinking" ? -12 : mood === "sad" ? 6 : 0;
  if (blink || mood === "excited") {
    // Closed or ^ ^ happy eyes
    const curve = mood === "excited" ? "M -22 6 Q 0 -22 22 6" : "M -22 0 Q 0 10 22 0";
    return (
      <g stroke="#222" strokeWidth={8} fill="none" strokeLinecap="round">
        <path d={curve} transform="translate(-48 -170)" />
        <path d={curve} transform="translate(48 -170)" />
      </g>
    );
  }
  return (
    <g>
      {[-48, 48].map((x) => (
        <g key={x} transform={`translate(${x} -170)`}>
          <ellipse rx={27} ry={eyeRy} fill="#fff" stroke={look === "flat" ? "#222" : "none"} strokeWidth={4} />
          <circle cx={dx * 0.6} cy={dy + 4} r={pupilR} fill="#222" />
          <circle cx={dx * 0.6 - 5} cy={dy - 3} r={pupilR * 0.35} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

function Brows({ mood }: { mood: Expression }) {
  const p = {
    happy: [-6, -6],
    excited: [-14, -14],
    sad: [14, 14],
    surprised: [-24, -24],
    scared: [10, 10],
    angry: [-18, -18],
    thinking: [-4, -22],
  }[mood];
  const angleL = mood === "angry" ? 18 : mood === "sad" || mood === "scared" ? -16 : 0;
  return (
    <g stroke="#222" strokeWidth={9} strokeLinecap="round">
      <line x1={-70} y1={-222 + p[0]} x2={-28} y2={-222 + p[0]} transform={`rotate(${angleL} -49 ${-222 + p[0]})`} />
      <line x1={28} y1={-222 + p[1]} x2={70} y2={-222 + p[1]} transform={`rotate(${-angleL} 49 ${-222 + p[1]})`} />
    </g>
  );
}

function Mouth({ mood, open }: { mood: Expression; open: number }) {
  const y = -105;
  if (open > 0.1) {
    return <ellipse cx={0} cy={y} rx={22 + open * 6} ry={8 + open * 18} fill="#5a1f2b" stroke="#222" strokeWidth={5} />;
  }
  switch (mood) {
    case "happy":
      return <path d={`M -34 ${y - 6} Q 0 ${y + 26} 34 ${y - 6}`} stroke="#222" strokeWidth={8} fill="none" strokeLinecap="round" />;
    case "excited":
      return <path d={`M -40 ${y - 10} Q 0 ${y + 48} 40 ${y - 10} Z`} fill="#5a1f2b" stroke="#222" strokeWidth={6} strokeLinejoin="round" />;
    case "sad":
      return <path d={`M -28 ${y + 10} Q 0 ${y - 16} 28 ${y + 10}`} stroke="#222" strokeWidth={8} fill="none" strokeLinecap="round" />;
    case "surprised":
      return <ellipse cx={0} cy={y} rx={18} ry={26} fill="#5a1f2b" stroke="#222" strokeWidth={6} />;
    case "angry":
      return <path d={`M -30 ${y + 4} L 30 ${y + 4}`} stroke="#222" strokeWidth={9} strokeLinecap="round" />;
    case "thinking":
      return <path d={`M -10 ${y + 2} Q 14 ${y - 6} 30 ${y}`} stroke="#222" strokeWidth={8} fill="none" strokeLinecap="round" />;
    case "scared":
      return <path d={`M -32 ${y + 4} q 8 -10 16 0 t 16 0 t 16 0 t 16 0`} stroke="#222" strokeWidth={7} fill="none" strokeLinecap="round" />;
  }
}

function AccessoryArt({ accessory, color }: { accessory: Accessory; color: string }) {
  switch (accessory) {
    case "none":
      return null;
    case "hat":
      return (
        <g>
          <ellipse cx={0} cy={-282} rx={120} ry={20} fill="#2d2a3e" />
          <rect x={-70} y={-400} width={140} height={120} rx={14} fill="#2d2a3e" />
          <rect x={-70} y={-310} width={140} height={22} fill="#ff5a5a" />
        </g>
      );
    case "bow":
      return (
        <g transform="translate(70 -285) rotate(15)">
          <path d="M 0 0 L -60 -34 L -60 34 Z" fill="#ff5a8a" />
          <path d="M 0 0 L 60 -34 L 60 34 Z" fill="#ff5a8a" />
          <circle r={16} fill="#ff2f6d" />
        </g>
      );
    case "glasses":
      return (
        <g stroke="#222" strokeWidth={7} fill="rgba(255,255,255,0.15)">
          <circle cx={-48} cy={-170} r={42} />
          <circle cx={48} cy={-170} r={42} />
          <line x1={-6} y1={-172} x2={6} y2={-172} />
        </g>
      );
    case "crown":
      return (
        <g transform="translate(0 -285)">
          <path d="M -80 0 L -80 -80 L -40 -40 L 0 -100 L 40 -40 L 80 -80 L 80 0 Z" fill="#ffd23f" stroke="#c99a00" strokeWidth={6} strokeLinejoin="round" />
          <circle cx={0} cy={-30} r={12} fill="#ff5a5a" />
          <circle cx={-50} cy={-22} r={8} fill="#4f9dff" />
          <circle cx={50} cy={-22} r={8} fill="#5ccf6b" />
        </g>
      );
    case "scarf":
      return (
        <g>
          <path d="M -120 -60 Q 0 -20 120 -60 L 120 -20 Q 0 20 -120 -20 Z" fill="#ff5a5a" />
          <rect x={50} y={-40} width={44} height={110} rx={12} fill="#e04848" />
        </g>
      );
  }
}

export const CharacterArt: React.FC<Props> = ({ character, mood, action, frame, look, facing, talking, time, id, seed }) => {
  const base = CHAR_COLORS[character.color];
  const m = motion(action, frame, facing, seed);
  const blink = (frame + (seed % 70)) % 95 < 4;
  const mouthOpen = talking ? Math.abs(Math.sin(frame / 2.6)) : 0;
  const deep = look === "2.5d";
  const light = SKY[time].light;
  const gid = `c-${id}`;
  const feetPhase = action === "walk" ? Math.sin(frame / 5) * 14 : 0;
  return (
    <g>
      {/* ground shadow */}
      <ellipse
        cx={m.x}
        cy={6}
        rx={130 * (1 + m.y / 400)}
        ry={26 * (1 + m.y / 400)}
        fill="#000"
        opacity={deep ? 0.28 : 0.18}
        filter={deep ? `url(#blur-${gid})` : undefined}
      />
      <defs>
        <filter id={`blur-${gid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
        <radialGradient id={`body-${gid}`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor={shade(base, 0.45)} />
          <stop offset="0.45" stopColor={base} />
          <stop offset="1" stopColor={shade(base, -0.35)} />
        </radialGradient>
        <clipPath id={`clip-${gid}`}>
          <ellipse cx={0} cy={-160} rx={135} ry={150} />
        </clipPath>
      </defs>
      <g transform={`translate(${m.x} ${m.y}) rotate(${m.tilt}) scale(${facing * (1 / Math.sqrt(m.squash))} ${m.squash})`}>
        {/* feet */}
        <ellipse cx={-50} cy={-12 - Math.max(0, feetPhase)} rx={42} ry={22} fill={shade(base, -0.3)} />
        <ellipse cx={50} cy={-12 - Math.max(0, -feetPhase)} rx={42} ry={22} fill={shade(base, -0.3)} />
        {/* arms */}
        <ellipse cx={-138} cy={-130 + (action === "jump" ? -40 : 0)} rx={26} ry={46} fill={shade(base, -0.12)} transform={`rotate(${action === "jump" || mood === "excited" ? 40 : 15} -138 -130)`} />
        <ellipse cx={138} cy={-130 + (action === "jump" ? -40 : 0)} rx={26} ry={46} fill={shade(base, -0.12)} transform={`rotate(${action === "jump" || mood === "excited" ? -40 : -15} 138 -130)`} />
        {/* body */}
        <ellipse cx={0} cy={-160} rx={135} ry={150} fill={deep ? `url(#body-${gid})` : base} stroke={deep ? "none" : "#222"} strokeWidth={deep ? 0 : 8} />
        {deep && (
          <g clipPath={`url(#clip-${gid})`}>
            {/* rim light on the edge away from the camera light */}
            <ellipse cx={-18} cy={-168} rx={140} ry={155} fill="none" stroke={light} strokeWidth={14} opacity={0.4} filter={`url(#blur-${gid})`} />
            {/* belly highlight */}
            <ellipse cx={-40} cy={-230} rx={40} ry={24} fill="#fff" opacity={0.35} />
          </g>
        )}
        {/* cheeks */}
        <ellipse cx={-82} cy={-118} rx={20} ry={12} fill="#ff6f91" opacity={0.45} />
        <ellipse cx={82} cy={-118} rx={20} ry={12} fill="#ff6f91" opacity={0.45} />
        <Eyes mood={mood} blink={blink} look={look} talkingLook={0} />
        <Brows mood={mood} />
        <Mouth mood={mood} open={mouthOpen} />
        {mood === "scared" && <path d="M 110 -250 q 14 26 0 36 q -14 -10 0 -36 Z" fill="#8fd3ff" />}
        <AccessoryArt accessory={character.accessory} color={base} />
      </g>
    </g>
  );
};
