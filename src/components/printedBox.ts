import * as THREE from 'three'
import layout from '../assets/box/layout.json' with { type: 'json' }

// Relative dimensions come from the five revised face PDFs, never from the print sheet.
const width = 3.1
const depth = width * layout.millimetres.depth / layout.millimetres.width
const height = width * layout.millimetres.height / layout.millimetres.width
export const boxDimensions = {
  width, depth, height, wall: .035, floor: .04, closedY: 0,
  baseWidth: width - .1, baseDepth: depth - .1, baseHeight: height - .045,
}
type Point = [number, number, number]
type Face = keyof typeof layout.rects
type Collider = { name: string; min: Point; max: Point }

/** Two hollow shells, one print atlas/material, 64 triangles in total. */
export function createPrintedBox(texture: THREE.Texture) {
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: .82, metalness: 0, toneMapped: false })
  // Printed ink may darken in shadow, but stage lights must not bleach its RGB.
  // Keep the physical shadows/normals while capping highlights at the source print.
  material.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>',
      'outgoingLight = min(outgoingLight, diffuseColor.rgb);\n#include <opaque_fragment>')
  }
  function shell(name: string, w: number, d: number, h: number, lid: boolean) {
    const { wall: t, floor } = boxDimensions
    const iw = w - 2 * t, id = d - 2 * t
    const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = []
    const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), normal = new THREE.Vector3()
    const colliders: Collider[] = []
    function quad(points: Point[], face: Face) {
      const start = positions.length / 3
      normal.crossVectors(v1.fromArray(points[1]).sub(v2.fromArray(points[0])),
        v2.fromArray(points[2]).sub(new THREE.Vector3().fromArray(points[0]))).normalize()
      const [x, y, rw, rh] = layout.rects[face]
      const left = (x + .5) / layout.atlasSize, right = (x + rw - .5) / layout.atlasSize
      const top = 1 - (y + .5) / layout.atlasSize, bottom = 1 - (y + rh - .5) / layout.atlasSize
      for (const p of points) { positions.push(...p); normals.push(normal.x, normal.y, normal.z) }
      uvs.push(left, bottom, right, bottom, right, top, left, top)
      indices.push(start, start + 1, start + 2, start, start + 2, start + 3)
    }
    function horizontal(y: number, up: boolean, face: Face) {
      const points: Point[] = [[-w / 2, y, d / 2], [w / 2, y, d / 2], [w / 2, y, -d / 2], [-w / 2, y, -d / 2]]
      quad(up ? points : [points[3], points[2], points[1], points[0]], face)
    }
    function walls(bw: number, bd: number, y0: number, y1: number, inside: boolean, faces: Face[]) {
      const corners: Point[][] = [
        [[bw / 2, y0, bd / 2], [bw / 2, y0, -bd / 2], [bw / 2, y1, -bd / 2], [bw / 2, y1, bd / 2]],
        [[-bw / 2, y0, -bd / 2], [-bw / 2, y0, bd / 2], [-bw / 2, y1, bd / 2], [-bw / 2, y1, -bd / 2]],
        [[-bw / 2, y0, bd / 2], [bw / 2, y0, bd / 2], [bw / 2, y1, bd / 2], [-bw / 2, y1, bd / 2]],
        [[bw / 2, y0, -bd / 2], [-bw / 2, y0, -bd / 2], [-bw / 2, y1, -bd / 2], [bw / 2, y1, -bd / 2]],
      ]
      corners.forEach((p, i) => quad(inside ? [p[1], p[0], p[3], p[2]] : p, faces[i]))
    }
    function rim(y: number, up: boolean) {
      const outer: Point[] = [[-w / 2, y, d / 2], [w / 2, y, d / 2], [w / 2, y, -d / 2], [-w / 2, y, -d / 2]]
      const inner: Point[] = [[-iw / 2, y, id / 2], [iw / 2, y, id / 2], [iw / 2, y, -id / 2], [-iw / 2, y, -id / 2]]
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4, p = [outer[i], outer[j], inner[j], inner[i]]
        quad(up ? p : p.reverse(), 'edge')
      }
    }
    if (lid) {
      horizontal(h, true, 'front')
      // Ceiling uses the inner rectangle, leaving the board thickness at its edges.
      quad([[-iw / 2, h - floor, -id / 2], [iw / 2, h - floor, -id / 2],
        [iw / 2, h - floor, id / 2], [-iw / 2, h - floor, id / 2]], 'paper')
      walls(w, d, 0, h, false, ['right', 'left', 'bottom', 'top'])
      const turnin = width * layout.turninMm / layout.millimetres.width
      walls(iw, id, 0, turnin, true, ['returnRight', 'returnLeft', 'returnBottom', 'returnTop'])
      walls(iw, id, turnin, h - floor, true, ['paper', 'paper', 'paper', 'paper'])
      rim(0, false)
      colliders.push({ name: 'box-ceiling', min: [-w / 2, h - floor, -d / 2], max: [w / 2, h, d / 2] })
    } else {
      horizontal(0, false, 'back')
      quad([[-iw / 2, floor, id / 2], [iw / 2, floor, id / 2],
        [iw / 2, floor, -id / 2], [-iw / 2, floor, -id / 2]], 'paper')
      walls(w, d, 0, h, false, ['navy', 'navy', 'navy', 'navy'])
      walls(iw, id, floor, h, true, ['paper', 'paper', 'paper', 'paper'])
      rim(h, true)
      colliders.push({ name: 'box-floor', min: [-w / 2, 0, -d / 2], max: [w / 2, floor, d / 2] })
    }
    colliders.push(
      { name: 'box-wall', min: [-w / 2, 0, -d / 2], max: [w / 2, h, -d / 2 + t] },
      { name: 'box-wall', min: [-w / 2, 0, d / 2 - t], max: [w / 2, h, d / 2] },
      { name: 'box-wall', min: [-w / 2, 0, -d / 2 + t], max: [-w / 2 + t, h, d / 2 - t] },
      { name: 'box-wall', min: [w / 2 - t, 0, -d / 2 + t], max: [w / 2, h, d / 2 - t] },
    )
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices); geometry.computeBoundingSphere()
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = `${name}-shell`; mesh.castShadow = mesh.receiveShadow = true
    mesh.userData.collisionBoxes = colliders
    const group = new THREE.Group()
    group.name = name; group.add(mesh)
    return group
  }
  const base = shell('box-base', boxDimensions.baseWidth, boxDimensions.baseDepth, boxDimensions.baseHeight, false)
  const lid = shell('box-lid', width, depth, height, true)
  lid.position.y = boxDimensions.closedY
  return { base, lid }
}
