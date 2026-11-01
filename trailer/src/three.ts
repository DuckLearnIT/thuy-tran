import { useEffect, useState } from 'react'
import { cancelRender, continueRender, delayRender, staticFile } from 'remotion'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Same normalisation as the site's pieceScene: centre on the base, keep source materials.
const prepare = (source: THREE.Object3D, height: number) => {
  source.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(source)
  const size = bounds.getSize(new THREE.Vector3())
  const center = bounds.getCenter(new THREE.Vector3())
  source.position.set(-center.x, -bounds.min.y, -center.z)
  const group = new THREE.Group()
  group.scale.setScalar(height / size.y)
  group.add(source)
  source.traverse(node => {
    const mesh = node as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.castShadow = !mesh.name.includes('Artwork')
    const material = mesh.material as THREE.MeshStandardMaterial
    if (material.map) material.map.anisotropy = 8
    if (material.transparent) material.depthWrite = false
  })
  return group
}

export const useStandees = (ids: string[], height: number) => {
  const [handle] = useState(() => delayRender('Loading standee GLBs'))
  const [pieces, setPieces] = useState<THREE.Group[] | null>(null)
  useEffect(() => {
    const loader = new GLTFLoader()
    Promise.all(ids.map(id => loader.loadAsync(staticFile(`pieces/${id}.glb`))))
      .then(list => {
        setPieces(list.map(g => prepare(g.scene, height)))
        continueRender(handle)
      })
      .catch(cancelRender)
  }, [])
  return pieces
}

export const useTextures = (paths: string[]) => {
  const [handle] = useState(() => delayRender('Loading card textures'))
  const [textures, setTextures] = useState<THREE.Texture[] | null>(null)
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    Promise.all(paths.map(p => loader.loadAsync(staticFile(p))))
      .then(list => {
        list.forEach(t => {
          t.colorSpace = THREE.SRGBColorSpace
          t.anisotropy = 8
        })
        setTextures(list)
        continueRender(handle)
      })
      .catch(cancelRender)
  }, [])
  return textures
}
