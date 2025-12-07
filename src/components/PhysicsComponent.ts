import { Body } from 'matter-js'
import type { Point } from 'pixi.js'
import type { Vector } from '../core'

export default class PhysicsComponent {
  appliesGravity = true

  constructor(public readonly body: Body) {
    this.body = body
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
