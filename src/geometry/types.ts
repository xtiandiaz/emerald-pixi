import type { Vector } from '../core/types'

export interface CollisionResult {
  normal: Vector
  penetration: number
  faceIndex: number
}
