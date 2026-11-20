import React from "react";
import { Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Visual } from "../types";

const ease = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 18 });

/** 主画面区域。frame 从该视觉出现时开始计（由外层 Sequence 保证）。 */
export const VisualView: React.FC<{
  v: Visual;
  accent: string;
  ink: string;
  w: number;
  h: number;
  holdFrames: number;
}> = ({ v, accent, ink, w, h, holdFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = ease(frame, fps);

  if (v.kind === "image" || v.kind === "video") {
    // 图片按真实比例 contain 进面板；镜头从 focusFrom 推/移到 focus（均为相对图片的坐标）
    const aspect = v.aspect ?? 16 / 9;
    const bw = Math.min(w, h * aspect);
    const bh = bw / aspect;
    const ox = (w - bw) / 2;
    const oy = (h - bh) / 2;
    const cam = (r: [number, number, number, number]) => {
      const s = Math.max(1, Math.min(w / (r[2] * bw), h / (r[3] * bh)));
      const px = ox + (r[0] + r[2] / 2) * bw;
      const py = oy + (r[1] + r[3] / 2) * bh;
      // 平移后不露出图片外的空白；缩放后仍比面板小的方向则居中
      const clamp = (t: number, size: number, box: number, off: number) => {
        const c = size / 2;
        const base = (off - c) * s + c; // t=0 时图片左/上边缘位置
        const scaled = box * s;
        if (scaled <= size) return (size - scaled) / 2 - base;
        return Math.min(-base, Math.max(size - scaled - base, t));
      };
      return { s, tx: clamp(-(px - w / 2) * s, w, bw, ox), ty: clamp(-(py - h / 2) * s, h, bh, oy) };
    };
    const a = cam(v.focusFrom ?? [0, 0, 1, 1]);
    const b = cam(v.focus ?? v.focusFrom ?? [0, 0, 1, 1]);
    const moveStart = Math.min(15, holdFrames * 0.15);
    const moveEnd = Math.max(moveStart + 1, Math.min(holdFrames * 0.55, moveStart + 50));
    const p = interpolate(frame, [moveStart, moveEnd], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: (t) => t * t * (3 - 2 * t),
    });
    const s = a.s + (b.s - a.s) * p;
    const tx = a.tx + (b.tx - a.tx) * p;
    const ty = a.ty + (b.ty - a.ty) * p;
    const hl = v.highlight;
    const pulse = 1 + Math.sin(frame / 6) * 0.06;
    const r = (hl?.r ?? 0.04) * bw;
    const hlIn = interpolate(frame, [moveEnd, moveEnd + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <div
        style={{
          width: w,
          height: h,
          overflow: "hidden",
          borderRadius: 20,
          background: v.bg === "dark" ? "#0E1014" : "#FAF9F5",
          opacity: enter,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: ox,
            top: oy,
            width: bw,
            height: bh,
            transform: `translate(${tx}px, ${ty}px) scale(${s})`,
            transformOrigin: `${w / 2 - ox}px ${h / 2 - oy}px`,
          }}
        >
          {v.kind === "video" ? (
            <OffthreadVideo src={staticFile(v.src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Img src={staticFile(v.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          {hl && (
            <div
              style={{
                position: "absolute",
                left: hl.x * bw - r,
                top: hl.y * bh - r,
                width: r * 2,
                height: r * 2,
                borderRadius: "50%",
                border: `${5 / s}px solid ${accent}`,
                boxShadow: `0 0 0 ${6 / s}px ${accent}33`,
                transform: `scale(${pulse})`,
                opacity: hlIn,
              }}
            />
          )}
        </div>
      </div>
    );
  }

  const card: React.CSSProperties = {
    width: w,
    height: h,
    borderRadius: 20,
    background: "#fff",
    padding: "56px 72px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    color: ink,
    opacity: enter,
    transform: `translateY(${(1 - enter) * 24}px)`,
  };

  if (v.kind === "points") {
    return (
      <div style={card}>
        {v.heading && (
          <div style={{ fontSize: 40, fontWeight: 800, marginBottom: 40, color: accent }}>{v.heading}</div>
        )}
        {v.items.map((it, i) => {
          const a = ease(frame, fps, 8 + i * 10);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                fontSize: 46,
                fontWeight: 650,
                margin: "18px 0",
                opacity: a,
                transform: `translateX(${(1 - a) * -40}px)`,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: `${accent}1F`,
                  color: accent,
                  fontSize: 30,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              {it}
            </div>
          );
        })}
      </div>
    );
  }

  if (v.kind === "quote") {
    return (
      <div style={{ ...card, background: "#FFFDF9" }}>
        <div style={{ fontSize: 120, lineHeight: 0.6, color: accent, fontFamily: "Georgia" }}>“</div>
        <div style={{ fontSize: 44, lineHeight: 1.45, fontWeight: 600, fontFamily: "Georgia, 'PingFang SC'" }}>
          {v.text}
        </div>
        {v.zh && <div style={{ fontSize: 34, marginTop: 30, color: "#5B6478", lineHeight: 1.5 }}>{v.zh}</div>}
        {v.by && <div style={{ fontSize: 28, marginTop: 30, color: accent, fontWeight: 700 }}>— {v.by}</div>}
      </div>
    );
  }

  if (v.kind === "stat") {
    const a = ease(frame, fps, 4);
    return (
      <div style={{ ...card, alignItems: "center", textAlign: "center" }}>
        <div style={{ fontSize: 36, color: "#5B6478", fontWeight: 600 }}>{v.label}</div>
        <div
          style={{
            fontSize: 200,
            fontWeight: 850,
            color: accent,
            letterSpacing: -4,
            transform: `scale(${0.8 + a * 0.2})`,
            margin: "10px 0",
          }}
        >
          {v.value}
        </div>
        {v.sub && <div style={{ fontSize: 34, color: ink, fontWeight: 600 }}>{v.sub}</div>}
      </div>
    );
  }

  if (v.kind === "bars") {
    const max = Math.max(...v.items.map((i) => i.value)) * 1.08;
    return (
      <div style={card}>
        <div style={{ fontSize: 38, fontWeight: 800, marginBottom: 36 }}>{v.title}</div>
        {v.items.map((it, i) => {
          const a = ease(frame, fps, 6 + i * 6);
          const pct = (it.value / max) * a;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, margin: "14px 0" }}>
              <div style={{ width: 300, fontSize: 30, fontWeight: it.highlight ? 800 : 500, textAlign: "right", color: it.highlight ? ink : "#5B6478" }}>
                {it.label}
              </div>
              <div style={{ flex: 1, height: 54, background: "#EEF1F6", borderRadius: 12, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${pct * 100}%`,
                    height: "100%",
                    background: it.highlight ? accent : "#B8C2D6",
                    borderRadius: 12,
                  }}
                />
              </div>
              <div style={{ width: 150, fontSize: 34, fontWeight: 800, color: it.highlight ? accent : "#5B6478" }}>
                {(it.value * a).toFixed(it.value % 1 === 0 ? 0 : 1)}
                {v.unit ?? ""}
              </div>
            </div>
          );
        })}
        {v.note && <div style={{ fontSize: 24, color: "#8A93A6", marginTop: 26 }}>{v.note}</div>}
      </div>
    );
  }

  // table
  return (
    <div style={card}>
      {v.title && <div style={{ fontSize: 38, fontWeight: 800, marginBottom: 30 }}>{v.title}</div>}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${v.columns.length}, 1fr)`, fontSize: 32 }}>
        {v.columns.map((c, i) => (
          <div key={i} style={{ padding: "16px 20px", color: "#8A93A6", fontWeight: 700, borderBottom: "2px solid #E3E7EF" }}>
            {c}
          </div>
        ))}
        {v.rows.map((r, ri) => {
          const a = ease(frame, fps, 6 + ri * 6);
          const hi = v.highlightRow === ri;
          return r.map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              style={{
                padding: "20px 20px",
                fontWeight: ci === 0 || hi ? 800 : 550,
                background: hi ? `${accent}14` : "transparent",
                color: hi && ci > 0 ? accent : ink,
                borderBottom: "1px solid #EEF1F6",
                opacity: a,
              }}
            >
              {cell}
            </div>
          ));
        })}
      </div>
      {v.note && <div style={{ fontSize: 24, color: "#8A93A6", marginTop: 26, lineHeight: 1.5 }}>{v.note}</div>}
    </div>
  );
};
