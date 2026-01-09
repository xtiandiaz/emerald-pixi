import { Point, Transform, type PointData } from 'pixi.js'
import { Component, Vector, type Range, type VectorData } from '../core'
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

    this.vertices = _vertices.map((v) => v.clone())

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
    const A = this
    A.updateVerticesIfNeeded()
    B.updateVerticesIfNeeded()

    let contact: Collision.Contact | undefined
    if (B instanceof CircleCollider) {
      contact = A.findContactWithCircle(B, includePoints)
    } else if (B instanceof PolygonCollider) {
      contact = A.findContactWithPolygon(B, includePoints)
    }
    if (contact) {
      Collision.correctContactDirectionIfNeeded(A, B, contact)
    }
    return contact
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
      !A.evaluatePolygonProjectionOverlap(B, contact) ||
      !B.evaluateProjectionOverlap(A, contact)
    ) {
      return
    }
    if (includePoints) {
      contact.points = [Collision.findContactPointsOnPolygon(A.center, B.vertices).cp1]
    }
    return contact
  }

  getProjectionRange(axis: Vector): Range {
    return Collision.getCircleProjectionRange(this.center, this.radius, axis)
  }

  protected evaluatePolygonProjectionOverlap(
    polygon: PolygonCollider,
    overlap: Collision.ProjectionOverlap,
  ): boolean {
    const closestVerIdx = Collision.getClosestVertexIndexToPoint(polygon.vertices, this.center)
    const closestVer = polygon.vertices[closestVerIdx]!
    const axis = new Vector()
    closestVer.subtract(this.center, axis).normalize(axis)

    return Collision.evaluateProjectionOverlap(
      Collision.getCircleProjectionRange(this.center, this.radius, axis),
      Collision.getProjectionRange(polygon.vertices, axis),
      axis,
      overlap,
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
    if (!A.evaluateProjectionOverlap(B, contact) || !B.evaluateProjectionOverlap(A, contact)) {
      return
    }
    if (includePoints) {
      const points = Collision.findContactPoints(A.vertices, B.vertices)
      if (points.length > 1) {
        contact.points = [points[0]!.add(points[1]!).multiplyScalar(0.5)]
      } else {
        contact.points = points
      }
    }
    return contact
  }

  getProjectionRange(axis: VectorData): Range {
    return Collision.getProjectionRange(this.vertices, axis)
  }

  getAxis(index: number, ref_axis: Vector) {
    this.vertices[(index + 1) % this.vertices.length]!.subtract(this.vertices[index]!, ref_axis)
      .orthogonalize(ref_axis)
      .normalize(ref_axis)
  }

  evaluateProjectionOverlap(
    other: Collider,
    ref_projOverlap: Collision.ProjectionOverlap,
  ): boolean {
    const axis = new Vector()

    for (let i = 0; i < this.vertices.length; i++) {
      this.getAxis(i, axis)
      if (
        !Collision.evaluateProjectionOverlap(
          this.getProjectionRange(axis),
          other.getProjectionRange(axis),
          axis,
          ref_projOverlap,
        )
      ) {
        return false
      }
    }
    return true
  }
}
