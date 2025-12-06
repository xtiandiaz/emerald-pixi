import { Body } from 'matter-js'
import type { Point } from 'pixi.js'
import type { Vector } from '../core'

export default class PhysicsComponent {
  appliesGravity = true

  constructor(public readonly body: Body) {
    this.body = body
  }

  setPosition(p: Point): PhysicsComponent {
    Body.setPosition(this.body, p)
    return this
  }

  setVelocity(v: Vector): PhysicsComponent {
    Body.setVelocity(this.body, v)
    return this
  }

  applyForce(p: Point, f: Vector): PhysicsComponent {
    Body.applyForce(this.body, p, f)
    return this
  }
}
