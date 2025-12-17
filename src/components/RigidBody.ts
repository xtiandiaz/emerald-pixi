import { Point } from 'pixi.js'
import { Component, Vector } from '../core'

export class RigidBody extends Component {
  position: Point
  rotation: number
  velocity = new Vector()
  gravity = new Vector(0, 9.81)
  force = new Vector()
  mass = 1

  isStatic = false
  isSensor = false

  get x(): number {
    return this.position.x
  }
  set x(val: number) {
    this.position.x = val
  }
  get y(): number {
    return this.position.y
  }
  set y(val: number) {
    this.position.y = val
  }

  constructor(x?: number, y?: number, rotation?: number) {
    super()

    this.position = new Point(x, y)
    this.rotation = rotation ?? 0
  }
}
