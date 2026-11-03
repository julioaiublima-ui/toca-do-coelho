import { useEffect, useRef } from 'react'

type ArcanaDiceCanvasProps = {
  sides: number
  value?: number
  rolling: boolean
  compact?: boolean
}

type Point = [number, number, number]
type Face = { points: Point[]; center: Point; normal: Point; value: number }

const phi = (1 + Math.sqrt(5)) / 2

function subtract(a: Point, b: Point): Point {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function cross(a: Point, b: Point): Point {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function dot(a: Point, b: Point) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function normalize(point: Point): Point {
  const length = Math.hypot(...point) || 1
  return [point[0] / length, point[1] / length, point[2] / length]
}

function verticesFor(sides: number): Point[] {
  if (sides === 4) return [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]]
  if (sides === 6) return [[-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], [1, -1, -1], [1, -1, 1], [1, 1, -1], [1, 1, 1]]
  if (sides === 8) return [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
  if (sides === 10) {
    const points: Point[] = [[0, 0, 2.8], [0, 0, -2.8]]
    for (let index = 0; index < 5; index += 1) {
      const angle = index * Math.PI * 2 / 5
      points.push([Math.cos(angle), Math.sin(angle), 0.25], [Math.cos(angle + Math.PI / 5), Math.sin(angle + Math.PI / 5), -0.25])
    }
    return points
  }
  if (sides === 12) return [[1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1], [0, 1 / phi, phi], [0, 1 / phi, -phi], [0, -1 / phi, phi], [0, -1 / phi, -phi], [1 / phi, phi, 0], [1 / phi, -phi, 0], [-1 / phi, phi, 0], [-1 / phi, -phi, 0], [phi, 0, 1 / phi], [phi, 0, -1 / phi], [-phi, 0, 1 / phi], [-phi, 0, -1 / phi]]
  const points: Point[] = []
  for (const a of [-1, 1]) for (const b of [-1, 1]) points.push([0, a, b * phi], [a, b * phi, 0], [a * phi, 0, b])
  return points
}

function facesFor(vertices: Point[], sides: number): Face[] {
  const faces: Face[] = []
  const seen = new Set<string>()
  for (let a = 0; a < vertices.length; a += 1) for (let b = a + 1; b < vertices.length; b += 1) for (let c = b + 1; c < vertices.length; c += 1) {
    const normal = normalize(cross(subtract(vertices[b], vertices[a]), subtract(vertices[c], vertices[a])))
    if (Math.hypot(...normal) < 0.01) continue
    const distances = vertices.map((point) => dot(normal, subtract(point, vertices[a])))
    if (distances.some((distance) => distance > 0.03) && distances.some((distance) => distance < -0.03)) continue
    const ids = distances.map((distance, index) => Math.abs(distance) < 0.03 ? index : -1).filter((index) => index >= 0)
    if (ids.length < 3) continue
    const key = ids.join(',')
    if (seen.has(key)) continue
    seen.add(key)
    const center = ids.reduce((sum, index) => [sum[0] + vertices[index][0], sum[1] + vertices[index][1], sum[2] + vertices[index][2]] as Point, [0, 0, 0]).map((value) => value / ids.length) as Point
    const outward = normalize(center)
    const axis = normalize(subtract(vertices[ids[0]], center))
    const sideAxis = cross(outward, axis)
    ids.sort((left, right) => Math.atan2(dot(subtract(vertices[left], center), sideAxis), dot(subtract(vertices[left], center), axis)) - Math.atan2(dot(subtract(vertices[right], center), sideAxis), dot(subtract(vertices[right], center), axis)))
    faces.push({ points: ids.map((index) => vertices[index]), center, normal: outward, value: sides === 100 ? ((faces.length % 10) * 10) : faces.length + 1 })
  }
  return faces
}

function rotate(point: Point, angle: Point): Point {
  const [sx, cx] = [Math.sin(angle[0]), Math.cos(angle[0])]
  const [sy, cy] = [Math.sin(angle[1]), Math.cos(angle[1])]
  const [sz, cz] = [Math.sin(angle[2]), Math.cos(angle[2])]
  const y = point[1] * cx - point[2] * sx
  const z = point[1] * sx + point[2] * cx
  const x = point[0] * cy + z * sy
  const depth = -point[0] * sy + z * cy
  return [x * cz - y * sz, x * sz + y * cz, depth]
}

export function ArcanaDiceCanvas({ sides, value, rolling, compact = false }: ArcanaDiceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const startedAt = useRef(0)
  const vertices = verticesFor(sides)
  const faces = facesFor(vertices, sides)

  useEffect(() => {
    if (rolling) startedAt.current = performance.now()
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const draw = (time: number) => {
      const rect = canvas.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas.width = rect.width * ratio
      canvas.height = rect.height * ratio
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, rect.width, rect.height)
      const elapsed = Math.max(0, time - startedAt.current)
      const spin = rolling ? elapsed / 130 : time / 4200
      const angle: Point = [rolling ? spin * 4.8 : -0.35, spin * 5.7, spin * 2.7]
      const scale = Math.min(rect.width, rect.height) * (compact ? 0.25 : 0.34)
      const projected = (point: Point) => {
        const rotated = rotate(point, angle)
        const perspective = 4 / (4.8 - rotated[2])
        return [rect.width / 2 + rotated[0] * scale * perspective, rect.height / 2 + rotated[1] * scale * perspective, rotated[2]] as [number, number, number]
      }
      context.save()
      context.translate(0, rolling ? Math.sin(elapsed / 90) * 4 : 0)
      context.fillStyle = '#05020799'
      context.filter = 'blur(13px)'
      context.beginPath()
      context.ellipse(rect.width / 2, rect.height * 0.78, scale * 0.95, scale * 0.2, 0, 0, Math.PI * 2)
      context.fill()
      context.filter = 'none'
      faces.map((face) => ({ face, center: rotate(face.center, angle) })).sort((a, b) => a.center[2] - b.center[2]).forEach(({ face }) => {
        const normal = rotate(face.normal, angle)
        if (normal[2] > 0.08) return
        const points = face.points.map(projected)
        context.beginPath()
        points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y))
        context.closePath()
        const light = Math.max(0, -normal[2])
        context.fillStyle = `rgba(${150 + light * 70}, ${35 + light * 45}, ${75 + light * 55}, 1)`
        context.strokeStyle = '#f0b5aa'
        context.lineWidth = 1
        context.fill()
        context.stroke()
        const center = projected(face.center)
        context.fillStyle = '#fff4ea'
        context.font = `600 ${Math.max(10, scale * 0.22)}px Georgia`
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        const label = sides === 100 ? `${String(face.value).padStart(2, '0')}` : String(face.value)
        context.fillText(face.value === value ? label : label, center[0], center[1])
      })
      context.restore()
      animationRef.current = window.requestAnimationFrame(draw)
    }
    animationRef.current = window.requestAnimationFrame(draw)
    return () => { if (animationRef.current) window.cancelAnimationFrame(animationRef.current) }
  }, [compact, faces, rolling, sides, value])

  return <canvas ref={canvasRef} className="arcana-dice-canvas" aria-label={`Modelo 3D do ${sides === 100 ? 'd100' : `d${sides}`}`} />
}
