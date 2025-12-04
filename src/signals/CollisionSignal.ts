import { Signal } from '../core'

export default class CollisionSignal extends Signal {
  constructor(
    public colliderId: number,
    public collidedId: number,
  ) {
    super()
  }
}
