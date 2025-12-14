import { Rectangle } from 'pixi.js'
import { World, System, Screen, type Disconnectable, type SignalBus } from './'
import { ScreenResizeSignal } from '../signals'
import { HUD } from '../ui'

export abstract class Scene {
  abstract readonly systems: System[]
  readonly hud = new HUD()
  protected connections: Disconnectable[] = []

  constructor(public readonly name: string) {}

  async load?(): Promise<void>
  build?(world: World): void

  async init(world: World, sb: SignalBus): Promise<void> {
    await this.load?.()

    this.build?.(world)

    this.systems.forEach((s) => s.init?.(world, this.hud, sb))

    this.connections.push(
      sb.connect(ScreenResizeSignal, (s) => this.onScreenResized(s.width, s.height)),
    )
    this.onScreenResized(Screen.width, Screen.height)
  }

  deinit(): void {
    this.connections.forEach((c) => c.disconnect())
    this.systems.forEach((s) => s.deinit?.())
  }

  protected onScreenResized(w: number, h: number) {
    this.hud.hitArea = new Rectangle(0, 0, w, h)
  }
}
