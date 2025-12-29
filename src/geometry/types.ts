import type { Vector } from '../core/types'

export interface ShapeContact {
  penetration: number
  normal: Vector
  faceIndex: number
}

export interface CollisionResult {
  normal: Vector
  penetration: number
  faceIndex: number
}
