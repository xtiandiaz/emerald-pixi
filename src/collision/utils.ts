import type { Bounds } from 'pixi.js'
import { Vector, type Range, type Entity } from '../core'
import { RigidBody, type Collider } from '../components'
import type { CollisionResult } from './types'

export function testForAABB(a: Bounds, b: Bounds): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}
export function testForAABBWithDiagonalVertices(a: number[], b: number[]): boolean {
  return !(a[0]! > b[2]! || a[2]! < b[0]! || a[1]! > b[3]! || a[3]! < b[1]!)
}

export function getPolygonProjectionRange(vertices: number[], axis: Vector): Range {
  const range = { min: Infinity, max: -Infinity }
  let proj: number
  for (let j = 0; j < vertices.length; j += 2) {
    proj = vertices[j]! * axis.x + vertices[j + 1]! * axis.y
    range.min = Math.min(range.min, proj)
    range.max = Math.max(range.max, proj)
  }
  return range
}

export function getCircleProjectionRange(x: number, y: number, r: number, axis: Vector): Range {
  const dot = axis.x * x + axis.y * y

  return { min: dot - r, max: dot + r }
}

export function updateEntityCollidersShapeTransform(e_cs: { e: Entity; c: Collider<any> }[]) {
  for (const { e, c } of e_cs) {
    const rb = e.getComponent(RigidBody)
    if (rb) {
      c.updateShapeTransform(rb.position.x, rb.position.y, rb.rotation)
    } else {
      c.updateShapeTransform(e.position.x, e.position.y, e.rotation)
    }
  }
}

/* 
  Following SAT – Separating Axis Theorem: https://www.sevenson.com.au/programming/sat/ 
*/
export function testForCollisionWithVertices(
  vA: number[],
  vB: number[],
): CollisionResult | undefined {
  return testForCollisionWithRangeProvider(vA, (axis) => getPolygonProjectionRange(vB, axis))
}
export function testForCollisionWithRangeProvider(
  vA: number[],
  getProjectionRangeB: (axis: Vector) => Range,
): CollisionResult | undefined {
  const res: CollisionResult = {
    dir: new Vector(),
    penetration: Infinity,
  }
  for (let i = 0; i < vA.length; i += 2) {
    const axis = getProjectionAxis(vA, i)
    const pRangeA = getPolygonProjectionRange(vA, axis)
    const pRangeB = getProjectionRangeB(axis)

    if (pRangeB.max < pRangeA.min || pRangeA.max < pRangeB.min) {
      return undefined
    }
    const penetration = Math.min(
      Math.abs(pRangeA.max - pRangeB.min),
      Math.abs(pRangeB.max - pRangeA.min),
    )
    if (penetration < res.penetration) {
      res.penetration = penetration
      res.dir = axis
    }
  }
  return res
}

function getProjectionAxis(vertices: number[], index: number): Vector {
  return new Vector(
    vertices[(index + 3) % vertices.length]! - vertices[index + 1]!,
    vertices[index]! - vertices[(index + 2) % vertices.length]!,
  ).normalize()
}
