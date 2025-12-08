import { Component, Vector } from '../core'
import { Body } from 'matter-js'
import type { Point } from 'pixi.js'

export class Physics extends Component {
  gravity = new Vector(0, -10)

  constructor(public readonly body: Body) {
    super()

    this.body = body
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
