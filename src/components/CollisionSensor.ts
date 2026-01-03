import { Component } from '../core'

export class CollisionSensor extends Component {
  readonly targetTags: Set<string>
  readonly collidedIds = new Set<number>()

  constructor(targetTags: string[]) {
    super()

    this.targetTags = new Set(targetTags)
  }
}
