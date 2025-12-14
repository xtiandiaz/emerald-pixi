import {
  Circle,
  Matrix,
  Point,
  Polygon,
  Rectangle,
  type PointData,
  type ShapePrimitive,
} from 'pixi.js'
import { Component } from '../core'

export enum ColliderShape {
  Rectangle = 'RECTANGLE',
  Circle = 'CIRCLE',
}

export class Collider extends Component {
  readonly vertices: number[]
  readonly aabb: number[]
  private center: Point

  constructor(
    private x: number,
    private y: number,
    private w: number,
    private h: number,
  ) {
    super()

    this.center = new Point(x + w / 2, y + h / 2)
    this.aabb = [x, y, x + w, y + h]
    this.vertices = [x, y, x + w, y, x + w, y + h, x, y + h]
  }

  update(wPos: PointData, rot: number) {
    this.aabb[0] = this.x + wPos.x
    this.aabb[1] = this.y + wPos.y
    this.aabb[2] = this.aabb[0] + this.w
    this.aabb[3] = this.aabb[1] + this.h
  }
}
