export type Component = object

export default class Entity {
  readonly id: number

  private static nextId = 0
  private components = {} as Record<string, object>

  private constructor() {
    this.id = Entity.nextId++
  }

  static create(): Entity {
    return new Entity()
  }

  addComponent<T extends Component>(type: new (...params: any) => T, ...params: any): T {
    const component = new type(...params)
    this.components[type.name] = component

    return component
  }

  getComponent<T extends Component>(type: new (...args: any) => T): T | undefined {
    return this.components[type.name] as T
  }

  removeComponent<T extends Component>(type: new () => T): T | undefined {
    const component = this.components[type.name] as T

    delete this.components[type.name]

    return component
  }

  hasComponent<T extends Component>(type: new () => T): boolean {
    return this.components[type.name] != undefined
  }
}
