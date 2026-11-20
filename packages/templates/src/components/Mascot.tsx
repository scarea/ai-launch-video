import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";

export type Pose = "idle" | "point" | "think";

export type AvatarConfig =
  | { type: "svg" }
  /** poses 可选再给 `${pose}Talk`（张嘴版），说话时与闭嘴版交替 */
  | { type: "png"; poses: Partial<Record<Pose | `${Pose}Talk`, string>> };

/**
 * 「小澜」—— 首发拆解栏目的原创占位形象（SVG 绘制）。
 * brand.json 里 avatar.type 改为 png 并提供 poses 后，会改用立绘 PNG。
 */
export const Mascot: React.FC<{
  pose: Pose;
  talking: boolean;
  avatar: AvatarConfig;
  height: number;
}> = ({ pose, talking, avatar, height }) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 22) * 6;

  if (avatar.type === "png") {
    const closed = avatar.poses[pose] ?? avatar.poses.idle;
    const open = avatar.poses[`${pose}Talk`];
    const src = talking && open && Math.floor(frame / 5) % 2 === 0 ? open : closed;
    if (src) {
      const breathe = 1 + Math.sin(frame / 18) * 0.008;
      return (
        <Img
          src={staticFile(src)}
          style={{
            height,
            transform: `translateY(${bob}px) scaleY(${breathe})`,
            transformOrigin: "50% 100%",
            objectFit: "contain",
            filter: "drop-shadow(0 12px 18px rgba(31,42,77,0.12))",
          }}
        />
      );
    }
  }

  const blink = frame % 96 < 4;
  const mouthOpen = talking && Math.floor(frame / 4) % 2 === 0;
  const armRot = pose === "point" ? 118 + Math.sin(frame / 10) * 4 : pose === "think" ? -150 : 8;

  const navy = "#1F2A4D";
  const hair = "#B9C9E6";
  const hairShade = "#8EA3CC";
  const skin = "#FFE8DA";
  const hoodie = "#FBF6EC";

  return (
    <svg
      viewBox="0 0 400 600"
      style={{ height, transform: `translateY(${bob}px)`, overflow: "visible" }}
    >
      {/* 影子 */}
      <ellipse cx="200" cy="592" rx="95" ry="10" fill="rgba(31,42,77,0.12)" />
      {/* 后发 */}
      <path d="M70 200 Q70 60 200 55 Q330 60 330 200 L338 330 Q300 350 270 320 L130 320 Q100 350 62 330 Z" fill={hairShade} />
      {/* 腿 */}
      <rect x="160" y="500" width="30" height="66" rx="12" fill={skin} />
      <rect x="210" y="500" width="30" height="66" rx="12" fill={skin} />
      <rect x="146" y="556" width="54" height="30" rx="14" fill="#fff" stroke={navy} strokeWidth="4" />
      <rect x="202" y="556" width="54" height="30" rx="14" fill="#fff" stroke={navy} strokeWidth="4" />
      {/* 裙 */}
      <path d="M128 455 L272 455 L292 515 L108 515 Z" fill={navy} />
      <path d="M150 458 L140 512 M200 458 L200 514 M250 458 L260 512" stroke="#33417A" strokeWidth="5" />
      {/* 左臂（自然下垂） */}
      <g transform="rotate(12 262 345)">
        <rect x="250" y="340" width="34" height="108" rx="17" fill={hoodie} stroke={navy} strokeWidth="4" />
        <circle cx="267" cy="452" r="16" fill={skin} />
      </g>
      {/* 卫衣 */}
      <path d="M140 330 Q200 310 260 330 L282 470 Q200 488 118 470 Z" fill={hoodie} stroke={navy} strokeWidth="4" />
      <path d="M150 450 L250 450" stroke={navy} strokeWidth="3" />
      <path d="M172 360 L172 400 L196 400 M228 360 L228 420 L208 420" stroke="#5A7BD6" strokeWidth="3" fill="none" />
      <circle cx="196" cy="400" r="4" fill="#5A7BD6" />
      <circle cx="208" cy="420" r="4" fill="#5A7BD6" />
      {/* 耳机挂脖 */}
      <path d="M138 322 Q200 372 262 322" stroke={navy} strokeWidth="10" fill="none" strokeLinecap="round" />
      <rect x="120" y="306" width="30" height="40" rx="12" fill="#5A7BD6" stroke={navy} strokeWidth="4" />
      <rect x="250" y="306" width="30" height="40" rx="12" fill="#5A7BD6" stroke={navy} strokeWidth="4" />
      {/* 右臂（姿态） */}
      <g transform={`rotate(${armRot} 140 345)`}>
        <rect x="118" y="340" width="34" height="108" rx="17" fill={hoodie} stroke={navy} strokeWidth="4" />
        <circle cx="135" cy="452" r="16" fill={skin} />
        {pose === "point" && <rect x="129" y="456" width="10" height="26" rx="5" fill={skin} />}
      </g>
      {/* 脸 */}
      <ellipse cx="200" cy="205" rx="122" ry="112" fill={skin} />
      {/* 刘海 */}
      <path d="M78 200 Q80 80 200 78 Q320 80 322 200 Q300 140 262 128 Q250 170 214 150 Q196 180 160 148 Q130 176 106 150 Q92 170 78 200 Z" fill={hair} />
      <path d="M92 190 Q96 250 110 300 L86 300 Q70 240 78 200 Z M308 190 Q304 250 290 300 L314 300 Q330 240 322 200 Z" fill={hair} />
      {/* 星星发夹 */}
      <path d="M282 96 l8 16 18 3 -13 12 3 18 -16 -9 -16 9 3 -18 -13 -12 18 -3 Z" fill="#FFD54A" stroke="#E0A800" strokeWidth="3" />
      {/* 眼睛 */}
      {blink ? (
        <>
          <path d="M132 222 Q152 232 172 222" stroke={navy} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M228 222 Q248 232 268 222" stroke={navy} strokeWidth="6" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="152" cy="218" rx="22" ry="29" fill="#1E8C95" />
          <ellipse cx="248" cy="218" rx="22" ry="29" fill="#1E8C95" />
          <ellipse cx="152" cy="226" rx="15" ry="18" fill="#3FC8C4" />
          <ellipse cx="248" cy="226" rx="15" ry="18" fill="#3FC8C4" />
          <circle cx="144" cy="206" r="8" fill="#fff" />
          <circle cx="240" cy="206" r="8" fill="#fff" />
          <circle cx="160" cy="232" r="4" fill="#fff" />
          <circle cx="256" cy="232" r="4" fill="#fff" />
        </>
      )}
      {/* 腮红 */}
      <ellipse cx="122" cy="256" rx="18" ry="9" fill="#FFB3BF" opacity="0.7" />
      <ellipse cx="278" cy="256" rx="18" ry="9" fill="#FFB3BF" opacity="0.7" />
      {/* 嘴 */}
      {mouthOpen ? (
        <ellipse cx="200" cy="268" rx="11" ry="9" fill="#C6535F" />
      ) : (
        <path d="M188 264 Q200 274 212 264" stroke="#C6535F" strokeWidth="5" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
};
