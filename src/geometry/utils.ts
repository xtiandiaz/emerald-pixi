import { Point, type Bounds } from 'pixi.js'
import { Vector, type Range, type Entity } from '../core'
import { Body } from '../components'

/* 
  Following:
  – Using the 'integraph' of a polygon technique: https://en.wikipedia.org/wiki/Centroid#Of_a_polygon
  – Using the 'Shoelace' formula to get the polygons's area: https://en.wikipedia.org/wiki/Shoelace_formula
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

export function testForAABB(a: Bounds, b: Bounds): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}
export function testForAABBWithDiagonalVertices(a: number[], b: number[]): boolean {
  return !(a[0]! > b[2]! || a[2]! < b[0]! || a[1]! > b[3]! || a[3]! < b[1]!)
}

// export function capSegment(a: Vector, b: Vector, )

// export function updateEntityColliderShapesTransform(e_cs: { e: Entity; c: Collider<any> }[]) {
//   for (const { e, c } of e_cs) {
//     const rb = e.getComponent(Body)
//     if (rb) {
//       c.update(rb.position, rb.rotation)
//     } else {
//       c.update(e.position, e.rotation)
//     }
//   }
// }

// /*
//   Following SAT – Separating Axis Theorem: https://www.sevenson.com.au/programming/sat/
// */
// export function testForCollisionWithVertices(
//   vA: number[],
//   vB: number[],
// ): CollisionResult | undefined {
//   return testForCollisionWithRangeProvider(vA, (axis) => getPolygonProjectionRange(vB, axis))
// }
// export function testForCollisionWithRangeProvider(
//   vA: number[],
//   getProjectionRangeB: (axis: Vector) => Range,
// ): CollisionResult | undefined {
//   const res: CollisionResult = {
//     normal: new Vector(),
//     penetration: Infinity,
//     faceIndex: -1,
//   }
//   for (let i = 0; i < vA.length; i += 2) {
//     const axis = getProjectionAxis(vA, i)
//     const pRangeA = getPolygonProjectionRange(vA, axis)
//     const pRangeB = getProjectionRangeB(axis)

//     if (pRangeB.max < pRangeA.min || pRangeA.max < pRangeB.min) {
//       return undefined
//     }
//     const penetration = Math.min(
//       Math.abs(pRangeA.max - pRangeB.min),
//       Math.abs(pRangeB.max - pRangeA.min),
//     )
//     if (penetration < res.penetration) {
//       res.penetration = penetration
//       res.normal = axis
//       res.faceIndex = i
//     }
//   }
//   return res
// }

export function getProjectionAxis(vertices: number[], index: number): Vector {
  return new Vector(
    vertices[(index + 3) % vertices.length]! - vertices[index + 1]!,
    vertices[index]! - vertices[(index + 2) % vertices.length]!,
  ).normalize()
}

export function getFaceAtIndex(vertices: number[], i: number): number[] {
  return [
    vertices[i]!,
    vertices[i + 1]!,
    vertices[(i + 2) % vertices.length]!,
    vertices[(i + 3) % vertices.length]!,
  ]
}
