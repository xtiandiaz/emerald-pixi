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

export function directionFromMovement(movement: Vector): Direction {
  if (Math.abs(movement.x) > Math.abs(movement.y)) {
    return movement.x < 0 ? Direction.Left : Direction.Right
  } else {
    return movement.y < 0 ? Direction.Up : Direction.Down
  }
}
