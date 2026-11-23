// Chunky toy-block people for Town Gossip, drawn in SVG. Every part is a little box with a lit top
// and a shaded side, so the town reads as 3D toys while staying 2.5D code art (fast to render).
import React from "react";
import type { Action, Character as CharacterT, Expression, Look, TimeOfDay } from "../../lib/story";
import { townFolk, type Outfit, type TownFolk } from "../../lib/town";
import { CHAR_COLORS, SKY, mix, shade } from "./palette";
import { motion } from "./Character";

type Props = {
  character: CharacterT;
  mood: Expression;
  action: Action;
  frame: number;
  look: Look;
  facing: 1 | -1;
  talking: boolean;
  time: TimeOfDay;
  seed: number;
};

const D = 26; // depth of each box, drawn up and to the right

/** Dress someone who isn't in the town cast from their color and accessory. */
function guest(c: CharacterT): TownFolk & { shirt: string } {
  const shirt = CHAR_COLORS[c.color];
  // Vary skin, hair and hairstyle by name so one-off characters don't all look alike.
  let h = 0;
  for (const ch of c.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const skins = ["#f2c79b", "#e8b48c", "#c98f62", "#a8714a", "#8a5a3c", "#f0d0b8"];
  const hairs = ["#2a1a12", "#5a3a22", "#c9a060", "#8a2a1a", "#1a1a1a", "#bbbbbb"];
  const styles: Outfit[] = c.accessory === "bow" ? ["ponytail", "pigtails"] : ["curly", "beanie", "bald", "headband", "cap"];
  return {
    ...c,
    role: "",
    handle: c.name.toLowerCase().replace(/\s+/g, "."),
    skin: skins[h % skins.length],
    shirt,
    pants: shade(shirt, -0.55),
    hair: hairs[(h >> 3) % hairs.length],
    outfit: styles[(h >> 6) % styles.length],
  };
}

/** Town folk wear a new shirt color each episode (from the story); Pip and the chef keep theirs. */
function dress(c: CharacterT): TownFolk & { shirt: string } {
  const f = townFolk(c.name);
  if (!f) return guest(c);
  return { ...f, shirt: f.fixedShirt ?? CHAR_COLORS[c.color] };
}

function Box({ x, y, w, h, color, deep, rx = 6, light }: { x: number; y: number; w: number; h: number; color: string; deep: boolean; rx?: number; light: string }) {
  return (
    <g>
      {deep && (
        <>
          <path d={`M ${x + w} ${y} l ${D} ${-D * 0.6} l 0 ${h} l ${-D} ${D * 0.6} Z`} fill={shade(color, -0.32)} />
          <path d={`M ${x} ${y} l ${D} ${-D * 0.6} l ${w} 0 l ${-D} ${D * 0.6} Z`} fill={mix(shade(color, 0.22), light, 0.15)} />
        </>
      )}
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={color} stroke={deep ? "none" : "#222"} strokeWidth={deep ? 0 : 6} />
    </g>
  );
}

function Face({ mood, talking, frame, blink }: { mood: Expression; talking: boolean; frame: number; blink: boolean }) {
  const ink = "#2a1f1a";
  const big = mood === "surprised" || mood === "scared";
  const ey = mood === "sad" ? -342 : -350;
  const look = mood === "thinking" ? -8 : 0;
  const eyes =
    blink && !big ? (
      <g stroke={ink} strokeWidth={7} strokeLinecap="round">
        <line x1={-46} y1={ey} x2={-22} y2={ey} />
        <line x1={22} y1={ey} x2={46} y2={ey} />
      </g>
    ) : mood === "excited" || mood === "happy" ? (
      <g stroke={ink} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {mood === "excited" ? (
          <>
            <path d={`M -48 ${ey + 8} L -34 ${ey - 8} L -20 ${ey + 8}`} />
            <path d={`M 20 ${ey + 8} L 34 ${ey - 8} L 48 ${ey + 8}`} />
          </>
        ) : (
          <>
            <ellipse cx={-34} cy={ey} rx={9} ry={13} fill={ink} stroke="none" />
            <ellipse cx={34} cy={ey} rx={9} ry={13} fill={ink} stroke="none" />
          </>
        )}
      </g>
    ) : big ? (
      <g>
        {[-34, 34].map((x) => (
          <g key={x}>
            <circle cx={x} cy={ey} r={20} fill="#fff" stroke={ink} strokeWidth={5} />
            <circle cx={x} cy={ey + 2} r={8} fill={ink} />
          </g>
        ))}
      </g>
    ) : (
      <g>
        <ellipse cx={-34} cy={ey + look} rx={9} ry={13} fill={ink} />
        <ellipse cx={34} cy={ey + look} rx={9} ry={13} fill={ink} />
      </g>
    );
  const browY = ey - 30;
  const brows =
    mood === "angry" ? (
      <g stroke={ink} strokeWidth={8} strokeLinecap="round">
        <line x1={-54} y1={browY - 8} x2={-18} y2={browY + 6} />
        <line x1={18} y1={browY + 6} x2={54} y2={browY - 8} />
      </g>
    ) : mood === "sad" || mood === "scared" ? (
      <g stroke={ink} strokeWidth={7} strokeLinecap="round">
        <line x1={-54} y1={browY + 6} x2={-18} y2={browY - 6} />
        <line x1={18} y1={browY - 6} x2={54} y2={browY + 6} />
      </g>
    ) : mood === "thinking" ? (
      <g stroke={ink} strokeWidth={7} strokeLinecap="round">
        <line x1={-52} y1={browY} x2={-18} y2={browY} />
        <line x1={18} y1={browY - 12} x2={52} y2={browY - 8} />
      </g>
    ) : null;
  const my = -300;
  const open = talking ? Math.abs(Math.sin(frame / 2.6)) : 0;
  let mouth: React.ReactNode;
  if (open > 0.15) mouth = <ellipse cx={0} cy={my} rx={18 + open * 6} ry={6 + open * 14} fill="#7a1f2b" stroke={ink} strokeWidth={5} />;
  else if (mood === "excited") mouth = <path d={`M -34 ${my - 10} L 34 ${my - 10} Q 30 ${my + 30} 0 ${my + 30} Q -30 ${my + 30} -34 ${my - 10} Z`} fill="#e8393f" stroke={ink} strokeWidth={6} strokeLinejoin="round" />;
  else if (mood === "happy") mouth = <path d={`M -28 ${my - 6} Q 0 ${my + 20} 28 ${my - 6}`} stroke={ink} strokeWidth={8} fill="none" strokeLinecap="round" />;
  else if (mood === "sad") mouth = <path d={`M -24 ${my + 10} Q 0 ${my - 10} 24 ${my + 10}`} stroke={ink} strokeWidth={8} fill="none" strokeLinecap="round" />;
  else if (mood === "surprised") mouth = <ellipse cx={0} cy={my + 2} rx={13} ry={18} fill="#7a1f2b" stroke={ink} strokeWidth={5} />;
  else if (mood === "angry") mouth = <path d={`M -24 ${my + 4} L 24 ${my + 4}`} stroke={ink} strokeWidth={8} strokeLinecap="round" />;
  else if (mood === "scared") mouth = <path d={`M -26 ${my + 4} q 6.5 -10 13 0 t 13 0 t 13 0 t 13 0`} stroke={ink} strokeWidth={6} fill="none" strokeLinecap="round" />;
  else mouth = <path d={`M -8 ${my + 2} Q 10 ${my - 6} 24 ${my}`} stroke={ink} strokeWidth={7} fill="none" strokeLinecap="round" />;
  return (
    <g>
      {eyes}
      {brows}
      {mouth}
      {(mood === "happy" || mood === "excited") && (
        <>
          <ellipse cx={-56} cy={-318} rx={13} ry={8} fill="#ff6f6f" opacity={0.45} />
          <ellipse cx={56} cy={-318} rx={13} ry={8} fill="#ff6f6f" opacity={0.45} />
        </>
      )}
      {mood === "scared" && <path d="M 66 -392 q 12 22 0 30 q -12 -8 0 -30 Z" fill="#8fd3ff" />}
    </g>
  );
}

/** Hair and hats. Drawn after the head box. */
type Dressed = TownFolk & { shirt: string };

function OutfitArt({ f, deep, light, part }: { f: Dressed; deep: boolean; light: string; part: "head" | "body" }) {
  const hair = f.hair;
  if (part === "body") {
    if (f.outfit === "mayor") {
      // gold sash and a big ribbon badge
      return (
        <g>
          <path d="M -78 -250 L -50 -260 L 78 -130 L 78 -104 Z" fill="#f2c23a" />
          <circle cx={-34} cy={-200} r={18} fill="#f2c23a" stroke="#b8860b" strokeWidth={4} />
        </g>
      );
    }
    if (f.outfit === "chef") {
      return <rect x={-58} y={-226} width={116} height={128} rx={10} fill="#f4f1ea" stroke="#d8d2c4" strokeWidth={4} />;
    }
    if (f.outfit === "bun") {
      // cardigan buttons
      return (
        <g fill={shade(f.shirt, -0.35)}>
          <rect x={-4} y={-258} width={8} height={148} />
          {[-230, -190, -150].map((y) => (
            <circle key={y} cx={0} cy={y} r={7} fill="#fff4d6" />
          ))}
        </g>
      );
    }
    if (f.outfit === "cap") {
      // hoodie pocket and strings
      return (
        <g>
          <rect x={-50} y={-170} width={100} height={46} rx={10} fill={shade(f.shirt, -0.15)} />
          <line x1={-20} y1={-258} x2={-22} y2={-214} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
          <line x1={20} y1={-258} x2={22} y2={-214} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
        </g>
      );
    }
    if (f.outfit === "police") {
      return (
        <g>
          <path d="M 30 -236 l 18 -8 l 18 8 l -4 26 l -14 8 l -14 -8 Z" fill="#f2c23a" stroke="#b8860b" strokeWidth={3} />
          <rect x={-80} y={-130} width={160} height={18} fill="#1d1d2b" />
        </g>
      );
    }
    if (f.outfit === "headband") {
      // a whistle on a cord
      return (
        <g>
          <path d="M -30 -262 Q 0 -200 30 -262" stroke="#ffd23f" strokeWidth={5} fill="none" />
          <rect x={-14} y={-218} width={28} height={18} rx={6} fill="#c0c0c8" />
        </g>
      );
    }
    if (f.outfit === "goggles") {
      return <rect x={-80} y={-150} width={160} height={16} fill="#7a5a3a" />;
    }
    return null;
  }
  switch (f.outfit) {
    case "cap":
      // green cap worn backwards: brim sticks out behind
      return (
        <g>
          <Box x={-86} y={-446} w={172} h={44} color="#2fa35a" deep={deep} rx={14} light={light} />
          <rect x={-150} y={-416} width={76} height={18} rx={9} fill="#23803f" />
          <rect x={-14} y={-440} width={28} height={30} rx={6} fill="#ffd23f" />
        </g>
      );
    case "bun":
      return (
        <g>
          <Box x={-86} y={-436} w={172} h={34} color={hair} deep={deep} rx={12} light={light} />
          <circle cx={0} cy={-466} r={34} fill={hair} />
          <circle cx={-10} cy={-476} r={12} fill="#fff" opacity={0.5} />
          {/* glasses */}
          <g stroke="#3a2a4a" strokeWidth={6} fill="rgba(255,255,255,0.18)">
            <rect x={-62} y={-372} width={52} height={42} rx={12} />
            <rect x={10} y={-372} width={52} height={42} rx={12} />
            <line x1={-10} y1={-352} x2={10} y2={-352} />
          </g>
        </g>
      );
    case "mayor":
      return (
        <g>
          <Box x={-86} y={-436} w={172} h={26} color={hair} deep={deep} rx={10} light={light} />
          <rect x={-90} y={-416} width={22} height={60} rx={6} fill={hair} />
          <rect x={68} y={-416} width={22} height={60} rx={6} fill={hair} />
          {/* moustache */}
          <path d="M -40 -318 Q -20 -334 0 -322 Q 20 -334 40 -318 Q 20 -306 0 -314 Q -20 -306 -40 -318 Z" fill={shade(hair, -0.3)} />
        </g>
      );
    case "ponytail":
      return (
        <g>
          <Box x={-86} y={-440} w={172} h={40} color={hair} deep={deep} rx={12} light={light} />
          <rect x={-88} y={-410} width={22} height={70} rx={8} fill={hair} />
          <path d="M -86 -420 q -60 20 -50 110 q 20 -30 40 -60 Z" fill={hair} />
          <path d="M -40 -452 l -30 -22 l 0 44 Z M -40 -452 l 30 -22 l 0 44 Z" fill="#ff5a8a" />
          <circle cx={-40} cy={-452} r={9} fill="#ff2f6d" />
        </g>
      );
    case "police":
      return (
        <g>
          <Box x={-90} y={-452} w={180} h={40} color="#1f2a44" deep={deep} rx={10} light={light} />
          <rect x={-96} y={-418} width={150} height={16} rx={8} fill="#141c30" />
          <circle cx={0} cy={-432} r={11} fill="#f2c23a" />
        </g>
      );
    case "goggles":
      return (
        <g>
          <Box x={-86} y={-440} w={172} h={30} color={hair} deep={deep} rx={10} light={light} />
          <path d="M -86 -420 l 20 -24 l 16 20 l 16 -24 l 16 22 l 18 -26 l 18 24 l 16 -22 l 16 26 l 18 -24 l 18 28 Z" fill={hair} />
          <rect x={-86} y={-412} width={172} height={14} fill="#5a3a22" />
          <circle cx={-34} cy={-405} r={20} fill="#9fdcff" stroke="#5a3a22" strokeWidth={6} />
          <circle cx={34} cy={-405} r={20} fill="#9fdcff" stroke="#5a3a22" strokeWidth={6} />
        </g>
      );
    case "headband":
      return (
        <g>
          <Box x={-86} y={-440} w={172} h={34} color={hair} deep={deep} rx={12} light={light} />
          <rect x={-86} y={-414} width={172} height={18} fill="#ffffff" />
          <rect x={-86} y={-408} width={172} height={6} fill={f.shirt} />
        </g>
      );
    case "bald":
      return (
        <g>
          <rect x={-90} y={-400} width={16} height={46} rx={6} fill={hair} />
          <rect x={74} y={-400} width={16} height={46} rx={6} fill={hair} />
          <path d="M -50 -386 L -20 -380 M 20 -380 L 50 -386" stroke={hair} strokeWidth={10} strokeLinecap="round" />
        </g>
      );
    case "pigtails":
      return (
        <g>
          <Box x={-86} y={-440} w={172} h={36} color={hair} deep={deep} rx={12} light={light} />
          <circle cx={-104} cy={-400} r={26} fill={hair} />
          <circle cx={104} cy={-400} r={26} fill={hair} />
          <circle cx={-90} cy={-414} r={9} fill="#ff5a8a" />
          <circle cx={90} cy={-414} r={9} fill="#ff5a8a" />
        </g>
      );
    case "curly":
      return (
        <g fill={hair}>
          {[-80, -48, -16, 16, 48, 80].map((x, i) => (
            <circle key={x} cx={x} cy={-436 - (i % 2) * 14} r={30} />
          ))}
          <circle cx={-92} cy={-396} r={22} />
          <circle cx={92} cy={-396} r={22} />
        </g>
      );
    case "beanie":
      return (
        <g>
          <Box x={-88} y={-462} w={176} h={60} color={shade(f.shirt, -0.25)} deep={deep} rx={22} light={light} />
          <rect x={-90} y={-418} width={180} height={22} rx={8} fill={shade(f.shirt, -0.4)} />
          <circle cx={0} cy={-470} r={18} fill="#fff" />
        </g>
      );
    case "chef":
      return (
        <g>
          <Box x={-70} y={-450} w={140} h={36} color="#f4f1ea" deep={deep} rx={8} light={light} />
          <circle cx={-40} cy={-480} r={40} fill="#ffffff" />
          <circle cx={10} cy={-498} r={46} fill="#ffffff" />
          <circle cx={50} cy={-474} r={36} fill="#f6f6f6" />
          {/* beard */}
          <path d="M -80 -320 L -80 -290 Q 0 -250 80 -290 L 80 -320 Q 40 -296 0 -296 Q -40 -296 -80 -320 Z" fill={hair} opacity={0.9} />
        </g>
      );
  }
}

function Extra({ kind, outfit }: { kind: CharacterT["accessory"]; outfit: Outfit }) {
  switch (kind) {
    case "glasses":
      if (outfit === "bun" || outfit === "goggles") return null;
      return (
        <g stroke="#222" strokeWidth={6} fill="rgba(255,255,255,0.15)">
          <circle cx={-34} cy={-352} r={24} />
          <circle cx={34} cy={-352} r={24} />
          <line x1={-10} y1={-352} x2={10} y2={-352} />
        </g>
      );
    case "scarf":
      if (outfit === "mayor") return null;
      return (
        <g>
          <rect x={-84} y={-280} width={168} height={30} rx={12} fill="#e04848" />
          <rect x={30} y={-256} width={30} height={70} rx={8} fill="#c93a3a" />
        </g>
      );
    case "bow":
      if (outfit === "ponytail" || outfit === "pigtails") return null;
      return (
        <g transform="translate(56 -440)">
          <path d="M 0 0 l -30 -20 l 0 40 Z M 0 0 l 30 -20 l 0 40 Z" fill="#ff5a8a" />
          <circle r={8} fill="#ff2f6d" />
        </g>
      );
    case "crown":
      return <path d="M -60 -440 L -60 -490 L -30 -462 L 0 -500 L 30 -462 L 60 -490 L 60 -440 Z" fill="#ffd23f" stroke="#c99a00" strokeWidth={5} strokeLinejoin="round" />;
    default:
      return null;
  }
}

export const BlockCharacterArt: React.FC<Props> = ({ character, mood, action, frame, look, facing, talking, time, seed }) => {
  const f = dress(character);
  // Extra accessory from the story (an episode can give someone glasses, a scarf, a crown...).
  const extra = character.accessory !== (townFolk(character.name)?.accessory ?? "none") ? character.accessory : "none";
  const m = motion(action, frame, facing, seed);
  const deep = look === "2.5d";
  const light = SKY[time].light;
  const blink = (frame + (seed % 70)) % 95 < 4;
  const swing = action === "walk" ? Math.sin(frame / 5) * 22 : 0;
  const armsUp = action === "jump" || mood === "excited";
  const armL = armsUp ? 150 : mood === "angry" ? 20 : 6 + swing * 0.6;
  const armR = armsUp ? -150 : mood === "angry" ? -20 : -6 - swing * 0.6;
  const holdsPhone = f.outfit === "ponytail";
  return (
    <g>
      <ellipse cx={m.x} cy={6} rx={120 * (1 + m.y / 400)} ry={22 * (1 + m.y / 400)} fill="#000" opacity={deep ? 0.26 : 0.16} />
      <g transform={`translate(${m.x} ${m.y}) rotate(${m.tilt * 0.6}) scale(${facing * (1 / Math.sqrt(m.squash))} ${m.squash})`}>
        {/* legs */}
        <g transform={`rotate(${swing} -28 -110)`}>
          <Box x={-56} y={-112} w={50} h={112} color={f.pants} deep={deep} light={light} />
          <rect x={-60} y={-18} width={58} height={20} rx={6} fill="#2a2a2a" />
        </g>
        <g transform={`rotate(${-swing} 28 -110)`}>
          <Box x={6} y={-112} w={50} h={112} color={f.pants} deep={deep} light={light} />
          <rect x={2} y={-18} width={58} height={20} rx={6} fill="#2a2a2a" />
        </g>
        {/* back arm */}
        <g transform={`rotate(${armR} 100 -248)`}>
          <Box x={80} y={-252} w={42} h={128} color={f.shirt} deep={deep} light={light} rx={10} />
          <rect x={82} y={-136} width={38} height={34} rx={10} fill={f.skin} />
          {holdsPhone && !armsUp && <rect x={84} y={-150} width={34} height={56} rx={6} fill="#1d1d2b" stroke="#555" strokeWidth={3} />}
        </g>
        {/* torso */}
        <Box x={-80} y={-262} w={160} h={156} color={f.shirt} deep={deep} light={light} rx={12} />
        <OutfitArt f={f} deep={deep} light={light} part="body" />
        {/* front arm */}
        <g transform={`rotate(${armL} -100 -248)`}>
          <Box x={-122} y={-252} w={42} h={128} color={shade(f.shirt, -0.06)} deep={false} light={light} rx={10} />
          <rect x={-120} y={-136} width={38} height={34} rx={10} fill={f.skin} />
        </g>
        {/* head */}
        <Box x={-84} y={-430} w={168} h={156} color={f.skin} deep={deep} light={light} rx={22} />
        {deep && <rect x={-70} y={-420} width={60} height={18} rx={9} fill="#fff" opacity={0.25} />}
        <Face mood={mood} talking={talking} frame={frame} blink={blink} />
        <OutfitArt f={f} deep={deep} light={light} part="head" />
        <Extra kind={extra} outfit={f.outfit} />
      </g>
    </g>
  );
};
