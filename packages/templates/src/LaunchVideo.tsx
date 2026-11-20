import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Mascot } from "./components/Mascot";
import { VisualView } from "./components/VisualView";
import type { Timeline, TimedCue, TimedScene } from "./types";

const FONT = "'PingFang SC', 'Noto Sans SC', 'Helvetica Neue', sans-serif";
const MUTED = "#8A93A6";

const PANEL = { x: 60, y: 236, w: 1380, h: 676 };
const RAIL_X = 1480;

const findCue = (scene: TimedScene, local: number): TimedCue | undefined => {
  let cur: TimedCue | undefined;
  for (const c of scene.cues) {
    if (c.from - scene.from <= local) cur = c;
  }
  return cur;
};

const Header: React.FC<{ t: Timeline; chapterNo: number; chapterCount: number }> = ({
  t,
  chapterNo,
  chapterCount,
}) => (
  <div
    style={{
      position: "absolute",
      left: 60,
      right: 60,
      top: 34,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 16,
          background: t.brand.primary,
          color: "#fff",
          fontWeight: 900,
          fontSize: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        首
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 850, color: t.brand.ink, letterSpacing: 1 }}>{t.brand.name}</div>
        <div style={{ fontSize: 18, color: MUTED, letterSpacing: 2 }}>{t.brand.tagline}</div>
      </div>
    </div>
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: t.brand.ink, fontVariantNumeric: "tabular-nums" }}>{t.date}</div>
      <div style={{ fontSize: 18, color: MUTED, letterSpacing: 1 }}>
        {chapterNo > 0 ? `CH ${String(chapterNo).padStart(2, "0")} / ${String(chapterCount).padStart(2, "0")}` : `${chapterCount} 个章节`}
      </div>
    </div>
  </div>
);

const ChapterTitle: React.FC<{ title: string; accent?: string; color: string; ink: string }> = ({
  title,
  accent,
  color,
  ink,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 20 });
  const b = spring({ frame: frame - 8, fps, config: { damping: 200 }, durationInFrames: 20 });
  return (
    <div style={{ position: "absolute", left: 60, top: 118, fontSize: 64, fontWeight: 850, color: ink, display: "flex", gap: 6 }}>
      <span style={{ opacity: a, transform: `translateY(${(1 - a) * 30}px)`, display: "inline-block" }}>{title}</span>
      {accent && (
        <span style={{ color, opacity: b, transform: `translateY(${(1 - b) * 30}px)`, display: "inline-block" }}>
          ，{accent}
        </span>
      )}
    </div>
  );
};

/**
 * 右侧栏分上下两区，互不重叠：
 *  上区（rail 顶部 0–330px）：厂商徽标、对比标签（两列小标签，最多 2 行）、指标环
 *  下区（底部 400px）：主播立绘，永远不被遮挡
 */
const RAIL_TOP = 236;
const RAIL_H = 780;
const HOST_H = 400;
const HOST_BOTTOM = 30;
const Rail: React.FC<{ t: Timeline; cue?: TimedCue; local: number; scene: TimedScene }> = ({ t, cue, local, scene }) => {
  const accent = t.vendor.accent;
  const side = cue?.side ?? {};
  const talking = !!cue && local < cue.from - scene.from + cue.speechFrames;
  const ratio = side.metric?.ratio ?? 0;
  const R = 50;
  const C = 2 * Math.PI * R;
  const tabs = (side.tabs ?? []).slice(0, 4);
  return (
    <div style={{ position: "absolute", left: RAIL_X, top: RAIL_TOP, width: 380, height: RAIL_H }}>
      <div style={{ height: RAIL_H - HOST_H - HOST_BOTTOM - 10, overflow: "hidden" }}>
        {/* 厂商徽标（文字，不使用官方 Logo 图） */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: accent,
              color: "#fff",
              fontSize: 28,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {t.vendor.short}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: t.brand.ink }}>{t.vendor.name}</div>
        </div>
        {tabs.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {tabs.map((tab, i) => {
              const on = i === (side.activeTab ?? 0);
              return (
                <div
                  key={tab}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 12,
                    fontSize: 20,
                    fontWeight: on ? 800 : 550,
                    color: on ? accent : MUTED,
                    background: on ? `${accent}18` : "#fff",
                    border: `2px solid ${on ? accent : "#E3E7EF"}`,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {tab}
                </div>
              );
            })}
          </div>
        )}
        {side.metric && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "#fff",
              borderRadius: 20,
              padding: "8px 16px 8px 8px",
              boxShadow: "0 8px 24px rgba(31,42,77,0.08)",
            }}
          >
            <svg width={R * 2 + 14} height={R * 2 + 14} style={{ flexShrink: 0 }}>
              <circle cx={R + 7} cy={R + 7} r={R} stroke="#E3E7EF" strokeWidth={9} fill="none" />
              <circle
                cx={R + 7}
                cy={R + 7}
                r={R}
                stroke={accent}
                strokeWidth={9}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - Math.min(1, ratio))}
                transform={`rotate(-90 ${R + 7} ${R + 7})`}
              />
              <text x={R + 7} y={R + 16} textAnchor="middle" fontSize={side.metric.value.length > 5 ? 22 : 27} fontWeight={850} fill={accent} fontFamily={FONT}>
                {side.metric.value}
              </text>
            </svg>
            <div style={{ fontSize: 21, color: "#5B6478", lineHeight: 1.35 }}>{side.metric.label}</div>
          </div>
        )}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: HOST_BOTTOM, height: HOST_H, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
        <Mascot pose={cue?.pose ?? "idle"} talking={talking} avatar={t.brand.avatar} height={HOST_H} />
      </div>
    </div>
  );
};

const Subtitle: React.FC<{ text?: string; ink: string }> = ({ text, ink }) =>
  text ? (
    <div
      style={{
        position: "absolute",
        left: 60,
        width: PANEL.w,
        top: 958,
        textAlign: "center",
        fontSize: 40,
        fontWeight: 750,
        color: ink,
        textShadow: "0 0 12px #fff, 0 0 4px #fff",
      }}
    >
      {text}
    </div>
  ) : null;

const Progress: React.FC<{ t: Timeline; frame: number }> = ({ t, frame }) => {
  const chapters = t.scenes.filter((s) => s.kind === "chapter");
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1028, display: "flex", gap: 6 }}>
      {chapters.map((s) => {
        const p = Math.max(0, Math.min(1, (frame - s.from) / s.frames));
        return (
          <div key={s.id} style={{ flex: s.frames, height: 8, borderRadius: 4, background: "#E3E7EF", overflow: "hidden" }}>
            <div style={{ width: `${p * 100}%`, height: "100%", background: t.vendor.accent }} />
          </div>
        );
      })}
    </div>
  );
};

const ChapterScene: React.FC<{ t: Timeline; scene: TimedScene; no: number; count: number }> = ({ t, scene, no, count }) => {
  const local = useCurrentFrame();
  const cue = findCue(scene, local);
  // 把连续相同 visual 的 cue 合并成一个 Sequence，保证同一张图的动画不被打断
  const groups: { key: string; from: number; frames: number; cue: TimedCue }[] = [];
  for (const c of scene.cues) {
    const last = groups[groups.length - 1];
    if (last && last.key === c.visualKey) last.frames += c.frames;
    else groups.push({ key: c.visualKey, from: c.from - scene.from, frames: c.frames, cue: c });
  }
  return (
    <AbsoluteFill>
      <ChapterTitle title={scene.title} accent={scene.accent} color={t.vendor.accent} ink={t.brand.ink} />
      <div
        style={{
          position: "absolute",
          left: PANEL.x,
          top: PANEL.y,
          width: PANEL.w,
          height: PANEL.h,
          borderRadius: 24,
          background: "#fff",
          boxShadow: "0 18px 50px rgba(31,42,77,0.10)",
        }}
      >
        {groups.map((g) => (
          <Sequence key={g.key + g.from} from={g.from} durationInFrames={g.frames} layout="none">
            <VisualView v={g.cue.visual} accent={t.vendor.accent} ink={t.brand.ink} w={PANEL.w} h={PANEL.h} holdFrames={g.frames} />
          </Sequence>
        ))}
      </div>
      {cue && (
        <div style={{ position: "absolute", left: PANEL.x + 8, top: PANEL.y + PANEL.h + 8, right: 1920 - PANEL.x - PANEL.w, display: "flex", justifyContent: "space-between", fontSize: 20, color: MUTED }}>
          <span>● {cue.source ?? `${t.vendor.name} 官方资料`}</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {String(cue.visualIndex + 1).padStart(2, "0")} / {String(cue.visualCount).padStart(2, "0")}
          </span>
        </div>
      )}
      <Header t={t} chapterNo={no} chapterCount={count} />
      <Rail t={t} cue={cue} local={local} scene={scene} />
      <Subtitle text={cue && local < cue.from - scene.from + cue.speechFrames + 6 ? cue.text : undefined} ink={t.brand.ink} />
    </AbsoluteFill>
  );
};

const IntroScene: React.FC<{ t: Timeline; scene: TimedScene }> = ({ t, scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = findCue(scene, frame);
  const talking = !!cue && frame < cue.from - scene.from + cue.speechFrames;
  const a = (d: number) => spring({ frame: frame - d, fps, config: { damping: 200 }, durationInFrames: 22 });
  const chapters = t.scenes.filter((s) => s.kind === "chapter");
  return (
    <AbsoluteFill>
      <Header t={t} chapterNo={0} chapterCount={chapters.length} />
      <div style={{ position: "absolute", left: 110, top: 170, fontSize: 22, letterSpacing: 6, color: MUTED, fontWeight: 700, opacity: a(0) }}>
        MODEL LAUNCH · {t.vendor.name.toUpperCase()}
      </div>
      <div style={{ position: "absolute", left: 104, top: 220, fontSize: 124, fontWeight: 900, color: t.brand.ink, opacity: a(4), transform: `translateY(${(1 - a(4)) * 40}px)` }}>
        {t.title[0]}
      </div>
      <div style={{ position: "absolute", left: 104, top: 370, fontSize: 124, fontWeight: 900, color: t.vendor.accent, opacity: a(12), transform: `translateY(${(1 - a(12)) * 40}px)` }}>
        {t.title[1]}
      </div>
      <div style={{ position: "absolute", left: 110, top: 540, fontSize: 32, color: "#5B6478", opacity: a(20) }}>{t.subtitle}</div>
      <div style={{ position: "absolute", left: 104, top: 650, display: "flex", gap: 24 }}>
        {t.highlights.map((h, i) => {
          const k = a(30 + i * 8);
          return (
            <div
              key={i}
              style={{
                width: 400,
                padding: "26px 30px",
                borderRadius: 20,
                background: "#fff",
                boxShadow: "0 14px 40px rgba(31,42,77,0.08)",
                borderTop: `5px solid ${t.vendor.accent}`,
                opacity: k,
                transform: `translateY(${(1 - k) * 40}px)`,
              }}
            >
              <div style={{ fontSize: 20, color: t.vendor.accent, fontWeight: 800, letterSpacing: 2 }}>{h.tag}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: t.brand.ink, marginTop: 10, lineHeight: 1.3 }}>{h.title}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", right: 120, top: 150, opacity: a(6) }}>
        <div style={{ width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(circle, ${t.vendor.accent}22, transparent 70%)`, position: "absolute", left: -60, top: 40 }} />
        <Mascot pose={cue?.pose ?? "point"} talking={talking} avatar={t.brand.avatar} height={560} />
      </div>
      <Subtitle text={cue && frame < cue.from - scene.from + cue.speechFrames + 6 ? cue.text : undefined} ink={t.brand.ink} />
    </AbsoluteFill>
  );
};

const OutroScene: React.FC<{ t: Timeline; scene: TimedScene }> = ({ t, scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = findCue(scene, frame);
  const talking = !!cue && frame < cue.from - scene.from + cue.speechFrames;
  const a = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 22 });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Header t={t} chapterNo={0} chapterCount={t.scenes.filter((s) => s.kind === "chapter").length} />
      <div style={{ display: "flex", alignItems: "center", gap: 80, opacity: a }}>
        <Mascot pose={cue?.pose ?? "idle"} talking={talking} avatar={t.brand.avatar} height={520} />
        <div>
          <div style={{ fontSize: 96, fontWeight: 900, color: t.brand.ink }}>{scene.title}</div>
          {scene.accent && <div style={{ fontSize: 44, fontWeight: 700, color: t.vendor.accent, marginTop: 20 }}>{scene.accent}</div>}
        </div>
      </div>
      <Subtitle text={cue && frame < cue.from - scene.from + cue.speechFrames + 6 ? cue.text : undefined} ink={t.brand.ink} />
    </AbsoluteFill>
  );
};

export const LaunchVideo: React.FC<{ timeline: Timeline }> = ({ timeline: t }) => {
  const frame = useCurrentFrame();
  const chapters = t.scenes.filter((s) => s.kind === "chapter");
  const drift = interpolate(frame, [0, t.totalFrames], [0, 120]);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: "#F5F7FB" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(1200px 700px at ${70 + drift / 10}% -10%, ${t.vendor.accent}14, transparent 60%), radial-gradient(900px 600px at 0% 110%, ${t.brand.primary}12, transparent 60%)`,
        }}
      />
      {t.scenes.map((s) => (
        <Sequence key={s.id} from={s.from} durationInFrames={s.frames}>
          {s.kind === "intro" ? (
            <IntroScene t={t} scene={s} />
          ) : s.kind === "outro" ? (
            <OutroScene t={t} scene={s} />
          ) : (
            <ChapterScene t={t} scene={s} no={chapters.indexOf(s) + 1} count={chapters.length} />
          )}
        </Sequence>
      ))}
      {t.scenes.flatMap((s) =>
        s.cues.map((c) => (
          <Sequence key={c.audio + c.from} from={c.from} durationInFrames={c.speechFrames + 2} layout="none">
            <Audio src={staticFile(c.audio)} />
          </Sequence>
        )),
      )}
      <Progress t={t} frame={frame} />
    </AbsoluteFill>
  );
};
