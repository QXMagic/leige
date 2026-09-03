#!/usr/bin/env python3
"""Crop + downscale the pet animation frames.

The source frames are 1920x1920 but 71-86% of every frame is transparent, and
the game never draws a pet larger than ~370 design px.  This script:

  1. computes ONE alpha bounding box per species, unioned over all 96 frames
     (idle + eat + sad) so every frame of every action crops identically --
     that is what keeps the sequence aligned and free of jitter;
  2. pads it slightly, then rescales so the original 1920px frame maps to
     VIRTUAL_FRAME px (i.e. the stored crop keeps exactly the pixel density of
     a VIRTUAL_FRAME x VIRTUAL_FRAME full frame);
  3. emits the per-species sprite offset needed to keep the pet rendering at
     the same on-screen position as before the crop.

Writes to OUT_ROOT; nothing is overwritten until you swap the directories.
"""

import json
import os
import sys
import glob
from PIL import Image

SRC_ROOT = "resource/animations"
OUT_ROOT = "resource/animations_shrunk"
SRC_FRAME = 1920.0        # original frame is SRC_FRAME x SRC_FRAME
VIRTUAL_FRAME = 512.0     # stored pixel density == a 512x512 full frame
PAD = 8                   # transparent margin, in source px, to avoid edge bleed


def union_bbox(species: str):
    box = None
    for f in sorted(glob.glob(os.path.join(SRC_ROOT, species, "*", "*.png"))):
        b = Image.open(f).split()[3].getbbox()
        if b is None:
            continue
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]),
                                     max(box[2], b[2]), max(box[3], b[3]))
    x0, y0, x1, y1 = box
    x0 = max(0, x0 - PAD)
    y0 = max(0, y0 - PAD)
    x1 = min(int(SRC_FRAME), x1 + PAD)
    y1 = min(int(SRC_FRAME), y1 + PAD)
    return (x0, y0, x1, y1)


def main():
    k = VIRTUAL_FRAME / SRC_FRAME
    species = sorted(os.listdir(SRC_ROOT))
    offsets, before, after = {}, 0, 0

    for sp in species:
        box = union_bbox(sp)
        w, h = box[2] - box[0], box[3] - box[1]
        ow, oh = max(1, round(w * k)), max(1, round(h * k))
        # crop centre relative to the original frame centre, in VIRTUAL_FRAME space
        cx = ((box[0] + box[2]) / 2.0 - SRC_FRAME / 2.0) * k
        cy = ((box[1] + box[3]) / 2.0 - SRC_FRAME / 2.0) * k
        offsets[sp] = [round(cx, 2), round(cy, 2)]

        files = sorted(glob.glob(os.path.join(SRC_ROOT, sp, "*", "*.png")))
        for f in files:
            rel = os.path.relpath(f, SRC_ROOT)
            dst = os.path.join(OUT_ROOT, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            im = Image.open(f).convert("RGBA")
            im.crop(box).resize((ow, oh), Image.LANCZOS).save(dst, "PNG", optimize=True)
            before += os.path.getsize(f)
            after += os.path.getsize(dst)
        print("  %-8s bbox=%-24s -> %dx%-4d  offset=(%.1f, %.1f)"
              % (sp, str(box), ow, oh, cx, cy), flush=True)

    with open(os.path.join(OUT_ROOT, "offsets.json"), "w") as fh:
        json.dump({"virtual_frame": VIRTUAL_FRAME, "offsets": offsets}, fh, indent=1)

    print("\n%.1f MB  ->  %.1f MB   (%.1f%%, saved %.0f MB)"
          % (before / 1e6, after / 1e6, 100.0 * after / before, (before - after) / 1e6))
    print("\nGDScript offsets:")
    for sp in species:
        print('\t"%s": Vector2(%s, %s),' % (sp, offsets[sp][0], offsets[sp][1]))


if __name__ == "__main__":
    sys.exit(main())
