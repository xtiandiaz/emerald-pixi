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

  get mass(): number {
    return this._mass * this.scale
  }
  get invMass(): number {
    return this._invMass / this.scale
  }
  get inertia(): number {
    return this._inertia * this.scale
  }
  get invInertia(): number {
    return this._invInertia / this.scale
  }
  restitution: number
  friction: Physics.Friction

  private readonly _mass: number
  private readonly _invMass: number
  private readonly _inertia: number
  private readonly _invInertia: number

  constructor(
    public readonly collider: Collider,
    options?: Partial<BodyOptions>,
  ) {
    super()

    this.isStatic = options?.isStatic ?? false
    this.isKinematic = options?.isKinematic ?? false
    this.isTrigger = options?.isTrigger ?? false
    this.layer = options?.layer ?? 1

    this._mass = this.isStatic ? 0 : Physics.calculateMass(collider.area)
    this._invMass = this._mass ? 1 / this._mass : 0
    this._inertia = this.isStatic ? 0 : Physics.calculateColliderInertia(collider, this._mass)
    this._invInertia = this._inertia ? 1 / this._inertia : 0
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
