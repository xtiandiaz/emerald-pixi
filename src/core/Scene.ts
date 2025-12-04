import { World, System, type Disconnectable, type SignalBus } from './'
import { ScreenResizeSignal } from '../signals'

export default abstract class Scene {
  abstract readonly systems: System[]
  protected disconnectables: Disconnectable[] = []

  constructor(readonly name: string) {}

  async init(world: World, sb: SignalBus): Promise<void> {
    await this.load?.()

    this.connect(sb, world)

    this.build(world)
  }

  async load?(): Promise<void>

  connect(sb: SignalBus, world: World) {
    this.disconnectables.push(sb.connect(ScreenResizeSignal, (s) => this.onScreenResized?.(s)))
  }

  abstract build(world: World): void

  deinit(): void {
    this.systems.forEach((s) => s.deinit?.())
    this.disconnectables.forEach((d) => d.disconnect())
    this.disconnectables.length = 0
  }

  onScreenResized?(s: ScreenResizeSignal): void
}
