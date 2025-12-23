import { type ContainerChild } from 'pixi.js'
import { Component } from '../core'

export abstract class ContainerChildComponent<T extends ContainerChild> extends Component {
  abstract readonly body: T

  constructor() {
    super()
  }
}
