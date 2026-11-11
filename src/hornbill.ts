import { type CustomLayerInterface, type Map as MapLibreMap, MercatorCoordinate } from 'maplibre-gl'
import * as THREE from 'three'

/** Everything the 3D layer needs to draw Kenyalang this frame. */
export interface BirdPose {
  lng: number
  lat: number
  alt: number // metres above sea level
  ground: number // terrain height under the bird, for the shadow
  heading: number // degrees
  bank: number // degrees
  wingspan: number // drawn size in metres
  /** 0 = gliding (wings still), 1 = flapping hard. */
  effort: number
}

const BLACK = 0x1d1d1b
const WHITE = 0xf2efe8
const BEAK = 0xf2a93b
const CASQUE = 0xe4572e

/**
 * A friendly, low-poly rhinoceros hornbill built from simple shapes (no model file needed).
 * Local units: wingspan = 1; x = right, y = forward, z = up.
 */
function buildHornbill() {
  const mat = (color: number) => new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide })
  const bird = new THREE.Group()

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), mat(BLACK))
  body.scale.set(1, 2.6, 0.95)
  bird.add(body)

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), mat(WHITE))
  belly.scale.set(1, 1.7, 0.7)
  belly.position.set(0, -0.06, -0.035)
  bird.add(belly)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 10), mat(BLACK))
  head.position.set(0, 0.2, 0.035)
  bird.add(head)

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), mat(WHITE))
    eye.position.set(side * 0.045, 0.215, 0.05)
    bird.add(eye)
  }

  // Big curved beak pointing forward, with the red-orange casque on top.
  // three.js cones and cylinders already run along +y (forward); tilt the beak tip slightly down.
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.2, 12), mat(BEAK))
  beak.position.set(0, 0.34, 0.02)
  beak.rotation.x = -0.15
  bird.add(beak)

  // The casque rides on top of the beak, curving slightly upwards.
  const casque = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.024, 0.13, 10), mat(CASQUE))
  casque.position.set(0, 0.3, 0.06)
  casque.rotation.x = 0.25
  bird.add(casque)

  // Tail: long and black with a white band near the end.
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.24, 0.012), mat(BLACK))
  tail.position.set(0, -0.3, -0.005)
  bird.add(tail)
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.101, 0.05, 0.014), mat(WHITE))
  band.position.set(0, -0.36, -0.005)
  bird.add(band)

  // Wings: tapered black panels with white tips, hinged at the shoulder so they can flap.
  const wingShape = new THREE.Shape()
  wingShape.moveTo(0, 0.09)
  wingShape.lineTo(0.42, 0.04)
  wingShape.lineTo(0.47, -0.02)
  wingShape.lineTo(0.4, -0.07)
  wingShape.lineTo(0, -0.1)
  wingShape.closePath()
  const wingGeom = new THREE.ShapeGeometry(wingShape)
  const tipShape = new THREE.Shape()
  tipShape.moveTo(0.36, 0.05)
  tipShape.lineTo(0.42, 0.04)
  tipShape.lineTo(0.47, -0.02)
  tipShape.lineTo(0.4, -0.07)
  tipShape.lineTo(0.34, -0.075)
  tipShape.closePath()
  const tipGeom = new THREE.ShapeGeometry(tipShape)

  const wings: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group()
    hinge.position.set(side * 0.05, 0.02, 0.02)
    const panel = new THREE.Mesh(wingGeom, mat(BLACK))
    const tip = new THREE.Mesh(tipGeom, mat(WHITE))
    tip.position.z = 0.001
    for (const m of [panel, tip]) {
      m.scale.x = side // mirror the left wing
      hinge.add(m)
    }
    bird.add(hinge)
    wings.push(hinge)
  }

  return { bird, wings }
}

function buildShadow() {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }),
  )
  shadow.scale.set(1.6, 0.8, 1)
  return shadow
}

/** A MapLibre custom 3D layer that draws Kenyalang where `getPose()` says he is. */
export function createHornbillLayer(getPose: () => BirdPose | null): CustomLayerInterface {
  const camera = new THREE.Camera()
  const scene = new THREE.Scene()
  const shadowScene = new THREE.Scene()
  const { bird, wings } = buildHornbill()
  scene.add(bird)
  scene.add(new THREE.AmbientLight(0xffffff, 1.1))
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.6)
  sun.position.set(-0.5, -0.4, 1)
  scene.add(sun)
  const shadow = buildShadow()
  shadowScene.add(shadow)

  let renderer: THREE.WebGLRenderer | null = null
  let map: MapLibreMap | null = null
  let flapPhase = 0
  let lastTime = performance.now()

  const matrixAt = (lng: number, lat: number, alt: number, sizeMetres: number) => {
    const mc = MercatorCoordinate.fromLngLat([lng, lat], alt)
    const s = mc.meterInMercatorCoordinateUnits() * sizeMetres
    // Mercator y points south, so flip y to keep the model's "forward" pointing north before rotating.
    return new THREE.Matrix4().makeTranslation(mc.x, mc.y, mc.z ?? 0).scale(new THREE.Vector3(s, -s, s))
  }

  return {
    id: 'kenyalang',
    type: 'custom',
    renderingMode: '3d',
    onAdd(m, gl) {
      map = m
      renderer = new THREE.WebGLRenderer({ canvas: m.getCanvas(), context: gl, antialias: true })
      renderer.autoClear = false
    },
    onRemove() {
      renderer?.dispose()
      renderer = null
      map = null
    },
    render(_gl, args) {
      const pose = getPose()
      if (!pose || !renderer || !map) return
      const now = performance.now()
      const dt = Math.min(0.1, (now - lastTime) / 1000)
      lastTime = now

      // Flap faster and wider when working hard; hold the wings slightly up when gliding.
      flapPhase += dt * (3 + 6 * pose.effort)
      const flap = Math.sin(flapPhase) * (0.12 + 0.45 * pose.effort) + 0.08
      wings[0]!.rotation.y = flap
      wings[1]!.rotation.y = -flap

      const base = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix as unknown as number[])
      const heading = (pose.heading * Math.PI) / 180
      const bank = (pose.bank * Math.PI) / 180

      const model = matrixAt(pose.lng, pose.lat, pose.alt, pose.wingspan)
        .multiply(new THREE.Matrix4().makeRotationZ(-heading))
        .multiply(new THREE.Matrix4().makeRotationY(bank))
      camera.projectionMatrix = base.clone().multiply(model)
      renderer.resetState()
      renderer.render(scene, camera)

      const shadowModel = matrixAt(pose.lng, pose.lat, pose.ground + 1, pose.wingspan).multiply(
        new THREE.Matrix4().makeRotationZ(-heading),
      )
      camera.projectionMatrix = base.clone().multiply(shadowModel)
      renderer.render(shadowScene, camera)
    },
  }
}
