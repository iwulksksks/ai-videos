// The whole video: optional title card, every beat, the end card, voices and ducked music.
import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, useCurrentFrame } from "remotion";
import type { VideoProps } from "../lib/story";
import { Scene } from "./Scene";
import { EndCard, TitleCard } from "./Text";

const LEVELS = { hook: [0.42, 0.1], cozy: [0.38, 0.1], twist: [0.22, 0.05] } as const; // [full, under voices]
const RAMP = 8;

function speakingWindows(p: VideoProps): [number, number][] {
  const out: [number, number][] = [];
  let at = p.introFrames;
  for (const b of p.beats) {
    if (b.narrationAudio) out.push([at, at + b.narrationFrames]);
    if (b.lineAudio) out.push([at + b.lineStartFrame, at + b.lineStartFrame + b.lineFrames]);
    at += b.durationInFrames;
  }
  return out;
}

const Outro: React.FC<{ style: VideoProps["style"] }> = ({ style }) => {
  const frame = useCurrentFrame();
  return <EndCard style={style} frame={frame} />;
};

const Intro: React.FC<{ title: string; total: number }> = ({ title, total }) => {
  const frame = useCurrentFrame();
  return <TitleCard title={title} frame={frame} total={total} />;
};

export const StoryVideo: React.FC<VideoProps> = (props) => {
  const windows = speakingWindows(props);
  const [MUSIC_FULL, MUSIC_DUCKED] = LEVELS[props.style];
  const musicVolume = (f: number) => {
    // f is relative to the music's own Sequence, which starts at 0.
    let duck = 0;
    for (const [a, b] of windows) {
      if (f >= a - RAMP && f <= b + RAMP) {
        const d = f < a ? (a - f) / RAMP : f > b ? (f - b) / RAMP : 0;
        duck = Math.max(duck, 1 - d);
      }
    }
    return MUSIC_FULL - (MUSIC_FULL - MUSIC_DUCKED) * duck;
  };

  let at = props.introFrames;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {props.introFrames > 0 && (
        <Sequence durationInFrames={props.introFrames} name="Title card">
          <Intro title={props.title} total={props.introFrames} />
        </Sequence>
      )}
      {props.beats.map((beat, i) => {
        const from = at;
        at += beat.durationInFrames;
        return (
          <Sequence key={i} from={from} durationInFrames={beat.durationInFrames} name={`Beat ${i + 1}`}>
            <Scene beat={beat} index={i} characters={props.characters} look={props.look} style={props.style} />
            {beat.narrationAudio && <Html5Audio src={beat.narrationAudio} />}
            {beat.lineAudio && (
              <Sequence from={beat.lineStartFrame} name="Line">
                <Html5Audio src={beat.lineAudio} />
              </Sequence>
            )}
          </Sequence>
        );
      })}
      {props.outroFrames > 0 && (
        <Sequence from={at} durationInFrames={props.outroFrames} name="End card">
          <Outro style={props.style} />
        </Sequence>
      )}
      {props.musicSrc && <Html5Audio src={props.musicSrc} volume={musicVolume} loop={props.musicLoop} />}
      {props.sfxSrc && <Html5Audio src={props.sfxSrc} volume={0.8} />}
    </AbsoluteFill>
  );
};
