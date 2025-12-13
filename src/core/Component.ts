export abstract class Component {
  readonly key: string

  constructor() {
    this.key = this.constructor.name
  }
}
