import { Vector2 } from '../core'
import { Point } from 'pixi.js'
import { Body } from 'matter-js'

export default class PhysicsComponent {
  readonly body: Body
  acceleration = 0
  velocity = new Vector2()
  position = new Point()
  mass = 1

  constructor(body: Body) {
    this.body = body
  }
}
