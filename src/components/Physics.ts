import { Component, Vector } from '../core'
import { Body } from 'matter-js'
import { Container, Point } from 'pixi.js'

export class Physics extends Component {
  gravity = new Vector(0, -10)

  get position() {
    return new Point(this.body.position.x, this.body.position.y)
  }

  constructor(public readonly body: Body) {
    super()

    this.body = body
  }

  init(container: Container): void {
    container.position.set(this.body.position.x, this.body.position.y)
  }

  setGravity(x: number, y: number): Physics {
    this.gravity.set(x, y)
    return this
  }

  setPosition(p: Point) {
    Body.setPosition(this.body, p)
  }

  setVelocity(v: Vector) {
    Body.setVelocity(this.body, v)
  }

  applyForce(f: Vector, from?: Point) {
    Body.applyForce(this.body, from ?? this.body.position, f)
  }
}
