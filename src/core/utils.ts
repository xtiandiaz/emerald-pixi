import type { Point } from 'pixi.js'
import { Direction, Vector } from '.'

export function isNearlyEqual(a: number, b: number, minDifference: number = 0.001): boolean {
  return Math.abs(b - a) <= minDifference
}

export function sign(value: number): number {
  return value < 0 ? -1 : 1
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function clamp01(value: number) {
  return clamp(value, 0, 1)
}

export function lerp(from: number, to: number, at: number): number {
  return from + (to - from) * at
}

export function average(...values: number[]): number {
  return values.reduce((sum, n) => sum + n, 0) / values.length
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

export const duration = (fromT: number) => Date.now() - fromT

export const distanceSquared = (a: Point, b: Point) => {
  return b.subtract(a).magnitudeSquared()
}
