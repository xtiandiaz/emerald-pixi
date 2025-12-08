import { Signal } from '../core'

export class CollisionSignal extends Signal {
  constructor(
    public colliderId: number,
    public collidedId: number,
  ) {
    super()
  }
}
