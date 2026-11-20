import React from "react";
import { Composition, staticFile } from "remotion";
import { LaunchVideo } from "./LaunchVideo";
import type { Timeline } from "./types";

type Props = { timeline: Timeline | null };

export const Root: React.FC = () => (
  <Composition
    id="LaunchVideo"
    component={LaunchVideo as unknown as React.FC<Props>}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={300}
    defaultProps={{ timeline: null } as Props}
    calculateMetadata={async ({ props }) => {
      const timeline: Timeline =
        props.timeline ?? (await fetch(staticFile("ep/timeline.json")).then((r) => r.json()));
      return {
        durationInFrames: timeline.totalFrames,
        fps: timeline.fps,
        width: timeline.width,
        height: timeline.height,
        props: { timeline },
      };
    }}
  />
);
