import { Matrix, ObservablePoint, Point, type PointData } from 'pixi.js'
import { Component, Vector } from '../core'
import type { ColliderShape } from '../physics/collider-shapes'
import type { Collision } from '../physics'

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

  private _rotation = 0
  get rotation(): number {
    return this._rotation
  }
  set rotation(val: number) {
    this._rotation = val
    this.shape.transform.rotation = val
  }
  torque = 0

  readonly mass: number
  readonly iMass: number // inverted
  gravityScale: Vector
  restitution: number

  private TM = new Matrix()

  constructor(
    public readonly shape: ColliderShape,
    options?: Partial<BodyOptions>,
  ) {
    super()

    this.isStatic = options?.isStatic ?? false
    this.isKinematic = options?.isKinematic ?? false

    this.position = new ObservablePoint(
      {
        _onUpdate: (p) => {
          this.shape.transform.position.set(p?.x, p?.y)
        },
      },
      options?.position?.x,
      options?.position?.y,
    )
    this.shape.transform.position.set(this.position.x, this.position.y)

    this.rotation = options?.rotation ?? 0

    this.mass = options?.mass ?? 1
    this.iMass = this.mass ? 1 / this.mass : 1
    this.restitution = options?.restitution ?? 0.2
    this.gravityScale = options?.gravityScale ?? new Vector(1, 1)
  }

  testForCollision(other: Body): Collision | undefined {
    this.setTransform()
    other.setTransform()

    const contact = this.shape.testForContact(other.shape)
    // console.log(contact)
    return undefined
  }

  private setTransform() {
    this.TM.setTransform(
      this.position.x,
      this.position.y,
      this.shape.centroid.x,
      this.shape.centroid.y,
      1,
      1,
      this.rotation,
      0,
      0,
    )
  }
}
