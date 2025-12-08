import { Component } from '../core'
import type { Point } from 'pixi.js'
import type { Vector } from '../core'
import { Body } from 'matter-js'

export class RigidBody extends Component {
  constructor(public readonly body: Body) {
    super()
  }

  setPosition(p: Point) {
    Body.setPosition(this.body, p)
  }

  setVelocity(v: Vector) {
    Body.setVelocity(this.body, v)
  }

  applyForce(p: Point, f: Vector) {
    Body.applyForce(this.body, p, f)
  }
}
