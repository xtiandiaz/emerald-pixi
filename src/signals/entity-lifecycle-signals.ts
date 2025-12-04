import { Signal } from '../core'

export class EntityAddedSignal extends Signal {
  constructor(public entityId: number) {
    super()
  }
}

export class EntityRemovedSignal extends Signal {
  constructor(public entityId: number) {
    super()
  }
}
