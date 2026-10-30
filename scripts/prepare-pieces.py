"""Prepare the supplied standees without changing geometry, UVs or material colours."""
import argparse
import io
import json
import struct
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'nha-tuong': 'tuong.glb',
    'nha-binh': 'nhabinh.glb',
    'tham-quan': 'hoatieu.glb',
    'thuyen-nhe': 'thuyenvien.glb',
    'truyen-lenh-lam': 'truyenlenh.glb',
    'huong-dao-luc': 'trinhsat.glb',
    'coc-ngam': 'Full 3d/nh-ChatGPT-20_17_11-21-thg-10-2026-3-Photoroom-standee.glb',
    'do-luong': 'Full 3d/nh-ChatGPT-20_17_08-21-thg-10-2026-1-Photoroom-standee.glb',
    'mai-phuc': 'Full 3d/nh-ChatGPT-20_17_13-21-thg-10-2026-4-standee.glb',
    'nghi-binh': 'Full 3d/nh-ChatGPT-20_17_10-21-thg-10-2026-2-Photoroom-standee.glb',
}

def unpack(path):
    raw = path.read_bytes()
    assert raw[:4] == b'glTF' and struct.unpack_from('<I', raw, 4)[0] == 2
    length = struct.unpack_from('<I', raw, 12)[0]
    doc = json.loads(raw[20:20 + length])
    binary = raw[28 + length:]
    return raw, doc, binary

def prepare(source, target):
    raw, doc, binary = unpack(source)
    replacements = {}
    for image in doc.get('images', []):
        view = doc['bufferViews'][image['bufferView']]
        start = view.get('byteOffset', 0)
        picture = Image.open(io.BytesIO(binary[start:start + view['byteLength']])).convert('RGBA')
        encoded = io.BytesIO()
        picture.save(encoded, 'WEBP', quality=92, method=6, exact=True)
        replacements[image['bufferView']] = encoded.getvalue()
        image['mimeType'] = 'image/webp'
    rebuilt = bytearray()
    for index, view in enumerate(doc['bufferViews']):
        while len(rebuilt) % 4: rebuilt.append(0)
        start = view.get('byteOffset', 0)
        payload = replacements.get(index, binary[start:start + view['byteLength']])
        view['byteOffset'], view['byteLength'] = len(rebuilt), len(payload)
        rebuilt.extend(payload)
    for texture in doc.get('textures', []):
        texture.setdefault('extensions', {})['EXT_texture_webp'] = {'source': texture.pop('source')}
    for field in ('extensionsUsed', 'extensionsRequired'):
        doc[field] = list(dict.fromkeys(doc.get(field, []) + ['EXT_texture_webp']))
    doc['buffers'][0]['byteLength'] = len(rebuilt)
    while len(rebuilt) % 4: rebuilt.append(0)
    metadata = json.dumps(doc, ensure_ascii=False, separators=(',', ':')).encode()
    metadata += b' ' * (-len(metadata) % 4)
    result = struct.pack('<4sII', b'glTF', 2, 28 + len(metadata) + len(rebuilt))
    result += struct.pack('<I4s', len(metadata), b'JSON') + metadata
    result += struct.pack('<I4s', len(rebuilt), b'BIN\0') + rebuilt
    target.write_bytes(result)
    # Geometry views must be byte-identical after repacking.
    _, check, packed = unpack(target)
    for i, view in enumerate(check['bufferViews']):
        if i not in replacements:
            old = json.loads(raw[20:20 + struct.unpack_from('<I', raw, 12)[0]])['bufferViews'][i]
            assert packed[view['byteOffset']:view['byteOffset'] + view['byteLength']] == binary[old.get('byteOffset', 0):old.get('byteOffset', 0) + old['byteLength']]
    return len(raw), len(result)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=Path.home() / 'Downloads')
    parser.add_argument('--characters-only', action='store_true')
    args = parser.parse_args()
    destination = ROOT / 'src/assets/pieces'
    destination.mkdir(parents=True, exist_ok=True)
    selected = list(SOURCES.items())[:6] if args.characters_only else SOURCES.items()
    sizes = [prepare(args.source / path, destination / f'{name}.glb') for name, path in selected]
    print(f'{len(sizes)} original models: {sum(a for a,b in sizes):,} -> {sum(b for a,b in sizes):,} bytes; geometry/UV verified unchanged.')
