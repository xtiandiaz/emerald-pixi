import type { Point } from 'pixi.js'
import type { Vector } from '../core'
import type { Body } from '../components'

export interface Gravity {
  vector: Vector
  scale: number
}

export type CollisionLayerMap = Map<number, number>

export interface Contact {
  penetration: number
  normal: Vector
  points: Point[]
}

export interface Collision extends Contact {
  A: Body
  B: Body
  restitution: number // usually denoted by 'e'
  sumInvMasses: number
}
