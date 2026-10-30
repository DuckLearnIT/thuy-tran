// Local dev only: await (await import('/scripts/check-box-packing.js')).checkBoxPacking()
import { OBB } from 'three/examples/jsm/math/OBB.js'

export async function checkBoxPacking() {
  const canvas = document.querySelector('canvas')
  const { scene } = canvas.__boxScene
  const { pieces } = await import('/src/data/pieces.ts')
  const tr = window.ScrollTrigger.getAll().find(t => t.trigger?.querySelector?.('#top'))
  const tl = tr.animation
  const state = tl.getChildren().flatMap(t => t.targets?.() ?? []).find(s => 'piecesReveal' in s)
  const original = scrollY
  const results = []
  const check = (name, passed) => { results.push({ name, passed }); if (!passed) throw Error(name) }
  const frames = async (n = 3) => { for (let i = 0; i < n; i++) await new Promise(requestAnimationFrame) }
  const seek = async time => {
    scrollTo(0, tr.start + (tr.end - tr.start) * time / tl.duration())
    window.ScrollTrigger.update(); tr.getTween()?.progress(1)
    const deadline = performance.now() + 5000
    for (;;) {
      await frames(1); tr.getTween()?.progress(1)
      const current = [state.locationsReveal, state.piecesReveal, state.piecesExit, state.locationsExit, state.boxClose, state.boxDismiss]
      const rendered = canvas.__boxScene.frameState
      if (rendered.length === current.length && rendered.every((v, i) => Math.abs(v - current[i]) < 1e-5)
        && Math.abs(tl.time() - Math.min(time, tl.duration())) < .005) break
      if (performance.now() > deadline) throw Error(`Renderer did not reach ${time}`)
    }
    scene.updateMatrixWorld(true)
  }
  const shape = mesh => {
    mesh.geometry.computeBoundingBox()
    const box = new OBB().fromBox3(mesh.geometry.boundingBox)
    // OBB.applyMatrix4 only adds translation to the center; these supplied
    // meshes have nonzero local centers and millimetre-to-scene scaling.
    const center = box.center.clone().applyMatrix4(mesh.matrixWorld)
    box.center.set(0, 0, 0)
    box.applyMatrix4(mesh.matrixWorld)
    box.center.copy(center)
    return box
  }
  const bodies = () => {
    const found = []
    for (const piece of pieces) {
      const root = scene.getObjectByName(piece.id)
      root.traverse(mesh => {
        if (mesh.isMesh && ['AcrylicSilhouette', 'InsertTab', 'RoundBaseWithSlot'].includes(mesh.name))
          found.push({ owner: piece.id, name: mesh.name, box: shape(mesh) })
      })
    }
    const board = scene.getObjectByName('location-board')
    board.children.filter(node => node.name.startsWith('location-')).forEach(root => {
      const mesh = root.getObjectByName('paper')
      found.push({ owner: root.name, name: 'paper', box: shape(mesh) })
    })
    return found
  }
  const obstacles = () => {
    const found = []
    for (const id of ['box-base', 'box-lid']) scene.getObjectByName(id).traverse(mesh => {
      if (mesh.isMesh) found.push({ owner: id, name: mesh.name, box: shape(mesh) })
    })
    return found
  }
  const inspect = label => {
    if (window.__packingCheck) window.__packingCheck.phase = label
    const parts = bodies(), walls = obstacles()
    const hits = []
    for (let i = 0; i < parts.length; i++) {
      const a = parts[i]
      for (const b of walls) if (a.box.intersectsOBB(b.box, 1e-7)) hits.push(`${a.owner}/${a.name} ↔ ${b.owner}/${b.name}`)
      for (let j = i + 1; j < parts.length; j++) {
        const b = parts[j]
        if (a.owner !== b.owner && a.box.intersectsOBB(b.box, 1e-7)) hits.push(`${a.owner}/${a.name} ↔ ${b.owner}/${b.name}`)
      }
    }
    if (hits.length) throw Error(`${label}: ${hits.slice(0, 6).join('; ')}`)
  }
  const pixels = async () => {
    await frames()
    const target = document.createElement('canvas')
    target.width = canvas.clientWidth; target.height = canvas.clientHeight
    const context = target.getContext('2d')
    context.drawImage(canvas, 0, 0, target.width, target.height)
    const data = context.getImageData(0, 0, target.width, target.height).data
    let count = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > 4) count++
    return count
  }
  try {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    const out = tl.labels['pieces-out'], pieceTime = tl.labels['locations-out'] - out
    for (const phase of [0, .03, .06, .09, .12]) { await seek(out + pieceTime * phase); inspect(`Box entry ${phase}`) }
    for (let i = 0; i < 10; i++) for (const phase of [.15, .4, .7, .9, 1]) {
      await seek(out + pieceTime * (.12 + .88 * (i + phase) / 10)); inspect(`Piece ${i} / ${phase}`)
    }
    check('All standees clear walls and one another throughout sequential packing', true)
    check('All ten packed objects stay visible before the lid closes', pieces.every(p => scene.getObjectByName(p.id).visible)
      && scene.getObjectByName(pieces[0].id).parent.visible)
    const cardsTime = tl.labels['box-close'] - tl.labels['locations-out']
    for (const phase of [.05, .18, .3, .45, .54, .62, .72, .82, .9, 1]) {
      await seek(tl.labels['locations-out'] + cardsTime * phase); inspect(`Cards ${phase}`)
    }
    check('Paper layers never overlap and the deck clears the rim before lowering', true)
    for (const phase of [.15, .25, .4, .5, .65, .75, .9, 1]) {
      await seek(tl.labels['box-close'] + .45 * phase); inspect(`Lid ${phase}`)
    }
    check('Lid clears every packed mesh', true)
    await seek(tl.labels['box-away'] + .65 * .98)
    check('Box has left the frustum before the canvas hides', await pixels() === 0)
    await seek(tl.labels['box-gone'] + .01)
    check('No canvas or box remains at the next chapter', getComputedStyle(canvas).visibility === 'hidden'
      && !scene.getObjectByName('box-base').visible && !scene.getObjectByName('box-lid').visible)
    await seek(tl.labels['pieces-showcase'])
    check('Reverse restores the full display and canvas', getComputedStyle(canvas).visibility !== 'hidden'
      && pieces.every(p => scene.getObjectByName(p.id).visible))
  } finally { scrollTo(0, original); window.ScrollTrigger.update(); tr.getTween()?.progress(1) }
  return results
}
