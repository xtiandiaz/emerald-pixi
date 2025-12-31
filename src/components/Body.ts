import { ObservablePoint, Point, Transform, type PointData } from 'pixi.js'
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

  readonly velocity = new Vector()
  readonly force = new Vector()
  torque = 0

  readonly transform = new Transform()
  get position(): PointData {
    return this.transform.position
  }
  get rotation(): number {
    return this.transform.rotation
  }

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

    this.mass = options?.mass ?? 1
    this.invMass = this.mass ? 1 / this.mass : 1
    this.restitution = options?.restitution ?? 0.2

    this.transform = new Transform({
      observer: {
        _onUpdate: (transform) => this.collider.setTransform(transform),
      },
    })
    this.transform.position.set(options?.position?.x, options?.position?.y)
    this.transform.rotation = options?.rotation ?? 0
  }

  applyForce(x: number, y: number) {
    this.force.x += x
    this.force.y += y
  }

  getCollision(other: Body): Collision | undefined {
    const contact = this.collider.getContact(other.collider)
    if (!contact) {
      return
    }
    console.log(contact)
    return {
      A: this,
      B: other,
      points: [],
      restitution: Math.max(this.restitution, other.restitution),
      sumInvMasses: this.invMass + other.invMass,
      ...contact,
    }
  }
}
