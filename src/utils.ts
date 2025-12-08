import type { Point } from 'pixi.js'
import { Direction, Vector } from './core'

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
