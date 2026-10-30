"""Regenerate the favicon set in public/ from the brand font: a cream "T" on vermilion.

    python scripts/make-favicon.py

Writes favicon.svg (glyph outline, no font needed), favicon.ico (16/32/48) and apple-touch-icon.png (180).
"""
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / 'public' / 'fonts' / 'NVN-Yellost-Regular-VH.ttf'
OUT = ROOT / 'public'
RED, CREAM = '#b5362b', '#f6e9d7'
GLYPH = 'T'
HEIGHT = 0.64     # glyph height as a share of the tile
CORNER = 0.22     # corner radius as a share of the tile (favicon only; the touch icon is full-bleed)
VIEW = 64

font = TTFont(FONT)
glyphs = font.getGlyphSet()
name = font.getBestCmap()[ord(GLYPH)]
bounds = BoundsPen(glyphs)
glyphs[name].draw(bounds)
x0, y0, x1, y1 = bounds.bounds
scale = VIEW * HEIGHT / (y1 - y0)
# Centre the real outline (not the advance box) in the tile; font y points up, SVG y points down.
tx = (VIEW - (x1 - x0) * scale) / 2 - x0 * scale
ty = (VIEW + (y1 - y0) * scale) / 2 + y0 * scale


def outline(size: int):
    """Glyph outline as an SVG path in a size x size box."""
    k = size / VIEW
    pen = SVGPathPen(glyphs, ntos=lambda v: f'{v:.2f}'.rstrip('0').rstrip('.'))
    glyphs[name].draw(TransformPen(pen, (scale * k, 0, 0, -scale * k, tx * k, ty * k)))
    return pen.getCommands()


svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEW} {VIEW}">'
       f'<rect width="{VIEW}" height="{VIEW}" rx="{VIEW * CORNER:.1f}" fill="{RED}"/>'
       f'<path d="{outline(VIEW)}" fill="{CREAM}"/></svg>\n')
(OUT / 'favicon.svg').write_text(svg, encoding='utf-8')


def raster(size: int, rounded: bool) -> Image.Image:
    """Draw the same outline by filling the font's contours through Pillow at 8x, then shrink."""
    from fontTools.pens.recordingPen import RecordingPen
    n = size * 8
    k = n / VIEW
    rec = RecordingPen()
    glyphs[name].draw(TransformPen(rec, (scale * k, 0, 0, -scale * k, tx * k, ty * k)))
    contours, current = [], []

    def flatten_quad(p0, p1, p2, steps=12):
        return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
                 (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in (i / steps for i in range(1, steps + 1))]

    def flatten_cubic(p0, p1, p2, p3, steps=16):
        return [((1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * p1[0] + 3 * (1 - t) * t * t * p2[0] + t ** 3 * p3[0],
                 (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * p1[1] + 3 * (1 - t) * t * t * p2[1] + t ** 3 * p3[1]) for t in (i / steps for i in range(1, steps + 1))]

    for op, args in rec.value:
        if op == 'moveTo':
            current = [args[0]]
        elif op == 'lineTo':
            current.append(args[0])
        elif op == 'qCurveTo':
            # TrueType implied on-curve points between consecutive off-curve points.
            pts = list(args)
            start = current[-1]
            offs, end = pts[:-1], pts[-1]
            for i, off in enumerate(offs):
                nxt = end if i == len(offs) - 1 else ((off[0] + offs[i + 1][0]) / 2, (off[1] + offs[i + 1][1]) / 2)
                current.extend(flatten_quad(start, off, nxt))
                start = nxt
        elif op == 'curveTo':
            current.extend(flatten_cubic(current[-1], *args))
        elif op in ('closePath', 'endPath'):
            contours.append(current)
            current = []

    mask = Image.new('L', (n, n), 0)
    # Even-odd fill so counters (holes) stay open.
    for contour in contours:
        layer = Image.new('L', (n, n), 0)
        ImageDraw.Draw(layer).polygon(contour, fill=255)
        mask = ImageChops.difference(mask, layer)
    tile = Image.new('RGBA', (n, n), RED)
    ink = Image.new('RGBA', (n, n), CREAM)
    tile.paste(ink, (0, 0), mask)
    if rounded:
        corner = Image.new('L', (n, n), 0)
        ImageDraw.Draw(corner).rounded_rectangle([0, 0, n - 1, n - 1], radius=int(n * CORNER), fill=255)
        clear = Image.new('RGBA', (n, n), (0, 0, 0, 0))
        tile = Image.composite(tile, clear, corner)
    return tile.resize((size, size), Image.LANCZOS)


sizes = [16, 32, 48]
frames = [raster(s, True) for s in sizes]
frames[-1].save(OUT / 'favicon.ico', format='ICO', sizes=[(s, s) for s in sizes], append_images=frames[:-1])
raster(180, False).convert('RGB').save(OUT / 'apple-touch-icon.png', optimize=True)
print('favicon.svg, favicon.ico, apple-touch-icon.png written to', OUT)
