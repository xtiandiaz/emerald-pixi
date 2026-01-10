import { Assets } from 'pixi.js'
import { World, System, type Disconnectable, type SignalBus } from './'
import { Input, InputController } from '../input'

export abstract class Scene {
  abstract readonly systems: System[]
  abstract readonly inputMap: Record<string, Input.Control>
  protected connections: Disconnectable[] = []
  protected input!: InputController<keyof typeof this.inputMap>

  constructor(public readonly name: string) {}

  async load?(): Promise<void>

  build?(world: World): void

  async init(world: World, signalBus: SignalBus): Promise<void> {
    await this.load?.()

    this.build?.(world)

    this.systems.forEach((s) => s.init?.(world, signalBus))

    this.input = new InputController(this.inputMap, (action) => this.onInput?.(action))
    this.input.init()
  }

  deinit(): void {
    this.input.deinit()

    Assets.reset()

    this.connections.forEach((c) => c.disconnect())
    this.systems.forEach((s) => s.deinit?.())
  }

  onInput?(action: Input.Action): void
}
