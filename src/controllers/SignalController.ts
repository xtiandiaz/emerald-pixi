import type {
  Signal,
  Disconnectable,
  SignalBus,
  SignalConnector,
  AnySignalConnector,
  SomeSignal,
} from '../core'

export class SignalController implements SignalBus {
  private connectors = new Map<string, Set<AnySignalConnector>>()
  private emissionQueue: (() => void)[] = []

  emit<T extends Signal>(signal: T): void {
    const connectors = this.connectors.get(signal.name)
    connectors?.forEach((c) => this.emissionQueue.push(() => c(signal as T)))
  }

  connect<T extends Signal>(type: SomeSignal<T>, connector: SignalConnector<T>): Disconnectable {
    if (!this.connectors.has(type.name)) {
      this.connectors.set(type.name, new Set())
    }
    this.connectors.get(type.name)!.add(connector as AnySignalConnector)

    return {
      disconnect: () => this.disconnect(type, connector),
    }
  }

  disconnect<T extends Signal>(type: SomeSignal<T>, connector: SignalConnector<T>) {
    this.connectors.get(type.name)?.delete(connector as AnySignalConnector)
  }

  processSignals() {
    this.emissionQueue.forEach((e) => e())
    this.emissionQueue.length = 0
  }
}
