"""绿幕立绘抠图：只在边缘去绿边，内部颜色不动。
用法：.venv/bin/python -I packages/core/cutout.py OUT_DIR in1.png [in2.png ...]
多张图按同一个外接框裁切，保证闭嘴/张嘴版本对齐、各姿势比例一致。
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

import os


def cut(src):
    im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    # 绿色程度：g 比 r、b 中较大者高多少
    spill = g - np.maximum(r, b)
    alpha = np.clip(1.0 - (spill - 40) / 80, 0, 1)  # spill<40 完全不透明，>120 完全透明
    a_img = Image.fromarray((alpha * 255).astype(np.uint8))
    a_img = a_img.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    alpha = np.asarray(a_img).astype(np.float32) / 255
    # 边缘带：原 alpha 未满或邻近透明区域
    edge = np.asarray(Image.fromarray(((alpha < 0.99) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
    g2 = np.where(edge & (spill > 0), np.maximum(r, b), g)
    out = np.dstack([r, g2, b, alpha * 255]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


out_dir, inputs = sys.argv[1], sys.argv[2:]
imgs = [(p, cut(p)) for p in inputs]
boxes = [i.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox() for _, i in imgs]
boxes = [b for b in boxes if b]
W, H = imgs[0][1].size
pad = 12
box = (max(0, min(b[0] for b in boxes) - pad), max(0, min(b[1] for b in boxes) - pad),
       min(W, max(b[2] for b in boxes) + pad), min(H, max(b[3] for b in boxes) + pad))
os.makedirs(out_dir, exist_ok=True)
for p, i in imgs:
    dst = os.path.join(out_dir, os.path.basename(p))
    i.crop(box).save(dst)
    print(f"cutout -> {dst} {box}")
