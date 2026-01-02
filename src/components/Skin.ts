import { Container, type ContainerChild, type Graphics } from 'pixi.js'
import { Component } from '../core'

export class Skin extends Component {
  readonly _dermis = new Container()

  get position() {
    return this._dermis.position
  }

  constructor(...args: [Graphics] | [ContainerChild]) {
    super()

    args.forEach((c) => this._dermis.addChild(c))
  }
}
