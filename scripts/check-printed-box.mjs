import assert from 'node:assert/strict'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { createPrintedBox, boxDimensions as size } from '../src/components/printedBox.ts'

const texture = new THREE.Texture()
const { base, lid } = createPrintedBox(texture)
const group = new THREE.Group(); group.add(base, lid)
const meshes = []; group.traverse(node => { if (node.isMesh) meshes.push(node) })
assert.equal(meshes.length, 2)
assert.equal(meshes[0].material, meshes[1].material)
assert.equal(meshes[0].material.map, texture)
assert.equal(meshes.reduce((sum, m) => sum + m.geometry.index.count / 3, 0), 64)
const bounds = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3())
assert.ok(Math.abs(bounds.x / bounds.z - 481.44 / 701.52) < 1e-6)
assert.ok(Math.abs(bounds.y / bounds.x - 123.84 / 481.44) < 1e-6)
assert.ok((size.width - 2 * size.wall - size.baseWidth) > 0)
assert.ok((size.depth - 2 * size.wall - size.baseDepth) > 0)
assert.ok(size.baseHeight < size.height - size.floor)
for (const mesh of meshes) {
  assert.equal(mesh.geometry.groups.length, 0, 'No per-face material groups / extra draw calls')
  assert.equal(mesh.userData.collisionBoxes.length, 5, 'Hollow collision parts, not the whole bounding box')
  const p = mesh.geometry.attributes.position, n = mesh.geometry.attributes.normal, uv = mesh.geometry.attributes.uv
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), cross = new THREE.Vector3()
  const edgeUses = new Map()
  const key = i => [p.getX(i), p.getY(i), p.getZ(i)].map(v => v.toFixed(5)).join(',')
  for (let i = 0; i < mesh.geometry.index.count; i += 3) {
    const ids = [0, 1, 2].map(v => mesh.geometry.index.getX(i + v))
    a.fromBufferAttribute(p, ids[0]); b.fromBufferAttribute(p, ids[1]); c.fromBufferAttribute(p, ids[2])
    cross.crossVectors(b.sub(a), c.sub(a)).normalize()
    assert.ok(cross.dot(new THREE.Vector3().fromBufferAttribute(n, ids[0])) > .999)
    for (let j = 0; j < 3; j++) {
      const edge = [key(ids[j]), key(ids[(j + 1) % 3])].sort().join('|')
      edgeUses.set(edge, (edgeUses.get(edge) ?? 0) + 1)
    }
  }
  assert.ok([...edgeUses.values()].every(count => count === 2), 'Closed shell without missing faces or overlapping panels')
  for (let i = 0; i < uv.count; i++) assert.ok(uv.getX(i) > 0 && uv.getX(i) < 1 && uv.getY(i) > 0 && uv.getY(i) < 1)
}

// Compare the old box alone, excluding all other scene contents/shadows.
const old = [
  new RoundedBoxGeometry(3, .1, 4, 3, .03),
  ...Array.from({ length: 4 }, () => new RoundedBoxGeometry(3, .52, .13, 3, .03)),
  ...Array.from({ length: 6 }, () => new THREE.BoxGeometry(1, 1, 1)),
  ...Array.from({ length: 4 }, () => new RoundedBoxGeometry(3, .57, .07, 3, .02)),
]
const before = old.reduce((sum, g) => sum + (g.index?.count ?? g.attributes.position.count) / 3, 0)
console.log(JSON.stringify({ sourceFacePoints: [481.44, 701.52, 123.84], meshes: 2, materials: 1, textureAtlases: 1,
  oldTriangles: before, triangles: 64, oldDrawCalls: 20, drawCalls: 2,
  triangleReductionPercent: Math.round((1 - 64 / before) * 10000) / 100 }, null, 2))
old.forEach(g => g.dispose())
meshes.forEach(m => m.geometry.dispose()); meshes[0].material.dispose(); texture.dispose()
