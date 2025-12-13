import { Container, Point, type PointData } from 'pixi.js'
import { Component, Vector } from '../core'

export class RigidBody extends Component {
  mass = 1

  isStatic = false
  isSensor = false

  private _position: Point
  get position() {
    return this._position
  }

  get x(): number {
    return this._position.x
  }
  set x(val: number) {
    this._position.x = val
  }
  get y(): number {
    return this._position.y
  }
  set y(val: number) {
    this._position.y = val
  }

  private _velocity = new Vector()
  get velocity() {
    return this._velocity
  }

  private _force = new Vector()
  get force() {
    return this._force
  }

  private _gravity = new Vector(0, 10)
  get gravity() {
    return this._gravity
  }

  constructor(x?: number, y?: number) {
    super()

    this._position = new Point(x, y)
  }
}
