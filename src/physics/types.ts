import type { CollisionResult } from '../collision'

export type CollisionLayerMap = Map<number, number>

export interface Collision extends CollisionResult {
  fromId: number
  intoId: number
}
