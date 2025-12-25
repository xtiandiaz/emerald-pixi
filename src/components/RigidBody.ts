import { Point } from 'pixi.js'
import { Component, Vector } from '../core'

export interface RigidBodyOptions {
  gravityScale: Vector
  mass: number
  restitution: number

  isKinematic: boolean
  isStatic: boolean
}

export class RigidBody extends Component {
  position = new Point()
  velocity = new Vector()
  force = new Vector()

  rotation = 0
  torque = 0

  gravityScale: Vector
  restitution: number
  mass: number

  isKinematic: boolean
  isStatic: boolean

  constructor(x?: number, y?: number, rotation = 0, options?: Partial<RigidBodyOptions>) {
    super()

    this.position.set(x, y)
    this.rotation = rotation

    this.gravityScale = options?.gravityScale ?? new Vector(1, 1)
    this.restitution = options?.restitution ?? 0.2
    this.mass = options?.mass ?? 1

    this.isKinematic = options?.isKinematic ?? false
    this.isStatic = options?.isStatic ?? false
  }
}
