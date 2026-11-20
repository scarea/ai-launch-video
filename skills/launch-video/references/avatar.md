# 主播立绘

## 原则

- **只用原创角色**。不要画、描摹或“改个名字”复刻任何现有作品（游戏、动画、VTuber）里的角色；用户点名要某个现有角色时，说明原因，改做一个风格相近的原创角色
- 用户提供了自己的角色设定图，可以按它来做

## 需要的图（同一个角色，同一画风、同一比例和站位）

| 文件 | 内容 |
|---|---|
| `host-idle.png` | 待机，闭嘴 |
| `host-idleTalk.png` | 待机，张嘴（说话时与 idle 交替） |
| `host-point.png` | 抬手指向左侧（主画面方向），闭嘴 |
| `host-pointTalk.png` | 同上，张嘴 |
| `host-think.png` | 思考（手托下巴） |

## 制作步骤

1. 文生图出第一张全身立绘：竖版 2:3，**纯绿幕背景 #00FF00**，无地面无阴影，全身留边
2. 其余姿势用**图生图**以第一张为参考生成，提示词强调 “same character, same outfit, exactly the same framing, scale and position”
3. 张嘴版用图生图从对应闭嘴版只改嘴型；**所有图必须同一分辨率**（若第一张与其他张尺寸不同，用图生图从其他张反推一张闭嘴版替换）
4. 抠图（多张一起，按同一外接框裁切，保证张嘴/闭嘴对齐）：
   ```bash
   npm run cutout -- brand/avatar 原图1.png 原图2.png ...
   ```
   抠图只在边缘去绿边，白色衣服不会偏色
5. 文件名改成上表，写进 `brand/brand.json` 的 `avatar.poses`（值写 `brand/avatar/host-idle.png` 这样的仓库路径）
6. `npm run stills -- <id>` 看右侧栏：主播区域固定 400px 高，不会被标签和指标环遮挡

原始生成图放 `brand/gen/`（不提交），只提交 `brand/avatar/` 的成品。
