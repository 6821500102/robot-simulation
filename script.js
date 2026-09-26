import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. ฉาก 3D โทนสว่าง
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf1f5f9);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(3.2, 2.5, 3.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 2. แสงสว่าง
const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
scene.add(ambientLight);

const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight1.position.set(5, 10, 7);
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0xfef08a, 0.3);
dirLight2.position.set(-5, 5, -5);
scene.add(dirLight2);

const gridHelper = new THREE.GridHelper(10, 20, 0xd97706, 0xcbd5e1);
scene.add(gridHelper);

// 3. วัสดุสีโมเดล
const matOrange = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.4, roughness: 0.3 });
const matDarkSteel = new THREE.MeshStandardMaterial({ color: 0x262626, metalness: 0.8, roughness: 0.2 });
const matSilver = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.1 });
const matBlack = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.5, roughness: 0.4 });

// 4. ประกอบโมเดลแขนกล 6 แกน
const robot = new THREE.Group();
scene.add(robot);

// Base ฐานโลหะ
const baseGroup = new THREE.Group();
robot.add(baseGroup);

const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.1, 32), matDarkSteel);
b1.position.y = 0.05;
baseGroup.add(b1);

const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.1, 32), matDarkSteel);
b2.position.y = 0.15;
baseGroup.add(b2);

for (let i = 0; i < 12; i++) {
  const angle = (i / 12) * Math.PI * 2;
  const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), matSilver);
  bolt.position.set(Math.cos(angle) * 0.53, 0.1, Math.sin(angle) * 0.53);
  baseGroup.add(bolt);
}

// Joint 1 (J1: Base Yaw)
const j1Group = new THREE.Group();
j1Group.position.y = 0.2;
robot.add(j1Group);

const j1Housing = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.2, 32), matOrange);
j1Housing.position.y = 0.1;
j1Group.add(j1Housing);

// Joint 2 (J2: Shoulder Pitch)
const j2Group = new THREE.Group();
j2Group.position.y = 0.2;
j1Group.add(j2Group);

const j2Cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.36, 32), matOrange);
j2Cap.rotation.x = Math.PI / 2;
j2Group.add(j2Cap);

const link1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.9, 32), matOrange);
link1.position.set(0, 0.45, 0);
j2Group.add(link1);

// Joint 3 (J3: Elbow Pitch)
const j3Group = new THREE.Group();
j3Group.position.set(0, 0.9, 0);
j2Group.add(j3Group);

const j3Cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.3, 32), matOrange);
j3Cap.rotation.x = Math.PI / 2;
j3Group.add(j3Cap);

// Joint 4 (J4: Forearm Roll)
const j4Group = new THREE.Group();
j4Group.position.set(0, 0, 0);
j3Group.add(j4Group);

const link2 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.7, 32), matOrange);
link2.position.set(0, 0.35, 0);
j4Group.add(link2);

// Joint 5 (J5: Wrist Pitch)
const j5Group = new THREE.Group();
j5Group.position.set(0, 0.7, 0);
j4Group.add(j5Group);

const j5Cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.22, 32), matOrange);
j5Cap.rotation.x = Math.PI / 2;
j5Group.add(j5Cap);

// Joint 6 & Gripper
const j6Group = new THREE.Group();
j6Group.position.set(0, 0, 0);
j5Group.add(j6Group);

const gripperBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.1, 32), matBlack);
gripperBase.position.y = 0.1;
j6Group.add(gripperBase);

const gripperBody = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.12), matDarkSteel);
gripperBody.position.y = 0.17;
j6Group.add(gripperBody);

// เขี้ยวจับ Gripper Left & Right
const fingerL = new THREE.Group();
fingerL.position.set(-0.05, 0.25, 0);
j6Group.add(fingerL);

const fL = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, 0.03), matSilver);
fingerL.add(fL);

const fingerR = new THREE.Group();
fingerR.position.set(0.05, 0.25, 0);
j6Group.add(fingerR);

const fR = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, 0.03), matSilver);
fingerR.add(fR);

// จุดวัดพิกัด TCP (Tool Center Point)
const tcpPoint = new THREE.Object3D();
tcpPoint.position.set(0, 0.32, 0);
j6Group.add(tcpPoint);

// 5. ระบบผูกค่าและควบคุมการเคลื่อนที่
const joints = ['j1', 'j2', 'j3', 'j4', 'j5', 'j6'];
let targetAngles = { j1:0, j2:0, j3:0, j4:0, j5:0, j6:0, gripper:0 };
let currentAngles = { j1:0, j2:0, j3:0, j4:0, j5:0, j6:0, gripper:0 };

function updateRobotPhysics() {
  // Lerp การเคลื่อนที่ให้นุ่มนวล
  joints.forEach(id => {
    currentAngles[id] += (targetAngles[id] - currentAngles[id]) * 0.15;
  });
  currentAngles.gripper += (targetAngles.gripper - currentAngles.gripper) * 0.15;

  // หมุนข้อต่อ 3D
  j1Group.rotation.y = THREE.MathUtils.degToRad(currentAngles.j1);
  j2Group.rotation.z = THREE.MathUtils.degToRad(currentAngles.j2);
  j3Group.rotation.z = THREE.MathUtils.degToRad(currentAngles.j3);
  j4Group.rotation.y = THREE.MathUtils.degToRad(currentAngles.j4);
  j5Group.rotation.z = THREE.MathUtils.degToRad(currentAngles.j5);
  j6Group.rotation.y = THREE.MathUtils.degToRad(currentAngles.j6);

  // ขยับกางเขี้ยว Gripper
  const gOffset = (currentAngles.gripper / 100) * 0.05;
  fingerL.position.x = -0.05 - gOffset;
  fingerR.position.x = 0.05 + gOffset;

  // คำนวณพิกัด X, Y, Z บน HUD Real-time
  const worldPos = new THREE.Vector3();
  tcpPoint.getWorldPosition(worldPos);
  document.getElementById('pos-x').textContent = worldPos.x.toFixed(2);
  document.getElementById('pos-y').textContent = worldPos.y.toFixed(2);
  document.getElementById('pos-z').textContent = worldPos.z.toFixed(2);
}

// ผูก Event ให้สไลเดอร์และช่องกรอกตัวเลข
joints.forEach(id => {
  const range = document.getElementById(id);
  const number = document.getElementById(`${id}-num`);

  range.addEventListener('input', () => {
    number.value = range.value;
    targetAngles[id] = parseFloat(range.value);
  });

  number.addEventListener('input', () => {
    let val = parseFloat(number.value) || 0;
    val = Math.max(-180, Math.min(180, val));
    range.value = val;
    targetAngles[id] = val;
  });
});

// Gripper Control
const gRange = document.getElementById('gripper');
const gNumber = document.getElementById('gripper-num');
gRange.addEventListener('input', () => {
  gNumber.value = gRange.value;
  targetAngles.gripper = parseFloat(gRange.value);
});
gNumber.addEventListener('input', () => {
  let val = parseFloat(gNumber.value) || 0;
  val = Math.max(0, Math.min(100, val));
  gRange.value = val;
  targetAngles.gripper = val;
});

// 6. ฟังก์ชัน Preset Poses
function setPose(j1, j2, j3, j4, j5, j6, g = 0) {
  const pose = { j1, j2, j3, j4, j5, j6 };
  joints.forEach(id => {
    targetAngles[id] = pose[id];
    document.getElementById(id).value = pose[id];
    document.getElementById(`${id}-num`).value = pose[id];
  });
  targetAngles.gripper = g;
  gRange.value = g;
  gNumber.value = g;
}

document.getElementById('pose-home').addEventListener('click', () => setPose(0, 0, 0, 0, 0, 0, 0));
document.getElementById('pose-pick').addEventListener('click', () => setPose(35, -45, 60, 0, -15, 0, 80));
document.getElementById('pose-place').addEventListener('click', () => setPose(-60, -30, 45, 0, -15, 90, 0));
document.getElementById('pose-inspect').addEventListener('click', () => setPose(0, -20, -30, 90, 45, 45, 20));

// ปุ่ม Reset
document.getElementById('reset-btn').addEventListener('click', () => setPose(0, 0, 0, 0, 0, 0, 0));

// 7. โหมด Auto Motion Sequence สาธิต
let isDemoRunning = false;
document.getElementById('demo-btn').addEventListener('click', () => {
  if (isDemoRunning) return;
  isDemoRunning = true;
  document.getElementById('demo-btn').textContent = '⏳ กำลังทำงาน...';

  const steps = [
    () => setPose(0, 0, 0, 0, 0, 0, 0),
    () => setPose(45, -40, 55, 0, -15, 0, 100), // เอื้อมจับ
    () => setPose(45, -40, 55, 0, -15, 0, 0),   // หนีบ
    () => setPose(45, 0, 20, 0, 0, 0, 0),      // ยกขึ้น
    () => setPose(-50, -30, 40, 0, -10, 90, 0), // หมุนไปวาง
    () => setPose(-50, -30, 40, 0, -10, 90, 100),// ปล่อย
    () => setPose(0, 0, 0, 0, 0, 0, 0)          // กลับ Home
  ];

  steps.forEach((step, index) => {
    setTimeout(() => {
      step();
      if (index === steps.length - 1) {
        isDemoRunning = false;
        document.getElementById('demo-btn').textContent = '▶ เล่นโหมดสาธิต (Auto Pick & Place)';
      }
    }, index * 1800);
  });
});

// 8. ปุ่มสลับมุมมองกล้อง
document.querySelectorAll('.cam-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const view = e.target.dataset.view;
    if (view === 'iso') camera.position.set(3.2, 2.5, 3.2);
    if (view === 'top') camera.position.set(0, 4.5, 0.01);
    if (view === 'front') camera.position.set(0, 1.5, 4);
    if (view === 'side') camera.position.set(4, 1.5, 0);
    controls.target.set(0, 0.8, 0);
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