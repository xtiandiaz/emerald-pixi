import { Collider, Collision, Component } from '..'

export class CollisionTrigger extends Component implements Collision.Component {
  layer = 1

  constructor(public readonly collider: Collider) {
    super()
  }
}
