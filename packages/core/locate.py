"""在官方图表里找数据点，输出相对坐标（0–1，相对原图），用于 episode.json 的 highlight / focus。

用法（.venv/bin/python -I packages/core/locate.py ...，或 npm run locate -- ...）：
  locate.py IMG --grid OUT.jpg           生成带 10% 网格和刻度的预览图，先用眼睛找大致区域
  locate.py IMG --sample 0.69,0.26       读取该相对位置的像素颜色（拿到数据点的颜色）
  locate.py IMG --color '#62998' [--tol 45] [--k 11]
                                          找出该颜色的所有色块（数据点/柱子），按 x 排序输出中心与尺寸

重要：坐标一律相对“原图”计算。不要在缩放、拼接过的预览图上量坐标再换算。
"""
import argparse
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument("img")
ap.add_argument("--grid")
ap.add_argument("--sample")
ap.add_argument("--color")
ap.add_argument("--tol", type=int, default=45)
ap.add_argument("--k", type=int, default=11, help="去掉细线的形态学核大小；数据点越小设得越小")
a = ap.parse_args()

im = Image.open(a.img).convert("RGB")
W, H = im.size

if a.grid:
    g = im.copy()
    d = ImageDraw.Draw(g)
    for i in range(1, 10):
        x, y = W * i // 10, H * i // 10
        d.line([(x, 0), (x, H)], fill=(255, 0, 0), width=max(1, W // 800))
        d.line([(0, y), (W, y)], fill=(255, 0, 0), width=max(1, W // 800))
        d.text((x + 4, 4), f"{i/10:.1f}", fill=(255, 0, 0))
        d.text((4, y + 4), f"{i/10:.1f}", fill=(255, 0, 0))
    g.thumbnail((1400, 1400))
    g.save(a.grid)
    print(json.dumps({"grid": a.grid, "size": [W, H], "aspect": round(W / H, 4)}))

if a.sample:
    x, y = (float(v) for v in a.sample.split(","))
    r, g_, b = im.getpixel((min(W - 1, int(x * W)), min(H - 1, int(y * H))))
    print(json.dumps({"at": [x, y], "color": f"#{r:02x}{g_:02x}{b:02x}"}))

if a.color:
    c = a.color.lstrip("#")
    rgb = np.array([int(c[i : i + 2], 16) for i in (0, 2, 4)])
    arr = np.asarray(im).astype(int)
    mask = (np.abs(arr - rgb).sum(-1) < a.tol).astype(np.uint8) * 255
    m = Image.fromarray(mask).filter(ImageFilter.MinFilter(a.k)).filter(ImageFilter.MaxFilter(a.k))
    on = np.asarray(m) > 0
    seen = np.zeros_like(on)
    blobs = []
    for y0, x0 in zip(*np.nonzero(on)):
        if seen[y0, x0]:
            continue
        stack, pts = [(y0, x0)], []
        seen[y0, x0] = True
        while stack:
            cy, cx = stack.pop()
            pts.append((cy, cx))
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < H and 0 <= nx < W and on[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        p = np.array(pts)
        blobs.append({
            "x": round(p[:, 1].mean() / W, 3),
            "y": round(p[:, 0].mean() / H, 3),
            "top": round(p[:, 0].min() / H, 3),
            "w": round((np.ptp(p[:, 1]) + 1) / W, 3),
            "h": round((np.ptp(p[:, 0]) + 1) / H, 3),
        })
    blobs.sort(key=lambda b: b["x"])
    print(json.dumps({"color": a.color, "count": len(blobs), "blobs": blobs}, ensure_ascii=False))
