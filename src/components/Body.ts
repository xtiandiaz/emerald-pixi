import { Point, Transform, type PointData } from 'pixi.js'
import { clamp, Vector, Collider, Component } from '../core'
import { Physics } from '../'

export interface BodyOptions {
  isStatic: boolean
  isKinematic: boolean
  isTrigger: boolean
  layer?: number

  position: PointData
  rotation: number
  scale: number

  restitution: number
  friction: Physics.Friction
}

export class Body extends Component implements BodyOptions {
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
  get scale(): number {
    return this.transform.scale.x
  }
  set scale(value: number) {
    this.transform.scale.set(value, value)
  }
  get invScale(): number {
    return 1 / this.scale
  }

  restitution: number
  friction: Physics.Friction

  readonly mass: number
  get scaledMass(): number {
    return this.mass * this.scale
  }
  readonly invMass: number
  get invScaledMass(): number {
    return this.invMass * this.invScale
  }

  readonly inertia: number
  get scaledInertia(): number {
    return this.inertia * this.scale
  }
  readonly invInertia: number
  get invScaledInertia(): number {
    return this.invInertia * this.invScale
  }

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
    this.inertia = this.isStatic ? 0 : Physics.calculateColliderInertia(collider)
    this.invInertia = this.inertia ? 1 / this.inertia : 0
    this.restitution = clamp(options?.restitution ?? 0.2, 0, 1)
    this.friction = options?.friction ?? {
      static: 0.5,
      dynamic: 0.3,
    }

    this.transform = new Transform({
      observer: {
        _onUpdate: (transform) =>
          this.collider.setTransform(transform.position, transform.rotation, transform.scale),
      },
    })
    this.transform.position.set(options?.position?.x, options?.position?.y)
    this.transform.rotation = options?.rotation ?? 0
    this.transform.scale.set(options?.scale ?? 1)
  }
}
