import { Container, Rectangle } from 'pixi.js'
import { World, System, Screen, type Disconnectable, type SignalBus } from './'
import { ScreenResizeSignal } from '../signals'

export abstract class Scene {
  abstract readonly systems: System[]
  readonly slate = new Container()
  protected connections: Disconnectable[] = []

  constructor(readonly name: string) {}

  async init(world: World, sb: SignalBus): Promise<void> {
    this.connections.push(
      sb.connect(ScreenResizeSignal, (s) => this.onScreenResized(s.width, s.height)),
    )
    this.onScreenResized(Screen.width, Screen.height)
  }

  deinit(): void {
    this.systems.forEach((s) => s.deinit?.())
    this.connections.forEach((d) => d.disconnect())
    this.connections.length = 0
  }

  protected onScreenResized(w: number, h: number) {
    this.slate.hitArea = new Rectangle(0, 0, w, h)
  }
}
