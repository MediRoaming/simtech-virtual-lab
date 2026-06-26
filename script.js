const canvas = document.querySelector("#viewer");
const infoCard = document.querySelector("#infoCard");
const infoNumber = document.querySelector("#infoNumber");
const infoTitle = document.querySelector("#infoTitle");
const infoText = document.querySelector("#infoText");
const closeInfo = document.querySelector("#closeInfo");
const resetView = document.querySelector("#resetView");
const installApp = document.querySelector("#installApp");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.1, 1100);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const texture = new THREE.TextureLoader().load("panorama.jpg");
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;
texture.encoding = THREE.sRGBEncoding;

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(500, 80, 50),
  new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
);
sphere.scale.x = -1;
scene.add(sphere);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const hotspotGroup = new THREE.Group();
scene.add(hotspotGroup);

const hotspots = [
  {
    id: 1,
    title: "Main Simulation Bed and Manikin",
    text: "A high-fidelity patient bed setup for immersive clinical scenarios, assessment, debriefing, and procedural practice.",
    yaw: 0,
    pitch: -14
  },
  {
    id: 2,
    title: "Crash Trolley",
    text: "Emergency response equipment is positioned close to the bed so learners can rehearse time-critical resuscitation workflows.",
    yaw: -37,
    pitch: -12
  },
  {
    id: 3,
    title: "Patient Monitor",
    text: "Dynamic vital signs support scenario realism and help students interpret clinical deterioration in real time.",
    yaw: 8,
    pitch: 10
  },
  {
    id: 4,
    title: "Telehealth Teaching Display",
    text: "The large teaching display enables remote consultation, hybrid teaching, and collaborative telehealth demonstrations.",
    yaw: 42,
    pitch: 7
  },
  {
    id: 5,
    title: "Instructor Control Room Behind Glass",
    text: "Faculty can observe, operate simulation equipment, communicate with learners, and coordinate scenario flow from the control room.",
    yaw: -75,
    pitch: -2
  },
  {
    id: 6,
    title: "Clinical Skills Area",
    text: "A flexible skills zone supports stations for task trainers, equipment familiarisation, and small-group practical teaching.",
    yaw: 84,
    pitch: 0
  },
  {
    id: 7,
    title: "Digital Life Science Lab",
    text: "Digital learning tools and life science resources extend the simulation space into data-driven, technology-enabled education.",
    yaw: 122,
    pitch: -16
  }
];

hotspots.forEach((hotspot) => {
  const marker = new THREE.Sprite(createMarkerMaterial(hotspot.id));
  marker.userData = hotspot;
  marker.position.copy(sphericalPosition(hotspot.yaw, hotspot.pitch, 430));
  marker.scale.set(28, 28, 1);
  hotspotGroup.add(marker);

  const label = document.createElement("div");
  label.className = "hotspot-label";
  label.innerHTML = `<span>${hotspot.id}</span>${hotspot.title}`;
  document.body.appendChild(label);
  hotspot.label = label;
});

let lon = 0;
let lat = 0;
let targetLon = 0;
let targetLat = 0;
let isDragging = false;
let pointerDown = { x: 0, y: 0 };
let lonOnDown = 0;
let latOnDown = 0;
let fov = 74;
let activeHotspot = null;
let deferredInstallPrompt = null;
const activePointers = new Map();
let initialPinchDistance = 0;
let fovOnPinchStart = 74;
let wasPinching = false;

function sphericalPosition(yaw, pitch, radius) {
  const phi = THREE.MathUtils.degToRad(90 - pitch);
  const theta = THREE.MathUtils.degToRad(yaw);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.cos(theta)
  );
}

function createMarkerMaterial(number) {
  const size = 256;
  const markerCanvas = document.createElement("canvas");
  markerCanvas.width = size;
  markerCanvas.height = size;
  const ctx = markerCanvas.getContext("2d");

  ctx.clearRect(0, 0, size, size);
  ctx.shadowColor = "rgba(0, 20, 50, 0.45)";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(128, 128, 78, 0, Math.PI * 2);
  ctx.fillStyle = "#00a6c8";
  ctx.fill();
  ctx.lineWidth = 12;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 88px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(number, 128, 132);

  ctx.beginPath();
  ctx.arc(128, 128, 100, 0, Math.PI * 2);
  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(0, 166, 200, 0.35)";
  ctx.stroke();

  return new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(markerCanvas),
    transparent: true,
    depthTest: false
  });
}

function setView() {
  lat = Math.max(-82, Math.min(82, lat));
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon);
  camera.lookAt(
    500 * Math.sin(phi) * Math.sin(theta),
    500 * Math.cos(phi),
    500 * Math.sin(phi) * Math.cos(theta)
  );
}

function showInfo(hotspot) {
  activeHotspot = hotspot;
  infoNumber.textContent = hotspot.id;
  infoTitle.textContent = hotspot.title;
  infoText.textContent = hotspot.text;
  infoCard.classList.add("is-open");
  infoCard.setAttribute("aria-hidden", "false");
}

function hideInfo() {
  activeHotspot = null;
  infoCard.classList.remove("is-open");
  infoCard.setAttribute("aria-hidden", "true");
}

function updateFov(nextFov) {
  fov = Math.max(38, Math.min(88, nextFov));
  camera.fov = fov;
  camera.updateProjectionMatrix();
}

function updateLabels() {
  hotspots.forEach((hotspot) => {
    const position = hotspotGroup.children.find((marker) => marker.userData.id === hotspot.id).position.clone();
    position.project(camera);

    const isVisible = position.z < 1;
    hotspot.label.classList.toggle("is-hidden", !isVisible);

    if (isVisible) {
      const x = (position.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-position.y * 0.5 + 0.5) * window.innerHeight;
      hotspot.label.style.left = `${x}px`;
      hotspot.label.style.top = `${y}px`;
    }
  });
}

function getHotspotFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const clientX = event.clientX ?? event.changedTouches?.[0]?.clientX;
  const clientY = event.clientY ?? event.changedTouches?.[0]?.clientY;
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(hotspotGroup.children, false);
  return hits.length ? hits[0].object.userData : null;
}

function onPointerDown(event) {
  canvas.setPointerCapture?.(event.pointerId);
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (activePointers.size === 1) {
    isDragging = true;
    wasPinching = false;
    pointerDown = { x: event.clientX, y: event.clientY };
    lonOnDown = targetLon;
    latOnDown = targetLat;
  }

  if (activePointers.size === 2) {
    isDragging = false;
    wasPinching = true;
    initialPinchDistance = getPinchDistance();
    fovOnPinchStart = fov;
  }
}

function onPointerMove(event) {
  if (!activePointers.has(event.pointerId)) return;
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (activePointers.size === 2) {
    const distance = getPinchDistance();
    if (initialPinchDistance > 0) {
      const zoomDelta = (initialPinchDistance - distance) * 0.09;
      updateFov(fovOnPinchStart + zoomDelta);
    }
    return;
  }

  if (!isDragging || activePointers.size !== 1) return;
  targetLon = lonOnDown + (pointerDown.x - event.clientX) * 0.12;
  targetLat = latOnDown + (event.clientY - pointerDown.y) * 0.12;
}

function onPointerUp(event) {
  const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
  activePointers.delete(event.pointerId);
  isDragging = false;

  if (activePointers.size === 1) {
    const remaining = [...activePointers.values()][0];
    pointerDown = { x: remaining.x, y: remaining.y };
    lonOnDown = targetLon;
    latOnDown = targetLat;
    isDragging = true;
  }

  if (moved < 7 && activePointers.size === 0 && !wasPinching) {
    const hotspot = getHotspotFromEvent(event);
    if (hotspot) showInfo(hotspot);
  }

  if (activePointers.size === 0) wasPinching = false;
}

function onWheel(event) {
  event.preventDefault();
  updateFov(fov + Math.sign(event.deltaY) * 4);
}

function getPinchDistance() {
  const points = [...activePointers.values()];
  if (points.length < 2) return 0;
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  lon += (targetLon - lon) * 0.12;
  lat += (targetLat - lat) * 0.12;
  setView();
  updateLabels();
  renderer.render(scene, camera);
}

canvas.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", onPointerUp);
canvas.addEventListener("wheel", onWheel, { passive: false });
closeInfo.addEventListener("click", hideInfo);
resetView.addEventListener("click", () => {
  targetLon = 0;
  targetLat = 0;
  updateFov(74);
  hideInfo();
});
window.addEventListener("resize", onResize);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideInfo();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installApp.hidden = false;
});

window.addEventListener("appinstalled", () => {
  installApp.classList.add("is-installed");
  deferredInstallPrompt = null;
});

installApp.addEventListener("click", async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }

  showInfo({
    id: "iOS",
    title: "Install on iPhone or iPad",
    text: "Open this web link in Safari, tap the Share button, then choose Add to Home Screen. On Android or desktop Chrome, use the browser install option if it appears."
  });
});

if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
  installApp.classList.add("is-installed");
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

animate();
