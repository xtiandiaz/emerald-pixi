import type { Bounds, Point } from 'pixi.js'
import { Direction, Vector } from '.'

export function sign(value: number): number {
  return value < 0 ? -1 : 1
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function lerp(from: any, to: any, at: number): any {
  return from + (to - from) * at
}

export const directionVector = (d: Direction) => {
  switch (d) {
    case Direction.Up:
      return new Vector(0, -1)
    case Direction.Right:
      return new Vector(1, 0)
    case Direction.Down:
      return new Vector(0, 1)
    case Direction.Left:
      return new Vector(-1, 0)
  }
}

export const directionFromMovement = (m: Vector): Direction => {
  if (Math.abs(m.x) > Math.abs(m.y)) {
    return m.x < 0 ? Direction.Left : Direction.Right
  } else {
    return m.y < 0 ? Direction.Up : Direction.Down
  }
}

export const duration = (t: number) => Date.now() - t

export const distanceSquared = (a: Point, b: Point) => {
  return b.subtract(a).magnitudeSquared()
}

export function testForAABB(a: Bounds, b: Bounds): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}
export function testForAABBWithDiagonalVertices(a: number[], b: number[]): boolean {
  return !(a[0]! > b[2]! || a[2]! < b[0]! || a[1]! > b[3]! || a[3]! < b[1]!)
}
