import type { Disconnectable } from '../core'
import { connectDocumentEvent, Input } from '.'

export class InputController<K extends string> {
  private connections: Disconnectable[] = []

  constructor(
    private inputMap: Record<K, Input.Control>,
    private onAction: (action: Input.Action) => void,
  ) {}

  init() {
    const entries = Object.entries<Input.Control>(this.inputMap)
    const keyboardEntries = entries.filter(([k, c]) => c.kind == Input.Control.Kind.KEY)
    const keys = Object.keys(this.inputMap) as K[]

    this.connections.push(
      connectDocumentEvent('keydown', (event) => {
        if (!event.repeat) return keys.forEach((key) => this.onAction({ key, event }))
      }),
    )
  }

  deinit() {
    this.connections.forEach((c) => c.disconnect())
    this.connections.length = 0
  }

  getControl(key: K) {
    console.log(this.inputMap[key])
  }
}
