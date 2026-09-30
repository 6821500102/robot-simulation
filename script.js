import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. ตั้งค่า Scene และ Camera
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf1f5f9);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(3.5, 2.8, 3.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1.2, 0);

// แสงสว่างและ Grid
scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

const gridHelper = new THREE.GridHelper(10, 20, 0x94a3b8, 0xcbd5e1);
scene.add(gridHelper);

// วัสดุและสี
const matBase = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.3 });
const matJointPin = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
const matLink1 = new THREE.MeshStandardMaterial({ color: 0xe07a38, metalness: 0.3, roughness: 0.4 });
const matLink2 = new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.3, roughness: 0.4 });
const matLink3 = new THREE.MeshStandardMaterial({ color: 0xa855f7, metalness: 0.3, roughness: 0.4 });
const matGripper = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.2 });

// 2. โครงสร้างแขนกล 3 DOF
const robot = new THREE.Group();
scene.add(robot);

// Base (J0)
const baseGroup = new THREE.Group();
robot.add(baseGroup);

const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.3, 32), matBase);
baseMesh.position.y = 0.15;
baseGroup.add(baseMesh);

const j0Group = new THREE.Group();
j0Group.position.y = 0.3;
robot.add(j0Group);

const j0Housing = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32), matBase);
j0Housing.position.y = 0.1;
j0Group.add(j0Housing);

// Joint 1 -> Link 1
const j1Group = new THREE.Group();
j1Group.position.y = 0.2;
j0Group.add(j1Group);

const j1Pin = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.35, 32), matJointPin);
j1Pin.rotation.z = Math.PI / 2;
j1Group.add(j1Pin);

const link1L = 1.1;
const link1Mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, link1L, 32), matLink1);
link1Mesh.position.y = link1L / 2;
j1Group.add(link1Mesh);

// Joint 2 -> Link 2
const j2Group = new THREE.Group();
j2Group.position.y = link1L;
j1Group.add(j2Group);

const j2Pin = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 32), matJointPin);
j2Pin.rotation.z = Math.PI / 2;
j2Group.add(j2Pin);

const link2L = 0.9;
const link2Mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, link2L, 32), matLink2);
link2Mesh.position.y = link2L / 2;
j2Group.add(link2Mesh);

// Joint 3 -> Link 3
const j3Group = new THREE.Group();
j3Group.position.y = link2L;
j2Group.add(j3Group);

const j3Pin = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.25, 32), matJointPin);
j3Pin.rotation.z = Math.PI / 2;
j3Group.add(j3Pin);

const link3L = 0.7;
const link3Mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, link3L, 32), matLink3);
link3Mesh.position.y = link3L / 2;
j3Group.add(link3Mesh);

// Tool (End Effector)
const toolGroup = new THREE.Group();
toolGroup.position.y = link3L;
j3Group.add(toolGroup);

const toolBase = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.12), matGripper);
toolBase.position.y = 0.03;
toolGroup.add(toolBase);

const fingerL = new THREE.Group();
fingerL.position.set(-0.04, 0.08, 0);
toolGroup.add(fingerL);
fingerL.add(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.04), matJointPin));

const fingerR = new THREE.Group();
fingerR.position.set(0.04, 0.08, 0);
toolGroup.add(fingerR);
fingerR.add(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.04), matJointPin));

// จุดอ้างอิงตำแหน่งสำหรับอ่านค่า Real-time
const tcpPoint = new THREE.Object3D();
tcpPoint.position.set(0, 0.15, 0);
toolGroup.add(tcpPoint);

// 3. เงื่อนไขและข้อจำกัดกายภาพของ Stepping Motor
const LIMITS = {
  j1: { min: -135, max: 135 },
  j2: { min: -15, max: 85 },
  j3: { min: -100, max: 10 },
  j4: { min: -80, max: 80 }
};

const joints = ['j1', 'j2', 'j3', 'j4'];
let targetAngles = { j1: 0, j2: 30, j3: -45, j4: 15, gripper: 20 };
let currentAngles = { j1: 0, j2: 30, j3: -45, j4: 15, gripper: 20 };

// ข้อ 1: ฟังก์ชันตรวจสอบเตือนเมื่อปรับเกินความสามารถมอเตอร์
function checkMotorLimits() {
  let isError = false;
  let errorMsg = '';

  joints.forEach(id => {
    const val = targetAngles[id];
    const card = document.getElementById(`card-${id}`);
    
    if (val < LIMITS[id].min || val > LIMITS[id].max) {
      isError = true;
      card.classList.add('error-card');
      errorMsg = `จุดหมุน ${id.toUpperCase()} เกินขีดจำกัดมอเตอร์! (${LIMITS[id].min}° ถึง ${LIMITS[id].max}°)`;
    } else {
      card.classList.remove('error-card');
    }
  });

  // ตรวจสอบการชนพื้น (Collision with Ground Z < 0.02m)
  const tcpWorld = new THREE.Vector3();
  tcpPoint.getWorldPosition(tcpWorld);
  if (tcpWorld.y < 0.02) {
    isError = true;
    errorMsg = '⚠️ คำเตือน: ปลายแขนกลชนพื้น! (Ground Collision)';
  }

  const banner = document.getElementById('warning-banner');
  const statusBadge = document.getElementById('system-status');

  if (isError) {
    banner.classList.remove('hidden');
    document.getElementById('warning-text').textContent = errorMsg;
    statusBadge.classList.add('error');
    statusBadge.innerHTML = '<span class="pulse" style="background:#ef4444"></span> OVERLIMIT ERROR';
  } else {
    banner.classList.add('hidden');
    statusBadge.classList.remove('error');
    statusBadge.innerHTML = '<span class="pulse"></span> READY';
  }
}

// ข้อ 2: อัปเดตพิกัด X Y Z ของทุกจุดหมุนบน HUD
function updateJointCoordinatesHUD() {
  const points = [
    { group: j0Group, id: 'j0' },
    { group: j1Group, id: 'j1' },
    { group: j2Group, id: 'j2' },
    { group: j3Group, id: 'j3' },
    { group: tcpPoint, id: 'tcp' }
  ];

  const pos = new THREE.Vector3();
  points.forEach(item => {
    item.group.getWorldPosition(pos);
    document.getElementById(`${item.id}-x`).textContent = pos.x.toFixed(2);
    document.getElementById(`${item.id}-y`).textContent = pos.y.toFixed(2);
    document.getElementById(`${item.id}-z`).textContent = pos.z.toFixed(2);
  });
}

function updateRobotPhysics() {
  joints.forEach(id => {
    currentAngles[id] += (targetAngles[id] - currentAngles[id]) * 0.15;
  });
  currentAngles.gripper += (targetAngles.gripper - currentAngles.gripper) * 0.15;

  j0Group.rotation.y = THREE.MathUtils.degToRad(currentAngles.j1);
  j1Group.rotation.z = THREE.MathUtils.degToRad(-currentAngles.j2);
  j2Group.rotation.z = THREE.MathUtils.degToRad(-currentAngles.j3);
  j3Group.rotation.z = THREE.MathUtils.degToRad(-currentAngles.j4);

  const gOffset = (currentAngles.gripper / 100) * 0.04;
  fingerL.position.x = -0.04 - gOffset;
  fingerR.position.x = 0.04 + gOffset;

  checkMotorLimits();
  updateJointCoordinatesHUD();
}

// ผูก Event ให้ UI Control
joints.forEach(id => {
  const range = document.getElementById(id);
  const number = document.getElementById(`${id}-num`);

  range.addEventListener('input', () => {
    number.value = range.value;
    targetAngles[id] = parseFloat(range.value);
  });

  number.addEventListener('input', () => {
    let val = parseFloat(number.value) || 0;
    range.value = val;
    targetAngles[id] = val;
  });
});

const gRange = document.getElementById('gripper');
const gNumber = document.getElementById('gripper-num');
gRange.addEventListener('input', () => {
  gNumber.value = gRange.value;
  targetAngles.gripper = parseFloat(gRange.value);
});
gNumber.addEventListener('input', () => {
  let val = parseFloat(gNumber.value) || 0;
  gRange.value = val;
  targetAngles.gripper = val;
});

// ข้อ 3: ระบบบันทึกและเล่นย้อนหลัง (Set and Play Teaching Mode)
let waypoints = [];
let isPlayingSequence = false;

function applyPose(pose) {
  joints.forEach(id => {
    targetAngles[id] = pose[id];
    document.getElementById(id).value = pose[id];
    document.getElementById(`${id}-num`).value = pose[id];
  });
  targetAngles.gripper = pose.gripper;
  gRange.value = pose.gripper;
  gNumber.value = pose.gripper;
}

function renderWaypointList() {
  const listEl = document.getElementById('waypoint-list');
  document.getElementById('wpt-count').textContent = waypoints.length;
  listEl.innerHTML = '';
  waypoints.forEach((wpt, index) => {
    const li = document.createElement('li');
    li.textContent = `Step ${index + 1}: J1:${wpt.j1}°, J2:${wpt.j2}°, J3:${wpt.j3}°, J4:${wpt.j4}°`;
    listEl.appendChild(li);
  });
}

// ปุ่ม SET Position
document.getElementById('set-btn').addEventListener('click', () => {
  const currentPose = { ...targetAngles };
  waypoints.push(currentPose);
  renderWaypointList();
});

// ปุ่ม PLAY Sequence
document.getElementById('play-btn').addEventListener('click', () => {
  if (waypoints.length === 0) {
    alert('กรุณากดกดบันทึกจุด (SET Position) อย่างน้อย 1 จุดก่อนกดเล่น!');
    return;
  }
  if (isPlayingSequence) return;

  isPlayingSequence = true;
  document.getElementById('play-btn').textContent = '⏳ กำลังเล่น...';

  waypoints.forEach((wpt, idx) => {
    setTimeout(() => {
      applyPose(wpt);
      if (idx === waypoints.length - 1) {
        isPlayingSequence = false;
        document.getElementById('play-btn').textContent = '▶ PLAY Sequence (เล่นลำดับ)';
      }
    }, idx * 1600);
  });
});

// ปุ่ม Clear
document.getElementById('clear-btn').addEventListener('click', () => {
  waypoints = [];
  renderWaypointList();
});

// ปุ่ม Reset Home
document.getElementById('reset-btn').addEventListener('click', () => {
  applyPose({ j1: 0, j2: 30, j3: -45, j4: 15, gripper: 20 });
});

// ปุ่มสลับกล้อง
document.querySelectorAll('.cam-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const view = e.target.dataset.view;
    if (view === 'iso') camera.position.set(3.5, 2.8, 3.5);
    if (view === 'top') camera.position.set(0, 5, 0.01);
    if (view === 'front') camera.position.set(0, 2, 4.5);
    if (view === 'side') camera.position.set(4.5, 2, 0);
    controls.target.set(0, 1.2, 0);
  });
});

window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

function animate() {
  requestAnimationFrame(animate);
  updateRobotPhysics();
  controls.update();
  renderer.render(scene, camera);
}
animate();