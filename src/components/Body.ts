import { ObservablePoint, Point, type PointData } from 'pixi.js'
import { Component, Vector } from '../core'
import type { Collider } from '../physics/colliders'
import { type Contact, type Collision } from '../physics'
import { Game } from '../game'

export interface BodyOptions {
  isStatic: boolean
  isKinematic: boolean
  layer?: number

  position: PointData
  rotation: number
  restitution: number
  mass: number
}

export class Body extends Component implements BodyOptions {
  isStatic: boolean
  isKinematic: boolean
  layer?: number

  readonly position: Point
  readonly velocity = new Vector()
  readonly force = new Vector()

  private _rotation = 0
  get rotation(): number {
    return this._rotation
  }
  set rotation(val: number) {
    this._rotation = val
    this.collider.transform.rotation = val
  }
  torque = 0

  readonly mass: number
  readonly invMass: number // inverted
  restitution: number

  constructor(
    public readonly collider: Collider,
    options?: Partial<BodyOptions>,
  ) {
    super()

    this.isStatic = options?.isStatic ?? false
    this.isKinematic = options?.isKinematic ?? false

    this.position = new ObservablePoint(
      {
        _onUpdate: (p) => {
          this.collider.transform.position.set(p?.x, p?.y)
        },
      },
      options?.position?.x,
      options?.position?.y,
    )
    this.collider.transform.position.set(this.position.x, this.position.y)

    this.rotation = options?.rotation ?? 0

    this.mass = options?.mass ?? 1
    this.invMass = this.mass ? 1 / this.mass : 1
    this.restitution = options?.restitution ?? 0.2
  }

  applyForce(x: number, y: number) {
    this.force.x += x
    this.force.y += y
  }

  testForCollision(other: Body): Collision | undefined {
    const contact = this.collider.testForContact(other.collider)
    if (!contact) {
      return
    }
    return {
      A: this,
      B: other,
      restitution: Math.max(this.restitution, other.restitution),
      sumInvMasses: this.invMass + other.invMass,
      ...contact,
    }
  }
}
