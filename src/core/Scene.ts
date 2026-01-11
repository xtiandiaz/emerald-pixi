import { Assets, Rectangle } from 'pixi.js'
import { World, System, Screen, type Disconnectable, type SignalBus } from './'
import { Input, InputController } from '../input'
import { ScreenResized } from '../signals'

export abstract class Scene {
  abstract readonly systems: System[]
  abstract readonly inputMap?: Record<string, Input.Control>
  protected input = new InputController<keyof typeof this.inputMap>()
  protected connections: Disconnectable[] = []
  private hitArea = new Rectangle(0, 0, Screen.width, Screen.height)

  constructor(public readonly name: string) {}

  async load?(): Promise<void>

  build?(world: World): void

  async init(world: World, signalBus: SignalBus): Promise<void> {
    await this.load?.()

    this.build?.(world)

    this.systems.forEach((s) => s.init?.(world, signalBus))

    if (this.inputMap) {
      world.interactive = true
      world.hitArea = this.hitArea

      this.input.init(this.inputMap, world, (signal) => this.onInput?.(signal, world))

      this.connections.push(signalBus.connect(ScreenResized, (_) => this.onScreenResized()))
    }
  }

  deinit(): void {
    this.input.deinit()

    Assets.reset()

    this.connections.forEach((c) => c.disconnect())
    this.systems.forEach((s) => s.deinit?.())
  }

  protected onScreenResized() {
    this.hitArea.width = Screen.width
    this.hitArea.height = Screen.height
  }

  protected onInput(signal: Input.Signal, world: World): void {
    this.systems.forEach((s) => s.input?.(signal, world))
  }
}
