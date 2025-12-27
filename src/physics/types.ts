import type { CollisionResult } from '../geometry'

export type CollisionLayerMap = Map<number, number>

export type CollisionActor = { id: number; tag?: string; isSensor: boolean }

export interface Collision extends CollisionResult {
  actors: [CollisionActor, CollisionActor]
}
