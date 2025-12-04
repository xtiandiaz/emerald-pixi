import type { ECStore, SignalEmitter, SignalBus, Disconnectable, Entity, World } from './'

export default class System {
  protected disconnectables: Disconnectable[] = []

  init?(world: World, sbe: SignalBus & SignalEmitter): void

  deinit() {
    this.disconnectables.forEach((d) => d.disconnect())
    this.disconnectables.length = 0
  }

  onEntityAdded?(entity: Entity): void
  onEntityRemoved?(entity: Entity): void

  update?(world: World, se: SignalEmitter, dt: number): void
}
