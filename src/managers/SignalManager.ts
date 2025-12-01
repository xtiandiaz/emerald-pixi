import type { EntityProvider, SignalEmitter, Signal, TargetedSignal } from '../core'

export default class SignalManager implements SignalEmitter {
  private signalIndex = new Map<number, Signal[]>()

  emit(ts: TargetedSignal): void {
    if (!this.signalIndex.has(ts.targetId)) {
      this.signalIndex.set(ts.targetId, [ts.signal])
    } else {
      this.signalIndex.get(ts.targetId)!.push(ts.signal)
    }
  }

  connectSignals(ec: EntityProvider) {
    for (const entry of this.signalIndex.entries()) {
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
    this.signalIndex.clear()
  }
}
