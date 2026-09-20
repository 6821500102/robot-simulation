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

const dirLight2 = new THREE.DirectionalLight(0xfef08a, 0.3); // แสงอุ่นๆ สะท้อนแขนกล
dirLight2.position.set(-5, 5, -5);
scene.add(dirLight2);

const gridHelper = new THREE.GridHelper(10, 20, 0xd97706, 0xcbd5e1);
scene.add(gridHelper);

// 3. วัสดุสีแขนกลอุตสาหกรรม (Industrial Orange & Metallic Steel)
const matOrange = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.4, roughness: 0.3 });
const matDarkSteel = new THREE.MeshStandardMaterial({ color: 0x262626, metalness: 0.8, roughness: 0.2 });
const matSilver = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.1 });
const matBlack = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.5, roughness: 0.4 });

// 4. โครงสร้างแขนกลอุตสาหกรรม 6 แกน (Industrial Orange Arm)
const robot = new THREE.Group();
scene.add(robot);

// --- BASE (ฐานโลหะทรงกลมลดระดับพร้อมหมุดน็อต) ---
const baseGroup = new THREE.Group();
robot.add(baseGroup);

const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.1, 32), matDarkSteel);
b1.position.y = 0.05;
baseGroup.add(b1);

const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.1, 32), matDarkSteel);
b2.position.y = 0.15;
baseGroup.add(b2);

const b3 = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.08, 32), matDarkSteel);
b3.position.y = 0.24;
baseGroup.add(b3);

// หมุดน็อตรอบฐาน
for (let i = 0; i < 12; i++) {
  const angle = (i / 12) * Math.PI * 2;
  const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), matSilver);
  bolt.position.set(Math.cos(angle) * 0.53, 0.1, Math.sin(angle) * 0.53);
  baseGroup.add(bolt);
}

// --- JOINT 1 (J1: Base Rotate - หมุนแกน Y) ---
const j1Group = new THREE.Group();
j1Group.position.y = 0.28;
robot.add(j1Group);

const j1Housing = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.2, 32), matOrange);
j1Housing.position.y = 0.1;
j1Group.add(j1Housing);

// --- JOINT 2 (J2: Shoulder Pitch - หมุนก้มเงยไหล่ แกน Z) ---
const j2Group = new THREE.Group();
j2Group.position.y = 0.2;
j1Group.add(j2Group);

// จานปิดด้านข้างข้อต่อ J2
const j2Cap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.36, 32), matOrange);
j2Cap.rotation.x = Math.PI / 2;
j2Group.add(j2Cap);

const j2Inner = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.37, 32), matDarkSteel);
j2Inner.rotation.x = Math.PI / 2;
j2Group.add(j2Inner);

// ท่อนแขนล่าง (Lower Arm Link)
const link1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.9, 32), matOrange);
link1.position.set(0, 0.45, 0);
j2Group.add(link1);

// --- JOINT 3 (J3: Elbow Pitch - หมุนศอก แกน Z) ---
const j3Group = new THREE.Group();
j3Group.position.set(0, 0.9, 0);
j2Group.add(j3Group);

const j3Cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.3, 32), matOrange);
j3Cap.rotation.x = Math.PI / 2;
j3Group.add(j3Cap);

// --- JOINT 4 (J4: Forearm Roll - หมุนควงท่อนแขน แกน Y) ---
const j4Group = new THREE.Group();
j4Group.position.set(0, 0, 0);
j3Group.add(j4Group);

const link2 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.7, 32), matOrange);
link2.position.set(0, 0.35, 0);
j4Group.add(link2);

// --- JOINT 5 (J5: Wrist Pitch - ก้มเงยข้อมือ แกน Z) ---
const j5Group = new THREE.Group();
j5Group.position.set(0, 0.7, 0);
j4Group.add(j5Group);

const j5Cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.22, 32), matOrange);
j5Cap.rotation.x = Math.PI / 2;
j5Group.add(j5Cap);

// --- JOINT 6 & GRIPPER (J6: Tool Roll & Mechanical Claw) ---
const j6Group = new THREE.Group();
j6Group.position.set(0, 0, 0);
j5Group.add(j6Group);

// ฐานหัวจับ Gripper
const gripperBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.1, 32), matBlack);
gripperBase.position.y = 0.1;
j6Group.add(gripperBase);

const gripperBody = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.12), matDarkSteel);
gripperBody.position.y = 0.17;
j6Group.add(gripperBody);

// กระบอกสูบขับเคลื่อนเขี้ยว
const cyl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 16), matSilver);
cyl1.position.set(-0.06, 0.24, 0);
j6Group.add(cyl1);

const cyl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 16), matSilver);
cyl2.position.set(0.06, 0.24, 0);
j6Group.add(cyl2);

// เขี้ยวจับด้านซ้าย (Left Finger)
const fingerL = new THREE.Group();
fingerL.position.set(-0.07, 0.28, 0);
j6Group.add(fingerL);

const fL1 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.1, 0.03), matSilver);
fL1.rotation.z = -0.3;
fingerL.add(fL1);

const fL2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.025), matBlack);
fL2.position.set(0.02, 0.08, 0);
fL2.rotation.z = 0.4;
fingerL.add(fL2);

// เขี้ยวจับด้านขวา (Right Finger)
const fingerR = new THREE.Group();
fingerR.position.set(0.07, 0.28, 0);
j6Group.add(fingerR);

const fR1 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.1, 0.03), matSilver);
fR1.rotation.z = 0.3;
fingerR.add(fR1);

const fR2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.025), matBlack);
fR2.position.set(-0.02, 0.08, 0);
fR2.rotation.z = -0.4;
fingerR.add(fR2);

// 5. ระบบเชื่อมโยงข้อมูลป้อนเข้า (Bi-directional Binding)
const joints = ['j1', 'j2', 'j3', 'j4', 'j5', 'j6'];

function updateRobot() {
  const deg1 = parseFloat(document.getElementById('j1').value) || 0;
  const deg2 = parseFloat(document.getElementById('j2').value) || 0;
  const deg3 = parseFloat(document.getElementById('j3').value) || 0;
  const deg4 = parseFloat(document.getElementById('j4').value) || 0;
  const deg5 = parseFloat(document.getElementById('j5').value) || 0;
  const deg6 = parseFloat(document.getElementById('j6').value) || 0;

  j1Group.rotation.y = THREE.MathUtils.degToRad(deg1);
  j2Group.rotation.z = THREE.MathUtils.degToRad(deg2);
  j3Group.rotation.z = THREE.MathUtils.degToRad(deg3);
  j4Group.rotation.y = THREE.MathUtils.degToRad(deg4);
  j5Group.rotation.z = THREE.MathUtils.degToRad(deg5);
  j6Group.rotation.y = THREE.MathUtils.degToRad(deg6);
}

joints.forEach(id => {
  const range = document.getElementById(id);
  const number = document.getElementById(`${id}-num`);

  // เลื่อนสไลเดอร์ -> ช่องตัวเลขเปลี่ยน
  range.addEventListener('input', () => {
    number.value = range.value;
    updateRobot();
  });

  // พิมพ์ตัวเลข -> สไลเดอร์เปลี่ยน + หมุนโมเดลสด
  number.addEventListener('input', () => {
    let val = parseFloat(number.value);
    if (isNaN(val)) val = 0;
    if (val > 180) val = 180;
    if (val < -180) val = -180;
    range.value = val;
    updateRobot();
  });
});

// ปุ่มรีเซ็ต
document.getElementById('reset-btn').addEventListener('click', () => {
  joints.forEach(id => {
    document.getElementById(id).value = 0;
    document.getElementById(`${id}-num`).value = 0;
  });
  updateRobot();
});

window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();