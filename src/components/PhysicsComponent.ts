import { Vector2 } from '../core'
import { Point } from 'pixi.js'

export default class PhysicsComponent {
  acceleration = 0
  velocity = new Vector2()
  position = new Point()
  mass = 1
}
