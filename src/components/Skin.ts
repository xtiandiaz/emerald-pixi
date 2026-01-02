import { Container, type ContainerChild, type Graphics } from 'pixi.js'
import { Component } from '../core'

export class Skin extends Component {
  readonly dermis = new Container()

  get position() {
    return this.dermis.position
  }

  constructor(...args: Graphics[] | ContainerChild[]) {
    super()

    args.forEach((c) => this.dermis.addChild(c))
  }
}
