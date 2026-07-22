import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

// ── Shaders (moved from <script> tags) ──────────────────────────
const vertexShader = `
  attribute float size;
  attribute vec3 customColor;
  varying vec3 vColor;
  void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_PointSize = size * ( 300.0 / -mvPosition.z );
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform vec3 color;
  uniform sampler2D pointTexture;
  varying vec3 vColor;
  void main() {
    gl_FragColor = vec4( color * vColor, 1.0 );
    gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
  }
`;

export default function TextAnimation() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Scene Setup ─────────────────────────────────────────────
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 1, 10000);
    camera.position.set(0, 0, 100);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // transparent background
    container.appendChild(renderer.domElement);

    // ── Mouse ────────────────────────────────────────────────────
    const mouse     = new THREE.Vector2(-200, 200);
    const raycaster = new THREE.Raycaster();
    let   buttom    = false;
    let   ease      = 0.05;
    const colorChange   = new THREE.Color();

    // ── Invisible plane for raycasting ──────────────────────────
    const planeGeo  = new THREE.PlaneGeometry(
      visibleWidthAtZDepth(100, camera),
      visibleHeightAtZDepth(100, camera)
    );
    const planeMat  = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    const planeArea = new THREE.Mesh(planeGeo, planeMat);
    planeArea.visible = false;
    scene.add(planeArea);

    // ── Particles ref ────────────────────────────────────────────
    let particles: THREE.Points | null = null;
    let geometryCopy: THREE.BufferGeometry | null = null;

    // ── Load font + texture ──────────────────────────────────────
    let particleTexture: THREE.Texture | null = null;
const texLoader = new THREE.TextureLoader();
particleTexture = texLoader.load(
  'https://res.cloudinary.com/dfvtkoboz/image/upload/v1605013866/particle_a64uzf.png'
);

const fontLoader = new FontLoader();
fontLoader.load(
  '/Orbitron_Regular.json',
  (font) => {
    // font is guaranteed loaded here
    createText(font, particleTexture!);
  }
);
    // ── Create particle text ─────────────────────────────────────
    function createText(font: any, particleImg: THREE.Texture) {
      const data = {
        text:          'STUDICTION\nYOUR FUTURE',   // ← change your text here
        amount:        1500,
        particleSize:  1,
        textSize:      22,
        area:          500,
        padding:    20,
      };

      let thePoints: THREE.Vector3[] = [];
      let colors: number[] = [];
      let sizes: number[] = [];

      let shapes = font.generateShapes(data.text, data.textSize);
      let geo    = new THREE.ShapeGeometry(shapes);
      geo.computeBoundingBox();

      const xMid = -0.5 * (geo.boundingBox!.max.x - geo.boundingBox!.min.x);
      const yMid =  (geo.boundingBox!.max.y - geo.boundingBox!.min.y) / 2.85;
      geo.center();

      let holeShapes = [];
      for (let q = 0; q < shapes.length; q++) {
        let shape = shapes[q];
        if (shape.holes && shape.holes.length > 0) {
          for (let j = 0; j < shape.holes.length; j++) {
            holeShapes.push(shape.holes[j]);
          }
        }
      }
      shapes.push.apply(shapes, holeShapes);

      for (let x = 0; x < shapes.length; x++) {
        let shape       = shapes[x];
        const amount    = shape.type === 'Path' ? data.amount / 2 : data.amount;
        let points      = shape.getSpacedPoints(amount);

        points.forEach((element: THREE.Vector2) => {
          thePoints.push(new THREE.Vector3(element.x, element.y, 0));
          colors.push(colorChange.r, colorChange.g, colorChange.b);
          sizes.push(1);
        });
      }

      let geoParticles = new THREE.BufferGeometry().setFromPoints(thePoints);
      geoParticles.translate(xMid, yMid, 0);
      geoParticles.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
      geoParticles.setAttribute('size',        new THREE.Float32BufferAttribute(sizes, 1));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          color:         { value: new THREE.Color(0xffffff) },
          pointTexture:  { value: particleImg }
        },
        vertexShader,
        fragmentShader,
        blending:    THREE.AdditiveBlending,
        depthTest:   false,
        transparent: true,
      });

      particles = new THREE.Points(geoParticles, material);
      scene.add(particles);

      geometryCopy = new THREE.BufferGeometry();
      geometryCopy.copy(particles.geometry);
    }

    // ── Animation loop ───────────────────────────────────────────
    function animate() {
      animId = requestAnimationFrame(animate);

      if (particles && geometryCopy) {
        const time       = ((.001 * performance.now()) % 12) / 12;
        const zigzagTime = (1 + Math.sin(time * 2 * Math.PI)) / 6;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(planeArea);

        if (intersects.length > 0) {
          const pos    = particles.geometry.attributes.position;
          const copy   = geometryCopy.attributes.position;
          const coulors = particles.geometry.attributes.customColor;
          const size   = particles.geometry.attributes.size;

          const mx = intersects[0].point.x;
          const my = intersects[0].point.y;
          
          for (let i = 0, l = pos.count; i < l; i++) {
            const initX = copy.getX(i);
            const initY = copy.getY(i);
            const initZ = copy.getZ(i);

            let px = pos.getX(i);
            let py = pos.getY(i);
            let pz = pos.getZ(i);

            colorChange.setHSL(0.5, 1, 1);
            coulors.setXYZ(i, colorChange.r, colorChange.g, colorChange.b);
            coulors.needsUpdate = true;
            size.array[i] = 1;
            size.needsUpdate = true;

            let dx = mx - px;
            let dy = my - py;
            const d = dx * dx + dy * dy;
            const f = -250 / d;
            const mouseDistance = Math.sqrt(d);

            if (buttom) {
              const t = Math.atan2(dy, dx);
              px -= f * Math.cos(t);
              py -= f * Math.sin(t);
              colorChange.setHSL(0.5 + zigzagTime, 1.0, 0.5);
              coulors.setXYZ(i, colorChange.r, colorChange.g, colorChange.b);
              coulors.needsUpdate = true;
            } else {
              if (mouseDistance < 250) {
                if (i % 5 === 0) {
                  const t = Math.atan2(dy, dx);
                  px -= 0.03 * Math.cos(t);
                  py -= 0.03 * Math.sin(t);
                  colorChange.setHSL(0.15, 1.0, 0.5);
                  coulors.setXYZ(i, colorChange.r, colorChange.g, colorChange.b);
                  coulors.needsUpdate = true;
                  size.array[i] = 1 / 1.2;
                  size.needsUpdate = true;
                } else {
                  const t = Math.atan2(dy, dx);
                  px += f * Math.cos(t);
                  py += f * Math.sin(t);
                  size.array[i] = 1 * 1.3;
                  size.needsUpdate = true;
                }
              }
            }

            px += (initX - px) * ease;
            py += (initY - py) * ease;
            pz += (initZ - pz) * ease;
            pos.setXYZ(i, px, py, pz);
            pos.needsUpdate = true;
          }
        }
      }

      renderer.render(scene, camera);
    }

    let animId = requestAnimationFrame(animate);

    // ── Events ───────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
  mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
};

const onMouseDown = (e: MouseEvent) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
  mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
  buttom = true;
  ease = 0.01;
};

const onMouseUp = () => { buttom = false; ease = 0.05; };

const onResize = () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
};

window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mouseup',   onMouseUp);
window.addEventListener('resize',    onResize);

    // ── Cleanup on unmount ───────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup',   onMouseUp);
      window.removeEventListener('resize',    onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };

    // ── Helpers ──────────────────────────────────────────────────
    function visibleHeightAtZDepth(depth: number, cam: THREE.PerspectiveCamera) {
      const cameraOffset = cam.position.z;
      const d = depth < cameraOffset ? depth - cameraOffset : depth + cameraOffset;
      const vFOV = cam.fov * Math.PI / 180;
      return 2 * Math.tan(vFOV / 0.5) * Math.abs(d);
    }
    function visibleWidthAtZDepth(depth: number, cam: THREE.PerspectiveCamera) {
      return visibleHeightAtZDepth(depth, cam) * cam.aspect;
    }

  }, []);

  return (
    <div className="w-full flex justify-center md:justify-start overflow-visible relative h-[140px] md:h-[200px]">
    <div
      ref={containerRef}
      className="scale-[0.5] sm:scale-[0.7] md:scale-[0.85] origin-top md:origin-top-left absolute top-0 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0"
      style={{
        width: '610px',
        height: '300px',
      }}
    />
  </div>
);
}