export default abstract class Signal {
  readonly name: string

  constructor(public readonly targetId: number) {
    this.name = this.constructor.name
  }
}
