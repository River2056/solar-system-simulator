import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { orbitalAngle, orbitalPosition, advanceSimulation } from './orbits.js';
import { MOONS_BY_PLANET, moonAngularVelocity, advanceSynchronousMoon } from './moons.js';
import { MOON_APPEARANCES, createMoonTexture, createMoonGeometry, createMoonMaterial } from './moon-visuals.js';
import { updateTrackedCamera } from './camera.js';
import { FreeRoamController } from './free-roam.js';
import { orientPlanet, advancePlanetRotation } from './planet-rotation.js';
import './style.css';

const PLANETS = [
  { name:'Mercury', color:'#aaa7a0', radius:1.5, orbit:16, period:87.97, rotation:'58.6 days', diameter:'4,879 km', distance:'57.9 million km', moons:0, temp:'167 °C', overview:'The smallest planet and the closest world to the Sun, with a heavily cratered surface.', fact:'A solar day on Mercury lasts 176 Earth days—twice as long as its year.' },
  { name:'Venus', color:'#d7a967', radius:2.35, orbit:24, period:224.7, rotation:'−243 days', diameter:'12,104 km', distance:'108.2 million km', moons:0, temp:'464 °C', overview:'A cloud-shrouded world with a dense carbon-dioxide atmosphere and runaway greenhouse effect.', fact:'Venus rotates backward compared with most planets and is the hottest planet.' },
  { name:'Earth', color:'#3e80c8', accent:'#7da765', radius:2.55, orbit:33, period:365.25, rotation:'23h 56m', diameter:'12,742 km', distance:'149.6 million km', moons:1, temp:'15 °C', overview:'Our ocean-covered home world, the only place currently known to support life.', fact:'Liquid water covers about 71% of Earth’s surface.' },
  { name:'Mars', color:'#b85838', radius:1.9, orbit:43, period:686.98, rotation:'24h 37m', diameter:'6,779 km', distance:'227.9 million km', moons:2, temp:'−65 °C', overview:'A cold desert world known for iron-rich soil, vast canyons, and extinct volcanoes.', fact:'Olympus Mons is the largest known volcano in the solar system.' },
  { name:'Jupiter', color:'#c79567', accent:'#e0c2a1', radius:6.5, orbit:61, period:4332.59, rotation:'9h 56m', diameter:'139,820 km', distance:'778.5 million km', moons:95, temp:'−110 °C', overview:'The largest planet, a banded gas giant that shapes the architecture of the solar system.', fact:'Its Great Red Spot is a storm larger than Earth that has persisted for centuries.' },
  { name:'Saturn', color:'#d8bd7c', accent:'#f2dca4', radius:5.6, orbit:80, period:10759.22, rotation:'10h 42m', diameter:'116,460 km', distance:'1.43 billion km', moons:146, temp:'−140 °C', overview:'A pale gas giant encircled by the solar system’s most spectacular ring system.', fact:'Saturn is less dense than water, while its rings are mostly particles of water ice.' },
  { name:'Uranus', color:'#86c8cf', radius:4.1, orbit:99, period:30688.5, rotation:'−17h 14m', diameter:'50,724 km', distance:'2.87 billion km', moons:28, temp:'−195 °C', overview:'An ice giant with a blue-green atmosphere that rotates almost completely on its side.', fact:'Its 98° axial tilt makes Uranus appear to roll around the Sun.' },
  { name:'Neptune', color:'#3568ca', accent:'#6292ef', radius:4, orbit:119, period:60182, rotation:'16h 6m', diameter:'49,244 km', distance:'4.50 billion km', moons:16, temp:'−200 °C', overview:'A distant blue ice giant with the fastest winds measured anywhere in the solar system.', fact:'Neptune was discovered through mathematical prediction before it was observed.' }
];

const SUN = {
  name:'Sun', color:'#ff9b32', radius:8, kicker:'STAR · SYSTEM CENTER',
  overview:'A 4.6-billion-year-old yellow dwarf star whose gravity holds the solar system together and whose light makes life on Earth possible.',
  fact:'The Sun contains about 99.86% of all the mass in the solar system and could hold roughly 1.3 million Earths.',
  stats:[['DIAMETER','1.39 million km'],['MASS','1.989 × 10³⁰ kg'],['SURFACE TEMP.','5,500 °C'],['CORE TEMP.','15 million °C'],['ROTATION','25–35 days'],['AGE','4.6 billion years']]
};
const BODIES = [SUN, ...PLANETS];

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
const textureLoader = new THREE.TextureLoader();

function loadTexture(name) {
  const texture = textureLoader.load(`/textures/${name}`);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030510, 0.00165);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, .1, 1000);
const OVERVIEW = new THREE.Vector3(125, 177, 125);
camera.position.copy(OVERVIEW);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = .055;
controls.minDistance = 8;
controls.maxDistance = 360;
controls.target.set(0,0,0);
const freeRoam=new FreeRoamController(camera,canvas,document.querySelector('.flight-controls'),document.querySelector('.flight-look-control'));

scene.add(new THREE.AmbientLight(0x435477, .2));
scene.add(new THREE.HemisphereLight(0xb8ceff,0x080a10,.3));
const sunLight = new THREE.PointLight(0xffd7a3, 1350, 0, 1.45);
scene.add(sunLight);

const seeded = n => { const v = Math.sin(n * 9182.211 + 17.31) * 43758.5453; return v - Math.floor(v); };

function canvasTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function makeCoronaTexture() {
  const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d');
  const g=x.createRadialGradient(256,256,72,256,256,255); g.addColorStop(0,'rgba(255,248,193,1)'); g.addColorStop(.17,'rgba(255,184,54,.72)'); g.addColorStop(.37,'rgba(255,111,15,.23)'); g.addColorStop(.72,'rgba(255,72,4,.055)'); g.addColorStop(1,'rgba(255,60,0,0)'); x.fillStyle=g; x.fillRect(0,0,512,512);
  x.translate(256,256); x.globalCompositeOperation='screen';
  for(let i=0;i<80;i++) { x.rotate(seeded(i+90)*.17); const length=80+seeded(i)*155; const ray=x.createLinearGradient(58,0,length,0); ray.addColorStop(0,'rgba(255,213,96,.12)'); ray.addColorStop(1,'rgba(255,100,10,0)'); x.fillStyle=ray; x.fillRect(58,-.35-seeded(i),length-58,.7+seeded(i)*2); }
  return canvasTexture(c);
}

function makeStarTexture() {
  const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d');
  const glow=x.createRadialGradient(32,32,0,32,32,32); glow.addColorStop(0,'rgba(255,255,255,1)'); glow.addColorStop(.08,'rgba(255,255,255,.95)'); glow.addColorStop(.28,'rgba(180,210,255,.28)'); glow.addColorStop(1,'rgba(120,165,255,0)'); x.fillStyle=glow; x.fillRect(0,0,64,64);
  return canvasTexture(c);
}

function makeRingTexture() {
  const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d');
  for(let r=118;r<250;r+=2){ const gap=seeded(r)>.82; x.strokeStyle=gap?'rgba(35,27,18,.08)':`rgba(${180+Math.floor(seeded(r)*65)},${155+Math.floor(seeded(r+2)*60)},${110+Math.floor(seeded(r+4)*55)},${.28+seeded(r+6)*.58})`; x.lineWidth=1+seeded(r)*3; x.beginPath(); x.arc(256,256,r,0,Math.PI*2); x.stroke(); }
  return canvasTexture(c);
}

const milkyWay=new THREE.Mesh(new THREE.SphereGeometry(455,64,40),new THREE.MeshBasicMaterial({map:loadTexture('stars_milky_way.jpg'),side:THREE.BackSide,transparent:true,opacity:.56,depthWrite:false}));
milkyWay.rotation.set(.65,.3,-.18); scene.add(milkyWay);

// A dense, circular point field replaces the square default WebGL particles.
const starTexture=makeStarTexture();
for (const [count, radius, size, opacity, color] of [[3200,430,1.05,.72,0xb9d0ff],[760,330,2.05,.78,0xffe5c2],[90,285,4.5,.88,0xd5e7ff]]) {
  const data=[];
  for(let i=0;i<count;i++) { const r=radius*(.68+seeded(i+count)*.32), u=seeded(i*3+count)*2-1, a=seeded(i*5+count)*Math.PI*2, q=Math.sqrt(1-u*u); data.push(r*q*Math.cos(a), r*u, r*q*Math.sin(a)); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(data,3));
  scene.add(new THREE.Points(g,new THREE.PointsMaterial({map:starTexture,color,size,transparent:true,opacity,alphaTest:.025,depthWrite:false,sizeAttenuation:true,blending:THREE.AdditiveBlending})));
}

const sunTexture=loadTexture('sun.jpg');
const sun = new THREE.Mesh(new THREE.SphereGeometry(8,96,64), new THREE.MeshBasicMaterial({map:sunTexture,toneMapped:false}));
scene.add(sun);
SUN.group=sun; SUN.mesh=sun; SUN.detailLayers=[];
const sunShell = new THREE.Mesh(new THREE.SphereGeometry(8.22,64,48),new THREE.MeshBasicMaterial({color:0xffb13b,transparent:true,opacity:.12,blending:THREE.AdditiveBlending,side:THREE.BackSide}));
scene.add(sunShell);
const corona = new THREE.Sprite(new THREE.SpriteMaterial({map:makeCoronaTexture(),color:0xffc05b,transparent:true,opacity:.88,depthWrite:false,blending:THREE.AdditiveBlending}));
corona.scale.set(43,43,1); scene.add(corona);
const prominences=[];
for(let i=0;i<4;i++){
  const arc=new THREE.Mesh(new THREE.TorusGeometry(8.7+i*.25,.055+i*.025,8,64,Math.PI*(.42+seeded(i)*.4)),new THREE.MeshBasicMaterial({color:i%2?0xff7b21:0xffc04d,transparent:true,opacity:.32,blending:THREE.AdditiveBlending,depthWrite:false}));
  arc.rotation.set(seeded(i)*Math.PI,seeded(i+3)*Math.PI,seeded(i+9)*Math.PI); scene.add(arc); prominences.push(arc);
}
const glow = new THREE.Mesh(new THREE.SphereGeometry(10.5,40,40), new THREE.MeshBasicMaterial({color:0xff8b32,transparent:true,opacity:.1,side:THREE.BackSide,blending:THREE.AdditiveBlending}));
scene.add(glow);

const orbitGroup = new THREE.Group(); scene.add(orbitGroup);
const clickable=[];
const sunHit = new THREE.Mesh(new THREE.SphereGeometry(10.4,32,24),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
sunHit.userData.planet=SUN; sunHit.userData.hoverTarget=sun; scene.add(sunHit); clickable.push(sunHit);
const planetTextureNames={Mercury:'mercury.jpg',Venus:'venus_atmosphere.jpg',Earth:'earth_daymap.jpg',Mars:'mars.jpg',Jupiter:'jupiter.jpg',Saturn:'saturn.jpg',Uranus:'uranus.jpg',Neptune:'neptune.jpg'};
const moonTextures=new Map([['Moon',loadTexture('moon.jpg')]]);
function getMoonTexture(name){
  if(!moonTextures.has(name)) moonTextures.set(name,createMoonTexture(name));
  return moonTextures.get(name);
}
PLANETS.forEach((p,index) => {
  p.initialAngle = index * 1.73 + .5;
  const group = new THREE.Group(); scene.add(group); p.group=group;
  const texture = loadTexture(planetTextureNames[p.name]);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.radius,64,48), new THREE.MeshStandardMaterial({map:texture,bumpMap:texture,bumpScale:p.name==='Mercury'||p.name==='Mars'?.12:.035,roughness:['Earth','Neptune'].includes(p.name)?.62:.84,metalness:0}));
  orientPlanet(mesh,p.name);
  group.add(mesh); p.mesh=mesh; p.detailLayers=[]; p.moonSystems=[];
  if(p.name==='Earth'){
    const cloudTexture=loadTexture('earth_clouds.jpg');
    const clouds=new THREE.Mesh(new THREE.SphereGeometry(p.radius*1.018,64,48),new THREE.MeshStandardMaterial({map:cloudTexture,alphaMap:cloudTexture,transparent:true,opacity:.72,depthWrite:false,roughness:1}));
    orientPlanet(clouds,p.name); group.add(clouds); p.clouds=clouds; p.detailLayers.push(clouds);
  }
  if(['Venus','Earth','Uranus','Neptune'].includes(p.name)){
    const atmosphereColors={Venus:0xffce7a,Earth:0x5caeff,Uranus:0x8de5e9,Neptune:0x3f78ff};
    const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(p.radius*1.055,48,36),new THREE.MeshBasicMaterial({color:atmosphereColors[p.name],transparent:true,opacity:p.name==='Earth'?.12:.075,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false}));
    group.add(atmosphere); p.detailLayers.push(atmosphere);
  }
  const hit = new THREE.Mesh(new THREE.SphereGeometry(Math.max(p.radius*1.45,2.8),20,16), new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  hit.userData.planet=p; hit.userData.hoverTarget=mesh; group.add(hit); clickable.push(hit);
  if (p.name==='Saturn' || p.name==='Uranus') {
    const ringTexture=p.name==='Saturn'?loadTexture('saturn_ring_alpha.png'):makeRingTexture();
    const inner=p.name==='Saturn'?7.1:5.2, outer=p.name==='Saturn'?11.2:7.2;
    const ringGeometry=new THREE.RingGeometry(inner,outer,160);
    if(p.name==='Saturn') {
      const positions=ringGeometry.attributes.position, uvs=ringGeometry.attributes.uv;
      for(let vertex=0;vertex<positions.count;vertex++) {
        const radius=Math.hypot(positions.getX(vertex),positions.getY(vertex));
        uvs.setXY(vertex,(radius-inner)/(outer-inner),.5);
      }
    }
    const ringMaterial=p.name==='Saturn'
      ? new THREE.MeshBasicMaterial({map:ringTexture,color:0xfff3d6,side:THREE.DoubleSide,transparent:true,opacity:1,depthWrite:false})
      : new THREE.MeshStandardMaterial({map:ringTexture,color:0x9fc9cf,side:THREE.DoubleSide,transparent:true,opacity:.28,roughness:.86,depthWrite:false});
    const ring=new THREE.Mesh(ringGeometry,ringMaterial);
    ring.rotation.x=Math.PI/2; ring.rotation.y=p.name==='Saturn'?.16:1.45; group.add(ring); p.ring=ring; p.detailLayers.push(ring);
  }
  const visibleMoons=MOONS_BY_PLANET[p.name]||[];
  visibleMoons.forEach((moonData,m)=>{
    const orbitPlane=new THREE.Group();
    orbitPlane.rotation.z=THREE.MathUtils.degToRad(moonData.eclipticInclinationDeg);
    const pivot=new THREE.Group();
    const anchor=new THREE.Group();
    const orientation=new THREE.Group();
    const moonRadius=Math.max(.16,p.radius*(p.name==='Earth'?.19:.055+seeded(m)*.025));
    const moonTexture=getMoonTexture(moonData.name);
    const moon=new THREE.Mesh(createMoonGeometry(moonData.name,moonRadius),createMoonMaterial(moonData.name,moonTexture));
    const initialAngle=m*1.8+seeded(index+m)*2;
    anchor.position.x=p.radius*(1.7+m*.42)+.8;
    moon.rotation.y=initialAngle;
    moon.userData.name=moonData.name;
    const moonAppearance=MOON_APPEARANCES[moonData.name];
    if(moonAppearance.atmosphere){
      const atmosphere=new THREE.Mesh(createMoonGeometry(moonData.name,moonRadius*1.07),new THREE.MeshBasicMaterial({color:moonAppearance.atmosphere,transparent:true,opacity:.2,depthWrite:false,side:THREE.BackSide}));
      moon.add(atmosphere);
    }
    pivot.rotation.y=initialAngle;
    orientation.rotation.y=-initialAngle;
    orientation.add(moon); anchor.add(orientation); pivot.add(anchor); orbitPlane.add(pivot); group.add(orbitPlane);
    p.moonSystems.push({pivot,orientation,moon,angularVelocity:moonAngularVelocity(moonData.orbitPeriodDays,moonData.direction)});
  });
  const curve = new THREE.EllipseCurve(0,0,p.orbit,p.orbit,0,Math.PI*2,false,0);
  const pts=curve.getPoints(180).map(v=>new THREE.Vector3(v.x,0,v.y));
  const orbit=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x445170,transparent:true,opacity:.28}));
  orbit.userData.defaultOpacity=.28; orbitGroup.add(orbit); p.orbitLine=orbit;
});

const nav=document.querySelector('#planet-buttons');
BODIES.forEach(p => { const b=document.createElement('button'); b.className='planet-button'; b.innerHTML=`<i class="planet-dot" style="background:${p.color};color:${p.color}"></i>${p.name.toUpperCase()}`; b.addEventListener('click',()=>selectPlanet(p)); nav.appendChild(b); p.button=b; });

const explorePanel=document.querySelector('.planet-nav');
const exploreToggle=document.querySelector('#toggle-explore');
function setExploreMinimized(minimized) {
  explorePanel.classList.toggle('minimized',minimized);
  exploreToggle.textContent=minimized?'＋':'−';
  exploreToggle.setAttribute('aria-expanded',String(!minimized));
  exploreToggle.setAttribute('aria-label',minimized?'Show explore panel':'Minimize explore panel');
  exploreToggle.title=minimized?'Show explore panel':'Minimize explore panel';
}
exploreToggle.addEventListener('click',()=>setExploreMinimized(!explorePanel.classList.contains('minimized')));

let playing=true, speed=60, simMs=Date.now(), orbitEpochMs=simMs, selected=null, cameraMode='cinematic';
let transition=null, hover=null;
const clock=new THREE.Clock(), raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
const panel=document.querySelector('#planet-panel'), tooltip=document.querySelector('#tooltip');
const savedView={position:OVERVIEW.clone(),target:new THREE.Vector3()};

function startCameraTransition(position,target,duration=1.25,onDone=null) {
  transition={fromPos:camera.position.clone(),toPos:position.clone(),fromTarget:controls.target.clone(),toTarget:target.clone(),time:0,duration,onDone};
}
function selectPlanet(p) {
  if (!selected) { savedView.position.copy(camera.position); savedView.target.copy(controls.target); }
  selected=p;
  BODIES.forEach(q=>{ q.button.classList.toggle('active',q===p); if(q.orbitLine) { q.orbitLine.material.opacity=q===p?.9:.16; q.orbitLine.material.color.set(q===p?p.color:0x445170); } });
  const world=new THREE.Vector3(); p.group.getWorldPosition(world);
  const dir=camera.position.clone().sub(controls.target).normalize();
  dir.y=.18; dir.normalize();
  const distance=Math.max(p.radius*7,18);
  startCameraTransition(world.clone().add(dir.multiplyScalar(distance)).add(new THREE.Vector3(0,p.radius*.35,0)),world,1.15);
  populatePanel(p); setPanelMinimized(true); panel.classList.add('open'); panel.setAttribute('aria-hidden','false');
}
function deselect(restoreView=true) {
  if (!selected) return;
  selected=null;
  BODIES.forEach(q=>{q.button.classList.remove('active'); if(q.orbitLine) { q.orbitLine.material.opacity=.28; q.orbitLine.material.color.set(0x445170); }});
  setPanelMinimized(false); panel.classList.remove('open'); panel.setAttribute('aria-hidden','true');
  if(restoreView) startCameraTransition(savedView.position,savedView.target,1.3);
}
function setPanelMinimized(minimized) {
  const toggle=document.querySelector('#toggle-panel');
  panel.classList.toggle('minimized',minimized);
  toggle.textContent=minimized?'＋':'−';
  toggle.setAttribute('aria-expanded',String(!minimized));
  toggle.setAttribute('aria-label',minimized?'Show planet details':'Minimize planet details');
  toggle.title=minimized?'Show planet details':'Minimize planet details';
  if (!minimized) panel.scrollTop=0;
}
function populatePanel(p) {
  document.querySelector('#planet-name').textContent=p.name;
  document.querySelector('#planet-kicker').textContent=p.kicker||`PLANET ${String(PLANETS.indexOf(p)+1).padStart(2,'0')}`;
  document.querySelector('#planet-overview').textContent=p.overview;
  document.querySelector('#planet-fact').textContent=p.fact;
  document.querySelector('#planet-icon').style.setProperty('--planet-color',p.color);
  const stats=p.stats||[['DIAMETER',p.diameter],['AVG. DISTANCE',p.distance],['ORBITAL PERIOD',`${p.period.toLocaleString()} days`],['ROTATION',p.rotation],['KNOWN MOONS',String(p.moons)],['AVG. TEMPERATURE',p.temp]];
  document.querySelector('#planet-stats').innerHTML=stats.map(([k,v])=>`<div class="stat"><dt>${k}</dt><dd>${v}</dd></div>`).join('');
}

function pick(event, isClick=false) {
  if(cameraMode==='free-roam') return;
  const r=canvas.getBoundingClientRect(); pointer.x=((event.clientX-r.left)/r.width)*2-1; pointer.y=-((event.clientY-r.top)/r.height)*2+1;
  raycaster.setFromCamera(pointer,camera); const hit=raycaster.intersectObjects(clickable,false)[0]; const p=hit?.object.userData.planet || null;
  if (isClick) { if (p) selectPlanet(p); return; }
  if (hover!==p) { hover=p; canvas.style.cursor=p?'pointer':'grab'; clickable.forEach(m=>m.userData.hoverTarget.scale.setScalar(m.userData.planet===p?1.08:1)); }
  if (p) { tooltip.textContent=p.name.toUpperCase(); tooltip.style.left=`${event.clientX}px`; tooltip.style.top=`${event.clientY}px`; tooltip.style.opacity=1; } else tooltip.style.opacity=0;
}
canvas.addEventListener('pointermove',e=>pick(e));
canvas.addEventListener('click',e=>pick(e,true));
document.querySelector('#back').addEventListener('click',deselect);
document.querySelector('#toggle-panel').addEventListener('click',e=>{e.stopPropagation(); setPanelMinimized(!panel.classList.contains('minimized'));});
panel.addEventListener('click',()=>{if(panel.classList.contains('minimized')) setPanelMinimized(false);});

document.querySelector('#play-pause').addEventListener('click',()=>{ playing=!playing; document.querySelector('#play-icon').textContent=playing?'Ⅱ':'▶'; document.querySelector('#play-label').textContent=playing?'PAUSE':'PLAY'; });
document.querySelector('#reset').addEventListener('click',()=>{ simMs=Date.now(); orbitEpochMs=simMs; if(cameraMode==='free-roam') enterFreeRoam(PLANETS.find(p=>p.name==='Earth')); else { deselect(); if(!selected) startCameraTransition(OVERVIEW,new THREE.Vector3(),1.2); } });
document.querySelector('#speed').addEventListener('change',e=>{speed=Number(e.target.value); document.querySelector('.scale-note').textContent=`TIME ${speed.toLocaleString()}× · SIZES & DISTANCES VISUALLY ADJUSTED — NOT TO SCALE`;});

function enterFreeRoam(body=selected||PLANETS.find(p=>p.name==='Earth')) {
  const target=new THREE.Vector3();
  body.group.getWorldPosition(target);
  const direction=camera.position.clone().sub(target);
  if(direction.lengthSq()<.001) direction.set(1,.35,1);
  const spawn=target.clone().add(direction.normalize().multiplyScalar(body.radius*3));
  transition=null;
  deselect(false);
  freeRoam.enter(spawn,target);
}

function setCameraMode(mode) {
  if(mode===cameraMode) return;
  if(mode==='free-roam') {
    enterFreeRoam();
  } else if(freeRoam.active) {
    const forward=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
    controls.target.copy(camera.position).addScaledVector(forward,20);
    freeRoam.exit();
  }
  cameraMode=mode;
  document.querySelectorAll('.mode').forEach(button=>button.classList.toggle('active',button.dataset.mode===mode));
  document.querySelector('#camera-hint').innerHTML=mode==='free-roam'?'<i class="mouse-icon">↔</i> MOVE MOUSE TO LOOK':'<i class="mouse-icon">↔</i> DRAG TO ORBIT';
  document.querySelector('#movement-hint').textContent=mode==='free-roam'?'WASD TO FLY · SHIFT TO BOOST':'SCROLL TO ZOOM';
}

document.querySelectorAll('.mode').forEach(button=>button.addEventListener('click',()=>setCameraMode(button.dataset.mode)));

function animate() {
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.1);
  simMs=advanceSimulation(simMs,dt,speed,playing);
  const elapsedSimSeconds=(simMs-orbitEpochMs)/1000;
  PLANETS.forEach((p,i)=>{
    const angle=orbitalAngle(elapsedSimSeconds,p.period,p.initialAngle), pos=orbitalPosition(p.orbit,angle);
    p.group.position.set(pos.x,0,pos.z);
    if(playing) {
      advancePlanetRotation(p.mesh,dt,.09+i*.008);
      if(p.clouds) advancePlanetRotation(p.clouds,dt,.12);
      p.moonSystems.forEach(system=>advanceSynchronousMoon(system,dt));
    }
  });
  sun.rotation.y+=dt*.035;
  sunShell.rotation.y-=dt*.018;
  prominences.forEach((arc,i)=>{ arc.rotation.y+=dt*(.012+i*.003); arc.material.opacity=.22+Math.sin(performance.now()*.001+i)*.1; });
  const pulse=1+Math.sin(performance.now()*.0012)*.035;
  glow.scale.setScalar(pulse); corona.scale.setScalar(43*pulse);

  let targetWorld=null;
  if(selected) { targetWorld=new THREE.Vector3(); selected.group.getWorldPosition(targetWorld); }
  if(transition) {
    transition.time+=dt; const raw=Math.min(transition.time/transition.duration,1); const t=raw*raw*(3-2*raw);
    camera.position.lerpVectors(transition.fromPos,transition.toPos,t);
    controls.target.lerpVectors(transition.fromTarget,transition.toTarget,t);
    if(raw>=1){ const done=transition.onDone; transition=null; done?.(); }
  } else if(selected && targetWorld) {
    updateTrackedCamera(camera.position,controls.target,targetWorld,dt,cameraMode==='cinematic');
  }
  if(cameraMode==='cinematic' && !transition && !selected) {
    const target=new THREE.Vector3();
    const offset=camera.position.clone().sub(controls.target); offset.applyAxisAngle(new THREE.Vector3(0,1,0),dt*.055);
    camera.position.copy(target).add(offset); controls.target.lerp(target,1-Math.exp(-dt*4));
  }
  controls.enabled=!transition&&cameraMode!=='free-roam';
  if(cameraMode==='free-roam') {
    const obstacles=BODIES.map(body=>{const center=new THREE.Vector3(); body.group.getWorldPosition(center); return {center,radius:body.radius};});
    freeRoam.update(dt,obstacles);
  } else {
    controls.update();
  }
  document.querySelector('#sim-time').textContent=new Date(simMs).toLocaleString(undefined,{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).toUpperCase();
  renderer.render(scene,camera);
}

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight);});
animate();
