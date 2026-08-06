#!/usr/bin/env python3
"""Build transparent, vintage-postcard landmark cutouts from licensed source photos."""
from __future__ import annotations

from pathlib import Path
import random

import cv2
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT = ASSETS / "landmarks"
OUT.mkdir(parents=True, exist_ok=True)

RNG = np.random.default_rng(17)


def open_rgb(name: str) -> Image.Image:
    return Image.open(ASSETS / name).convert("RGB")


def polygon_mask(size: tuple[int, int], polygons: list[list[tuple[int, int]]] | None = None,
                 lines: list[tuple[list[tuple[int, int]], int]] | None = None,
                 ellipses: list[tuple[int, int, int, int]] | None = None) -> np.ndarray:
    canvas = Image.new("L", size, 0)
    draw = ImageDraw.Draw(canvas)
    for points in polygons or []:
        draw.polygon(points, fill=255)
    for points, width in lines or []:
        draw.line(points, fill=255, width=width, joint="curve")
    for box in ellipses or []:
        draw.ellipse(box, fill=255)
    return np.asarray(canvas) > 0


def connected_blue_sky(rgb: np.ndarray, hmin: int = 88, hmax: int = 135,
                       sat_min: int = 35, value_min: int = 55,
                       blue_bias: int = 18) -> np.ndarray:
    """Return likely sky pixels connected to an outside edge.

    A connected-component pass keeps similarly blue details inside a landmark from
    disappearing unless they are actually connected to the surrounding sky.
    """
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    h, s, v = cv2.split(hsv)
    r, g, b = cv2.split(rgb)
    hue_blue = (h >= hmin) & (h <= hmax) & (s >= sat_min) & (v >= value_min)
    channel_blue = (b.astype(np.int16) - r.astype(np.int16) >= blue_bias) & (
        b.astype(np.int16) - g.astype(np.int16) >= 2
    ) & (b >= value_min)
    candidate = (hue_blue | channel_blue).astype(np.uint8)

    # Lightly close tiny compression gaps so the sky remains one connected field.
    candidate = cv2.morphologyEx(candidate, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    count, labels = cv2.connectedComponents(candidate, connectivity=8)
    if count <= 1:
        return np.zeros(candidate.shape, dtype=bool)

    # Only the top edge and the upper portions of the side edges are treated as
    # exterior sky. Including the bottom edge can mistakenly erase bluish
    # asphalt or shadowed ground.
    side_limit = max(8, labels.shape[0] // 2)
    edge_labels = np.unique(np.concatenate([
        labels[:8, :].ravel(),
        labels[:side_limit, :8].ravel(),
        labels[:side_limit, -8:].ravel(),
    ]))
    edge_labels = edge_labels[edge_labels != 0]
    return np.isin(labels, edge_labels)


def vintage_grade(image: Image.Image, strength: float = 1.0, brightness: float = 1.0) -> Image.Image:
    image = ImageEnhance.Color(image).enhance(max(0.0, 1.0 - 0.18 * strength))
    image = ImageEnhance.Contrast(image).enhance(1.02)
    image = ImageEnhance.Brightness(image).enhance(brightness)

    arr = np.asarray(image).astype(np.float32)
    warm = np.array([236.0, 196.0, 145.0], dtype=np.float32)
    arr = arr * (1.0 - 0.07 * strength) + warm * (0.07 * strength)
    grain = RNG.normal(0.0, 2.7 * strength, arr.shape[:2])[:, :, None]
    arr = np.clip(arr + grain, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGB")


def add_paper_border(rgb: Image.Image, alpha: np.ndarray, border_px: int = 10,
                     pad: int = 26, label: str = "") -> Image.Image:
    alpha_u8 = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
    # A tiny blur softens aliasing but preserves the silhouette.
    alpha_u8 = cv2.GaussianBlur(alpha_u8, (0, 0), 0.65)
    source_alpha = Image.fromarray(alpha_u8, "L")

    dilation_size = max(3, border_px * 2 + 1)
    paper_alpha = source_alpha.filter(ImageFilter.MaxFilter(dilation_size))

    # Warm paper with subtle mottling.
    a = np.asarray(paper_alpha).astype(np.uint8)
    h, w = a.shape
    base = np.empty((h, w, 4), dtype=np.uint8)
    paper_noise = RNG.normal(0, 3.0, (h, w, 1))
    paper = np.clip(np.array([246, 226, 188], dtype=np.float32) + paper_noise, 0, 255).astype(np.uint8)
    base[..., :3] = paper
    base[..., 3] = a
    result = Image.fromarray(base, "RGBA")

    photo = rgb.convert("RGBA")
    photo.putalpha(source_alpha)
    result.alpha_composite(photo)

    bbox = result.getbbox()
    if bbox is None:
        raise ValueError(f"Empty cutout for {label or 'image'}")
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(result.width, right + pad)
    bottom = min(result.height, bottom + pad)
    return result.crop((left, top, right, bottom))


def save_cutout(name: str, source: Image.Image, alpha: np.ndarray,
                vintage_strength: float = 1.0, brightness: float = 1.0,
                border_px: int = 10) -> None:
    graded = vintage_grade(source, strength=vintage_strength, brightness=brightness)
    out = add_paper_border(graded, alpha.astype(np.float32), border_px=border_px, label=name)
    out_path = OUT / f"{name}.webp"
    out.save(out_path, "WEBP", quality=92, method=6, exact=True)
    print(f"{out_path.relative_to(ROOT)} {out.size[0]}x{out.size[1]}")


def build_concrete() -> None:
    image = open_rgb("source-concrete-blocks.jpg")
    w, h = image.size
    skyline = [
        (0, 92), (34, 92), (34, 98), (242, 102), (242, 129),
        (391, 126), (391, 120), (501, 128), (501, 140),
        (589, 142), (589, 148), (662, 154), (662, 163),
        (714, 164), (714, 160), (766, 168), (766, 173),
        (808, 175), (808, 170), (842, 176), (842, 180),
        (875, 181), (875, 177), (904, 184), (904, 196),
        (w, 197), (w, h), (0, h),
    ]
    alpha = polygon_mask(image.size, [skyline])
    save_cutout("concrete", image, alpha, border_px=8)


def build_stardust() -> None:
    image = open_rgb("source-stardust.jpg")
    rgb = np.asarray(image)
    sky = connected_blue_sky(rgb, hmin=85, hmax=135, sat_min=28, value_min=65, blue_bias=15)
    polygons = [
        # Star, tower, marquee and its two supports.
        [(626, 194), (634, 208), (649, 214), (638, 226), (641, 241),
         (626, 233), (612, 242), (616, 226), (604, 216), (619, 210)],
        [(608, 219), (643, 219), (654, 408), (598, 408)],
        [(536, 405), (715, 403), (722, 464), (534, 465)],
        [(551, 456), (573, 456), (571, 557), (553, 557)],
        [(681, 455), (700, 455), (697, 555), (683, 555)],
    ]
    geom = polygon_mask(image.size, polygons)
    # Preserve the weathered sign while removing any small wedges of blue sky.
    alpha = geom & ~sky
    # The sign itself includes faded blue paint; restore the solid central shapes.
    core = polygon_mask(image.size, polygons[1:3])
    alpha |= core
    save_cutout("stardust", image, alpha, vintage_strength=0.75, brightness=1.04, border_px=9)


def build_downtown() -> None:
    image = open_rgb("source-highland-ave.jpg")
    rgb = np.asarray(image)
    sky = connected_blue_sky(rgb, hmin=83, hmax=135, sat_min=28, value_min=65, blue_bias=12)
    w, h = image.size
    geom = polygon_mask(image.size, [[(0, 172), (w, 172), (w, h), (0, h)]])
    alpha = geom & ~sky
    save_cutout("downtown", image, alpha, vintage_strength=0.9, border_px=9)


def build_courthouse() -> None:
    image = open_rgb("source-courthouse.jpg")
    rgb = np.asarray(image)
    sky = connected_blue_sky(rgb, hmin=88, hmax=140, sat_min=38, value_min=55, blue_bias=18)
    geom = polygon_mask(image.size, [[(120, 25), (1180, 25), (1180, 845), (120, 845)]])
    alpha = geom & ~sky
    save_cutout("courthouse", image, alpha, vintage_strength=0.95, border_px=10)


def build_water_tower() -> None:
    image = open_rgb("source-water-tower-panoramio.jpg")

    # The tower's lattice is very thin. A hand-traced geometry mask keeps the
    # actual photographed metalwork while avoiding the blue sky and trees.
    tank_shapes = [
        [(377, 440), (550, 440), (558, 585), (546, 610),
         (516, 678), (483, 713), (447, 704), (405, 672),
         (378, 620)],
        [(365, 474), (378, 431), (410, 410), (489, 402),
         (535, 417), (560, 447), (558, 485), (535, 470),
         (395, 470)],
    ]
    ellipses = [
        (365, 403, 562, 489),   # upper rim and cap
        (363, 565, 568, 636),   # lower ring
    ]
    lines = [
        ([(384, 585), (244, 1608)], 15),
        ([(438, 581), (420, 1608)], 14),
        ([(488, 692), (551, 1608)], 13),
        ([(552, 585), (784, 1608)], 15),
        ([(379, 486), (363, 760)], 8),
        ([(354, 742), (590, 742)], 9),
        ([(333, 899), (626, 899)], 9),
        ([(309, 1097), (668, 1097)], 9),
        ([(281, 1405), (731, 1405)], 10),
        ([(354, 742), (626, 899)], 7),
        ([(590, 742), (333, 899)], 7),
        ([(333, 899), (668, 1097)], 7),
        ([(626, 899), (309, 1097)], 7),
        ([(309, 1097), (731, 1405)], 7),
        ([(668, 1097), (281, 1405)], 7),
        ([(281, 1405), (784, 1608)], 7),
        ([(731, 1405), (244, 1608)], 7),
        ([(467, 695), (486, 1608)], 9),
    ]
    alpha = polygon_mask(image.size, tank_shapes, lines=lines, ellipses=ellipses)
    save_cutout("water-tower", image, alpha, vintage_strength=0.7, brightness=1.02, border_px=9)


def build_teepees() -> None:
    image = open_rgb("source-el-cosmico.jpg")
    body_polygons = [
        [(190, 414), (267, 284), (289, 286), (323, 408), (302, 420), (205, 421)],
        [(311, 421), (414, 247), (438, 246), (539, 413), (509, 425), (339, 427)],
        [(671, 414), (741, 279), (764, 279), (851, 408), (824, 418), (691, 421)],
    ]
    pole_lines = [
        ([(276, 291), (250, 250)], 4), ([(276, 291), (259, 247)], 4),
        ([(276, 291), (268, 244)], 4), ([(276, 291), (279, 244)], 4),
        ([(276, 291), (289, 249)], 4),
        ([(428, 254), (398, 190)], 4), ([(428, 254), (407, 184)], 4),
        ([(428, 254), (417, 181)], 4), ([(428, 254), (427, 180)], 4),
        ([(428, 254), (438, 183)], 4), ([(428, 254), (449, 187)], 4),
        ([(428, 254), (460, 194)], 4),
        ([(752, 286), (714, 232)], 4), ([(752, 286), (725, 225)], 4),
        ([(752, 286), (739, 220)], 4), ([(752, 286), (752, 221)], 4),
        ([(752, 286), (765, 224)], 4), ([(752, 286), (778, 231)], 4),
    ]
    alpha = polygon_mask(image.size, body_polygons, lines=pole_lines)
    save_cutout("teepees", image, alpha, vintage_strength=0.35, brightness=1.08, border_px=9)


def main() -> None:
    build_concrete()
    build_stardust()
    build_downtown()
    build_courthouse()
    build_water_tower()
    build_teepees()


if __name__ == "__main__":
    main()
