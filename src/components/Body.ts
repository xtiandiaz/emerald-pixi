import { Point, Transform, type PointData } from 'pixi.js'
import { clamp, Vector, Collider, Component } from '../core'
import { Collision, Physics } from '../'

export interface BodyOptions {
  isStatic: boolean
  isKinematic: boolean
  isTrigger: boolean
  layer?: number

  position: PointData
  rotation: number
  restitution: number
  friction: Physics.Friction
}

export class Body extends Component implements Collision.Actor, BodyOptions {
  isStatic: boolean
  isKinematic: boolean
  isTrigger: boolean
  layer: number

  readonly velocity = new Vector()
  readonly force = new Vector()

  angularVelocity = 0
  torque = 0

  readonly transform = new Transform()
  get position(): Point {
    return this.transform.position
  }
  get rotation(): number {
    return this.transform.rotation
  }

  readonly mass: number
  readonly invMass: number
  readonly inertia: number
  readonly invInertia: number
  restitution: number
  friction: Physics.Friction

  constructor(
    public readonly collider: Collider,
    options?: Partial<BodyOptions>,
  ) {
    super()

    this.isStatic = options?.isStatic ?? false
    this.isKinematic = options?.isKinematic ?? false
    this.isTrigger = options?.isTrigger ?? false
    this.layer = options?.layer ?? 1

    this.mass = this.isStatic ? 0 : Physics.calculateMass(collider.area)
    this.invMass = this.mass ? 1 / this.mass : 0
    this.inertia = this.isStatic ? 0 : Physics.calculateColliderInertia(collider, this.mass)
    this.invInertia = this.inertia ? 1 / this.inertia : 0
    this.restitution = clamp(options?.restitution ?? 0.2, 0, 1)
    this.friction = options?.friction ?? {
      static: 0.5,
      dynamic: 0.3,
    }

    this.transform = new Transform({
      observer: {
        _onUpdate: (transform) =>
          this.collider.setTransform(transform.position, transform.rotation),
      },
    })
    this.transform.position.set(options?.position?.x, options?.position?.y)
    this.transform.rotation = options?.rotation ?? 0
  }

  applyForce(x: number, y: number) {
    this.force.x += x
    this.force.y += y
  }
}
