import { Point, type PointData } from 'pixi.js'
import { Component, Vector } from '../core'
import type { ColliderShape } from './collider-components'

export interface BodyOptions {
  isStatic: boolean
  isKinematic: boolean
  layer?: number

  position: PointData
  rotation: number
  restitution: number
  mass: number
  gravityScale: Vector
}

export class Body extends Component implements BodyOptions {
  isStatic: boolean
  isKinematic: boolean
  layer?: number

  readonly position: Point
  velocity = new Vector()
  force = new Vector()

  rotation: number
  torque = 0

  readonly mass: number
  readonly iMass: number // inverted
  gravityScale: Vector
  restitution: number

  constructor(
    public readonly shape: ColliderShape,
    options?: Partial<BodyOptions>,
  ) {
    super()

    this.isStatic = options?.isStatic ?? false
    this.isKinematic = options?.isKinematic ?? false

    this.position = new Point()
    this.position.set(options?.position?.x, options?.position?.y)

    this.rotation = options?.rotation ?? 0

    this.mass = options?.mass ?? 1
    this.iMass = this.mass ? 1 / this.mass : 1
    this.restitution = options?.restitution ?? 0.2
    this.gravityScale = options?.gravityScale ?? new Vector(1, 1)
  }
}
