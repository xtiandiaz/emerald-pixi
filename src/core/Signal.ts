export interface _Signal<Key> {
  key: Key
}

export abstract class Signal {
  readonly name: string

  constructor() {
    this.name = this.constructor.name
  }
}
