// Objects drawn in code for "insert" close-ups, so explanation beats can show the mechanism.
import React from "react";
import type { Prop, TimeOfDay } from "../../lib/story";
import { shade, tod } from "./palette";

function Gear({ x, y, r, teeth, color, angle }: { x: number; y: number; r: number; teeth: number; color: string; angle: number }) {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.82;
    const a2 = a + Math.PI / (teeth * 2);
    pts.push(`${Math.cos(a) * rr},${Math.sin(a) * rr}`, `${Math.cos(a2) * rr},${Math.sin(a2) * rr}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <polygon points={pts.join(" ")} fill={color} stroke={shade(color, -0.35)} strokeWidth={8} strokeLinejoin="round" />
      <circle r={r * 0.45} fill={shade(color, 0.15)} stroke={shade(color, -0.35)} strokeWidth={8} />
      <circle r={r * 0.14} fill={shade(color, -0.4)} />
    </g>
  );
}

export const PropArt: React.FC<{ prop: Prop; frame: number; time: TimeOfDay }> = ({ prop, frame, time }) => {
  const brass = tod("#d4a23a", time);
  const iron = tod("#7b8190", time);
  const wood = tod("#9a6b45", time);
  switch (prop) {
    case "none":
      return null;
    case "gear":
      return (
        <g>
          <Gear x={-130} y={0} r={240} teeth={14} color={brass} angle={frame * 1.2} />
          <Gear x={250} y={-170} r={150} teeth={9} color={iron} angle={-frame * 1.9 + 10} />
        </g>
      );
    case "lever": {
      const tilt = Math.sin(frame / 18) * 14;
      return (
        <g>
          <path d="M -90 200 L 0 40 L 90 200 Z" fill={iron} stroke={shade(iron, -0.4)} strokeWidth={8} />
          <g transform={`translate(0 40) rotate(${tilt})`}>
            <rect x={-420} y={-24} width={840} height={48} rx={18} fill={wood} stroke={shade(wood, -0.35)} strokeWidth={8} />
            <rect x={-420} y={-150} width={130} height={126} rx={12} fill={iron} />
          </g>
        </g>
      );
    }
    case "bell": {
      const swing = Math.sin(frame / 6) * 12;
      return (
        <g>
          <rect x={-300} y={-330} width={600} height={34} rx={10} fill={wood} />
          <g transform={`translate(0 -300) rotate(${swing})`}>
            <path d="M -200 330 Q -200 60 0 40 Q 200 60 200 330 L 240 380 L -240 380 Z" fill={brass} stroke={shade(brass, -0.35)} strokeWidth={10} />
            <circle cx={0} cy={400} r={40} fill={shade(brass, -0.3)} />
          </g>
          {Math.abs(swing) > 9 && <path d="M 280 0 q 40 40 0 80 M 330 -20 q 60 60 0 120" stroke="#fff" strokeWidth={10} fill="none" opacity={0.8} />}
        </g>
      );
    }
    case "jar":
      return (
        <g>
          <path d="M -180 -260 h 360 v 60 q 80 60 80 200 v 260 q 0 60 -60 60 h -400 q -60 0 -60 -60 v -260 q 0 -140 80 -200 Z" fill={tod("#bfe8ff", time)} opacity={0.6} stroke={tod("#7fb6d4", time)} strokeWidth={10} />
          <rect x={-200} y={-300} width={400} height={50} rx={14} fill={wood} />
          <path d="M -240 120 q 240 -40 480 0 v 180 q 0 60 -60 60 h -360 q -60 0 -60 -60 Z" fill={tod("#4f9dff", time)} opacity={0.7} />
          <circle cx={-40} cy={-20 + ((frame * 3) % 200)} r={40} fill={brass} />
        </g>
      );
    case "rail": {
      const gap = 60 + Math.sin(frame / 20) * 30;
      return (
        <g>
          {[-1, 1].map((side) => (
            <rect key={side} x={side < 0 ? -560 : gap / 2} y={-40} width={560 - gap / 2} height={80} rx={6} fill={iron} stroke={shade(iron, -0.4)} strokeWidth={8} />
          ))}
          {[-420, -180, 180, 420].map((x) => (
            <rect key={x} x={x - 50} y={50} width={100} height={140} rx={10} fill={wood} />
          ))}
          <path d={`M ${-gap / 2} -110 h ${gap} M ${-gap / 2} -130 v 40 M ${gap / 2} -130 v 40`} stroke="#ffe14d" strokeWidth={10} />
        </g>
      );
    }
    case "pendulum": {
      const a = Math.sin(frame / 14) * 28;
      return (
        <g>
          <rect x={-200} y={-460} width={400} height={30} rx={10} fill={wood} />
          <g transform={`translate(0 -440) rotate(${a})`}>
            <rect x={-8} y={0} width={16} height={620} fill={iron} />
            <circle cy={660} r={90} fill={brass} stroke={shade(brass, -0.35)} strokeWidth={10} />
          </g>
        </g>
      );
    }
    case "wheel":
      return (
        <g transform={`rotate(${frame * 2})`}>
          <circle r={320} fill="none" stroke={wood} strokeWidth={60} />
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={-12} y={-300} width={24} height={300} fill={wood} transform={`rotate(${i * 45})`} />
          ))}
          <circle r={60} fill={iron} />
        </g>
      );
    case "rope":
      return (
        <g>
          <circle cx={0} cy={-300} r={110} fill={wood} stroke={shade(wood, -0.35)} strokeWidth={10} />
          <path d={`M -110 -300 L -110 ${300 + Math.sin(frame / 10) * 40} M 110 -300 L 110 ${200 - Math.sin(frame / 10) * 40}`} stroke={tod("#d9c39a", time)} strokeWidth={26} strokeLinecap="round" />
          <rect x={-190} y={300 + Math.sin(frame / 10) * 40} width={160} height={140} rx={14} fill={iron} />
        </g>
      );
  }
};
