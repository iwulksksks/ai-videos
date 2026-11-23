"use client";
// The cutaway cartoon office building. Each room is clickable; a worker looks busy while its stage runs.
import React from "react";
import { AGENT_COLORS, ROOMS, type RoomId } from "./rooms";

type Props = {
  busy: Partial<Record<RoomId, boolean>>;
  selected: RoomId | null;
  onSelect: (id: RoomId) => void;
  night: boolean;
};

// x, y, w, h for each room inside a 1000 x 1340 drawing.
const LAYOUT: Record<RoomId, [number, number, number, number]> = {
  trends: [110, 70, 385, 210],
  scout: [505, 70, 385, 210],
  producer: [110, 300, 470, 240],
  research: [590, 300, 300, 240],
  script: [110, 550, 390, 240],
  qa: [510, 550, 380, 240],
  voice: [110, 800, 390, 240],
  art: [510, 800, 380, 240],
  edit: [110, 1050, 390, 240],
  ship: [510, 1050, 380, 240],
};

function Worker({ color, busy, x, y }: { color: string; busy: boolean; x: number; y: number }) {
  const c = AGENT_COLORS[color] ?? "#ffd23f";
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={busy ? "worker busy" : "worker"}>
        <ellipse cx={0} cy={4} rx={30} ry={7} fill="#000" opacity={0.15} />
        <ellipse cx={-12} cy={-2} rx={11} ry={6} fill={c} filter="brightness(0.8)" />
        <ellipse cx={12} cy={-2} rx={11} ry={6} fill={c} />
        <ellipse cx={0} cy={-36} rx={32} ry={35} fill={c} stroke="#2d2a3e" strokeWidth={3} />
        <ellipse cx={-11} cy={-44} rx={6} ry={8} fill="#fff" />
        <ellipse cx={11} cy={-44} rx={6} ry={8} fill="#fff" />
        <circle cx={-10} cy={-42} r={3.5} fill="#222" />
        <circle cx={12} cy={-42} r={3.5} fill="#222" />
        {busy ? (
          <ellipse cx={0} cy={-24} rx={7} ry={5} fill="#5a1f2b" />
        ) : (
          <path d="M -9 -27 Q 0 -19 9 -27" stroke="#222" strokeWidth={3} fill="none" strokeLinecap="round" />
        )}
      </g>
      {busy && (
        <g className="thinking">
          <rect x={18} y={-112} width={56} height={34} rx={16} fill="#fff" stroke="#2d2a3e" strokeWidth={3} />
          <circle cx={34} cy={-95} r={4} fill="#2d2a3e" className="dot d1" />
          <circle cx={46} cy={-95} r={4} fill="#2d2a3e" className="dot d2" />
          <circle cx={58} cy={-95} r={4} fill="#2d2a3e" className="dot d3" />
        </g>
      )}
    </g>
  );
}

function Furniture({ id, w, h }: { id: RoomId; w: number; h: number }) {
  const floor = h - 34;
  switch (id) {
    case "trends":
      return (
        <g>
          <rect x={w - 150} y={floor - 80} width={14} height={80} fill="#5b5670" />
          <rect x={w - 200} y={floor - 120} width={120} height={34} rx={14} fill="#4f9dff" transform={`rotate(-25 ${w - 140} ${floor - 100})`} />
          <rect x={40} y={floor - 120} width={110} height={80} rx={10} fill="#2d2a3e" />
          <path d={`M 52 ${floor - 55} l 20 -20 l 18 12 l 22 -30 l 20 16`} stroke="#5ccf6b" strokeWidth={5} fill="none" />
        </g>
      );
    case "scout":
      return (
        <g>
          <rect x={30} y={floor - 130} width={150} height={96} rx={10} fill="#2d2a3e" />
          <rect x={40} y={floor - 120} width={130} height={76} rx={6} fill="#ff5a5a" />
          <path d={`M 95 ${floor - 100} l 26 18 l -26 18 z`} fill="#fff" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={w - 170 + i * 30} y={floor - 30 - (i + 1) * 22} width={22} height={(i + 1) * 22} rx={3} fill={i === 3 ? "#5ccf6b" : "#ff9a3c"} />
          ))}
          <circle cx={w - 60} cy={44} r={20} fill="none" stroke="#2d2a3e" strokeWidth={6} />
          <rect x={w - 50} y={58} width={8} height={26} rx={4} fill="#2d2a3e" transform={`rotate(-40 ${w - 46} 62)`} />
        </g>
      );
    case "producer":
      return (
        <g>
          <rect x={w - 200} y={floor - 60} width={170} height={60} rx={8} fill="#a8714a" />
          <rect x={w - 180} y={floor - 100} width={70} height={46} rx={6} fill="#2d2a3e" />
          <rect x={30} y={30} width={150} height={100} rx={8} fill="#fff" stroke="#c9b285" strokeWidth={4} />
          <text x={105} y={70} textAnchor="middle" fontSize={18} fontWeight={700} fill="#c8323c">STUDIO</text>
          <text x={105} y={98} textAnchor="middle" fontSize={16} fill="#555">plan</text>
          <rect x={w - 80} y={30} width={50} height={70} rx={6} fill="#ffd23f" />
        </g>
      );
    case "research":
      return (
        <g>
          <rect x={20} y={28} width={160} height={110} rx={6} fill="#c98f5e" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={30 + (i % 2) * 76} y={38 + Math.floor(i / 2) * 50} width={64} height={40} fill={["#fff3b0", "#ffd9ec", "#d5e6ff", "#d4f5c9"][i]} transform={`rotate(${(i % 2 ? 4 : -4)} ${60 + (i % 2) * 76} ${58 + Math.floor(i / 2) * 50})`} />
          ))}
          <rect x={w - 140} y={floor - 50} width={120} height={50} rx={8} fill="#8a5a3b" />
        </g>
      );
    case "script":
      return (
        <g>
          <rect x={w - 190} y={floor - 56} width={160} height={56} rx={8} fill="#8a5a3b" />
          <rect x={w - 160} y={floor - 84} width={80} height={30} rx={4} fill="#2d2a3e" />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={30 + i * 18} y={floor - 30 - i * 10} width={60} height={12} rx={3} fill="#fff" stroke="#bbb" />
          ))}
          <rect x={30} y={30} width={90} height={120} rx={6} fill="#fff" stroke="#a77bff" strokeWidth={4} />
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={42} y1={52 + i * 20} x2={108} y2={52 + i * 20} stroke="#bbb" strokeWidth={4} />
          ))}
        </g>
      );
    case "qa":
      return (
        <g>
          <rect x={w - 170} y={floor - 60} width={140} height={60} rx={8} fill="#e8eef9" stroke="#9aa7c7" strokeWidth={3} />
          <circle cx={w - 130} cy={floor - 80} r={18} fill="#5ccf6b" opacity={0.8} />
          <rect x={w - 100} y={floor - 110} width={16} height={50} rx={6} fill="#4f9dff" opacity={0.7} />
          <rect x={30} y={30} width={120} height={90} rx={8} fill="#fff" stroke="#4f9dff" strokeWidth={4} />
          <path d="M 50 75 l 18 18 l 36 -40" stroke="#5ccf6b" strokeWidth={9} fill="none" strokeLinecap="round" />
        </g>
      );
    case "voice":
      return (
        <g>
          <line x1={w - 110} y1={floor} x2={w - 110} y2={floor - 120} stroke="#555" strokeWidth={6} />
          <rect x={w - 128} y={floor - 160} width={36} height={56} rx={18} fill="#2d2a3e" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={30 + i * 22} y={30} width={18} height={110} fill={i % 2 ? "#e6b3cf" : "#d79bbd"} />
          ))}
        </g>
      );
    case "art":
      return (
        <g>
          <line x1={w - 140} y1={floor} x2={w - 110} y2={floor - 170} stroke="#8a5a3b" strokeWidth={8} />
          <line x1={w - 60} y1={floor} x2={w - 90} y2={floor - 170} stroke="#8a5a3b" strokeWidth={8} />
          <rect x={w - 170} y={floor - 160} width={140} height={100} rx={4} fill="#fff" stroke="#ddd" strokeWidth={3} />
          <circle cx={w - 120} cy={floor - 115} r={22} fill="#ff9a3c" />
          <circle cx={w - 80} cy={floor - 100} r={16} fill="#4f9dff" />
          <path d={`M 30 ${floor - 10} q 30 -60 60 0`} fill="#ffd23f" />
        </g>
      );
    case "edit":
      return (
        <g>
          <rect x={w - 230} y={floor - 56} width={200} height={56} rx={8} fill="#3b3f4c" />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={w - 225 + i * 66} y={floor - 130} width={60} height={70} rx={6} fill="#1d1f29" stroke="#ff5a5a" strokeWidth={3} />
          ))}
          <rect x={30} y={30} width={130} height={18} rx={9} fill="#2d2a3e" />
          <circle cx={60} cy={100} r={34} fill="none" stroke="#2d2a3e" strokeWidth={10} />
          <circle cx={60} cy={100} r={8} fill="#2d2a3e" />
        </g>
      );
    case "ship":
      return (
        <g>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={w - 200 + (i % 2) * 70} y={floor - 60 - Math.floor(i / 2) * 60} width={64} height={58} fill="#d9a066" stroke="#a8714a" strokeWidth={3} />
              <line x1={w - 200 + (i % 2) * 70} y1={floor - 31 - Math.floor(i / 2) * 60} x2={w - 136 + (i % 2) * 70} y2={floor - 31 - Math.floor(i / 2) * 60} stroke="#a8714a" strokeWidth={4} />
            </g>
          ))}
          <rect x={30} y={30} width={140} height={110} rx={6} fill="#9aa0ad" />
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={30} y1={48 + i * 20} x2={170} y2={48 + i * 20} stroke="#7b8190" strokeWidth={4} />
          ))}
        </g>
      );
  }
}

export function Building({ busy, selected, onSelect, night }: Props) {
  return (
    <svg viewBox="0 0 1000 1340" className="building" role="img" aria-label="The Reelhouse studio building">
      <defs>
        <linearGradient id="bsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night ? "#0b1440" : "#7cc8ff"} />
          <stop offset="1" stopColor={night ? "#2b3a7a" : "#e3f5ff"} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1000} height={1340} fill="url(#bsky)" />
      {night ? (
        <circle cx={955} cy={34} r={26} fill="#f4f1de" />
      ) : (
        <circle cx={955} cy={34} r={30} fill="#fff1a8" />
      )}
      <g opacity={night ? 0.25 : 0.9} className="clouds">
        <ellipse cx={120} cy={34} rx={60} ry={16} fill="#fff" />
        <ellipse cx={150} cy={24} rx={36} ry={18} fill="#fff" />
      </g>
      {/* ground */}
      <rect x={0} y={1290} width={1000} height={50} fill="#6cc56a" />
      {/* building shell */}
      <rect x={90} y={285} width={820} height={1015} rx={10} fill="#e8d2b0" stroke="#5a4636" strokeWidth={8} />
      <rect x={90} y={60} width={820} height={232} rx={8} fill="#d9c09a" stroke="#5a4636" strokeWidth={8} />
      <rect x={70} y={275} width={860} height={22} rx={6} fill="#c8323c" />
      <text x={500} y={45} textAnchor="middle" fontSize={34} fontWeight={800} fill={night ? "#ffe14d" : "#2d2a3e"} className="sign">
        REELHOUSE
      </text>
      {ROOMS.map((room) => {
        const [x, y, w, h] = LAYOUT[room.id];
        const isBusy = !!busy[room.id];
        return (
          <g
            key={room.id}
            transform={`translate(${x} ${y})`}
            className={`room ${selected === room.id ? "selected" : ""} ${isBusy ? "is-busy" : ""}`}
            onClick={() => onSelect(room.id)}
            role="button"
            tabIndex={0}
            aria-label={`${room.name}, ${room.agent}`}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(room.id)}
          >
            <rect width={w} height={h} fill={room.wall} stroke="#5a4636" strokeWidth={5} />
            <rect y={h - 34} width={w} height={34} fill="#b98a5e" />
            {night && <rect width={w} height={h} fill="#1a2350" opacity={0.18} />}
            <Furniture id={room.id} w={w} h={h} />
            <Worker color={room.color} busy={isBusy} x={w / 2 - 10} y={h - 30} />
            {isBusy && <rect className="glow" width={w} height={h} fill="none" stroke="#ffe14d" strokeWidth={6} />}
            <g transform={`translate(${w / 2} 22)`}>
              <rect x={-110} y={-16} width={220} height={32} rx={16} fill="#2d2a3e" opacity={0.85} />
              <text textAnchor="middle" y={6} fontSize={17} fontWeight={700} fill="#fff">
                {room.name} · {room.agent}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
