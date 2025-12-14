import { Point } from 'pixi.js'
import { Component, Vector } from '../core'

export class RigidBody extends Component {
  mass = 1

  isStatic = false
  isSensor = false

  private p: Point
  get position() {
    return this.p
  }

  get x(): number {
    return this.p.x
  }
  set x(val: number) {
    this.p.x = val
  }
  get y(): number {
    return this.p.y
  }
  set y(val: number) {
    this.p.y = val
  }

  private v = new Vector()
  get velocity() {
    return this.v
  }

  private f = new Vector()
  get force() {
    return this.f
  }

  private g = new Vector(0, 10)
  get gravity() {
    return this.g
  }

  constructor(x?: number, y?: number) {
    super()

    this.p = new Point(x, y)
  }
}
