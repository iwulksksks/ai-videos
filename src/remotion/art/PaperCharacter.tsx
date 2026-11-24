// Paper-cutout puppets for Town Gossip. Every body part is a piece of colored card with a white
// cut edge, joined at the shoulders with little brass paper fasteners. Motion is stepped (a new
// pose every 3 frames, with a tiny random wiggle) so it moves like stop-motion paper.
import React from "react";
import type { Action, Character as CharacterT, Expression } from "../../lib/story";
import { townFolk, type Outfit, type TownFolk } from "../../lib/town";
import { CHAR_COLORS, seeded, shade } from "./palette";
import { motion } from "./Character";

export const CUT = "#fffaf0"; // the white edge of cut paper
const EDGE = 7;
const INK = "#2b2220";

type Props = {
  character: CharacterT;
  mood: Expression;
  action: Action;
  frame: number;
  facing: 1 | -1;
  talking: boolean;
  seed: number;
};

type Dressed = TownFolk & { shirt: string };

function guest(c: CharacterT): Dressed {
  const shirt = CHAR_COLORS[c.color];
  let h = 0;
  for (const ch of c.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const skins = ["#f2c79b", "#e8b48c", "#c98f62", "#a8714a", "#8a5a3c", "#f0d0b8"];
  const hairs = ["#2a1a12", "#5a3a22", "#c9a060", "#8a2a1a", "#1a1a1a", "#bbbbbb"];
  const styles: Outfit[] = c.accessory === "bow" ? ["ponytail", "pigtails"] : ["curly", "beanie", "bald", "headband", "cap"];
  return { ...c, role: "", skin: skins[h % skins.length], shirt, pants: shade(shirt, -0.55), hair: hairs[(h >> 3) % hairs.length], outfit: styles[(h >> 6) % styles.length] };
}

/** Town folk get a new shirt color each episode (from the story); Pip and the chef keep theirs. */
function dress(c: CharacterT): Dressed {
  const f = townFolk(c.name);
  if (!f) return guest(c);
  return { ...f, shirt: f.fixedShirt ?? CHAR_COLORS[c.color] };
}

/** A piece of card: colored fill with a white cut edge behind it. */
const P: React.FC<React.SVGProps<SVGPathElement> & { d: string; fill: string }> = ({ d, fill, ...rest }) => (
  <path d={d} fill={fill} stroke={CUT} strokeWidth={EDGE} strokeLinejoin="round" paintOrder="stroke" {...rest} />
);

function Pin({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={8} fill="#d9a93a" stroke="#8a6a1a" strokeWidth={2.5} />
      <circle cx={x - 2.5} cy={y - 2.5} r={2.5} fill="#fff3c4" />
    </g>
  );
}

const circle = (cx: number, cy: number, r: number) => `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;

const HEAD_Y = -335;

function Face({ mood, talking, frame, blink }: { mood: Expression; talking: boolean; frame: number; blink: boolean }) {
  const big = mood === "surprised" || mood === "scared";
  const ey = HEAD_Y - 8 + (mood === "sad" ? 6 : 0);
  const look = mood === "thinking" ? -6 : 0;
  const r = big ? 20 : 15;
  const eyes = blink ? (
    <g stroke={INK} strokeWidth={6} strokeLinecap="round">
      <line x1={-42} y1={ey} x2={-20} y2={ey} />
      <line x1={20} y1={ey} x2={42} y2={ey} />
    </g>
  ) : mood === "excited" ? (
    <g stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M -44 ${ey + 6} Q -31 ${ey - 14} -18 ${ey + 6}`} />
      <path d={`M 18 ${ey + 6} Q 31 ${ey - 14} 44 ${ey + 6}`} />
    </g>
  ) : (
    <g>
      {[-31, 31].map((x) => (
        <g key={x}>
          <circle cx={x} cy={ey} r={r} fill="#fff" />
          <circle cx={x + 2} cy={ey + 2 + look} r={big ? 7 : 8} fill={INK} />
        </g>
      ))}
    </g>
  );
  const by = ey - 30;
  const brows =
    mood === "angry" ? (
      <g fill={INK}>
        <path d={`M -52 ${by - 6} L -14 ${by + 6} L -16 ${by + 13} L -54 ${by + 2} Z`} />
        <path d={`M 52 ${by - 6} L 14 ${by + 6} L 16 ${by + 13} L 54 ${by + 2} Z`} />
      </g>
    ) : mood === "sad" || mood === "scared" ? (
      <g fill={INK}>
        <path d={`M -50 ${by + 8} L -16 ${by - 4} L -14 ${by + 3} L -48 ${by + 15} Z`} />
        <path d={`M 50 ${by + 8} L 16 ${by - 4} L 14 ${by + 3} L 48 ${by + 15} Z`} />
      </g>
    ) : mood === "thinking" ? (
      <g fill={INK}>
        <rect x={-50} y={by} width={34} height={7} rx={3} />
        <rect x={16} y={by - 12} width={34} height={7} rx={3} transform={`rotate(-10 33 ${by - 9})`} />
      </g>
    ) : null;
  const my = HEAD_Y + 42;
  const open = talking ? Math.abs(Math.sin(frame / 2.2)) : 0;
  let mouth: React.ReactNode;
  if (open > 0.2) mouth = <ellipse cx={0} cy={my} rx={14 + open * 6} ry={5 + open * 13} fill="#7a1f2b" />;
  else if (mood === "excited") mouth = <path d={`M -28 ${my - 8} L 28 ${my - 8} Q 24 ${my + 24} 0 ${my + 24} Q -24 ${my + 24} -28 ${my - 8} Z`} fill="#c8323c" />;
  else if (mood === "happy") mouth = <path d={`M -24 ${my - 6} Q 0 ${my + 18} 24 ${my - 6}`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />;
  else if (mood === "sad") mouth = <path d={`M -20 ${my + 8} Q 0 ${my - 10} 20 ${my + 8}`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />;
  else if (mood === "surprised") mouth = <ellipse cx={0} cy={my + 2} rx={12} ry={16} fill="#7a1f2b" />;
  else if (mood === "angry") mouth = <rect x={-20} y={my} width={40} height={7} rx={3} fill={INK} />;
  else if (mood === "scared") mouth = <path d={`M -22 ${my + 4} l 7 -7 l 7 7 l 7 -7 l 7 7 l 7 -7`} stroke={INK} strokeWidth={5} fill="none" strokeLinejoin="round" />;
  else mouth = <path d={`M -6 ${my + 2} Q 8 ${my - 6} 20 ${my}`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />;
  return (
    <g>
      <circle cx={-52} cy={HEAD_Y + 24} r={13} fill="#ff7a8a" opacity={0.55} />
      <circle cx={52} cy={HEAD_Y + 24} r={13} fill="#ff7a8a" opacity={0.55} />
      {eyes}
      {brows}
      {mouth}
      {mood === "scared" && <P d={`M 74 ${HEAD_Y - 50} q 12 22 0 30 q -12 -8 0 -30 Z`} fill="#8fd3ff" />}
    </g>
  );
}

/** Hair and hats sit on top of the head; some outfits add a piece on the body. */
function Hair({ f }: { f: Dressed }) {
  const h = f.hair;
  const top = HEAD_Y - 85;
  switch (f.outfit) {
    case "cap":
      return (
        <g>
          <P d={`M -86 ${top + 44} Q -80 ${top - 14} 0 ${top - 16} Q 80 ${top - 14} 86 ${top + 44} Z`} fill="#2fa35a" />
          <P d={`M -86 ${top + 34} L -150 ${top + 46} L -146 ${top + 60} L -84 ${top + 52} Z`} fill="#23803f" />
          <circle cx={0} cy={top - 10} r={8} fill="#ffd23f" />
        </g>
      );
    case "bun":
      return (
        <g>
          <P d={circle(0, top - 20, 34)} fill={h} />
          <P d={`M -88 ${top + 70} Q -90 ${top - 2} 0 ${top - 4} Q 90 ${top - 2} 88 ${top + 70} Q 60 ${top + 26} 0 ${top + 28} Q -60 ${top + 26} -88 ${top + 70} Z`} fill={h} />
          <g stroke="#3a2a4a" strokeWidth={5} fill="rgba(255,255,255,0.25)">
            <circle cx={-31} cy={HEAD_Y - 8} r={24} />
            <circle cx={31} cy={HEAD_Y - 8} r={24} />
            <line x1={-7} y1={HEAD_Y - 8} x2={7} y2={HEAD_Y - 8} />
          </g>
        </g>
      );
    case "mayor":
      return (
        <g>
          <P d={`M -90 ${top + 80} Q -96 ${top + 20} -60 ${top + 18} L -70 ${top + 80} Z`} fill={h} />
          <P d={`M 90 ${top + 80} Q 96 ${top + 20} 60 ${top + 18} L 70 ${top + 80} Z`} fill={h} />
          <ellipse cx={-30} cy={HEAD_Y - 60} rx={22} ry={10} fill="#fff" opacity={0.35} />
          <P d={`M -40 ${HEAD_Y + 26} Q -20 ${HEAD_Y + 6} 0 ${HEAD_Y + 20} Q 20 ${HEAD_Y + 6} 40 ${HEAD_Y + 26} Q 20 ${HEAD_Y + 36} 0 ${HEAD_Y + 28} Q -20 ${HEAD_Y + 36} -40 ${HEAD_Y + 26} Z`} fill={shade(h, -0.3)} />
        </g>
      );
    case "ponytail":
      return (
        <g>
          <P d={`M -70 ${top + 20} Q -150 ${top + 60} -120 ${top + 190} Q -100 ${top + 110} -60 ${top + 60} Z`} fill={h} />
          <P d={`M -88 ${top + 76} Q -88 ${top - 4} 0 ${top - 6} Q 88 ${top - 4} 88 ${top + 60} Q 30 ${top + 20} -40 ${top + 40} Z`} fill={h} />
          <P d={`M -66 ${top + 16} l -30 -20 l 0 40 Z M -66 ${top + 16} l 30 -20 l 0 40 Z`} fill="#ff5a8a" />
        </g>
      );
    case "chef":
      return (
        <g>
          <P d={`M -62 ${top + 24} L 62 ${top + 24} L 62 ${top - 6} L -62 ${top - 6} Z`} fill="#f4f1ea" />
          <P d={`M -70 ${top - 4} Q -110 ${top - 70} -50 ${top - 80} Q -30 ${top - 130} 20 ${top - 110} Q 90 ${top - 120} 80 ${top - 50} Q 110 ${top - 20} 62 ${top - 4} Z`} fill="#ffffff" />
          <P d={`M -82 ${HEAD_Y + 10} Q -84 ${HEAD_Y + 90} 0 ${HEAD_Y + 100} Q 84 ${HEAD_Y + 90} 82 ${HEAD_Y + 10} Q 40 ${HEAD_Y + 60} 0 ${HEAD_Y + 60} Q -40 ${HEAD_Y + 60} -82 ${HEAD_Y + 10} Z`} fill={h} />
        </g>
      );
    case "police":
      return (
        <g>
          <P d={`M -96 ${top + 40} L 96 ${top + 40} L 70 ${top + 56} L -70 ${top + 56} Z`} fill="#141c30" />
          <P d={`M -80 ${top + 42} Q -90 ${top - 30} 0 ${top - 30} Q 90 ${top - 30} 80 ${top + 42} Z`} fill="#1f2a44" />
          <P d={`M -12 ${top - 10} l 12 -10 l 12 10 l -4 18 l -16 0 Z`} fill="#d9a93a" />
        </g>
      );
    case "goggles":
      return (
        <g>
          <P d={`M -88 ${top + 60} L -70 ${top - 10} L -40 ${top + 20} L -20 ${top - 30} L 10 ${top + 14} L 36 ${top - 26} L 56 ${top + 16} L 80 ${top - 8} L 88 ${top + 60} Z`} fill={h} />
          <rect x={-88} y={top + 42} width={176} height={12} fill="#5a3a22" />
          <P d={circle(-30, top + 48, 20)} fill="#9fdcff" />
          <P d={circle(30, top + 48, 20)} fill="#9fdcff" />
        </g>
      );
    case "headband":
      return (
        <g>
          <P d={`M -88 ${top + 64} Q -88 ${top - 4} 0 ${top - 6} Q 88 ${top - 4} 88 ${top + 64} Q 0 ${top + 30} -88 ${top + 64} Z`} fill={h} />
          <P d={`M -90 ${top + 44} Q 0 ${top + 14} 90 ${top + 44} L 90 ${top + 62} Q 0 ${top + 32} -90 ${top + 62} Z`} fill="#ffffff" />
        </g>
      );
    case "bald":
      return (
        <g>
          <P d={`M -88 ${HEAD_Y - 20} Q -96 ${HEAD_Y + 10} -84 ${HEAD_Y + 30} L -78 ${HEAD_Y - 20} Z`} fill={h} />
          <P d={`M 88 ${HEAD_Y - 20} Q 96 ${HEAD_Y + 10} 84 ${HEAD_Y + 30} L 78 ${HEAD_Y - 20} Z`} fill={h} />
          <ellipse cx={-30} cy={HEAD_Y - 60} rx={22} ry={10} fill="#fff" opacity={0.35} />
        </g>
      );
    case "pigtails":
      return (
        <g>
          <P d={circle(-104, top + 70, 30)} fill={h} />
          <P d={circle(104, top + 70, 30)} fill={h} />
          <P d={`M -88 ${top + 70} Q -88 ${top - 4} 0 ${top - 6} Q 88 ${top - 4} 88 ${top + 70} Q 50 ${top + 30} 0 ${top + 40} Q -50 ${top + 30} -88 ${top + 70} Z`} fill={h} />
          <circle cx={-86} cy={top + 52} r={10} fill="#ff5a8a" />
          <circle cx={86} cy={top + 52} r={10} fill="#ff5a8a" />
        </g>
      );
    case "curly":
      return (
        <g>
          {[-78, -46, -14, 18, 50, 80].map((x, i) => (
            <P key={x} d={circle(x, top + 10 - (i % 2) * 16, 32)} fill={h} />
          ))}
          <P d={circle(-94, top + 66, 24)} fill={h} />
          <P d={circle(94, top + 66, 24)} fill={h} />
        </g>
      );
    case "beanie":
      return (
        <g>
          <P d={`M -88 ${top + 54} Q -92 ${top - 40} 0 ${top - 44} Q 92 ${top - 40} 88 ${top + 54} Z`} fill={shade(f.shirt, -0.25)} />
          <P d={`M -94 ${top + 36} L 94 ${top + 36} L 94 ${top + 62} L -94 ${top + 62} Z`} fill={shade(f.shirt, -0.4)} />
          <P d={circle(0, top - 52, 18)} fill="#ffffff" />
        </g>
      );
  }
}

function BodyDetail({ f }: { f: Dressed }) {
  switch (f.outfit) {
    case "mayor":
      return <P d="M -60 -236 L -40 -246 L 70 -110 L 54 -100 Z" fill="#d9a93a" />;
    case "chef":
      return <P d="M -44 -210 L 44 -210 L 56 -100 L -56 -100 Z" fill="#f4f1ea" />;
    case "police":
      return <P d="M 22 -214 l 14 -6 l 14 6 l -3 20 l -11 6 l -11 -6 Z" fill="#d9a93a" />;
    case "bun":
      return (
        <g>
          {[-200, -170, -140].map((y) => (
            <circle key={y} cx={0} cy={y} r={6} fill="#fff4d6" />
          ))}
        </g>
      );
    case "cap":
      return <P d="M -40 -160 L 40 -160 L 44 -122 L -44 -122 Z" fill={shade(f.shirt, -0.15)} />;
    case "headband":
      return (
        <g>
          <path d="M -26 -248 Q 0 -190 26 -248" stroke="#ffd23f" strokeWidth={5} fill="none" />
          <P d={rrect(-12, -206, 24, 16, 5)} fill="#c0c0c8" />
        </g>
      );
    default:
      return null;
  }
}

function Extra({ kind, outfit }: { kind: CharacterT["accessory"]; outfit: Outfit }) {
  switch (kind) {
    case "glasses":
      if (outfit === "bun" || outfit === "goggles") return null;
      return (
        <g stroke={INK} strokeWidth={5} fill="rgba(255,255,255,0.2)">
          <circle cx={-31} cy={HEAD_Y - 8} r={24} />
          <circle cx={31} cy={HEAD_Y - 8} r={24} />
          <line x1={-7} y1={HEAD_Y - 8} x2={7} y2={HEAD_Y - 8} />
        </g>
      );
    case "scarf":
      if (outfit === "mayor") return null;
      return <P d="M -70 -262 Q 0 -236 70 -262 L 70 -236 Q 40 -220 40 -160 L 20 -160 L 22 -224 Q -30 -220 -70 -236 Z" fill="#e04848" />;
    case "bow":
      if (outfit === "ponytail" || outfit === "pigtails") return null;
      return <P d={`M 50 ${HEAD_Y - 80} l -30 -20 l 0 40 Z M 50 ${HEAD_Y - 80} l 30 -20 l 0 40 Z`} fill="#ff5a8a" />;
    case "crown":
      return <P d={`M -56 ${HEAD_Y - 70} L -56 ${HEAD_Y - 120} L -28 ${HEAD_Y - 92} L 0 ${HEAD_Y - 130} L 28 ${HEAD_Y - 92} L 56 ${HEAD_Y - 120} L 56 ${HEAD_Y - 70} Z`} fill="#ffd23f" />;
    default:
      return null;
  }
}

export const PaperCharacterArt: React.FC<Props> = ({ character, mood, action, frame, facing, talking, seed }) => {
  const f = dress(character);
  const extra = character.accessory !== (townFolk(character.name)?.accessory ?? "none") ? character.accessory : "none";
  // Stop-motion: hold each pose for 3 frames, and wiggle a little on every new pose.
  const step = Math.floor(frame / 3) * 3;
  const r = seeded(seed + step * 13);
  const wiggle = (r() - 0.5) * 2.4;
  const m = motion(action, step, facing, seed);
  const blink = (step + (seed % 70)) % 96 < 3;
  const swing = action === "walk" ? Math.sin(step / 5) * 24 : 0;
  const armsUp = action === "jump" || mood === "excited";
  const armL = armsUp ? 140 : mood === "angry" ? 30 : mood === "thinking" ? 120 : 8 + swing * 0.6;
  const armR = armsUp ? -140 : mood === "angry" ? -30 : -8 - swing * 0.6;
  const arm = (x: number, rot: number, color: string) => (
    <g transform={`rotate(${rot} ${x} -236)`}>
      <P d={rrect(x - 17, -246, 34, 132, 16)} fill={color} />
      <P d={circle(x, -114, 20)} fill={f.skin} />
      <Pin x={x} y={-230} />
    </g>
  );
  return (
    <g>
      {/* soft paper shadow on the set */}
      <ellipse cx={m.x + 14} cy={8} rx={110} ry={18} fill="#000" opacity={0.18} />
      <g transform={`translate(${m.x} ${m.y}) rotate(${m.tilt * 0.5 + wiggle}) scale(${facing} 1)`}>
        {/* legs */}
        <g transform={`rotate(${swing} -26 -100)`}>
          <P d={rrect(-46, -110, 36, 106, 12)} fill={f.pants} />
          <P d={`M -54 -10 Q -54 -28 -30 -28 L -6 -28 Q 6 -28 6 -12 L 6 0 L -54 0 Z`} fill="#2a2a2a" />
        </g>
        <g transform={`rotate(${-swing} 26 -100)`}>
          <P d={rrect(10, -110, 36, 106, 12)} fill={f.pants} />
          <P d={`M 2 -10 Q 2 -28 26 -28 L 46 -28 Q 60 -28 60 -12 L 60 0 L 2 0 Z`} fill="#2a2a2a" />
        </g>
        {arm(74, armR, shade(f.shirt, -0.12))}
        {/* body: a cut-paper tunic */}
        <P d="M -64 -258 Q 0 -274 64 -258 L 96 -98 Q 0 -84 -96 -98 Z" fill={f.shirt} />
        <BodyDetail f={f} />
        {/* head on a pinned neck */}
        <P d={rrect(-20, -272, 40, 30, 8)} fill={shade(f.skin, -0.1)} />
        <P d={circle(0, HEAD_Y, 86)} fill={f.skin} />
        <Face mood={mood} talking={talking} frame={step} blink={blink} />
        <Hair f={f} />
        <Extra kind={extra} outfit={f.outfit} />
        {arm(-74, armL, f.shirt)}
      </g>
    </g>
  );
};
