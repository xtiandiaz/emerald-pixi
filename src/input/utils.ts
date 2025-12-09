import type { Container, ContainerChild, ContainerEvents, FederatedPointerEvent } from 'pixi.js'
import type { Disconnectable } from '../core'
import type { PointerEventKey } from './types'

export function connectDocumentEvent<K extends keyof DocumentEventMap>(
  key: K,
  connector: (e: DocumentEventMap[K]) => void,
): Disconnectable {
  document.addEventListener(key, connector)

  return {
    disconnect: () => document.removeEventListener(key, connector),
  }
}

export function connectPointerEvent(
  key: PointerEventKey,
  target: Container,
  connector: (e: FederatedPointerEvent) => void,
): Disconnectable {
  target.on(key, connector)

  return {
    disconnect: () => target.off(key, connector),
  }
}
