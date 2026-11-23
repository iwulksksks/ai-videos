// The ten backgrounds, all drawn in code. Each setting is split into three depth layers
// (far, mid, near) so the 2.5D camera can move them at different speeds.
import React from "react";
import type { Setting, TimeOfDay } from "../../lib/story";
import { SKY, seeded, shade, tod } from "./palette";

export type Layers = { far: React.ReactNode; mid: React.ReactNode; near: React.ReactNode };

const L = -400; // left bleed
const R = 1480; // right bleed
const W = R - L;

function Sky({ time, id }: { time: TimeOfDay; id: string }) {
  const s = SKY[time];
  const r = seeded(id.length * 97 + 3);
  return (
    <g>
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s.top} />
          <stop offset="1" stopColor={s.bottom} />
        </linearGradient>
        <radialGradient id={`sun-${id}`}>
          <stop offset="0" stopColor={time === "night" ? "#fffbe8" : "#fff8d0"} />
          <stop offset="0.5" stopColor={time === "night" ? "#e9ecff" : time === "sunset" ? "#ffb35c" : "#fff1a8"} stopOpacity="0.9" />
          <stop offset="1" stopColor={s.bottom} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={L} y={-400} width={W} height={2000} fill={`url(#sky-${id})`} />
      {time === "night" &&
        Array.from({ length: 70 }, (_, i) => (
          <circle key={i} cx={L + r() * W} cy={-300 + r() * 1300} r={1.5 + r() * 3} fill="#fff" opacity={0.4 + r() * 0.6} />
        ))}
      <circle cx={time === "sunset" ? 760 : 820} cy={time === "sunset" ? 980 : 330} r={time === "night" ? 170 : 260} fill={`url(#sun-${id})`} />
      <circle cx={time === "sunset" ? 760 : 820} cy={time === "sunset" ? 980 : 330} r={time === "night" ? 70 : 95} fill={time === "night" ? "#f4f1de" : time === "sunset" ? "#ffd27a" : "#fff6c2"} />
      {time !== "night" &&
        [0, 1, 2].map((i) => {
          const x = L + 200 + i * 560 + r() * 200;
          const y = 220 + r() * 380;
          const c = time === "sunset" ? "#ffd3b8" : "#ffffff";
          return (
            <g key={i} opacity={0.85}>
              <ellipse cx={x} cy={y} rx={150} ry={50} fill={c} />
              <ellipse cx={x + 70} cy={y - 35} rx={90} ry={55} fill={c} />
              <ellipse cx={x - 60} cy={y - 20} rx={70} ry={45} fill={c} />
            </g>
          );
        })}
    </g>
  );
}

function Hills({ time, y, color, amp = 80, seed = 1 }: { time: TimeOfDay; y: number; color: string; amp?: number; seed?: number }) {
  const r = seeded(seed);
  let d = `M ${L} ${y}`;
  for (let x = L; x <= R; x += 180) d += ` Q ${x + 90} ${y - amp * (0.4 + r())} ${x + 180} ${y}`;
  d += ` L ${R} 2400 L ${L} 2400 Z`;
  return <path d={d} fill={tod(color, time)} />;
}

function Tree({ x, y, s, time, dark = 0 }: { x: number; y: number; s: number; time: TimeOfDay; dark?: number }) {
  const leaf = tod(shade("#3fae5a", dark), time);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-18} y={-120} width={36} height={130} rx={10} fill={tod("#8a5a3b", time)} />
      <circle cx={0} cy={-190} r={110} fill={leaf} />
      <circle cx={-70} cy={-140} r={75} fill={leaf} />
      <circle cx={70} cy={-140} r={75} fill={leaf} />
      <circle cx={-30} cy={-230} r={50} fill={tod(shade("#3fae5a", dark + 0.18), time)} opacity={0.7} />
    </g>
  );
}

function Floor({ time, color, y = 1180, lines }: { time: TimeOfDay; color: string; y?: number; lines?: string }) {
  return (
    <g>
      <rect x={L} y={y} width={W} height={2400 - y} fill={tod(color, time)} />
      <rect x={L} y={y} width={W} height={14} fill={tod(shade(color, -0.2), time)} />
      {lines &&
        Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={540 + (i - 4) * 120} y1={y} x2={540 + (i - 4) * 520} y2={2300} stroke={tod(lines, time)} strokeWidth={6} opacity={0.35} />
        ))}
    </g>
  );
}

function Window({ x, y, w, h, time, id }: { x: number; y: number; w: number; h: number; time: TimeOfDay; id: string }) {
  const s = SKY[time];
  return (
    <g>
      <defs>
        <linearGradient id={`win-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s.top} />
          <stop offset="1" stopColor={s.bottom} />
        </linearGradient>
      </defs>
      <rect x={x - 14} y={y - 14} width={w + 28} height={h + 28} rx={18} fill={tod("#f4e1c1", time)} />
      <rect x={x} y={y} width={w} height={h} rx={10} fill={`url(#win-${id})`} />
      {time === "night" && <circle cx={x + w * 0.7} cy={y + h * 0.3} r={26} fill="#f4f1de" />}
      {time !== "night" && <circle cx={x + w * 0.7} cy={y + h * 0.35} r={34} fill="#fff3b0" opacity={0.9} />}
      <rect x={x + w / 2 - 6} y={y} width={12} height={h} fill={tod("#f4e1c1", time)} />
      <rect x={x} y={y + h / 2 - 6} width={w} height={12} fill={tod("#f4e1c1", time)} />
    </g>
  );
}

function Bush({ x, y, s, color, time }: { x: number; y: number; s: number; color: string; time: TimeOfDay }) {
  const c = tod(color, time);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={-80} cy={0} r={110} fill={c} />
      <circle cx={60} cy={-30} r={140} fill={shade(c, 0.08)} />
      <circle cx={190} cy={10} r={100} fill={c} />
    </g>
  );
}

function Column({ x, y, h, color, time, w = 110 }: { x: number; y: number; h: number; color: string; time: TimeOfDay; w?: number }) {
  return (
    <g>
      <rect x={x - w / 2 - 20} y={y - 30} width={w + 40} height={40} rx={8} fill={tod(shade(color, -0.1), time)} />
      <rect x={x - w / 2} y={y} width={w} height={h} fill={tod(color, time)} />
      {[0.2, 0.5, 0.8].map((f) => (
        <rect key={f} x={x - w / 2 + w * f - 5} y={y} width={10} height={h} fill={tod(shade(color, -0.12), time)} />
      ))}
      <rect x={x - w / 2 - 20} y={y + h} width={w + 40} height={40} rx={8} fill={tod(shade(color, -0.1), time)} />
    </g>
  );
}

function Crowd({ y, rows, seed, time, size = 34 }: { y: number; rows: number; seed: number; time: TimeOfDay; size?: number }) {
  const r = seeded(seed);
  const cols = ["#ff8fc7", "#4f9dff", "#ffd23f", "#5ccf6b", "#ff9a3c", "#a77bff", "#ff5a5a", "#2ec4b6"];
  const out: React.ReactNode[] = [];
  for (let row = 0; row < rows; row++) {
    for (let x = L + (row % 2) * size; x < R; x += size * 2.1) {
      const c = tod(cols[Math.floor(r() * cols.length)], time);
      out.push(<circle key={`${row}-${x}`} cx={x + r() * 10} cy={y + row * size * 1.7 + r() * 8} r={size * (0.8 + r() * 0.3)} fill={c} />);
    }
  }
  return <g>{out}</g>;
}

function Banner({ x, y, color, time }: { x: number; y: number; color: string; time: TimeOfDay }) {
  return (
    <g>
      <path d={`M ${x} ${y} h 120 v 260 l -60 -50 l -60 50 Z`} fill={tod(color, time)} />
      <circle cx={x + 60} cy={y + 90} r={30} fill={tod("#ffd23f", time)} />
    </g>
  );
}


// ---------- Brickbury (Town Gossip): chunky toy-block buildings ----------

function BlockHouse({ x, y, w, h, wall, roof, time, seed }: { x: number; y: number; w: number; h: number; wall: string; roof: string; time: TimeOfDay; seed: number }) {
  const r = seeded(seed);
  const d = 40;
  const lit = time === "night";
  const win = (wx: number, wy: number) => (
    <g key={`${wx}-${wy}`}>
      <rect x={wx - 6} y={wy - 6} width={62} height={72} fill={tod("#fdf6e8", time)} />
      <rect x={wx} y={wy} width={50} height={60} fill={lit ? (r() > 0.35 ? "#ffd56a" : "#2c3560") : tod("#9fd3ff", time)} />
      <rect x={wx + 22} y={wy} width={6} height={60} fill={tod("#fdf6e8", time)} />
    </g>
  );
  const cols = Math.max(1, Math.floor((w - 40) / 90));
  const rows = Math.max(1, Math.floor((h - 150) / 110));
  return (
    <g>
      {/* side wall */}
      <path d={`M ${x + w} ${y - h} l ${d} ${-d * 0.6} l 0 ${h} l ${-d} ${d * 0.6} Z`} fill={tod(shade(wall, -0.3), time)} />
      {/* front wall */}
      <rect x={x} y={y - h} width={w} height={h} fill={tod(wall, time)} />
      {/* roof: a box with a lit top */}
      <path d={`M ${x - 20} ${y - h} L ${x + w / 2} ${y - h - w * 0.36} L ${x + w + 20} ${y - h} Z`} fill={tod(roof, time)} />
      <path d={`M ${x + w / 2} ${y - h - w * 0.36} l ${d} ${-d * 0.6} L ${x + w + 20 + d} ${y - h - d * 0.6} L ${x + w + 20} ${y - h} Z`} fill={tod(shade(roof, -0.25), time)} />
      {Array.from({ length: rows }, (_, j) => Array.from({ length: cols }, (_, i) => win(x + 30 + i * ((w - 60) / cols) + ((w - 60) / cols - 50) / 2, y - h + 40 + j * 110)))}
      {/* door */}
      <rect x={x + w / 2 - 34} y={y - 120} width={68} height={120} fill={tod(shade(roof, -0.2), time)} />
      <circle cx={x + w / 2 + 20} cy={y - 60} r={6} fill="#ffd23f" />
    </g>
  );
}

function Bunting({ y, sag, time, from = L, to = R }: { y: number; sag: number; time: TimeOfDay; from?: number; to?: number }) {
  const n = Math.floor((to - from) / 70);
  const cols = ["#ff5a5a", "#ffd23f", "#4f9dff", "#5ccf6b", "#a77bff", "#ff9a3c"];
  return (
    <g>
      <path d={`M ${from} ${y} Q ${(from + to) / 2} ${y + sag * 2} ${to} ${y}`} stroke="#444" strokeWidth={4} fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n;
        const px = from + (to - from) * t;
        const py = y + sag * 4 * t * (1 - t) * 1;
        return <rect key={i} x={px - 18} y={py} width={36} height={40} fill={tod(cols[i % cols.length], time)} />;
      })}
    </g>
  );
}

function LampPost({ x, y, time, h = 520 }: { x: number; y: number; time: TimeOfDay; h?: number }) {
  return (
    <g>
      <rect x={x - 12} y={y - h} width={24} height={h} fill={tod("#3b3f4c", time)} />
      <rect x={x - 34} y={y - h - 40} width={68} height={48} rx={8} fill={time === "night" ? "#ffe9a0" : tod("#f4f4f4", time)} stroke={tod("#3b3f4c", time)} strokeWidth={8} />
      {time === "night" && <circle cx={x} cy={y - h - 16} r={120} fill="#ffe9a0" opacity={0.18} />}
    </g>
  );
}

function BlockTree({ x, y, s, time }: { x: number; y: number; s: number; time: TimeOfDay }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-16} y={-110} width={32} height={110} fill={tod("#7a5236", time)} />
      <rect x={-80} y={-260} width={160} height={160} rx={12} fill={tod("#3fae5a", time)} />
      <path d="M 80 -260 l 30 -18 l 0 160 l -30 18 Z" fill={tod("#2d8a45", time)} />
      <path d="M -80 -260 l 30 -18 l 160 0 l -30 18 Z" fill={tod("#64c878", time)} />
    </g>
  );
}

const TOWN_HOUSES = [
  { wall: "#f2b8c6", roof: "#8a3b55" },
  { wall: "#9ec9f2", roof: "#2f4f8a" },
  { wall: "#fbe08a", roof: "#a0522d" },
  { wall: "#b8e6b0", roof: "#3f7a46" },
  { wall: "#f5c99b", roof: "#7a4a2a" },
  { wall: "#d6c4f2", roof: "#5a3f8a" },
];

export function sceneLayers(setting: Setting, time: TimeOfDay, id: string): Layers {
  switch (setting) {
    case "forest":
      return {
        far: (
          <g>
            <Sky time={time} id={id} />
            <Hills time={time} y={1050} color="#8fcf8a" amp={120} seed={3} />
            {[-250, -20, 220, 470, 720, 980, 1250].map((x, i) => (
              <Tree key={x} x={x} y={1120} s={0.55 + (i % 3) * 0.08} time={time} dark={-0.25} />
            ))}
          </g>
        ),
        mid: (
          <g>
            <Floor time={time} color="#6cc56a" />
            <Tree x={-120} y={1260} s={1.3} time={time} />
            <Tree x={1210} y={1240} s={1.2} time={time} dark={-0.08} />
            <path d={`M 400 1180 Q 540 1500 380 2000 L 760 2000 Q 620 1500 680 1180 Z`} fill={tod("#d9b98a", time)} opacity={0.8} />
          </g>
        ),
        near: (
          <g>
            <Bush x={-120} y={1900} s={1.4} color="#2f8f47" time={time} />
            <Bush x={1050} y={1950} s={1.3} color="#2f8f47" time={time} />
          </g>
        ),
      };
    case "city": {
      const r = seeded(11);
      const buildings = Array.from({ length: 12 }, (_, i) => ({ x: L + i * 160, h: 380 + r() * 520, c: ["#7b8fb8", "#9aa7c7", "#6d7aa6", "#b0a3c9"][i % 4] }));
      return {
        far: (
          <g>
            <Sky time={time} id={id} />
            {buildings.map((b, i) => (
              <g key={i}>
                <rect x={b.x} y={1180 - b.h} width={150} height={b.h} fill={tod(b.c, time)} />
                {Array.from({ length: Math.floor(b.h / 70) }, (_, j) =>
                  [0, 1, 2].map((k) => (
                    <rect
                      key={`${j}-${k}`}
                      x={b.x + 18 + k * 44}
                      y={1180 - b.h + 30 + j * 70}
                      width={26}
                      height={36}
                      rx={4}
                      fill={time === "night" ? (r() > 0.4 ? "#ffe38a" : "#3a4470") : tod("#dff1ff", time)}
                      opacity={0.9}
                    />
                  )),
                )}
              </g>
            ))}
          </g>
        ),
        mid: (
          <g>
            <Floor time={time} color="#9aa0ad" />
            <rect x={L} y={1380} width={W} height={1000} fill={tod("#555b6b", time)} />
            {Array.from({ length: 10 }, (_, i) => (
              <rect key={i} x={L + i * 200} y={1640} width={110} height={18} rx={9} fill={tod("#f2e6a0", time)} />
            ))}
          </g>
        ),
        near: (
          <g>
            <rect x={-40} y={600} width={40} height={1500} fill={tod("#3b3f4c", time)} />
            <rect x={-40} y={590} width={180} height={28} rx={14} fill={tod("#3b3f4c", time)} />
            <circle cx={130} cy={640} r={34} fill={time === "night" ? "#fff2a8" : "#e8e8e8"} opacity={0.95} />
          </g>
        ),
      };
    }
    case "bedroom":
      return {
        far: (
          <g>
            <rect x={L} y={-400} width={W} height={2000} fill={tod("#b8a4e3", time)} />
            {Array.from({ length: 14 }, (_, i) => (
              <rect key={i} x={L + i * 140} y={-400} width={60} height={1600} fill={tod("#c6b5ec", time)} opacity={0.5} />
            ))}
            <Window x={590} y={420} w={340} h={420} time={time} id={id} />
            <rect x={130} y={470} width={220} height={290} rx={12} fill={tod("#ffd23f", time)} />
            <path d="M 180 700 L 240 560 L 300 700 Z" fill={tod("#ff5a5a", time)} />
          </g>
        ),
        mid: (
          <g>
            <Floor time={time} color="#c98f5e" lines="#a66f43" />
            <rect x={-260} y={1060} width={520} height={260} rx={40} fill={tod("#ff8fc7", time)} />
            <rect x={-260} y={1020} width={240} height={110} rx={40} fill={tod("#ffffff", time)} />
            <rect x={-280} y={980} width={40} height={360} rx={12} fill={tod("#8a5a3b", time)} />
            <ellipse cx={540} cy={1700} rx={420} ry={120} fill={tod("#7fd1c7", time)} opacity={0.6} />
          </g>
        ),
        near: (
          <g>
            <rect x={960} y={1460} width={200} height={500} rx={20} fill={tod("#8a5a3b", time)} />
            <circle cx={1060} cy={1400} r={120} fill={tod("#3fae5a", time)} />
            <circle cx={980} cy={1330} r={80} fill={tod("#5ccf6b", time)} />
          </g>
        ),
      };
    case "space": {
      const r = seeded(23);
      return {
        far: (
          <g>
            <rect x={L} y={-400} width={W} height={2400} fill={time === "day" ? "#1b1550" : time === "sunset" ? "#2a1043" : "#05051a"} />
            {Array.from({ length: 140 }, (_, i) => (
              <circle key={i} cx={L + r() * W} cy={-300 + r() * 1500} r={1 + r() * 3.5} fill="#fff" opacity={0.3 + r() * 0.7} />
            ))}
            <circle cx={830} cy={420} r={190} fill="#ff9a3c" />
            <ellipse cx={830} cy={420} rx={330} ry={60} fill="none" stroke="#ffd6a3" strokeWidth={18} opacity={0.8} transform="rotate(-18 830 420)" />
            <circle cx={150} cy={700} r={60} fill="#7ad6ff" opacity={0.85} />
          </g>
        ),
        mid: (
          <g>
            <path d={`M ${L} 1200 Q 540 1080 ${R} 1200 L ${R} 2400 L ${L} 2400 Z`} fill="#b9bccb" />
            {[
              [200, 1400, 90],
              [800, 1320, 60],
              [520, 1800, 130],
              [1050, 1650, 70],
            ].map(([x, y, s]) => (
              <ellipse key={x} cx={x} cy={y} rx={s} ry={s * 0.35} fill="#8f93a6" />
            ))}
          </g>
        ),
        near: (
          <g>
            <circle cx={-40} cy={1880} r={170} fill="#6d7187" />
            <circle cx={1120} cy={260} r={80} fill="#6d7187" opacity={0.9} />
          </g>
        ),
      };
    }
    case "beach":
      return {
        far: (
          <g>
            <Sky time={time} id={id} />
            <rect x={L} y={1000} width={W} height={260} fill={tod("#2fa7d8", time)} />
            {Array.from({ length: 8 }, (_, i) => (
              <path key={i} d={`M ${L + i * 260} 1080 q 60 -24 120 0`} stroke={tod("#bfeaff", time)} strokeWidth={8} fill="none" />
            ))}
          </g>
        ),
        mid: (
          <g>
            <path d={`M ${L} 1220 Q 540 1150 ${R} 1230 L ${R} 2400 L ${L} 2400 Z`} fill={tod("#f3d79a", time)} />
            <path d={`M ${L} 1220 Q 540 1150 ${R} 1230`} stroke={tod("#ffffff", time)} strokeWidth={14} fill="none" opacity={0.7} />
            <circle cx={900} cy={1480} r={44} fill={tod("#ff5a5a", time)} />
            <path d="M 862 1480 a 38 38 0 0 1 76 0" fill={tod("#ffffff", time)} />
          </g>
        ),
        near: (
          <g>
            <path d="M -60 2000 Q -20 1300 60 900" stroke={tod("#9a6b45", time)} strokeWidth={60} fill="none" />
            {[-40, 10, 60, 110].map((a) => (
              <ellipse key={a} cx={60} cy={900} rx={260} ry={50} fill={tod("#3fae5a", time)} transform={`rotate(${a} 60 900) translate(200 0)`} />
            ))}
          </g>
        ),
      };
    case "castle":
      return {
        far: (
          <g>
            <Sky time={time} id={id} />
            <Hills time={time} y={1100} color="#7fbf7a" amp={140} seed={9} />
            <g transform="translate(540 1050)">
              <rect x={-260} y={-420} width={520} height={420} fill={tod("#a9a3b8", time)} />
              {[-260, 180].map((x) => (
                <g key={x}>
                  <rect x={x} y={-600} width={80} height={600} fill={tod("#9893aa", time)} />
                  <path d={`M ${x - 20} -600 L ${x + 40} -720 L ${x + 100} -600 Z`} fill={tod("#6f5bd1", time)} />
                </g>
              ))}
              <path d="M -70 0 L -70 -150 A 70 70 0 0 1 70 -150 L 70 0 Z" fill={tod("#4a3b2f", time)} />
              {[-180, -60, 60, 160].map((x) => (
                <rect key={x} x={x} y={-340} width={36} height={60} rx={18} fill={time === "night" ? "#ffe38a" : tod("#5b5670", time)} />
              ))}
            </g>
          </g>
        ),
        mid: (
          <g>
            <Floor time={time} color="#8fbf6a" />
            <path d={`M 360 1180 L 720 1180 L 1100 2400 L -20 2400 Z`} fill={tod("#c2b8a3", time)} />
            {Array.from({ length: 6 }, (_, i) => (
              <line key={i} x1={360 - i * 60} y1={1250 + i * 160} x2={720 + i * 60} y2={1250 + i * 160} stroke={tod("#a39882", time)} strokeWidth={6} />
            ))}
          </g>
        ),
        near: (
          <g>
            <Banner x={-40} y={300} color="#6f5bd1" time={time} />
            <Bush x={1020} y={1960} s={1.2} color="#3e9f50" time={time} />
          </g>
        ),
      };
    case "cafe":
      return {
        far: (
          <g>
            <rect x={L} y={-400} width={W} height={2000} fill={tod("#f2c9a0", time)} />
            <rect x={L} y={880} width={W} height={300} fill={tod("#d99b6c", time)} />
            <Window x={80} y={380} w={380} h={420} time={time} id={id} />
            <rect x={600} y={380} width={400} height={300} rx={16} fill={tod("#3b3a3a", time)} />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={640} y={420 + i * 60} width={200 + (i % 2) * 90} height={18} rx={9} fill="#f3f3f3" opacity={0.85} />
            ))}
            {[200, 540, 880].map((x) => (
              <g key={x}>
                <line x1={x} y1={-400} x2={x} y2={220} stroke="#333" strokeWidth={4} />
                <path d={`M ${x - 50} 260 Q ${x} 180 ${x + 50} 260 Z`} fill={tod("#ffb35c", time)} />
                <circle cx={x} cy={262} r={16} fill="#fff6c2" />
              </g>
            ))}
          </g>
        ),
        mid: (
          <g>
            <Floor time={time} color="#9c6b4a" lines="#7a5236" />
            <rect x={L} y={1100} width={W} height={120} fill={tod("#7a4b2e", time)} />
            <rect x={L} y={1080} width={W} height={40} rx={10} fill={tod("#a8714a", time)} />
          </g>
        ),
        near: (
          <g>
            <rect x={820} y={1700} width={460} height={60} rx={20} fill={tod("#7a4b2e", time)} />
            <path d="M 940 1700 l 20 -150 h 130 l 20 150 Z" fill={tod("#ffffff", time)} />
            <path d="M 1110 1600 a 40 40 0 0 1 0 70" stroke={tod("#ffffff", time)} strokeWidth={16} fill="none" />
            <path d="M 990 1520 q 20 -40 0 -80 M 1040 1520 q 20 -40 0 -80" stroke="#fff" strokeWidth={8} fill="none" opacity={0.6} />
          </g>
        ),
      };
    case "classroom":
      return {
        far: (
          <g>
            <rect x={L} y={-400} width={W} height={2000} fill={tod("#f6e7b4", time)} />
            <rect x={120} y={360} width={840} height={460} rx={20} fill={tod("#a8714a", time)} />
            <rect x={150} y={390} width={780} height={400} rx={12} fill={tod("#2f5d50", time)} />
            <text x={540} y={560} textAnchor="middle" fontSize={64} fill="#f2f2f2" opacity={0.85} fontFamily="sans-serif">
              ABC  1 + 2 = 3
            </text>
            <path d="M 260 700 q 120 -60 240 0 t 240 0" stroke="#f2f2f2" strokeWidth={6} fill="none" opacity={0.7} />
            <Window x={-300} y={420} w={300} h={380} time={time} id={id} />
            <circle cx={1180} cy={400} r={80} fill="#fff" stroke={tod("#555", time)} strokeWidth={12} />
          </g>
        ),
        mid: (
          <g>
            <Floor time={time} color="#c8a27a" lines="#a8845e" />
            {[-160, 260, 680, 1100].map((x) => (
              <g key={x}>
                <rect x={x} y={1240} width={260} height={30} rx={8} fill={tod("#d9a066", time)} />
                <rect x={x + 20} y={1270} width={16} height={110} fill={tod("#666", time)} />
                <rect x={x + 224} y={1270} width={16} height={110} fill={tod("#666", time)} />
              </g>
            ))}
          </g>
        ),
        near: (
          <g>
            <rect x={-200} y={1760} width={700} height={50} rx={14} fill={tod("#d9a066", time)} />
            <rect x={60} y={1680} width={160} height={80} rx={10} fill={tod("#ff5a5a", time)} />
            <rect x={240} y={1700} width={140} height={60} rx={10} fill={tod("#4f9dff", time)} />
          </g>
        ),
      };
    case "palace":
      return {
        far: (
          <g>
            <rect x={L} y={-400} width={W} height={2000} fill={tod("#f3e2c0", time)} />
            <path d="M 240 1180 L 240 520 A 300 300 0 0 1 840 520 L 840 1180 Z" fill={tod("#d7b97c", time)} />
            <path d="M 300 1180 L 300 540 A 240 240 0 0 1 780 540 L 780 1180 Z" fill={SKY[time].top} />
            <path d="M 300 1180 L 300 540 A 240 240 0 0 1 780 540 L 780 1180 Z" fill={SKY[time].bottom} opacity={0.6} />
            {time === "night" && <circle cx={540} cy={600} r={60} fill="#f4f1de" />}
            <circle cx={540} cy={480} r={70} fill={tod("#ffd23f", time)} />
            <path d="M 500 480 l 40 -60 l 40 60 l -40 30 Z" fill={tod("#ff5a5a", time)} />
            {[-260, 20, 1060, 1340].map((x) => (
              <Column key={x} x={x} y={280} h={880} color="#efe0c2" time={time} />
            ))}
            {[120, 960].map((x) => (
              <g key={x}>
                <line x1={x} y1={-400} x2={x} y2={120} stroke={tod("#b8932f", time)} strokeWidth={6} />
                <circle cx={x} cy={150} r={60} fill={tod("#ffd23f", time)} opacity={0.9} />
                <circle cx={x} cy={150} r={110} fill="#fff3b0" opacity={0.25} />
              </g>
            ))}
          </g>
        ),
        mid: (
          <g>
            <Floor time={time} color="#e3cfa6" lines="#c9b285" />
            <path d={`M 400 1180 L 680 1180 L 900 2400 L 180 2400 Z`} fill={tod("#c8323c", time)} />
            <path d={`M 400 1180 L 420 1180 L 220 2400 L 180 2400 Z M 660 1180 L 680 1180 L 900 2400 L 860 2400 Z`} fill={tod("#ffd23f", time)} />
          </g>
        ),
        near: (
          <g>
            <path d="M -200 -200 Q 80 600 -40 2200 L -200 2200 Z" fill={tod("#9c2430", time)} />
            <path d="M 1280 -200 Q 1000 600 1120 2200 L 1280 2200 Z" fill={tod("#9c2430", time)} />
          </g>
        ),
      };
    case "arena":
      return {
        far: (
          <g>
            <Sky time={time} id={id} />
            <rect x={L} y={560} width={W} height={640} fill={tod("#8a7a6a", time)} />
            <Crowd y={620} rows={6} seed={5} time={time} size={26} />
            <rect x={L} y={1080} width={W} height={100} fill={tod("#6b5d50", time)} />
            {[-80, 380, 840].map((x, i) => (
              <Banner key={x} x={x} y={1060} color={["#ff5a5a", "#4f9dff", "#ffd23f"][i]} time={time} />
            ))}
            {time === "night" &&
              [-100, 1180].map((x) => (
                <g key={x}>
                  <rect x={x - 10} y={160} width={20} height={420} fill="#444" />
                  <rect x={x - 70} y={120} width={140} height={60} rx={10} fill="#fffbe0" />
                  <path d={`M ${x - 60} 180 L ${x < 540 ? x + 700 : x - 700} 1400 L ${x < 540 ? x + 300 : x - 300} 1400 Z`} fill="#fffbe0" opacity={0.12} />
                </g>
              ))}
          </g>
        ),
        mid: (
          <g>
            <Floor time={time} color="#e4c48f" />
            <ellipse cx={540} cy={1600} rx={620} ry={240} fill="none" stroke={tod("#ffffff", time)} strokeWidth={12} opacity={0.6} />
            <circle cx={540} cy={1600} r={60} fill="none" stroke={tod("#ffffff", time)} strokeWidth={10} opacity={0.6} />
          </g>
        ),
        near: (
          <g>
            <Crowd y={2020} rows={2} seed={8} time={time} size={70} />
          </g>
        ),
      };
    case "workshop":
      return {
        far: (
          <g>
            <rect x={L} y={-400} width={W} height={2000} fill={tod("#8a6a4f", time)} />
            {Array.from({ length: 12 }, (_, i) => (
              <rect key={i} x={L + i * 160} y={-400} width={8} height={1600} fill={tod("#6f533c", time)} />
            ))}
            <Window x={620} y={360} w={320} h={380} time={time} id={id} />
            <rect x={60} y={300} width={420} height={460} rx={10} fill={tod("#5b4330", time)} />
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <line x1={110 + i * 100} y1={330} x2={110 + i * 100} y2={420} stroke={tod("#c9c9c9", time)} strokeWidth={6} />
                <rect x={95 + i * 100} y={420} width={30} height={70} rx={6} fill={tod(["#c8323c", "#4f9dff", "#ffd23f", "#5ccf6b"][i], time)} />
              </g>
            ))}
            <circle cx={270} cy={640} r={80} fill="none" stroke={tod("#b8932f", time)} strokeWidth={22} strokeDasharray="20 14" />
          </g>
        ),
        mid: (
          <g>
            <Floor time={time} color="#9c7650" lines="#7a5a3a" />
            <rect x={-300} y={1150} width={640} height={60} rx={10} fill={tod("#a8714a", time)} />
            <rect x={-280} y={1210} width={30} height={200} fill={tod("#6f533c", time)} />
            <rect x={300} y={1210} width={30} height={200} fill={tod("#6f533c", time)} />
            <circle cx={40} cy={1110} r={50} fill="none" stroke={tod("#888", time)} strokeWidth={16} strokeDasharray="14 10" />
          </g>
        ),
        near: (
          <g>
            <rect x={900} y={1650} width={400} height={400} rx={10} fill={tod("#6f533c", time)} />
            <rect x={940} y={1600} width={100} height={60} rx={8} fill={tod("#c8323c", time)} />
          </g>
        ),
      };
    case "harbor":
      return {
        far: (
          <g>
            <Sky time={time} id={id} />
            <rect x={L} y={980} width={W} height={300} fill={tod("#2b7fb8", time)} />
            <g transform="translate(700 980)">
              <path d="M -200 0 L 200 0 L 150 70 L -150 70 Z" fill={tod("#7a4b2e", time)} />
              <rect x={-8} y={-360} width={16} height={360} fill={tod("#5b4330", time)} />
              <path d="M 8 -340 L 170 -60 L 8 -60 Z" fill={tod("#f3ead7", time)} />
              <path d="M -8 -300 L -150 -60 L -8 -60 Z" fill={tod("#e8dcc2", time)} />
            </g>
            <rect x={60} y={760} width={70} height={240} fill={tod("#f3ead7", time)} />
            <rect x={50} y={720} width={90} height={50} fill={tod("#c8323c", time)} />
            {time === "night" && <path d="M 95 740 L -300 600 L -300 880 Z" fill="#fff6c2" opacity={0.25} />}
          </g>
        ),
        mid: (
          <g>
            <rect x={L} y={1180} width={W} height={1300} fill={tod("#a8845e", time)} />
            {Array.from({ length: 14 }, (_, i) => (
              <rect key={i} x={L + i * 140} y={1180} width={8} height={1300} fill={tod("#8a6a48", time)} />
            ))}
            <rect x={L} y={1180} width={W} height={20} fill={tod("#6f533c", time)} />
          </g>
        ),
        near: (
          <g>
            <rect x={950} y={1300} width={60} height={800} fill={tod("#6f533c", time)} />
            <path d="M 960 1350 q -120 200 30 400" stroke={tod("#d9c39a", time)} strokeWidth={22} fill="none" />
            <ellipse cx={980} cy={1290} rx={50} ry={16} fill={tod("#5b4330", time)} />
          </g>
        ),
      };
    case "canyon":
      return {
        far: (
          <g>
            <Sky time={time} id={id} />
            <path d={`M ${L} 1180 L ${L} 520 L 80 600 L 160 450 L 300 560 L 330 1180 Z`} fill={tod("#c2703d", time)} />
            <path d={`M ${R} 1180 L ${R} 480 L 960 560 L 860 420 L 760 600 L 720 1180 Z`} fill={tod("#b5622f", time)} />
            {[700, 820, 940].map((y) => (
              <line key={y} x1={L} y1={y} x2={330} y2={y + 30} stroke={tod("#a35a2c", time)} strokeWidth={10} opacity={0.6} />
            ))}
          </g>
        ),
        mid: (
          <g>
            <Floor time={time} color="#d99a5b" />
            {[0, 1].map((k) => (
              <line key={k} x1={470 + k * 140} y1={1180} x2={180 + k * 720} y2={2300} stroke={tod("#5b5670", time)} strokeWidth={18} />
            ))}
            {Array.from({ length: 9 }, (_, i) => {
              const y = 1200 + i * i * 14 + i * 40;
              const half = 70 + i * 40;
              return <rect key={i} x={540 - half - 20} y={y} width={half * 2 + 40} height={14 + i * 2} rx={4} fill={tod("#7a4b2e", time)} />;
            })}
          </g>
        ),
        near: (
          <g>
            <path d="M -200 2100 L -200 1500 Q -60 1420 60 1560 L 120 2100 Z" fill={tod("#a35a2c", time)} />
            <path d="M 1000 1900 l 20 -140 l 30 0 l 20 140 Z M 980 1820 h 110" stroke={tod("#3e8f50", time)} strokeWidth={26} strokeLinecap="round" />
          </g>
        ),
      };
    case "prison":
      return {
        far: (
          <g>
            <rect x={L} y={-400} width={W} height={2000} fill={tod("#8f8a85", time)} />
            {Array.from({ length: 30 }, (_, i) => (
              <rect key={i} x={L + (i % 6) * 320 + (Math.floor(i / 6) % 2) * 160} y={-100 + Math.floor(i / 6) * 260} width={300} height={240} rx={10} fill={tod("#9d9893", time)} stroke={tod("#7a7570", time)} strokeWidth={6} />
            ))}
            <rect x={680} y={380} width={240} height={200} rx={10} fill={SKY[time].top} />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={700 + i * 60} y={380} width={14} height={200} fill={tod("#444", time)} />
            ))}
          </g>
        ),
        mid: (
          <g>
            <Floor time={time} color="#7d7873" />
            <rect x={-300} y={1080} width={520} height={120} rx={10} fill={tod("#6b5d50", time)} />
            <rect x={-300} y={1060} width={520} height={30} rx={10} fill={tod("#c9c0b0", time)} />
          </g>
        ),
        near: (
          <g>
            {Array.from({ length: 4 }, (_, i) => (
              <rect key={i} x={-120 + i * 70} y={-200} width={26} height={2400} fill={tod("#3b3f4c", time)} />
            ))}
            <rect x={-150} y={600} width={340} height={24} fill={tod("#3b3f4c", time)} />
          </g>
        ),
      };
    case "mine":
      return {
        far: (
          <g>
            <rect x={L} y={-400} width={W} height={2000} fill={tod("#4a3b33", time === "day" ? "sunset" : time)} />
            <path d={`M ${L} -400 L ${R} -400 L ${R} 300 Q 540 140 ${L} 300 Z`} fill="#2b221e" />
            <path d="M 300 1180 L 300 560 Q 540 380 780 560 L 780 1180 Z" fill="#1a1412" />
            {[300, 780].map((x) => (
              <rect key={x} x={x - 30} y={540} width={60} height={640} fill={tod("#8a5a3b", time)} />
            ))}
            <rect x={240} y={520} width={600} height={50} fill={tod("#8a5a3b", time)} />
            {[200, 880].map((x) => (
              <g key={x}>
                <circle cx={x} cy={500} r={22} fill="#ffcf6b" />
                <circle cx={x} cy={500} r={70} fill="#ffcf6b" opacity={0.2} />
              </g>
            ))}
          </g>
        ),
        mid: (
          <g>
            <Floor time={time} color="#5e4a3e" />
            {[0, 1].map((k) => (
              <line key={k} x1={500 + k * 80} y1={1180} x2={300 + k * 480} y2={2300} stroke="#9aa0ad" strokeWidth={14} />
            ))}
            <path d="M 760 1120 h 220 l -30 120 h -160 Z" fill={tod("#6d7187", time)} />
            {[790, 940].map((x) => (
              <circle key={x} cx={x} cy={1250} r={24} fill="#333" />
            ))}
            <circle cx={820} cy={1110} r={34} fill={tod("#3b3f4c", time)} />
            <circle cx={880} cy={1100} r={40} fill={tod("#ffd23f", time)} />
          </g>
        ),
        near: (
          <g>
            <path d="M -300 2200 L -300 1400 Q -100 1300 80 1500 L 160 2200 Z" fill="#2b221e" />
            <path d="M 1380 -300 L 1380 900 Q 1100 700 1050 -300 Z" fill="#2b221e" />
          </g>
        ),
      };
    case "market":
      return {
        far: (
          <g>
            <Sky time={time} id={id} />
            {[-260, 100, 460, 820, 1180].map((x, i) => (
              <g key={x}>
                <rect x={x} y={500 + (i % 2) * 60} width={320} height={680} fill={tod(["#e8c79a", "#d9a066", "#f0d9b5"][i % 3], time)} />
                <rect x={x + 120} y={640 + (i % 2) * 60} width={80} height={110} rx={40} fill={tod("#5b4330", time)} />
              </g>
            ))}
            <path d={`M ${L} 420 Q 540 560 ${R} 420`} stroke="#555" strokeWidth={4} fill="none" />
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} d={`M ${L + 80 + i * 150} ${470 + Math.sin(i) * 20} l 30 50 l 30 -50 Z`} fill={["#ff5a5a", "#ffd23f", "#4f9dff", "#5ccf6b"][i % 4]} />
            ))}
          </g>
        ),
        mid: (
          <g>
            <Floor time={time} color="#c8b08a" />
            {[-200, 860].map((x) => (
              <g key={x}>
                <rect x={x} y={1000} width={340} height={200} fill={tod("#a8714a", time)} />
                <path d={`M ${x - 30} 1000 L ${x + 370} 1000 L ${x + 330} 900 L ${x + 10} 900 Z`} fill={tod("#c8323c", time)} />
                {[0, 1, 2, 3].map((i) => (
                  <circle key={i} cx={x + 60 + i * 70} cy={990} r={26} fill={tod(["#ff9a3c", "#5ccf6b", "#ff5a5a", "#ffd23f"][i], time)} />
                ))}
              </g>
            ))}
          </g>
        ),
        near: (
          <g>
            <rect x={-160} y={1650} width={360} height={260} rx={20} fill={tod("#9a6b45", time)} />
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={-60 + i * 90} cy={1640} r={46} fill={tod(["#ff5a5a", "#ffd23f", "#ff9a3c"][i], time)} />
            ))}
          </g>
        ),
      };
    case "town":
      return {
        far: (
          <g>
            <Sky time={time} id={id} />
            <Hills time={time} y={900} color="#8fcf8a" amp={90} seed={5} />
            {[-380, -60, 260, 580, 900, 1220].map((x, i) => (
              <BlockHouse key={x} x={x} y={1150} w={260} h={300 + (i % 3) * 70} wall={TOWN_HOUSES[i].wall} roof={TOWN_HOUSES[i].roof} time={time} seed={i + 3} />
            ))}
            <Bunting y={560} sag={40} time={time} />
          </g>
        ),
        mid: (
          <g>
            <Floor time={time} color="#c9c4bb" />
            <rect x={L} y={1330} width={W} height={1100} fill={tod("#4a4d57", time)} />
            {Array.from({ length: 10 }, (_, i) => (
              <rect key={i} x={L + i * 210} y={1560} width={120} height={20} fill={tod("#f2d14a", time)} />
            ))}
            <BlockTree x={-150} y={1250} s={1} time={time} />
            <BlockTree x={1180} y={1240} s={0.95} time={time} />
          </g>
        ),
        near: (
          <g>
            <LampPost x={-20} y={2000} time={time} h={1100} />
            <g transform="translate(980 1960)">
              <path d="M -50 0 L -20 -110 L 20 -110 L 50 0 Z" fill="#ff8a2a" />
              <rect x={-40} y={-70} width={80} height={16} fill="#fff" />
            </g>
          </g>
        ),
      };
    case "plaza":
      return {
        far: (
          <g>
            <Sky time={time} id={id} />
            <Hills time={time} y={880} color="#86c47f" amp={70} seed={9} />
            <BlockHouse x={-340} y={1140} w={300} h={380} wall={TOWN_HOUSES[4].wall} roof={TOWN_HOUSES[4].roof} time={time} seed={21} />
            {/* town hall with a clock tower */}
            <g>
              <BlockHouse x={250} y={1140} w={580} h={420} wall="#efe6d6" roof="#b33b3b" time={time} seed={22} />
              <rect x={470} y={440} width={140} height={300} fill={tod("#efe6d6", time)} />
              <path d="M 610 440 l 40 -24 l 0 300 l -40 24 Z" fill={tod("#c9bfae", time)} />
              <circle cx={540} cy={540} r={50} fill={tod("#ffffff", time)} stroke={tod("#3b3f4c", time)} strokeWidth={8} />
              <line x1={540} y1={540} x2={540} y2={505} stroke="#3b3f4c" strokeWidth={6} />
              <line x1={540} y1={540} x2={565} y2={550} stroke="#3b3f4c" strokeWidth={6} />
              <path d="M 460 440 L 540 360 L 620 440 Z" fill={tod("#b33b3b", time)} />
            </g>
            <BlockHouse x={1060} y={1140} w={300} h={340} wall={TOWN_HOUSES[1].wall} roof={TOWN_HOUSES[1].roof} time={time} seed={23} />
            <Bunting y={520} sag={50} time={time} from={-300} to={460} />
            <Bunting y={520} sag={50} time={time} from={620} to={1400} />
          </g>
        ),
        mid: (
          <g>
            <Floor time={time} color="#d8cdb8" />
            {Array.from({ length: 8 }, (_, i) => (
              <line key={i} x1={L} y1={1240 + i * 110} x2={R} y2={1240 + i * 110} stroke={tod("#c2b59c", time)} strokeWidth={6} />
            ))}
            {/* fountain */}
            <g transform="translate(540 1300)">
              <rect x={-220} y={-60} width={440} height={80} rx={10} fill={tod("#b9b2a6", time)} />
              <rect x={-200} y={-60} width={400} height={24} fill={tod("#6fc3ff", time)} />
              <rect x={-30} y={-200} width={60} height={150} fill={tod("#b9b2a6", time)} />
              <path d="M 0 -200 q -60 -40 -110 60 M 0 -200 q 60 -40 110 60" stroke={tod("#9fdcff", time)} strokeWidth={10} fill="none" opacity={0.85} />
            </g>
          </g>
        ),
        near: (
          <g>
            <BlockTree x={-120} y={2000} s={1.6} time={time} />
            <g transform="translate(1000 1980)">
              <rect x={-120} y={-80} width={240} height={24} rx={6} fill={tod("#8a5a3b", time)} />
              <rect x={-110} y={-56} width={16} height={56} fill={tod("#3b3f4c", time)} />
              <rect x={94} y={-56} width={16} height={56} fill={tod("#3b3f4c", time)} />
            </g>
          </g>
        ),
      };
    case "lab":
      return {
        far: (
          <g>
            <rect x={L} y={-400} width={W} height={2000} fill={tod("#dfe9ee", time)} />
            <rect x={80} y={340} width={920} height={420} rx={14} fill={tod("#f7fbfd", time)} stroke={tod("#9fb3bf", time)} strokeWidth={8} />
            <path d="M 140 660 l 120 -160 l 90 90 l 140 -220 l 110 150 l 160 -60 l 120 120" stroke={tod("#4f9dff", time)} strokeWidth={10} fill="none" />
            {[200, 420, 640, 860].map((x) => (
              <circle key={x} cx={x} cy={420} r={18} fill={tod("#ff5a5a", time)} />
            ))}
          </g>
        ),
        mid: (
          <g>
            <Floor time={time} color="#b9c7cf" lines="#9fb0ba" />
            <rect x={-300} y={1080} width={W} height={40} rx={8} fill={tod("#6d7a85", time)} />
            {[60, 220, 380, 760, 920].map((x, i) => (
              <g key={x}>
                <path d={`M ${x - 30} 1080 L ${x - 10} 980 L ${x + 10} 980 L ${x + 30} 1080 Z`} fill={tod(["#5ccf6b", "#a77bff", "#ffd23f", "#2ec4b6", "#ff8fc7"][i], time)} opacity={0.85} />
                <rect x={x - 12} y={940} width={24} height={44} fill={tod("#e8f4f8", time)} stroke="#9fb3bf" strokeWidth={3} />
              </g>
            ))}
          </g>
        ),
        near: (
          <g>
            <rect x={900} y={1500} width={60} height={600} fill={tod("#6d7a85", time)} />
            <circle cx={930} cy={1480} r={70} fill="none" stroke={tod("#6d7a85", time)} strokeWidth={24} />
            <circle cx={930} cy={1480} r={40} fill="#bfe8ff" opacity={0.7} />
          </g>
        ),
      };
  }
}
