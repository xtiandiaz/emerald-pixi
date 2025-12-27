import { Signal } from '../core'

export class EntityAdded extends Signal {
  constructor(public readonly entityId: number) {
    super()
  }
}

export class EntityRemoved extends Signal {
  constructor(public readonly entityId: number) {
    super()
  }
}
