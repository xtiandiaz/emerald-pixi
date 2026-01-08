import { Point, Transform, type PointData } from 'pixi.js'
import { Component, Vector, type Range } from '../core'
import { Collision } from '../core'
import { Geometry } from '../core'

export abstract class Collider extends Component {
  layer = 1

  readonly vertices: Point[]
  protected transform = new Transform()
  private shouldUpdateVertices = true

  abstract readonly area: number

  get center(): Point {
    return this.transform.position.add(this.centroid)
  }
  get position(): PointData {
    return this.transform.position
  }

  protected constructor(
    protected readonly _vertices: Point[],
    protected readonly centroid: Point,
    public readonly aabb: Collision.AABB = { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } },
  ) {
    super()

    this.vertices = [..._vertices]

    this.updateVertices()
  }

  static circle(x: number, y: number, r: number) {
    return new CircleCollider(x, y, r)
  }
  static polygon(vertices: number[]) {
    return new PolygonCollider(vertices)
  }
  static rectangle(x: number, y: number, w: number, h: number) {
    return Collider.polygon([x, y, x + w, y, x + w, y + h, x, y + h])
  }

  setTransform(position: PointData, rotation: number) {
    this.shouldUpdateVertices =
      this.transform.position.x != position.x ||
      this.transform.position.y != position.y ||
      this.transform.rotation != rotation

    this.transform.position.set(position.x, position.y)
    this.transform.rotation = rotation
  }

  hasAABBIntersection(B: Collider): boolean {
    this.updateVerticesIfNeeded()
    B.updateVerticesIfNeeded()

    return Collision.isAABBIntersection(this.aabb, B.aabb)
  }

  findContact(B: Collider, includePoints: boolean = false): Collision.Contact | undefined {
    this.updateVerticesIfNeeded()
    B.updateVerticesIfNeeded()

    if (B instanceof CircleCollider) {
      return this.findContactWithCircle(B, includePoints)
    } else if (B instanceof PolygonCollider) {
      return this.findContactWithPolygon(B, includePoints)
    }
  }

  abstract findContactWithCircle(
    B: CircleCollider,
    includePoints: boolean,
  ): Collision.Contact | undefined
  abstract findContactWithPolygon(
    B: PolygonCollider,
    includePoints: boolean,
  ): Collision.Contact | undefined

  abstract getProjectionRange(axis: Vector): Range

  protected updateVertices() {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (let i = 0; i < this._vertices.length; i++) {
      const v = this.vertices[i]!
      this.transform.matrix.apply(this._vertices[i]!, v)

      minX = Math.min(minX, v.x)
      maxX = Math.max(maxX, v.x)
      minY = Math.min(minY, v.y)
      maxY = Math.max(maxY, v.y)
    }

    this.aabb.min.x = minX
    this.aabb.min.y = minY
    this.aabb.max.x = maxX
    this.aabb.max.y = maxY
  }

  private updateVerticesIfNeeded() {
    if (this.shouldUpdateVertices) {
      this.updateVertices()
    }
    this.shouldUpdateVertices = false
  }
}

export class CircleCollider extends Collider {
  readonly area: number

  constructor(
    x: number,
    y: number,
    public readonly radius: number,
  ) {
    super([], new Point(x, y), {
      min: { x: x - radius, y: y - radius },
      max: { x: x + radius, y: y + radius },
    })

    this.area = Math.PI * radius * radius
  }

  findContactWithCircle(B: CircleCollider, includePoints: boolean): Collision.Contact | undefined {
    const radii = this.radius + B.radius
    const diffPos = B.center.subtract(this.center)
    const distSqrd = diffPos.magnitudeSquared()
    if (distSqrd >= radii * radii) {
      return
    }
    const dist = Math.sqrt(distSqrd)
    const dir = diffPos.divideByScalar(dist)
    const contact: Collision.Contact = {
      depth: radii - dist,
      normal: dir,
    }
    if (includePoints) {
      contact.points = [this.center.add(dir.multiplyScalar(this.radius))]
    }
    return contact
  }

  findContactWithPolygon(
    B: PolygonCollider,
    includePoints: boolean,
  ): Collision.Contact | undefined {
    const A = this
    const contact: Collision.Contact = { depth: Infinity, normal: new Vector() }
    if (
      !A.projectWithPolygonAndEvaluateContact(B, contact) ||
      !B.projectWithAnotherAndEvaluateContact(A, contact)
    ) {
      return
    }

    Collision.fixContactDirectionIfNeeded(contact, A.center, B.center)

    if (includePoints) {
      contact.points = [Collision.findClosestPointOnVertices(A.center, B.vertices)]
    }
    return contact
  }

  getProjectionRange(axis: Vector): Range {
    return Collision.getCircleProjectionRange(this.center, this.radius, axis)
  }

  protected projectWithPolygonAndEvaluateContact(
    polygon: PolygonCollider,
    contact: Collision.Contact,
  ): boolean {
    const closestVerIdx = Collision.getClosestVertexIndexToPoint(polygon.vertices, this.center)
    const closestVer = polygon.vertices[closestVerIdx]!
    const axis = new Vector()
    closestVer.subtract(this.center, axis).normalize(axis)

    return Collision.evaluateContact(
      Collision.getCircleProjectionRange(this.center, this.radius, axis),
      Collision.getVerticesProjectionRange(polygon.vertices, axis),
      axis,
      contact,
    )
  }

  protected updateVertices(): void {
    this.aabb.min.x = this.position.x - this.radius
    this.aabb.min.y = this.position.y - this.radius
    this.aabb.max.x = this.position.x + this.radius
    this.aabb.max.y = this.position.y + this.radius
  }
}

export class PolygonCollider extends Collider {
  readonly area: number

  constructor(vertices: number[]) {
    const _vertices: Point[] = []
    for (let i = 0; i < vertices.length; i += 2) {
      _vertices.push(new Point(vertices[i]!, vertices[i + 1]!))
    }
    super(_vertices, Geometry.calculateCentroid(vertices))

    this.area = (this.aabb.max.x - this.aabb.min.x) * (this.aabb.max.y - this.aabb.min.y)
  }

  findContactWithCircle(B: CircleCollider, includePoints: boolean): Collision.Contact | undefined {
    return B.findContactWithPolygon(this, includePoints)
  }
  findContactWithPolygon(
    B: PolygonCollider,
    includePoints: boolean,
  ): Collision.Contact | undefined {
    const A = this
    const contact: Collision.Contact = { depth: Infinity, normal: new Vector() }
    if (
      !A.projectWithAnotherAndEvaluateContact(B, contact) ||
      !B.projectWithAnotherAndEvaluateContact(A, contact)
    ) {
      return
    }

    Collision.fixContactDirectionIfNeeded(contact, A.center, B.center)
  }

  getProjectionRange(axis: Vector): Range {
    return Collision.getVerticesProjectionRange(this.vertices, axis)
  }

  getAxis(index: number, axis: Vector) {
    this.vertices[(index + 1) % this.vertices.length]!.subtract(this.vertices[index]!, axis)
      .orthogonalize(axis)
      .normalize(axis)
  }

  projectWithAnotherAndEvaluateContact(another: Collider, contact: Collision.Contact): boolean {
    const axis = new Vector()

    for (let i = 0; i < this.vertices.length; i++) {
      this.getAxis(i, axis)
      if (
        !Collision.evaluateContact(
          this.getProjectionRange(axis),
          another.getProjectionRange(axis),
          axis,
          contact,
        )
      ) {
        return false
      }
    }
    return true
  }
}
