import {
  FederatedPointerEvent,
  type Container,
  type FederatedEvent,
  type FederatedEventMap,
} from 'pixi.js'
import { connectContainerEvent, connectDocumentEvent, Input } from '.'
import type { Disconnectable } from '../core'
import '../extensions'

export class InputController<K extends string> {
  private onSignal!: (signal: Input.Signal) => void
  // Actions to linked keyboard keys
  private keyCodeToActionsMap = new Map<string, Set<K>>()
  // Actions to linked pointer event types
  private pointerEventTypeToActionsMap = new Map<keyof FederatedEventMap, Set<K>>()
  private connections: Disconnectable[] = []

  init(
    inputMap: Record<K, Input.Control>,
    inputStage: Container,
    onSignal: (signal: Input.Signal) => void,
  ) {
    this.onSignal = onSignal

    const entries = Object.entries<Input.Control>(inputMap)
    const keyboardEntries = entries.filter(
      ([_, control]) => control.source == Input.Source.KEYBOARD,
    ) as [K, Input.KeyboardControl][]

    for (const [action, control] of keyboardEntries) {
      for (const keyCode of control.keyCodes) {
        if (!this.keyCodeToActionsMap.has(keyCode)) {
          this.keyCodeToActionsMap.set(keyCode, new Set())
        }
        this.keyCodeToActionsMap.get(keyCode)!.add(action)
      }
    }
    this.connections.push(
      connectDocumentEvent('keydown', (event: KeyboardEvent) => {
        if (event.repeat) {
          return
        }
        this.keyCodeToActionsMap.get(event.code)?.forEach((action) => {
          this.onSignal({
            source: Input.Source.KEYBOARD,
            action,
            event,
          } as Input.KeyboardSignal)
        })
      }),
    )

    const pointerEntries = entries.filter(
      ([_, control]) => control.source == Input.Source.POINTER,
    ) as [K, Input.PointerControl][]

    for (const [action, control] of pointerEntries) {
      const eventName = control.eventType
      if (!this.pointerEventTypeToActionsMap.has(eventName)) {
        this.pointerEventTypeToActionsMap.set(eventName, new Set())
      }
      this.pointerEventTypeToActionsMap.get(eventName)!.add(action)
    }
    for (const [eventType, actions] of this.pointerEventTypeToActionsMap) {
      this.connections.push(
        connectContainerEvent(eventType, inputStage, (event: FederatedEvent) => {
          actions.forEach((action) =>
            this.onSignal({
              source: Input.Source.POINTER,
              action,
              event: event as FederatedPointerEvent,
            } as Input.PointerSignal),
          )
        }),
      )
    }
  }

  deinit() {
    this.connections.forEach((c) => c.disconnect())
    this.connections.length = 0
  }
}
