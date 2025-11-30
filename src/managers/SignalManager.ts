import type { EntityProvider, SignalEmitter } from '../core'
import { Signal } from '../signals'

export default class SignalManager implements SignalEmitter {
  private targetedSignals = new Map<number, Signal[]>()

  emit(signal: Signal): void {
    if (!this.targetedSignals.has(signal.targetId)) {
      this.targetedSignals.set(signal.targetId, [signal])
    } else {
      this.targetedSignals.get(signal.targetId)!.push(signal)
    }
  }

  connectSignals(ec: EntityProvider) {
    for (const entry of this.targetedSignals.entries()) {
      const entity = ec.getEntity(entry[0])
      if (!entity) {
        continue
      }
      for (const signal of entry[1]) {
        entity.getConnection(signal.name)?.call(entity, signal)
      }
    }
    this.clear()
  }

  clear() {
    this.targetedSignals.clear()
  }
}
