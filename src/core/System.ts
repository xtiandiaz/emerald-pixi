import type { SignalBus, Disconnectable, Entity, World } from './'
import type { HUD } from '../ui'

export class System {
  protected connections: Disconnectable[] = []

  init?(world: World, hud: HUD, sb: SignalBus): void

  deinit() {
    this.connections.forEach((d) => d.disconnect())
    this.connections.length = 0
  }

  update?(world: World, sb: SignalBus, dt: number): void
}
