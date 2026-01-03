import { Assets, Rectangle } from 'pixi.js'
import { World, System, Screen, type Disconnectable, type SignalBus } from './'
import { ScreenResized } from '../signals'
import { HUD } from '../ui'

export abstract class Scene {
  abstract readonly systems: System[]
  readonly hud = new HUD()
  protected connections: Disconnectable[] = []

  constructor(public readonly name: string) {}

  async load?(): Promise<void>
  build?(world: World): void

  async init(world: World, signalBus: SignalBus): Promise<void> {
    await this.load?.()

    this.build?.(world)

    this.systems.forEach((s) => s.init?.(world, signalBus))

    this.connections.push(
      signalBus.connect(ScreenResized, (s) => this.onScreenResized(s.width, s.height)),
    )
    this.onScreenResized(Screen.width, Screen.height)
  }

  deinit(): void {
    Assets.reset()

    this.connections.forEach((c) => c.disconnect())
    this.systems.forEach((s) => s.deinit?.())
  }

  protected onScreenResized(w: number, h: number) {
    this.hud.hitArea = new Rectangle(0, 0, w, h)
  }
}
