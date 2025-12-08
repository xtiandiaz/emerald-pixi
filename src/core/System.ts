import type { SignalEmitter, SignalBus, Disconnectable, Entity, World } from './'

export class System {
  protected connections: Disconnectable[] = []

  init?(world: World, sbe: SignalBus & SignalEmitter): void

  deinit() {
    this.connections.forEach((d) => d.disconnect())
    this.connections.length = 0
  }

  update?(world: World, se: SignalEmitter, dt: number): void
}
