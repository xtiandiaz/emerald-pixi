import type { Container, ContainerChild, ContainerEvents, EventEmitter } from 'pixi.js'
import type { Disconnectable } from '../core'

export function connectDocumentEvent<K extends keyof DocumentEventMap>(
  key: K,
  connector: (e: DocumentEventMap[K]) => void,
): Disconnectable {
  document.addEventListener(key, connector)

  return {
    disconnect: () => document.removeEventListener(key, connector),
  }
}

type AnyEvent = { [K: ({} & string) | ({} & symbol)]: any }
export function connectContainerEvent<K extends keyof ContainerEvents<ContainerChild>>(
  key: K,
  target: Container,
  connector: (
    ...args: EventEmitter.ArgumentMap<ContainerEvents<ContainerChild> & AnyEvent>[Extract<
      K,
      keyof ContainerEvents<ContainerChild> | keyof AnyEvent
    >]
  ) => void,
): Disconnectable {
  target.on(key, connector)

  return {
    disconnect: () => target.off(key, connector),
  }
}
