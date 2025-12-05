import type { SignalEmitter, SignalBus, Disconnectable, Entity, World } from './'

export default class System {
  protected disconnectables: Disconnectable[] = []

  init?(world: World, sbe: SignalBus & SignalEmitter): void

  deinit() {
    this.disconnectables.forEach((d) => d.disconnect())
    this.disconnectables.length = 0
  }

  update?(world: World, se: SignalEmitter, dt: number): void
}
