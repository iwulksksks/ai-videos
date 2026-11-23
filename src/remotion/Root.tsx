import React from "react";
import { Composition } from "remotion";
import { stageStory } from "../lib/agents/art";
import { FPS, HEIGHT, WIDTH, totalFrames, type VideoProps } from "../lib/story";
import { demoPitches, demoStory } from "../lib/writers/demo";
import { StoryVideo } from "./StoryVideo";

// A demo story so Remotion Studio has something to show with no app running.
function sampleProps(): VideoProps {
  const pitch = demoPitches("hook", [])[0];
  const story = demoStory(pitch, "hook");
  const plan = stageStory(story, "hook", []);
  return {
    title: story.title,
    style: "hook",
    look: "2.5d",
    characters: story.characters,
    beats: plan.beats.map(({ narrationFile: _n, lineFile: _l, ...b }) => ({ ...b, narrationAudio: null, lineAudio: null })),
    musicSrc: null,
    musicLoop: false,
    musicMood: "epic",
    introFrames: plan.introFrames,
    outroFrames: plan.outroFrames,
  };
}

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Story"
      component={StoryVideo}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      durationInFrames={300}
      defaultProps={sampleProps()}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, totalFrames(props)) })}
    />
  );
};
