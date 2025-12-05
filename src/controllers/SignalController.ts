import type {
  Signal,
  Disconnectable,
  SignalBus,
  SignalEmitter,
  SignalReceptor,
  AnySignalReceptor,
  SomeSignal,
} from '../core'

export default class SignalController implements SignalBus, SignalEmitter {
  private receptors = new Map<string, Set<AnySignalReceptor>>()
  private emissionQueue: (() => void)[] = []

  emit<T extends Signal>(signal: T): void {
    const connectors = this.receptors.get(signal.name)
    connectors?.forEach((c) => this.emissionQueue.push(() => c(signal as T)))
  }

  connect<T extends Signal>(type: SomeSignal<T>, receptor: SignalReceptor<T>): Disconnectable {
    if (!this.receptors.has(type.name)) {
      this.receptors.set(type.name, new Set())
    }
    this.receptors.get(type.name)!.add(receptor as AnySignalReceptor)

    return {
      disconnect: () => this.disconnect(type, receptor),
    }
  }

  disconnect<T extends Signal>(type: SomeSignal<T>, connector: SignalReceptor<T>) {
    this.receptors.get(type.name)?.delete(connector as AnySignalReceptor)
  }

  processSignals() {
    this.emissionQueue.forEach((e) => e())
    this.emissionQueue.length = 0
  }
}
