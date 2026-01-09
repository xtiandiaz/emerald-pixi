import { Assets } from 'pixi.js'
import { World, System, type Disconnectable, type SignalBus } from './'

export abstract class Scene {
  abstract readonly systems: System[]
  protected connections: Disconnectable[] = []

  constructor(public readonly name: string) {}

  async load?(): Promise<void>

  build?(world: World): void

  async init(world: World, signalBus: SignalBus): Promise<void> {
    await this.load?.()

    this.build?.(world)

    this.systems.forEach((s) => s.init?.(world, signalBus))
  }

  deinit(): void {
    Assets.reset()

    this.connections.forEach((c) => c.disconnect())
    this.systems.forEach((s) => s.deinit?.())
  }
}
