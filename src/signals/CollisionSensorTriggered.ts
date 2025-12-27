import { Signal } from '../core'

export class CollisionSensorTriggered extends Signal {
  constructor(
    public readonly sensor: { id: number; tag?: string },
    public readonly trigger: { id: number; tag?: string },
  ) {
    super()
  }
}
