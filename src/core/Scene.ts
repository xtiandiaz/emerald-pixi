import { Container, Rectangle } from 'pixi.js'
import { World, System, Screen, type Disconnectable, type SignalBus, type SignalEmitter } from './'
import { ScreenResizeSignal } from '../signals'

export default abstract class Scene {
  abstract readonly systems: System[]
  readonly slate = new Container()
  protected disconnectables: Disconnectable[] = []

  constructor(readonly name: string) {}

  async init(world: World, sbe: SignalBus & SignalEmitter): Promise<void> {
    this.disconnectables.push(
      sbe.connect(ScreenResizeSignal, (s) => this.onScreenResized(s.width, s.height)),
    )
    this.onScreenResized(Screen.width, Screen.height)
  }

  deinit(): void {
    this.systems.forEach((s) => s.deinit?.())
    this.disconnectables.forEach((d) => d.disconnect())
    this.disconnectables.length = 0
  }

  protected onScreenResized(w: number, h: number) {
    this.slate.hitArea = new Rectangle(0, 0, w, h)
  }
}
