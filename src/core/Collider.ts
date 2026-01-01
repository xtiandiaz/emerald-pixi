import { Point, Transform, type PointData } from 'pixi.js'
import { Vector, type Range } from '../core'
import { Collision } from '.'
import { Geometry } from '.'

export abstract class Collider {
  readonly vertices: Point[]
  readonly normals: Vector[]
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
    protected readonly _normals: Vector[],
    protected readonly centroid: Point,
    public readonly aabb: Collision.AABB = { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } },
  ) {
    this.vertices = [..._vertices]
    this.normals = [..._normals]

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

  setTransform(t: Transform) {
    this.shouldUpdateVertices =
      this.transform.position.x != t.position.x ||
      this.transform.position.y != t.position.y ||
      this.transform.rotation != t.rotation

    this.transform.position.set(t.position.x, t.position.y)
    this.transform.rotation = t.rotation
  }

  hasAABBIntersection(B: Collider): boolean {
    this.updateVerticesIfNeeded()
    B.updateVerticesIfNeeded()

    return Collision.isAABBIntersection(this.aabb, B.aabb)
  }

  findCollision(B: Collider, includePoints: boolean = false): Collision.Result | undefined {
    this.updateVerticesIfNeeded()
    B.updateVerticesIfNeeded()

    if (B instanceof CircleCollider) {
      return this.findCollisionWithCircle(B, includePoints)
    } else if (B instanceof PolygonCollider) {
      return this.findCollisionWithPolygon(B, includePoints)
    }
  }
  abstract findCollisionWithCircle(
    B: CircleCollider,
    includePoints: boolean,
  ): Collision.Result | undefined
  abstract findCollisionWithPolygon(
    B: PolygonCollider,
    includePoints: boolean,
  ): Collision.Result | undefined

  protected updateVertices() {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (let i = 0; i < this._vertices.length; i++) {
      const v = this.vertices[i]!
      this.transform.matrix.apply(this._vertices[i]!, v)
      this._normals[i]!.rotate(this.transform.rotation, this.normals[i])

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
    public radius: number,
  ) {
    super([], [], new Point(x, y), {
      min: { x: x - radius, y: y - radius },
      max: { x: x + radius, y: y + radius },
    })

    this.area = 2 * Math.PI * radius
  }

  findCollisionWithCircle(B: CircleCollider, includePoints: boolean): Collision.Result | undefined {
    const radii = this.radius + B.radius
    const diffPos = B.center.subtract(this.center)
    const distSqrd = diffPos.magnitudeSquared()
    if (distSqrd >= radii * radii) {
      return
    }
    const dist = Math.sqrt(distSqrd)
    const dir = diffPos.divideByScalar(dist)
    const contact: Collision.Result = {
      depth: radii - dist,
      normal: dir,
    }
    if (includePoints) {
      contact.points = [this.center.add(dir.multiplyScalar(this.radius))]
    }
    return contact
  }

  findCollisionWithPolygon(
    B: PolygonCollider,
    includePoints: boolean,
  ): Collision.Result | undefined {
    const contact: Collision.Result = { depth: Infinity, normal: new Vector() }
    let axis!: Vector, cProj!: Range, vProj!: Range

    for (let i = 0; i < B.vertices.length; i++) {
      axis = B.normals[i]!
      vProj = Collision.getVerticesProjectionRange(B.vertices, axis)
      cProj = Collision.getCircleProjectionRange(this.center, this.radius, axis)
      if (!Collision.hasProjectionOverlap(cProj, vProj)) {
        return
      }
      const depth = Math.min(cProj.max - vProj.min, vProj.max - cProj.min)
      if (depth < contact.depth) {
        contact.depth = depth
        contact.normal = axis
      }
    }
    const closestVerIdx = Collision.getClosestVertexIndexToPoint(B.vertices, this.center)
    const closestVer = B.vertices[closestVerIdx]!
    axis = closestVer.subtract(this.center).normalize()
    vProj = Collision.getVerticesProjectionRange(B.vertices, axis)
    cProj = Collision.getCircleProjectionRange(this.center, this.radius, axis)
    if (!Collision.hasProjectionOverlap(cProj, vProj)) {
      return
    }
    const depth = Math.min(vProj.max - cProj.min, cProj.max - vProj.min)
    if (depth < contact.depth) {
      contact.depth = depth
      contact.normal = axis
    }
    const dir = this.center.subtract(B.center)
    if (dir.dot(contact.normal) < 0) {
      contact.normal.invert()
    }
    if (includePoints) {
      contact.points = [Collision.findClosestPointOnVertices(this.center, B.vertices)]
    }

    return contact
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
    const normals: Vector[] = []
    for (let i = 0; i < _vertices.length; i++) {
      const vi = _vertices[i]!
      const vi1 = _vertices[(i + 1) % _vertices.length]!
      const face: Vector = vi1.subtract(vi)
      normals.push(new Vector(face.y, -face.x).normalize())
    }
    super(_vertices, normals, Geometry.calculateCentroid(vertices))

    this.area = (this.aabb.max.x - this.aabb.min.x) * (this.aabb.max.y - this.aabb.min.y)
  }

  findCollisionWithCircle(B: CircleCollider, includePoints: boolean): Collision.Result | undefined {
    return B.findCollisionWithPolygon(this, includePoints)
  }
  findCollisionWithPolygon(
    B: PolygonCollider,
    includePoints: boolean,
  ): Collision.Result | undefined {
    return
  }

  getRotatedNormal(index: number, output?: Vector) {
    return this.normals[index]!.rotate(this.transform.rotation, output)
  }
  getTransformedVertex(index: number, output?: Point) {
    return this.transform.matrix.apply(this.vertices[index]!, output)
  }
  getFaceAtIndex(index: number): { edges: [Vector, Vector]; delta: Vector } {
    const edges: [Vector, Vector] = [
      this.vertices[index]!,
      this.vertices[(index + 1) % this.vertices.length]!,
    ]
    return { edges, delta: edges[1].subtract(edges[0]) }
  }
}
