import Signal from '../core/Signal'

export default class CollisionSignal extends Signal {
  constructor(
    public collider: number,
    public collided: number,
    // public point: Point,
  ) {
    super()
  }
}
