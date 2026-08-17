import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { orbitalAngle, orbitalPosition, advanceSimulation } from './orbits.js';
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

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

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

scene.add(new THREE.AmbientLight(0x435477, .72));
scene.add(new THREE.HemisphereLight(0x9bb8ee,0x12131b,.78));
const sunLight = new THREE.PointLight(0xffd6a0, 4.8, 310, 1.2);
scene.add(sunLight);

const seeded = n => { const v = Math.sin(n * 9182.211 + 17.31) * 43758.5453; return v - Math.floor(v); };

function canvasTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function makePlanetTexture(p) {
  const c=document.createElement('canvas'); c.width=512; c.height=256;
  const x=c.getContext('2d'); x.fillStyle=p.color; x.fillRect(0,0,512,256);
  const ellipse=(i,color,alpha,rx,ry) => { x.globalAlpha=alpha; x.fillStyle=color; x.beginPath(); x.ellipse(seeded(i)*512,seeded(i+31)*256,rx*(.35+seeded(i+7)),ry*(.35+seeded(i+13)),seeded(i+3)*Math.PI,0,Math.PI*2); x.fill(); };
  if (p.name==='Mercury') {
    for(let i=0;i<190;i++){ const r=2+seeded(i+8)*12; ellipse(i,'#716e68',.16+seeded(i)*.22,r,r*.72); x.globalAlpha=.16; x.strokeStyle='#d6d1c8'; x.lineWidth=1; x.stroke(); }
  } else if (p.name==='Venus') {
    for(let i=0;i<34;i++){ x.globalAlpha=.11; x.strokeStyle=i%2?'#fff1bd':'#8c6238'; x.lineWidth=5+seeded(i)*10; x.beginPath(); x.moveTo(-30,i*8+seeded(i)*18); x.bezierCurveTo(130,i*5-30,360,i*10+40,550,i*7); x.stroke(); }
  } else if (p.name==='Earth') {
    const land=['#75934e','#527c49','#a18a55'];
    for(let i=0;i<38;i++) ellipse(i,land[i%3],.72,20+seeded(i)*38,6+seeded(i+2)*18);
    x.globalAlpha=.8; x.fillStyle='#eef4ef'; x.fillRect(0,0,512,12); x.fillRect(0,244,512,12);
  } else if (p.name==='Mars') {
    for(let i=0;i<80;i++) ellipse(i,i%4?'#7b3929':'#d07b4d',.10+seeded(i)*.2,5+seeded(i)*24,3+seeded(i+4)*10);
    x.globalAlpha=.82; x.fillStyle='#e8ded1'; x.beginPath(); x.ellipse(256,7,150,12,0,0,Math.PI*2); x.fill();
  } else {
    const palettes={Jupiter:['#ead0ab','#a96f4d','#f2dfbd','#7c4c3c'],Saturn:['#ead69b','#b89f6b','#f1e3b8','#8f7655'],Uranus:['#a6e2e1','#6db8c3','#c9eeee','#67aeba'],Neptune:['#517ed8','#214da9','#74a0ef','#173878']};
    const colors=palettes[p.name]; let y=0;
    for(let i=0;i<42;i++){ const h=3+seeded(i+2)*8; x.globalAlpha=.28+seeded(i)*.32; x.fillStyle=colors[i%colors.length]; x.fillRect(0,y,512,h); y+=h; }
    if(p.name==='Jupiter'){ x.globalAlpha=.85; x.fillStyle='#a94835'; x.beginPath(); x.ellipse(378,164,42,16,-.08,0,Math.PI*2); x.fill(); x.globalAlpha=.3; x.strokeStyle='#ffd3aa'; x.lineWidth=4; x.stroke(); }
    if(p.name==='Neptune') ellipse(39,'#15306f',.75,32,11);
  }
  const shade=x.createLinearGradient(0,0,0,256); shade.addColorStop(0,'rgba(255,255,255,.18)'); shade.addColorStop(.25,'rgba(255,255,255,0)'); shade.addColorStop(.78,'rgba(0,0,0,0)'); shade.addColorStop(1,'rgba(0,0,0,.26)'); x.globalAlpha=1; x.fillStyle=shade; x.fillRect(0,0,512,256);
  return canvasTexture(c);
}

function makeCloudTexture() {
  const c=document.createElement('canvas'); c.width=512; c.height=256; const x=c.getContext('2d');
  for(let i=0;i<75;i++){ x.fillStyle=`rgba(255,255,255,${.05+seeded(i)*.2})`; x.beginPath(); x.ellipse(seeded(i)*512,seeded(i+5)*256,8+seeded(i+3)*34,2+seeded(i+9)*7,seeded(i)*2,0,Math.PI*2); x.fill(); }
  return canvasTexture(c);
}

function makeSunTexture() {
  const c=document.createElement('canvas'); c.width=512; c.height=256; const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,256); g.addColorStop(0,'#ffd36a'); g.addColorStop(.48,'#ff9b27'); g.addColorStop(1,'#df4b0e'); x.fillStyle=g; x.fillRect(0,0,512,256);
  for(let i=0;i<900;i++){ const r=.5+seeded(i)*3.2; x.globalAlpha=.1+seeded(i+2)*.42; x.fillStyle=i%3?'#fff0a1':'#c83b0a'; x.beginPath(); x.arc(seeded(i+8)*512,seeded(i+16)*256,r,0,Math.PI*2); x.fill(); }
  for(let i=0;i<18;i++){ x.globalAlpha=.14; x.strokeStyle='#fff6bd'; x.lineWidth=1+seeded(i)*2; x.beginPath(); x.arc(seeded(i)*512,seeded(i+4)*256,8+seeded(i+7)*27,0,Math.PI*1.45); x.stroke(); }
  return canvasTexture(c);
}

function makeCoronaTexture() {
  const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
  const g=x.createRadialGradient(128,128,28,128,128,128); g.addColorStop(0,'rgba(255,190,65,.9)'); g.addColorStop(.28,'rgba(255,132,24,.32)'); g.addColorStop(.7,'rgba(255,91,8,.07)'); g.addColorStop(1,'rgba(255,80,0,0)'); x.fillStyle=g; x.fillRect(0,0,256,256); return canvasTexture(c);
}

function makeRingTexture() {
  const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d');
  for(let r=118;r<250;r+=2){ const gap=seeded(r)>.82; x.strokeStyle=gap?'rgba(35,27,18,.08)':`rgba(${180+Math.floor(seeded(r)*65)},${155+Math.floor(seeded(r+2)*60)},${110+Math.floor(seeded(r+4)*55)},${.28+seeded(r+6)*.58})`; x.lineWidth=1+seeded(r)*3; x.beginPath(); x.arc(256,256,r,0,Math.PI*2); x.stroke(); }
  return canvasTexture(c);
}

// Star field with two depth layers.
for (const [count, radius, size, opacity] of [[1800,420,.45,.8],[500,260,.9,.6]]) {
  const data=[];
  for(let i=0;i<count;i++) { const r=radius*(.42+Math.random()*.58), u=Math.random()*2-1, a=Math.random()*Math.PI*2, q=Math.sqrt(1-u*u); data.push(r*q*Math.cos(a), r*u, r*q*Math.sin(a)); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(data,3));
  scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xb9ccff,size,transparent:true,opacity,sizeAttenuation:true})));
}

const sunTexture=makeSunTexture();
const sun = new THREE.Mesh(new THREE.SphereGeometry(8,64,48), new THREE.MeshStandardMaterial({ map:sunTexture, emissiveMap:sunTexture, emissive:0xff6b12, emissiveIntensity:2.1, roughness:.68 }));
scene.add(sun);
const sunShell = new THREE.Mesh(new THREE.SphereGeometry(8.22,64,48),new THREE.MeshBasicMaterial({color:0xffb13b,transparent:true,opacity:.12,blending:THREE.AdditiveBlending,side:THREE.BackSide}));
scene.add(sunShell);
const corona = new THREE.Sprite(new THREE.SpriteMaterial({map:makeCoronaTexture(),color:0xffb33c,transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending}));
corona.scale.set(35,35,1); scene.add(corona);
const prominences=[];
for(let i=0;i<4;i++){
  const arc=new THREE.Mesh(new THREE.TorusGeometry(8.7+i*.25,.055+i*.025,8,64,Math.PI*(.42+seeded(i)*.4)),new THREE.MeshBasicMaterial({color:i%2?0xff7b21:0xffc04d,transparent:true,opacity:.32,blending:THREE.AdditiveBlending,depthWrite:false}));
  arc.rotation.set(seeded(i)*Math.PI,seeded(i+3)*Math.PI,seeded(i+9)*Math.PI); scene.add(arc); prominences.push(arc);
}
const glow = new THREE.Mesh(new THREE.SphereGeometry(10.5,40,40), new THREE.MeshBasicMaterial({color:0xff8b32,transparent:true,opacity:.1,side:THREE.BackSide,blending:THREE.AdditiveBlending}));
scene.add(glow);

const orbitGroup = new THREE.Group(); scene.add(orbitGroup);
const clickable=[];
PLANETS.forEach((p,index) => {
  p.initialAngle = index * 1.73 + .5;
  const group = new THREE.Group(); scene.add(group); p.group=group;
  const texture = makePlanetTexture(p);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.radius,64,48), new THREE.MeshStandardMaterial({map:texture,bumpMap:texture,bumpScale:p.name==='Mercury'||p.name==='Mars'?.12:.035,roughness:['Earth','Neptune'].includes(p.name)?.62:.84,metalness:0}));
  const tilts={Mercury:.034,Venus:.05,Earth:.409,Mars:.44,Jupiter:.054,Saturn:.466,Uranus:1.706,Neptune:.494};
  mesh.rotation.z=tilts[p.name];
  group.add(mesh); p.mesh=mesh; p.detailLayers=[]; p.moonPivots=[];
  if(['Venus','Earth'].includes(p.name)){
    const clouds=new THREE.Mesh(new THREE.SphereGeometry(p.radius*1.018,64,48),new THREE.MeshStandardMaterial({map:makeCloudTexture(),transparent:true,opacity:p.name==='Venus'?.72:.58,depthWrite:false,roughness:1}));
    clouds.rotation.z=mesh.rotation.z; group.add(clouds); p.clouds=clouds; p.detailLayers.push(clouds);
  }
  if(['Venus','Earth','Uranus','Neptune'].includes(p.name)){
    const atmosphereColors={Venus:0xffce7a,Earth:0x5caeff,Uranus:0x8de5e9,Neptune:0x3f78ff};
    const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(p.radius*1.055,48,36),new THREE.MeshBasicMaterial({color:atmosphereColors[p.name],transparent:true,opacity:p.name==='Earth'?.12:.075,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false}));
    group.add(atmosphere); p.detailLayers.push(atmosphere);
  }
  const hit = new THREE.Mesh(new THREE.SphereGeometry(Math.max(p.radius*1.45,2.8),20,16), new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  hit.userData.planet=p; group.add(hit); clickable.push(hit);
  if (p.name==='Saturn' || p.name==='Uranus') {
    const ringTexture=makeRingTexture();
    const inner=p.name==='Saturn'?7.1:5.2, outer=p.name==='Saturn'?11.2:7.2;
    const ring=new THREE.Mesh(new THREE.RingGeometry(inner,outer,160),new THREE.MeshStandardMaterial({map:ringTexture,alphaMap:ringTexture,color:p.name==='Saturn'?0xe1cca0:0x9fc9cf,side:THREE.DoubleSide,transparent:true,opacity:p.name==='Saturn'?.88:.28,roughness:.86,depthWrite:false}));
    ring.rotation.x=Math.PI/2; ring.rotation.y=p.name==='Saturn'?.16:1.45; group.add(ring); p.ring=ring; p.detailLayers.push(ring);
  }
  const moonCounts={Earth:1,Mars:2,Jupiter:4,Saturn:3,Uranus:2,Neptune:1};
  const visibleMoons=moonCounts[p.name]||0;
  for(let m=0;m<visibleMoons;m++){
    const pivot=new THREE.Group(); const moonRadius=Math.max(.16,p.radius*(p.name==='Earth'?.19:.055+seeded(m)*.025));
    const moon=new THREE.Mesh(new THREE.SphereGeometry(moonRadius,20,14),new THREE.MeshStandardMaterial({color:m===0&&p.name==='Jupiter'?0xd6c19a:0xaaa8a1,roughness:.95,bumpMap:texture,bumpScale:.03}));
    moon.position.x=p.radius*(1.7+m*.42)+.8; pivot.rotation.x=(seeded(index*7+m)-.5)*.28; pivot.rotation.y=m*1.8+seeded(index+m)*2; pivot.add(moon); group.add(pivot); p.moonPivots.push(pivot);
  }
  const curve = new THREE.EllipseCurve(0,0,p.orbit,p.orbit,0,Math.PI*2,false,0);
  const pts=curve.getPoints(180).map(v=>new THREE.Vector3(v.x,0,v.y));
  const orbit=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x445170,transparent:true,opacity:.28}));
  orbit.userData.defaultOpacity=.28; orbitGroup.add(orbit); p.orbitLine=orbit;
});

const nav=document.querySelector('#planet-buttons');
PLANETS.forEach(p => { const b=document.createElement('button'); b.className='planet-button'; b.innerHTML=`<i class="planet-dot" style="background:${p.color};color:${p.color}"></i>${p.name.toUpperCase()}`; b.addEventListener('click',()=>selectPlanet(p)); nav.appendChild(b); p.button=b; });

let playing=true, speed=60, simMs=Date.now(), orbitEpochMs=simMs, selected=null, cameraMode='fixed';
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
  PLANETS.forEach(q=>{ q.button.classList.toggle('active',q===p); q.orbitLine.material.opacity=q===p?.9:.16; q.orbitLine.material.color.set(q===p?p.color:0x445170); });
  const world=new THREE.Vector3(); p.group.getWorldPosition(world);
  const dir=camera.position.clone().sub(controls.target).normalize();
  const distance=Math.max(p.radius*7,18);
  startCameraTransition(world.clone().add(dir.multiplyScalar(distance)).add(new THREE.Vector3(0,p.radius*2.1,0)),world,1.15);
  populatePanel(p); panel.classList.add('open'); panel.setAttribute('aria-hidden','false');
}
function deselect() {
  if (!selected) return;
  selected=null;
  PLANETS.forEach(q=>{q.button.classList.remove('active'); q.orbitLine.material.opacity=.28; q.orbitLine.material.color.set(0x445170);});
  panel.classList.remove('open'); panel.setAttribute('aria-hidden','true');
  startCameraTransition(savedView.position,savedView.target,1.3);
}
function populatePanel(p) {
  document.querySelector('#planet-name').textContent=p.name;
  document.querySelector('#planet-kicker').textContent=`PLANET ${String(PLANETS.indexOf(p)+1).padStart(2,'0')}`;
  document.querySelector('#planet-overview').textContent=p.overview;
  document.querySelector('#planet-fact').textContent=p.fact;
  document.querySelector('#planet-icon').style.setProperty('--planet-color',p.color);
  const stats=[['DIAMETER',p.diameter],['AVG. DISTANCE',p.distance],['ORBITAL PERIOD',`${p.period.toLocaleString()} days`],['ROTATION',p.rotation],['KNOWN MOONS',String(p.moons)],['AVG. TEMPERATURE',p.temp]];
  document.querySelector('#planet-stats').innerHTML=stats.map(([k,v])=>`<div class="stat"><dt>${k}</dt><dd>${v}</dd></div>`).join('');
}

function pick(event, isClick=false) {
  const r=canvas.getBoundingClientRect(); pointer.x=((event.clientX-r.left)/r.width)*2-1; pointer.y=-((event.clientY-r.top)/r.height)*2+1;
  raycaster.setFromCamera(pointer,camera); const hit=raycaster.intersectObjects(clickable,false)[0]; const p=hit?.object.userData.planet || null;
  if (isClick) { p ? selectPlanet(p) : deselect(); return; }
  if (hover!==p) { hover=p; canvas.style.cursor=p?'pointer':'grab'; clickable.forEach(m=>m.parent.children[0].scale.setScalar(m.userData.planet===p?1.14:1)); }
  if (p) { tooltip.textContent=p.name.toUpperCase(); tooltip.style.left=`${event.clientX}px`; tooltip.style.top=`${event.clientY}px`; tooltip.style.opacity=1; } else tooltip.style.opacity=0;
}
canvas.addEventListener('pointermove',e=>pick(e));
canvas.addEventListener('click',e=>pick(e,true));
document.querySelector('#close-panel').addEventListener('click',deselect);

document.querySelector('#play-pause').addEventListener('click',()=>{ playing=!playing; document.querySelector('#play-icon').textContent=playing?'Ⅱ':'▶'; document.querySelector('#play-label').textContent=playing?'PAUSE':'PLAY'; });
document.querySelector('#reset').addEventListener('click',()=>{ simMs=Date.now(); orbitEpochMs=simMs; deselect(); if(!selected) startCameraTransition(OVERVIEW,new THREE.Vector3(),1.2); });
document.querySelector('#speed').addEventListener('change',e=>{speed=Number(e.target.value); document.querySelector('.scale-note').textContent=`TIME ${speed.toLocaleString()}× · SIZES & DISTANCES VISUALLY ADJUSTED — NOT TO SCALE`;});
document.querySelectorAll('.mode').forEach(b=>b.addEventListener('click',()=>{ cameraMode=b.dataset.mode; document.querySelectorAll('.mode').forEach(x=>x.classList.toggle('active',x===b)); }));

function animate() {
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.1);
  simMs=advanceSimulation(simMs,dt,speed,playing);
  const elapsedSimSeconds=(simMs-orbitEpochMs)/1000;
  PLANETS.forEach((p,i)=>{
    const angle=orbitalAngle(elapsedSimSeconds,p.period,p.initialAngle), pos=orbitalPosition(p.orbit,angle);
    p.group.position.set(pos.x,0,pos.z);
    if(playing) {
      p.mesh.rotation.y += dt * (.09 + i*.008);
      if(p.clouds) p.clouds.rotation.y += dt*(p.name==='Venus'?.055:.12);
      p.moonPivots.forEach((pivot,m)=>{ pivot.rotation.y+=dt*(.18+m*.055); });
    }
  });
  sun.rotation.y+=dt*.035;
  sunShell.rotation.y-=dt*.018;
  prominences.forEach((arc,i)=>{ arc.rotation.y+=dt*(.012+i*.003); arc.material.opacity=.22+Math.sin(performance.now()*.001+i)*.1; });
  const pulse=1+Math.sin(performance.now()*.0012)*.035;
  glow.scale.setScalar(pulse); corona.scale.setScalar(35*pulse);

  let targetWorld=null;
  if(selected) { targetWorld=new THREE.Vector3(); selected.group.getWorldPosition(targetWorld); }
  if(transition) {
    transition.time+=dt; const raw=Math.min(transition.time/transition.duration,1); const t=raw*raw*(3-2*raw);
    camera.position.lerpVectors(transition.fromPos,transition.toPos,t);
    controls.target.lerpVectors(transition.fromTarget,transition.toTarget,t);
    if(raw>=1){ const done=transition.onDone; transition=null; done?.(); }
  } else if(selected && targetWorld) {
    const delta=targetWorld.clone().sub(controls.target); controls.target.lerp(targetWorld,1-Math.exp(-dt*5)); camera.position.add(delta.multiplyScalar(1-Math.exp(-dt*5)));
  }
  if(cameraMode==='cinematic' && !transition) {
    const target=selected&&targetWorld?targetWorld:new THREE.Vector3();
    const offset=camera.position.clone().sub(controls.target); offset.applyAxisAngle(new THREE.Vector3(0,1,0),dt*.055);
    camera.position.copy(target).add(offset); controls.target.lerp(target,1-Math.exp(-dt*4));
  }
  controls.enabled=!transition;
  controls.update();
  document.querySelector('#sim-time').textContent=new Date(simMs).toLocaleString(undefined,{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).toUpperCase();
  renderer.render(scene,camera);
}

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight);});
animate();
