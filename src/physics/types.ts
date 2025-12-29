import type { Point } from 'pixi.js'
import type { CollisionResult } from '../geometry'
import type { Vector } from '../core'

export type CollisionLayerMap = Map<number, number>

export type CollisionActor = { id: number; tag?: string; isSensor: boolean }

export interface Collision extends CollisionResult {
  A: Body // Reference Body
  B: Body // Incident Body

  penetration: number
  normal: Vector
  contactPoints: Point[]
}
