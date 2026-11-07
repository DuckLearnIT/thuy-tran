"""Raster the supplied print PDF's trim faces, never its marks/bleed, into web textures."""
import hashlib
import json
import sys
from pathlib import Path

import pymupdf
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PDF = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(
    r'C:/Users/Duck/Downloads/Hop_Boardgame_In_20261105/Hop_Lien_Bleed_2cm_36x45.pdf')
REVISED = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(r'C:/Users/Duck/Downloads/In')
OUT = ROOT / 'src/assets/box'
OUT.mkdir(parents=True, exist_ok=True)
doc = pymupdf.open(PDF)
assert len(doc) == 2
assert abs(doc[0].rect.width * 25.4 / 72 - 360) < .01
assert abs(doc[0].rect.height * 25.4 / 72 - 450) < .01
files = {'front': 'mattruoc moi copy.pdf', 'left': 'mattrai moi.pdf', 'right': 'matphaimoi.pdf',
         'top': 'mattren moi.pdf', 'bottom': 'matduoi moi.pdf'}
revised = {label: pymupdf.open(REVISED / name) for label, name in files.items()}
assert all(len(d) == 1 for d in revised.values())
fw, fd = revised['front'][0].rect.width, revised['front'][0].rect.height
fh = revised['left'][0].rect.width
for side in ['left', 'right']:
    assert abs(revised[side][0].rect.width - fh) < .01 and abs(revised[side][0].rect.height - fd) < .01
for side in ['top', 'bottom']:
    assert abs(revised[side][0].rect.width - fw) < .01 and abs(revised[side][0].rect.height - fh) < .01
mm = {key: round(value * 25.4 / 72, 6) for key, value in [('width', fw), ('depth', fd), ('height', fh)]}
front_pixels = (960, round(960 * fd / fw))

# Bounds are x0,y0,x1,y1 in millimetres on the supplied 360x450mm sheets.
# PIL rotation is counter-clockwise; orientations follow folding each wall.
faces = {
    'front': (0, (85, 100, 275, 350), 0),
    'back': (1, (85, 100, 275, 350), 0),
    'left': (0, (35, 100, 85, 350), 90),
    'right': (0, (275, 100, 325, 350), -90),
    'top': (0, (85, 50, 275, 100), 180),
    'bottom': (0, (85, 350, 275, 400), 0),
    'returnLeft': (0, (15, 100, 35, 350), 90),
    'returnRight': (0, (325, 100, 345, 350), -90),
    'returnTop': (0, (85, 30, 275, 50), 180),
    'returnBottom': (0, (85, 400, 275, 420), 0),
}
rects = {
    'front': (4, 4, *front_pixels), 'back': (972, 4, *front_pixels),
    'left': (4, 1415, 1250, 221), 'right': (4, 1644, 1250, 221),
    'top': (1262, 1415, 760, 196), 'bottom': (1262, 1619, 760, 196),
    'returnLeft': (4, 1873, 1000, 81), 'returnRight': (1012, 1873, 1000, 81),
    'returnTop': (4, 1962, 570, 67), 'returnBottom': (582, 1962, 570, 67),
    'paper': (1270, 1823, 32, 32), 'navy': (1310, 1823, 32, 32), 'edge': (1350, 1823, 32, 32),
}


def edge_fit(image, size):
    """Contain the complete face; repeat edge pixels for any changed-box margins."""
    image = ImageOps.contain(image, size, Image.Resampling.LANCZOS)
    w, h = image.size
    x, y = (size[0] - w) // 2, (size[1] - h) // 2
    result = Image.new('RGB', size)
    result.paste(image, (x, y))
    if y:
        result.paste(image.crop((0, 0, w, 1)).resize((w, y)), (x, 0))
    if size[1] - y - h:
        result.paste(image.crop((0, h - 1, w, h)).resize((w, size[1] - y - h)), (x, y + h))
    if x:
        result.paste(result.crop((x, 0, x + 1, size[1])).resize((x, size[1])), (0, 0))
    if size[0] - x - w:
        result.paste(result.crop((x + w - 1, 0, x + w, size[1])).resize((size[0] - x - w, size[1])), (x + w, 0))
    return result


def raster(label, size, rotate=True):
    if label.startswith('return'):
        parent = label.removeprefix('return').lower()
        # The new PDFs contain no turn-in artwork. Continue their actual edge,
        # just as the original 20mm turn-ins were made; never reuse old print strips.
        source = raster(parent, (size[0], max(2, round(size[0] * fh / (fd if parent in ['left', 'right'] else fw)))))
        return source.crop((0, source.height - 1, source.width, source.height)).resize(size)
    if label in revised:
        page = revised[label][0]
        clip = page.rect
        angle = {'left': 90, 'right': -90}.get(label, 0)
    else:
        page_index, bounds, angle = faces[label]
        page = doc[page_index]
        clip = pymupdf.Rect([v * 72 / 25.4 for v in bounds])
    w, h = size if not rotate or angle % 180 == 0 else size[::-1]
    ratio = max(w / clip.width, h / clip.height)
    pix = page.get_pixmap(matrix=pymupdf.Matrix(ratio, ratio), clip=clip, alpha=False)
    image = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    if rotate and angle:
        image = image.rotate(angle, expand=True)
    return edge_fit(image, size)


atlas = Image.new('RGB', (2048, 2048), '#f2eadb')
for label in faces:
    x, y, w, h = rects[label]
    image = raster(label, (w, h))
    gutter = ImageOps.expand(image, border=2)
    # Repeat boundary pixels into the two-texel gutter for clean mipmapped seams.
    gutter.paste(image.crop((0, 0, w, 1)).resize((w, 2)), (2, 0))
    gutter.paste(image.crop((0, h - 1, w, h)).resize((w, 2)), (2, h + 2))
    gutter.paste(gutter.crop((2, 0, 3, h + 4)).resize((2, h + 4)), (0, 0))
    gutter.paste(gutter.crop((w + 1, 0, w + 2, h + 4)).resize((2, h + 4)), (w + 2, 0))
    atlas.paste(gutter, (x - 2, y - 2))

for label, color in [('paper', '#f2eadb'), ('navy', '#0c4964'), ('edge', '#e4dbc9')]:
    x, y, w, h = rects[label]
    atlas.paste(color, (x - 2, y - 2, x + w + 2, y + h + 2))

atlas.save(OUT / 'print-atlas.webp', quality=84, method=6)
atlas.resize((1024, 1024), Image.Resampling.LANCZOS).save(OUT / 'print-atlas-small.webp', quality=84, method=6)
raster('front', front_pixels).save(OUT / 'front.webp', quality=88, method=6)
raster('right', (128, round(128 * fd / fh)), rotate=False).save(OUT / 'right.webp', quality=87, method=6)
raster('bottom', (456, round(456 * fh / fw))).save(OUT / 'bottom.webp', quality=87, method=6)

data = {'atlasSize': 2048, 'millimetres': mm, 'frontPixels': front_pixels, 'turninMm': 20,
        'rects': rects, 'sourceSha256': hashlib.sha256(PDF.read_bytes()).hexdigest(),
        'revisedFaces': {label: {'filename': name, 'sha256': hashlib.sha256((REVISED / name).read_bytes()).hexdigest()}
                         for label, name in files.items()},
        'backFit': 'Original back retained completely with edge bleed in the new proportions.'}
(OUT / 'layout.json').write_text(json.dumps(data, indent=2) + '\n', encoding='utf8')
for path in OUT.glob('*.webp'):
    print(path.name, Image.open(path).size, path.stat().st_size, 'bytes')
