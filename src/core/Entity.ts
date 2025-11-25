export type Component = object

export default class Entity {
  readonly id: number

  private static nextId = 0
  private components = {} as Record<string, object>

  constructor() {
    this.id = Entity.nextId++
  }

  addComponent<T extends Component>(type: new () => T): T {
    const component = new type()
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
