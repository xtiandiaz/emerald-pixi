import type { Vector } from '../core/types'

export interface CollisionResult {
  dir: Vector
  penetration: number
}
