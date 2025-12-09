import type { SignalBus, Disconnectable, Entity, World } from './'

export class System {
  protected connections: Disconnectable[] = []

  init?(world: World, sb: SignalBus): void

  deinit() {
    this.connections.forEach((d) => d.disconnect())
    this.connections.length = 0
  }

  update?(world: World, sb: SignalBus, dt: number): void
}
