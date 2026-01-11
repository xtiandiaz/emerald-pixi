import { Collider, Component } from '../core'

export class CollisionSensor extends Component implements Collider {
  readonly collidedIds = new Set<number>()
  layer = 1

  constructor(public readonly shape: Collider.Shape) {
    super()
  }
}
