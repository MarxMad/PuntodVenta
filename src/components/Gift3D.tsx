import { useEffect, useRef, useState } from 'react'

// Regalo 3D con WebGL (Three.js). Se carga de forma diferida (dynamic import)
// para no pesar en la carga inicial. Si el dispositivo no soporta WebGL o el
// usuario pidió menos movimiento, se muestra un respaldo en CSS.

export default function Gift3D() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let disposed = false
    let cleanup = () => {}

    import('three')
      .then((THREE) => {
        if (disposed || !mount) return

        const W = mount.clientWidth || 220
        const H = mount.clientHeight || 220

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(W, H)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        mount.appendChild(renderer.domElement)
        renderer.domElement.style.display = 'block'

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100)
        camera.position.set(0, 1.4, 6)
        camera.lookAt(0, 0, 0)

        // ── Luces ────────────────────────────────────────────────
        scene.add(new THREE.AmbientLight(0xffffff, 0.65))
        const key = new THREE.DirectionalLight(0xffffff, 1.4)
        key.position.set(4, 6, 5)
        key.castShadow = true
        key.shadow.mapSize.set(1024, 1024)
        key.shadow.camera.near = 1
        key.shadow.camera.far = 20
        scene.add(key)
        const rim = new THREE.PointLight(0xec6f9c, 1.1, 30)
        rim.position.set(-4, 2, -3)
        scene.add(rim)
        const fill = new THREE.PointLight(0x8fbeec, 0.7, 30)
        fill.position.set(3, -2, 4)
        scene.add(fill)

        // ── Materiales ───────────────────────────────────────────
        const boxMat = new THREE.MeshStandardMaterial({ color: 0xec6f9c, roughness: 0.35, metalness: 0.1 })
        const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xfff2f8, roughness: 0.25, metalness: 0.2 })
        const lidMat = new THREE.MeshStandardMaterial({ color: 0xf072a0, roughness: 0.35, metalness: 0.1 })

        const gift = new THREE.Group()

        // Cuerpo de la caja
        const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1.7, 2), boxMat)
        body.position.y = -0.15
        body.castShadow = true
        gift.add(body)

        // Tapa
        const lid = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.5, 2.18), lidMat)
        lid.position.y = 0.95
        lid.castShadow = true
        gift.add(lid)

        // Listones (cruz) en cuerpo y tapa
        const ribV = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.72, 2.04), ribbonMat)
        ribV.position.y = -0.15
        gift.add(ribV)
        const ribH = new THREE.Mesh(new THREE.BoxGeometry(2.04, 1.72, 0.36), ribbonMat)
        ribH.position.y = -0.15
        gift.add(ribH)
        const ribLidV = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.52, 2.22), ribbonMat)
        ribLidV.position.y = 0.95
        gift.add(ribLidV)
        const ribLidH = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.52, 0.4), ribbonMat)
        ribLidH.position.y = 0.95
        gift.add(ribLidH)

        // Moño: dos toros + nudo
        const bow = new THREE.Group()
        const loopGeo = new THREE.TorusGeometry(0.32, 0.12, 16, 40)
        const loopL = new THREE.Mesh(loopGeo, ribbonMat)
        loopL.position.set(-0.32, 1.4, 0)
        loopL.rotation.set(Math.PI / 2, 0, 0.5)
        loopL.scale.set(1, 0.7, 1)
        const loopR = loopL.clone()
        loopR.position.x = 0.32
        loopR.rotation.z = -0.5
        const knot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), ribbonMat)
        knot.position.set(0, 1.4, 0)
        bow.add(loopL, loopR, knot)
        gift.add(bow)

        // Piso invisible que recibe sombra
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(30, 30),
          new THREE.ShadowMaterial({ opacity: 0.18 }),
        )
        floor.rotation.x = -Math.PI / 2
        floor.position.y = -1.05
        floor.receiveShadow = true
        scene.add(floor)

        gift.rotation.y = 0.5
        scene.add(gift)

        // ── Interacción con el mouse ─────────────────────────────
        let targetX = 0.5
        let targetY = 0
        const onMove = (e: MouseEvent) => {
          const r = mount.getBoundingClientRect()
          targetX = ((e.clientX - r.left) / r.width - 0.5) * 1.2 + 0.5
          targetY = ((e.clientY - r.top) / r.height - 0.5) * 0.8
        }
        window.addEventListener('mousemove', onMove)

        let raf = 0
        const clock = new THREE.Clock()
        const animate = () => {
          raf = requestAnimationFrame(animate)
          const t = clock.getElapsedTime()
          if (reduce) {
            gift.rotation.y = 0.5
          } else {
            gift.rotation.y += (targetX - gift.rotation.y) * 0.05 + 0.005
            gift.rotation.x += (targetY - gift.rotation.x) * 0.05
            gift.position.y = Math.sin(t * 1.4) * 0.08
          }
          renderer.render(scene, camera)
        }
        animate()

        const onResize = () => {
          const w = mount.clientWidth || 220
          const h = mount.clientHeight || 220
          camera.aspect = w / h
          camera.updateProjectionMatrix()
          renderer.setSize(w, h)
        }
        window.addEventListener('resize', onResize)

        cleanup = () => {
          cancelAnimationFrame(raf)
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('resize', onResize)
          renderer.dispose()
          scene.traverse((o) => {
            const m = o as THREE.Mesh
            if (m.geometry) m.geometry.dispose()
            const mat = m.material as THREE.Material | THREE.Material[]
            if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
            else if (mat) mat.dispose()
          })
          if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
        }
      })
      .catch(() => setFallback(true))

    return () => {
      disposed = true
      cleanup()
    }
  }, [])

  return (
    <div className="gift3d" ref={mountRef} aria-hidden="true">
      {fallback && (
        <div className="scene3d">
          <div className="box3d">
            <span className="face fx fx-front" /><span className="face fx fx-back" />
            <span className="face fx fx-right" /><span className="face fx fx-left" />
            <span className="face fx fx-top" /><span className="face fx fx-bottom" />
            <span className="bow" aria-hidden="true">🎀</span>
          </div>
        </div>
      )}
    </div>
  )
}
