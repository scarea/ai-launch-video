import type { AvatarConfig, Pose } from "./components/Mascot";

export type MediaVisual = {
  src: string; // 相对 public/ 的路径
  /** 宽/高，assemble 自动探测 */
  aspect?: number;
  /** 镜头起始与终止区域，相对图片的 0–1 坐标 [x, y, w, h]；缺省为整张图 */
  focusFrom?: [number, number, number, number];
  focus?: [number, number, number, number];
  /** 高亮圈，相对图片的 0–1 坐标，r 为图片宽度的比例 */
  highlight?: { x: number; y: number; r?: number };
  bg?: "light" | "dark";
};

/** 一句旁白在画面上的主视觉。没写 visual 的 cue 沿用上一句的画面。 */
export type Visual =
  | ({ kind: "image" } & MediaVisual)
  | ({ kind: "video" } & MediaVisual)
  | { kind: "points"; heading?: string; items: string[] }
  | { kind: "quote"; text: string; zh?: string; by?: string }
  | { kind: "stat"; value: string; label: string; sub?: string }
  | {
      kind: "bars";
      title: string;
      unit?: string;
      note?: string;
      items: { label: string; value: number; highlight?: boolean }[];
    }
  | {
      kind: "table";
      title?: string;
      columns: string[];
      rows: string[][];
      highlightRow?: number;
      note?: string;
    };

export type Side = {
  tabs?: string[];
  activeTab?: number;
  metric?: { value: string; label: string; ratio?: number };
};

export type TimedCue = {
  text: string;
  audio: string; // 相对 public/
  from: number; // 帧
  speechFrames: number;
  frames: number; // 含停顿
  visual: Visual;
  visualKey: string; // 视觉切换用
  visualIndex: number;
  visualCount: number;
  side: Side;
  pose: Pose;
  source?: string;
};

export type TimedScene = {
  kind: "intro" | "chapter" | "outro";
  id: string;
  title: string;
  accent?: string;
  from: number;
  frames: number;
  cues: TimedCue[];
};

export type Timeline = {
  fps: number;
  width: number;
  height: number;
  totalFrames: number;
  brand: {
    name: string;
    tagline: string;
    avatar: AvatarConfig;
    ink: string;
    primary: string;
  };
  vendor: { name: string; short: string; accent: string };
  date: string;
  title: [string, string];
  subtitle: string;
  highlights: { tag: string; title: string }[];
  scenes: TimedScene[];
};
