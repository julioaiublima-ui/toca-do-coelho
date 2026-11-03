import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

type ThreeDiceCanvasProps = {
  sides: number
  rolling: boolean
  compact?: boolean
}

export function ThreeDiceCanvas({ sides, rolling, compact = false }: ThreeDiceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const canvasElement = canvas
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
    camera.position.set(0, 0.15, 5.8)
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    const ambient = new THREE.HemisphereLight(0xffe6d0, 0x160b20, 2.2)
    scene.add(ambient)
    const keyLight = new THREE.DirectionalLight(0xffd7b0, 4)
    keyLight.position.set(2, 3, 4)
    keyLight.castShadow = true
    scene.add(keyLight)
    const rimLight = new THREE.PointLight(0x9b6bff, 2.2, 8)
    rimLight.position.set(-2, 0.5, 2)
    scene.add(rimLight)
    const group = new THREE.Group()
    scene.add(group)
    const loader = new GLTFLoader()
    let frame: number | undefined
    let disposed = false
    let startedAt = performance.now()

    function resize() {
      const rect = canvasElement.getBoundingClientRect()
      const width = Math.max(1, rect.width)
      const height = Math.max(1, rect.height)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    function render() {
      resize()
      renderer.render(scene, camera)
    }

    loader.load(`${import.meta.env.BASE_URL}models/d${sides}.glb`, (gltf) => {
      if (disposed) return
      const model = gltf.scene
      const bounds = new THREE.Box3().setFromObject(model)
      const size = bounds.getSize(new THREE.Vector3())
      const center = bounds.getCenter(new THREE.Vector3())
      const largestSide = Math.max(size.x, size.y, size.z) || 1
      model.scale.setScalar((compact ? 1.5 : 2.05) / largestSide)
      model.position.set(-center.x * model.scale.x, -center.y * model.scale.y, -center.z * model.scale.z)
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true
          object.receiveShadow = true
        }
      })
      group.clear()
      group.add(model)
      camera.position.z = compact ? 4.8 : 5.8
      startedAt = performance.now()
      render()
      if (!rolling) return
      const animate = (time: number) => {
        if (disposed) return
        const elapsed = time - startedAt
        const progress = Math.min(1, elapsed / 1200)
        const bounce = Math.sin(progress * Math.PI) * (compact ? 0.35 : 0.65)
        group.position.y = bounce
        group.rotation.set(progress * Math.PI * 5, progress * Math.PI * 7, progress * Math.PI * 3)
        render()
        if (progress < 1) frame = window.requestAnimationFrame(animate)
        else {
          group.position.y = 0
          group.rotation.set(-0.2, 0.55, 0.1)
          render()
        }
      }
      frame = window.requestAnimationFrame(animate)
    }, undefined, () => {
      if (!disposed) render()
    })

    if (!rolling) {
      group.rotation.set(-0.2, 0.55, 0.1)
      render()
    }
    window.addEventListener('resize', resize)
    return () => {
      disposed = true
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      renderer.dispose()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
          else object.material.dispose()
        }
      })
    }
  }, [compact, rolling, sides])

  return <canvas ref={canvasRef} className="arcana-dice-canvas" aria-label={`Modelo 3D real do d${sides}`} />
}
