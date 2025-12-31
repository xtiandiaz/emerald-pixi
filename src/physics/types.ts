import type { Point, PointData } from 'pixi.js'
import type { Vector } from '../core'
import type { Body } from '../components'

export interface Gravity {
  vector: Vector
  value: number
}

export type CollisionLayerMap = Map<number, number>

export type AABB = {
  min: PointData
  max: PointData
}

export interface Contact {
  depth: number
  normal: Vector
}

export interface Collision extends Contact {
  A: Body
  B: Body
  points: Point[]
  restitution: number // usually denoted by 'e'
  sumInvMasses: number
}
