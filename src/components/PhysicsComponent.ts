import { Body } from 'matter-js'

export default class PhysicsComponent {
  readonly body: Body

  constructor(body: Body) {
    this.body = body
  }
}
