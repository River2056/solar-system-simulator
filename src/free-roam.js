import * as THREE from 'three';

const COLLISION_EPSILON=.0001;
const MAX_COLLISION_PASSES=4;
const MOVE_SPEED=12;
const BOOST_MULTIPLIER=2.5;
const LOOK_SENSITIVITY=.003;
const MAX_PITCH=Math.PI/2-.02;

function pushOutsideObstacles(position,obstacles,clearance) {
  for(const obstacle of obstacles) {
    const minimumDistance=obstacle.radius+clearance;
    const offset=position.clone().sub(obstacle.center);
    if(offset.lengthSq()>=minimumDistance*minimumDistance) continue;
    if(offset.lengthSq()===0) offset.set(1,0,0);
    position.copy(obstacle.center).add(offset.setLength(minimumDistance+COLLISION_EPSILON));
  }
}

function firstCollision(position,displacement,obstacles,clearance) {
  const lengthSquared=displacement.lengthSq();
  if(lengthSquared===0) return null;

  let first=null;
  for(const obstacle of obstacles) {
    const expandedRadius=obstacle.radius+clearance;
    const offset=position.clone().sub(obstacle.center);
    const approach=offset.dot(displacement);
    if(approach>=0) continue;

    const discriminant=approach*approach-lengthSquared*(offset.lengthSq()-expandedRadius*expandedRadius);
    if(discriminant<0) continue;
    const time=(-approach-Math.sqrt(discriminant))/lengthSquared;
    if(time<0||time>1||(first&&time>=first.time)) continue;
    first={time,obstacle};
  }
  return first;
}

export function moveWithSphereCollisions(position,displacement,obstacles,clearance) {
  const result=position.clone();
  pushOutsideObstacles(result,obstacles,clearance);
  let remaining=displacement.clone();

  for(let pass=0;pass<MAX_COLLISION_PASSES&&remaining.lengthSq()>COLLISION_EPSILON**2;pass+=1) {
    const collision=firstCollision(result,remaining,obstacles,clearance);
    if(!collision) {
      result.add(remaining);
      break;
    }

    const travel=Math.max(0,collision.time-COLLISION_EPSILON/Math.sqrt(remaining.lengthSq()));
    result.addScaledVector(remaining,travel);
    const residual=remaining.multiplyScalar(1-collision.time);
    const normal=result.clone().sub(collision.obstacle.center).normalize();
    residual.addScaledVector(normal,-residual.dot(normal));
    remaining=residual;
  }

  pushOutsideObstacles(result,obstacles,clearance);
  return result;
}

export class FreeRoamController {
  constructor(camera,canvas,flightControls,lookControl,{clearance=.08}={}) {
    this.camera=camera;
    this.canvas=canvas;
    this.flightControls=flightControls;
    this.lookControl=lookControl;
    this.clearance=clearance;
    this.active=false;
    this.yaw=0;
    this.pitch=0;
    this.keys=new Set();
    this.touchMoves=new Set();
    this.mouseCaptureReadyAt=0;

    this.onKeyDown=event=>{
      if(!this.active||!['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(event.code)) return;
      event.preventDefault();
      this.keys.add(event.code);
    };
    this.onKeyUp=event=>this.keys.delete(event.code);
    this.onMouseMove=event=>{
      if(this.active&&document.pointerLockElement===this.canvas&&performance.now()>=this.mouseCaptureReadyAt) this.rotate(event.movementX,event.movementY);
    };
    this.captureMouse=event=>{
      if(!this.active||event.pointerType==='touch'||document.pointerLockElement===this.canvas) return;
      const request=this.canvas.requestPointerLock?.();
      request?.catch?.(()=>{});
    };

    addEventListener('keydown',this.onKeyDown);
    addEventListener('keyup',this.onKeyUp);
    addEventListener('blur',()=>this.keys.clear());
    document.addEventListener('pointerlockchange',()=>{
      if(document.pointerLockElement===this.canvas) this.mouseCaptureReadyAt=performance.now()+80;
    });
    document.addEventListener('mousemove',this.onMouseMove);
    canvas.addEventListener('pointerdown',this.captureMouse);

    flightControls.querySelectorAll('[data-move]').forEach(button=>{
      const move=button.dataset.move;
      const start=event=>{
        event.preventDefault();
        this.touchMoves.add(move);
        try { button.setPointerCapture(event.pointerId); } catch {}
      };
      const stop=event=>{event.preventDefault(); this.touchMoves.delete(move);};
      button.addEventListener('pointerdown',start);
      button.addEventListener('pointerup',stop);
      button.addEventListener('pointercancel',stop);
      button.addEventListener('lostpointercapture',()=>this.touchMoves.delete(move));
    });

    let lookPointer=null;
    lookControl.addEventListener('pointerdown',event=>{
      if(!this.active) return;
      event.preventDefault();
      lookPointer={id:event.pointerId,x:event.clientX,y:event.clientY};
      lookControl.classList.add('active');
      try { lookControl.setPointerCapture(event.pointerId); } catch {}
    });
    lookControl.addEventListener('pointermove',event=>{
      if(!this.active||lookPointer?.id!==event.pointerId) return;
      this.rotate(event.clientX-lookPointer.x,event.clientY-lookPointer.y);
      lookPointer.x=event.clientX;
      lookPointer.y=event.clientY;
    });
    const stopLook=event=>{
      if(lookPointer?.id!==event.pointerId) return;
      lookPointer=null;
      lookControl.classList.remove('active');
    };
    lookControl.addEventListener('pointerup',stopLook);
    lookControl.addEventListener('pointercancel',stopLook);
    lookControl.addEventListener('lostpointercapture',()=>{lookPointer=null; lookControl.classList.remove('active');});
  }

  rotate(deltaX,deltaY) {
    this.yaw-=deltaX*LOOK_SENSITIVITY;
    this.pitch=THREE.MathUtils.clamp(this.pitch-deltaY*LOOK_SENSITIVITY,-MAX_PITCH,MAX_PITCH);
    this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');
  }

  enter(position,target) {
    this.active=true;
    this.camera.position.copy(position);
    this.camera.lookAt(target);
    const rotation=new THREE.Euler().setFromQuaternion(this.camera.quaternion,'YXZ');
    this.pitch=rotation.x;
    this.yaw=rotation.y;
    document.body.classList.add('free-roam-active');
    const request=this.canvas.requestPointerLock?.();
    request?.catch?.(()=>{});
  }

  exit() {
    this.active=false;
    this.keys.clear();
    this.touchMoves.clear();
    this.lookControl.classList.remove('active');
    if(document.pointerLockElement===this.canvas) document.exitPointerLock?.();
    document.body.classList.remove('free-roam-active');
  }

  update(dt,obstacles) {
    if(!this.active) return;
    const forward=Number(this.keys.has('KeyW')||this.touchMoves.has('forward'))-Number(this.keys.has('KeyS')||this.touchMoves.has('back'));
    const right=Number(this.keys.has('KeyD')||this.touchMoves.has('right'))-Number(this.keys.has('KeyA')||this.touchMoves.has('left'));
    if(!forward&&!right) return;

    const direction=new THREE.Vector3();
    direction.addScaledVector(new THREE.Vector3(0,0,-1).applyQuaternion(this.camera.quaternion),forward);
    direction.addScaledVector(new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion),right);
    if(direction.lengthSq()>1) direction.normalize();
    const boosting=this.keys.has('ShiftLeft')||this.keys.has('ShiftRight');
    const displacement=direction.multiplyScalar(MOVE_SPEED*(boosting?BOOST_MULTIPLIER:1)*dt);
    this.camera.position.copy(moveWithSphereCollisions(this.camera.position,displacement,obstacles,this.clearance));
  }
}
