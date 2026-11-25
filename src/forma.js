import * as THREE from "./vendor/three.module.js";

export function mountGalleryScene(figure) {
  const canvas = figure.querySelector("canvas");
  const surface = figure.querySelector(".art-surface");
  const controls = figure.querySelector(".art-controls");
  const label = figure.querySelector(".render-label");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    label.textContent = "Vista previa";
  }

  return renderer && mountStudy(renderer, figure, canvas, surface, controls, label, motion);
}

function mountStudy(renderer, figure, canvas, surface, controls, label, motion) {
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 50);
  const object = new THREE.Group();
  scene.add(object);
  object.position.y = 0.24;
  camera.position.z = 7.9;
  renderer.setClearColor(0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;

  const studio = new THREE.Scene();
  studio.background = new THREE.Color("#221e48");
  addSoftbox(5, 1.8, [-2, 4, 4], "#dedfff", 6);
  addSoftbox(1.8, 5, [4, 0, 2], "#b596ff", 5);
  addSoftbox(3, 1, [0, -4, -1], "#6680ff", 4);
  addSoftbox(2, 3, [-4, 0, -3], "#dce7ff", 4);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, 0.04);
  scene.environment = environment.texture;
  pmrem.dispose();
  studio.traverse(node => {
    if (!node.isMesh) return;
    node.geometry.dispose();
    node.material.dispose();
  });

  scene.add(new THREE.HemisphereLight("#e3dcff", "#332379", 2.2));
  const rim = new THREE.DirectionalLight("#a5afff", 2);
  rim.position.set(-2, 3, 4);
  scene.add(rim);

  const solid = new THREE.Mesh(
    makeRibbon(240, 28),
    new THREE.MeshPhysicalMaterial({
      color: "#ada0ff",
      roughness: 0.28,
      metalness: 0.69,
      clearcoat: 0.55,
      clearcoatRoughness: 0.2,
    }),
  );
  const wire = makeWire();
  object.add(solid, wire);

  // Three exhibits sit around the visitor in a continuous circular gallery.
  scene.background = new THREE.Color("#242137");
  scene.fog = new THREE.FogExp2("#242137", .049);
  const floor = new THREE.GridHelper(100, 80, "#726788", "#443e56");
  floor.position.y = -2.45;
  scene.add(floor);
  object.position.z = -7.9;
  const exhibits = [object];
  for (const [index, geometry] of [
    new THREE.TorusKnotGeometry(1.3, .28, 128, 18),
    new THREE.IcosahedronGeometry(1.95, 0)
  ].entries()) {
    const angle = (index + 1) * Math.PI * 2 / 3;
    const group = new THREE.Group();
    const material = solid.material.clone();
    material.color.set(index ? "#ccdbab" : "#e4ac8a");
    const sculpture = new THREE.Mesh(geometry, material);
    group.add(sculpture);
    group.position.set(-Math.sin(angle)*7.9, .24, -Math.cos(angle)*7.9);
    scene.add(group);
    exhibits.push(group);
  }
  const names = ["Cinta plegada", "Nudo continuo", "Veinte caras"];
  const caption = figure.querySelector("#titulo-forma");
  const heading = figure.closest(".experience")?.querySelector(".scene-title");
  let yaw = 0;
  let pitch = 0;
  let targetYaw = yaw;
  let targetPitch = pitch;
  let blend = 0;
  let targetBlend = 0;
  let intro = 0;
  let previousTime = 0;
  let frame = 0;
  let gesture = null;
  let visible = true;
  let lastStation = 0;
  let orbitYaw;
  let orbitPitch;

  const resize = new ResizeObserver(() => {
    const { clientWidth: width, clientHeight: height } = surface;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.35, Math.sqrt(1300000 / (width * height))));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = 0;
    camera.fov = camera.aspect < 1 ? 62 : 40;
    camera.updateProjectionMatrix();
    schedule();
  });

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) schedule();
    else cancelFrame();
  });

  canvas.addEventListener("webglcontextlost", () => {
    cancelFrame();
    figure.dataset.state = "fallback";
    label.textContent = "Vista previa";
    controls.hidden = true;
  }, options);
  canvas.addEventListener("webglcontextrestored", () => {
    showStudy();
    schedule();
  }, options);

  for (const button of controls.querySelectorAll("[data-view]")) {
    button.addEventListener("click", () => {
      const next = Number(button.dataset.view === "mesh");
      if (next === targetBlend) return;
      targetBlend = next;
      for (const option of controls.querySelectorAll("[data-view]")) {
        option.setAttribute("aria-pressed", String(option === button));
      }
      schedule();
    }, options);
  }

  controls.querySelector(".rotate").addEventListener("click", () => {
    targetYaw += Math.PI / 3;
    schedule();
  }, options);

  canvas.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0) return;
    gesture = { x: event.clientX, y: event.clientY, id: event.pointerId };
    canvas.setPointerCapture(event.pointerId);
    figure.classList.add("dragging");
  }, options);

  canvas.addEventListener("pointermove", event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    targetYaw += (event.clientX - gesture.x) * 0.011;
    targetPitch = THREE.MathUtils.clamp(targetPitch + (event.clientY - gesture.y) * 0.008, -1.1, 1.1);
    gesture.x = event.clientX;
    gesture.y = event.clientY;
    schedule();
  }, options);

  canvas.addEventListener("lostpointercapture", () => {
    gesture = null;
    figure.classList.remove("dragging");
  }, options);
  motion.addEventListener("change", schedule, options);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelFrame();
    else schedule();
  }, options);

  resize.observe(surface);
  observer.observe(figure);
  showStudy();
  schedule();

  return () => {
    cancelFrame();
    listeners.abort();
    resize.disconnect();
    observer.disconnect();
    scene.traverse(node => {
      node.geometry?.dispose();
      node.material?.dispose();
    });
    environment.dispose();
    renderer.dispose();
  };

  function addSoftbox(width, height, position, color, strength) {
    const light = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength) }),
    );
    light.position.set(...position);
    light.lookAt(0, 0, 0);
    studio.add(light);
  }

  function showStudy() {
    figure.dataset.state = "active";
    label.textContent = "3D en tiempo real";
    controls.hidden = false;
  }

  function schedule() {
    if (!frame && visible && !document.hidden && figure.dataset.state === "active") {
      frame = requestAnimationFrame(render);
    }
  }

  function cancelFrame() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  }

  function render(time) {
    frame = 0;
    const elapsed = previousTime ? Math.min(time - previousTime, 50) : 16;
    previousTime = time;
    const reduced = motion.matches;
    const damp = (current, target, speed) => (
      reduced || Math.abs(target - current) < 0.002
        ? target : THREE.MathUtils.damp(current, target, speed, elapsed / 1000)
    );
    intro = reduced ? 1 : Math.min(1, intro + elapsed / 950);
    yaw = damp(yaw, targetYaw, 10);
    pitch = damp(pitch, targetPitch, 12);
    blend = damp(blend, targetBlend, 12);

    const entrance = (1 - intro) ** 3;
    camera.rotation.order = "YXZ";
    camera.rotation.set(pitch * .4, yaw, 0);
    if (!reduced) {
      if (yaw !== orbitYaw) heading?.style.setProperty("--orbit-y", Math.sin(yaw) * 25 + "deg");
      if (pitch !== orbitPitch) heading?.style.setProperty("--orbit-x", -pitch * 14 + "deg");
      orbitYaw = yaw;
      orbitPitch = pitch;
    }
    object.rotation.set(.48 - entrance * .38, -.22 - entrance * .95, -.25);
    const station = Math.round(yaw / (Math.PI * 2 / 3));
    if (station !== lastStation) {
      caption.textContent = names[((station % 3) + 3) % 3];
      lastStation = station;
    }
    for (const exhibit of exhibits.slice(1)) exhibit.children[0].material.wireframe = blend >= .5;
    object.scale.setScalar(1 - entrance * 0.26);
    solid.visible = blend < 0.995;
    solid.material.transparent = blend > 0;
    solid.material.opacity = 1 - blend;
    solid.material.depthWrite = blend < 0.75;
    wire.visible = blend > 0.008;
    wire.material.opacity = blend * 0.8;
    wire.scale.setScalar(1.014 + Math.sin(blend * Math.PI) * 0.085);
    renderer.render(scene, camera);
    if (intro < 1 || yaw !== targetYaw || pitch !== targetPitch || blend !== targetBlend) schedule();
    else previousTime = 0;
  }
}

function ribbonPoints(rings, sides) {
  const points = [];
  for (let ring = 0; ring < rings; ring++) {
    const angle = 2 * Math.PI * ring / rings;
    const fold = 5 * angle;
    const center = 1.52 + 0.27 * Math.cos(fold);
    const elevation = 0.42 * Math.sin(fold);
    const twist = 0.48 + 0.92 * Math.sin(fold + 0.55);
    const width = 0.54 + 0.13 * Math.cos(fold - 0.35);

    for (let side = 0; side < sides; side++) {
      const angleAround = 2 * Math.PI * side / sides;
      const across = width * Math.cos(angleAround);
      const thickness = 0.105 * Math.sin(angleAround);
      const radius = center + across * Math.cos(twist) - thickness * Math.sin(twist);
      const height = elevation + across * Math.sin(twist) + thickness * Math.cos(twist);
      points.push(radius * Math.cos(angle), radius * Math.sin(angle), height);
    }
  }
  return points;
}

function makeRibbon(rings, sides) {
  const indices = [];
  for (let ring = 0; ring < rings; ring++) {
    const nextRing = (ring + 1) % rings;
    for (let side = 0; side < sides; side++) {
      const nextSide = (side + 1) % sides;
      const a = ring * sides + side;
      const b = nextRing * sides + side;
      const c = ring * sides + nextSide;
      const d = nextRing * sides + nextSide;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(ribbonPoints(rings, sides), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeWire() {
  const rings = 100;
  const sides = 12;
  const vertices = ribbonPoints(rings, sides);
  const edges = [];
  for (let ring = 0; ring < rings; ring++) {
    const nextRing = (ring + 1) % rings;
    for (let side = 0; side < sides; side++) {
      const nextSide = (side + 1) % sides;
      const start = ring * sides + side;
      for (const end of [ring * sides + nextSide, nextRing * sides + side]) {
        edges.push(...vertices.slice(start * 3, start * 3 + 3));
        edges.push(...vertices.slice(end * 3, end * 3 + 3));
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
  return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
    color: "#c5bcff",
    transparent: true,
    depthWrite: false,
  }));
}
