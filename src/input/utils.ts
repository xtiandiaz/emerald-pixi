import type { Container, ContainerChild, ContainerEvents, EventEmitter } from 'pixi.js'
import type { Disconnectable } from '../core'

export function connectDocumentEvent<K extends keyof DocumentEventMap>(
  eventType: K,
  connector: (e: DocumentEventMap[K]) => void,
): Disconnectable {
  document.addEventListener(eventType, connector)

  return {
    disconnect: () => document.removeEventListener(eventType, connector),
  }
}

type AnyEvent = { [K: ({} & string) | ({} & symbol)]: any }
export function connectContainerEvent<K extends keyof ContainerEvents<ContainerChild>>(
  eventType: K,
  target: Container,
  connector: (
    ...args: EventEmitter.ArgumentMap<ContainerEvents<ContainerChild> & AnyEvent>[Extract<
      K,
      keyof ContainerEvents<ContainerChild> | keyof AnyEvent
    >]
  ) => void,
): Disconnectable {
  target.on(eventType, connector)

  return {
    disconnect: () => target.off(eventType, connector),
  }
}
