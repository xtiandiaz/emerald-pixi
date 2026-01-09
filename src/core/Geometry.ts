import { Point } from 'pixi.js'

export namespace Geometry {
  export type Segment = { a: Point; b: Point }

  export function findClosestPointAtSegment(origin: Point, segment: Geometry.Segment): Point {
    const ao = origin.subtract(segment.a)
    const ab = segment.b.subtract(segment.a)
    const segmentDistSq = ab.magnitudeSquared()
    const normDist = ao.dot(ab) / segmentDistSq
    if (normDist <= 0) {
      return segment.a
    } else if (normDist >= 1) {
      return segment.b
    } else {
      return segment.a.add(ab.multiplyScalar(normDist))
    }
  }

  /* 
    Following 'integraph' of a polygon technique: https://en.wikipedia.org/wiki/Centroid#Of_a_polygon
  */
  export function calculateCentroid(vertices: number[]) {
    const c = new Point()
    let x0: number, y0: number, x1: number, y1: number
    let doubleTotalArea = 0
    let crossProdSignedParalleloArea: number
    for (let i = 0; i < vertices.length; i += 2) {
      x0 = vertices[i]!
      y0 = vertices[i + 1]!
      x1 = vertices[(i + 2) % vertices.length]!
      y1 = vertices[(i + 3) % vertices.length]!
      crossProdSignedParalleloArea = x0 * y1 - x1 * y0
      c.x += (x0 + x1) * crossProdSignedParalleloArea
      c.y += (y0 + y1) * crossProdSignedParalleloArea
      doubleTotalArea += crossProdSignedParalleloArea
    }
    c.x /= 6 * 0.5 * doubleTotalArea
    c.y /= 6 * 0.5 * doubleTotalArea

    return c
  }
}
