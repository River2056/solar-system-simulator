import * as THREE from 'three';

export const MOON_APPEARANCES=Object.freeze({
  Moon:{shape:[1,.999,.998],style:'maria',base:'#96938c',dark:'#4d5150',light:'#c5c1b8',craters:85,roughness:1,bumpScale:.025},
  Phobos:{shape:[1,.81,.67],style:'rocky',base:'#74695b',dark:'#403b35',light:'#a19480',craters:105,irregularity:.13,roughness:1,bumpScale:.04},
  Deimos:{shape:[1,.80,.73],style:'rocky',base:'#817568',dark:'#554e47',light:'#a89a87',craters:48,irregularity:.08,roughness:1,bumpScale:.025},
  Io:{shape:[1,.997,.995],style:'volcanic',base:'#d5b33f',dark:'#523b25',light:'#eee193',accent:'#b75520',spots:95,roughness:.9,bumpScale:0},
  Europa:{shape:[1,.998,.997],style:'cracked-ice',base:'#d8c6a0',dark:'#8a5942',light:'#eee1bd',lines:46,roughness:.82,bumpScale:.006},
  Ganymede:{shape:[1,.997,.996],style:'grooved',base:'#777168',dark:'#424443',light:'#aaa194',craters:45,lines:38,roughness:.94,bumpScale:.008},
  Callisto:{shape:[1,.998,.996],style:'cratered-dark',base:'#413b36',dark:'#242424',light:'#afa18f',craters:150,roughness:1,bumpScale:.03},
  Mimas:{shape:[1,.95,.92],style:'herschel',base:'#aaa69d',dark:'#595852',light:'#ddd8cc',craters:90,roughness:1,bumpScale:.035},
  Enceladus:{shape:[1,.999,.998],style:'tiger-stripes',base:'#dce6e8',dark:'#82aebd',light:'#f6faf9',craters:35,lines:12,roughness:.75,bumpScale:.008},
  Titan:{shape:[1,.999,.997],style:'haze',base:'#b96826',dark:'#793b19',light:'#dc9140',roughness:.72,bumpScale:0,atmosphere:'#e8903b'},
  Miranda:{shape:[1,.98,.96],style:'patchwork',base:'#8c8983',dark:'#51504d',light:'#bbb7ae',craters:45,irregularity:.025,roughness:1,bumpScale:.03},
  Titania:{shape:[1,.997,.995],style:'chasms',base:'#777570',dark:'#494b4d',light:'#aaa8a1',craters:70,lines:20,roughness:1,bumpScale:.025},
  Triton:{shape:[1,.998,.996],style:'cantaloupe',base:'#c5a69e',dark:'#6d625f',light:'#e0cbc1',spots:70,lines:24,roughness:.92,bumpScale:.006}
});

function hashString(value){
  let hash=2166136261;
  for(let i=0;i<value.length;i++) hash=Math.imul(hash^value.charCodeAt(i),16777619);
  return hash>>>0;
}

function randomGenerator(seed){
  let state=seed||1;
  return ()=>{
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    return state/4294967296;
  };
}

function ellipse(ctx,x,y,r,color,alpha=1,stretch=1){
  ctx.save(); ctx.globalAlpha=alpha; ctx.fillStyle=color; ctx.beginPath();
  ctx.ellipse(x,y,r*stretch,r,0,0,Math.PI*2); ctx.fill(); ctx.restore();
}

function wrappedEllipse(ctx,x,y,r,color,alpha,stretch,width){
  ellipse(ctx,x,y,r,color,alpha,stretch);
  ellipse(ctx,x-width,y,r,color,alpha,stretch);
  ellipse(ctx,x+width,y,r,color,alpha,stretch);
}

function drawCraters(ctx,appearance,random,width,height){
  const count=appearance.craters||0;
  for(let i=0;i<count;i++){
    const r=(2+random()*10)*(i<4?1.8:1);
    const x=random()*width, y=random()*height;
    wrappedEllipse(ctx,x,y,r,appearance.dark,.22+random()*.28,1.2+random()*.8,width);
    wrappedEllipse(ctx,x-r*.18,y-r*.2,r*.72,appearance.light,.1+random()*.18,1.2+random()*.8,width);
  }
}

function drawWanderingLines(ctx,appearance,random,width,height,count=appearance.lines||20){
  ctx.save(); ctx.strokeStyle=appearance.dark; ctx.lineCap='round';
  for(let i=0;i<count;i++){
    let x=random()*width, y=random()*height;
    ctx.globalAlpha=.2+random()*.45; ctx.lineWidth=.7+random()*2.2;
    const points=[[x,y]];
    for(let p=0;p<7;p++){
      x+=(random()-.5)*75; y+=(random()-.5)*24;
      points.push([x,y]);
    }
    for(const offset of [-width,0,width]){
      ctx.beginPath(); ctx.moveTo(points[0][0]+offset,points[0][1]);
      for(let p=1;p<points.length;p++) ctx.lineTo(points[p][0]+offset,points[p][1]);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawAppearance(ctx,name,appearance,random,width,height){
  ctx.fillStyle=appearance.base; ctx.fillRect(0,0,width,height);

  if(['maria','grooved','patchwork','cantaloupe'].includes(appearance.style)){
    const patches=appearance.spots||45;
    for(let i=0;i<patches;i++) wrappedEllipse(ctx,random()*width,random()*height,8+random()*34,i%3?appearance.dark:appearance.light,.08+random()*.2,1.5+random()*3,width);
  }
  if(appearance.style==='volcanic'){
    for(let i=0;i<appearance.spots;i++){
      const color=i%5===0?appearance.dark:(i%2?appearance.accent:appearance.light);
      wrappedEllipse(ctx,random()*width,random()*height,3+random()*15,color,.35+random()*.45,1+random()*2.5,width);
    }
  }
  if(appearance.style==='haze'){
    ctx.save(); ctx.globalAlpha=.23;
    for(let y=25;y<height;y+=38){ctx.fillStyle=y%76===25?appearance.light:appearance.dark; ctx.fillRect(0,y,width,9+random()*10);}
    ctx.restore();
  }
  if(appearance.style==='grooved'){
    wrappedEllipse(ctx,width*.2,height*.5,118,appearance.dark,.48,1.8,width);
    wrappedEllipse(ctx,width*.69,height*.48,132,appearance.light,.24,1.45,width);
  }

  drawCraters(ctx,appearance,random,width,height);

  if(['cracked-ice','grooved','patchwork','chasms','cantaloupe'].includes(appearance.style)) drawWanderingLines(ctx,appearance,random,width,height);
  if(appearance.style==='tiger-stripes'){
    drawWanderingLines(ctx,appearance,random,width,height,8);
    ctx.save(); ctx.strokeStyle=appearance.dark; ctx.globalAlpha=.8; ctx.lineWidth=4;
    for(let i=0;i<4;i++){ctx.beginPath(); ctx.moveTo(width*(.37+i*.07),height*.72); ctx.bezierCurveTo(width*(.40+i*.07),height*.8,width*(.34+i*.07),height*.9,width*(.40+i*.07),height); ctx.stroke();}
    ctx.restore();
  }
  if(appearance.style==='herschel'){
    ellipse(ctx,width*.28,height*.46,55,appearance.dark,.72,1.35);
    ellipse(ctx,width*.275,height*.45,42,appearance.light,.35,1.35);
    ellipse(ctx,width*.28,height*.46,24,appearance.dark,.34,1.35);
  }
  if(appearance.style==='cratered-dark'){
    ctx.save(); ctx.strokeStyle=appearance.light; ctx.globalAlpha=.26;
    for(let radius=18;radius<=82;radius+=13){ctx.lineWidth=1+radius/55; ctx.beginPath(); ctx.ellipse(width*.34,height*.48,radius*1.7,radius,0,0,Math.PI*2); ctx.stroke();}
    ctx.restore();
  }
  if(appearance.style==='rocky' && name==='Phobos'){
    ellipse(ctx,width*.32,height*.47,48,appearance.dark,.72,1.25);
    ellipse(ctx,width*.315,height*.46,35,appearance.light,.28,1.25);
  }
  if(appearance.style==='patchwork'){
    ctx.save(); ctx.strokeStyle=appearance.light; ctx.globalAlpha=.5; ctx.lineWidth=3;
    for(let i=0;i<3;i++){
      const centerX=width*(.2+i*.28),centerY=height*(.35+(i%2)*.22);
      for(let band=0;band<4;band++){
        const radius=18+band*11; ctx.beginPath();
        ctx.moveTo(centerX-radius,centerY); ctx.lineTo(centerX,centerY-radius*.65); ctx.lineTo(centerX+radius,centerY); ctx.lineTo(centerX,centerY+radius*.65); ctx.closePath(); ctx.stroke();
      }
    }
    ctx.restore();
  }
  if(appearance.style==='chasms'){
    ctx.save(); ctx.strokeStyle=appearance.dark; ctx.globalAlpha=.7; ctx.lineWidth=4;
    for(let i=0;i<7;i++){
      ctx.beginPath(); ctx.moveTo(-30,height*(.18+i*.1)); ctx.lineTo(width+30,height*(.52+i*.035)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(width*(.12+i*.11),-20); ctx.lineTo(width*(.38+i*.08),height+20); ctx.stroke();
    }
    ctx.restore();
  }
  if(appearance.style==='cantaloupe'){
    ctx.save(); ctx.strokeStyle=appearance.light; ctx.globalAlpha=.2; ctx.lineWidth=2;
    for(let y=12;y<height;y+=18){ctx.beginPath(); for(let x=0;x<=width;x+=18) ctx.lineTo(x,y+Math.sin(x*.045+y)*7); ctx.stroke();}
    ctx.restore();
    ctx.save(); ctx.strokeStyle=appearance.dark; ctx.globalAlpha=.45; ctx.lineWidth=3;
    for(let i=0;i<10;i++){const x=width*(.08+i*.085); ctx.beginPath(); ctx.moveTo(x,height*.05); ctx.lineTo(x+15+random()*25,height*.38); ctx.stroke();}
    ctx.restore();
  }
}

export function createMoonTexture(name){
  const appearance=MOON_APPEARANCES[name];
  if(!appearance) throw new Error(`Missing appearance for moon: ${name}`);
  const canvas=document.createElement('canvas'); canvas.width=1024; canvas.height=512;
  const ctx=canvas.getContext('2d');
  drawAppearance(ctx,name,appearance,randomGenerator(hashString(name)),canvas.width,canvas.height);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=THREE.RepeatWrapping;
  return texture;
}

export function createMoonGeometry(name,radius){
  const appearance=MOON_APPEARANCES[name];
  if(!appearance) throw new Error(`Missing appearance for moon: ${name}`);
  const geometry=appearance.irregularity
    ?new THREE.IcosahedronGeometry(radius,5)
    :new THREE.SphereGeometry(radius,40,28);
  geometry.scale(...appearance.shape);
  if(appearance.irregularity){
    const positions=geometry.attributes.position;
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
      const noise=Math.sin(x*13.7+y*9.1+z*15.3)*appearance.irregularity;
      positions.setXYZ(i,x*(1+noise),y*(1+noise),z*(1+noise));
    }
    positions.needsUpdate=true; geometry.computeVertexNormals();
  }
  return geometry;
}

export function createMoonMaterial(name,texture){
  const appearance=MOON_APPEARANCES[name];
  return new THREE.MeshStandardMaterial({
    map:texture,
    bumpMap:appearance.bumpScale?texture:null,
    bumpScale:appearance.bumpScale,
    roughness:appearance.roughness
  });
}
