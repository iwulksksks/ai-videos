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
  }
}
