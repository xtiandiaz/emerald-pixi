import type { Disconnectable } from '../core'

export namespace Input {
  export interface Control {
    kind: Control.Kind
  }
  export namespace Control {
    export enum Kind {
      KEY,
      POINTER,
    }
    export type KeyOrButtonState = 'pressed' | 'released'

    export interface Key extends Control {
      code: string
      state: Control.KeyOrButtonState
    }

    export const key = (code: string, state: KeyOrButtonState): Key => ({
      kind: Kind.KEY,
      code,
      state,
    })
  }

  export interface Action {
    key: string
    event: KeyboardEvent
  }

  export function connectDocumentEvent<K extends keyof DocumentEventMap>(
    key: K,
    connector: (e: DocumentEventMap[K]) => void,
  ): Disconnectable {
    document.addEventListener(key, connector)

    return {
      disconnect: () => document.removeEventListener(key, connector),
    }
  }
}
