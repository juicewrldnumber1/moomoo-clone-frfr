// ============================================================
//  MOOMOO CLONE v2 — FULL GAME ENGINE
// ============================================================
'use strict';
const C = CONFIG;

// Apply title/subtitle from config
document.getElementById('menu-title').textContent = C.game.title;
document.getElementById('menu-subtitle').textContent = C.game.subtitle;

// ── Canvas & Context ──────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
const mmCvs  = document.getElementById('minimap');
const mmCtx  = mmCvs.getContext('2d');
mmCvs.width = mmCvs.height = C.ui.minimapSize;

function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
resize(); window.addEventListener('resize', resize);

const WW = C.world.width, WH = C.world.height;

// ── State ─────────────────────────────────────────────────
let gameState = 'menu';
let playerName = 'Player';
let paused = false; // true when age-up panel is shown

// ── Input ─────────────────────────────────────────────────
const keys = {};
const mouse = { x: 0, y: 0, wx: 0, wy: 0, down: false };

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (gameState !== 'playing' || paused) return;
  const map = {Digit1:0,Digit2:1,Digit3:2,Digit4:3,Digit5:4,Digit6:5,Digit7:6,Digit8:7};
  if (map[e.code] !== undefined) setSlot(map[e.code]);
  if (e.code === 'KeyC') toggleShop();
  if (e.code === 'KeyT') { e.preventDefault(); openChat(); }
  if (e.code === 'KeyQ') doDash();
  if (e.code === 'Escape') { closeShop(); closeChat(); }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

canvas.addEventListener('mousemove', e => {
  mouse.x = e.clientX; mouse.y = e.clientY;
  const w = screenToWorld(e.clientX, e.clientY);
  mouse.wx = w.x; mouse.wy = w.y;
});
canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  mouse.down = true;
  if (gameState === 'playing' && !paused) doAction();
});
canvas.addEventListener('mouseup', e => { if (e.button === 0) mouse.down = false; });

// ── Camera ────────────────────────────────────────────────
const cam = { x: WW/2, y: WH/2 };
function worldToScreen(wx, wy) { return { x: wx - cam.x + canvas.width/2, y: wy - cam.y + canvas.height/2 }; }
function screenToWorld(sx, sy) { return { x: sx + cam.x - canvas.width/2, y: sy + cam.y - canvas.height/2 }; }

// ── Math helpers ──────────────────────────────────────────
const dist   = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
const angle  = (a,b) => Math.atan2(b.y-a.y, b.x-a.x);
const lerp   = (a,b,t) => a+(b-a)*t;
const clamp  = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const rand   = (lo,hi) => lo + Math.random()*(hi-lo);

// ── Audio ─────────────────────────────────────────────────
const audioCtx = C.audio.enabled ? new(window.AudioContext||window.webkitAudioContext)() : null;
function playTone(freq,dur,type='square',vol=0.3){
  if(!audioCtx||!C.audio.enabled)return;
  try{
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.connect(g);g.connect(audioCtx.destination);
    o.type=type;o.frequency.value=freq;
    g.gain.setValueAtTime(vol*C.audio.masterVolume,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
    o.start();o.stop(audioCtx.currentTime+dur);
  }catch(e){}
}
const sfxHit    = () => playTone(200,0.1,'sawtooth',C.audio.hitVolume);
const sfxCollect= () => playTone(660,0.07,'sine',C.audio.collectVolume);
const sfxBuild  = () => playTone(440,0.12,'square',C.audio.buildVolume);
const sfxDeath  = () => { playTone(110,0.5,'sawtooth',C.audio.deathVolume); playTone(80,0.9,'sawtooth',0.5); };
const sfxLevelUp= () => [440,550,660,880].forEach((f,i)=>setTimeout(()=>playTone(f,0.15,'sine',0.5),i*80));
const sfxBoss   = () => [150,120,90].forEach((f,i)=>setTimeout(()=>playTone(f,0.4,'sawtooth',0.7),i*200));
const sfxShoot  = () => playTone(800,0.05,'square',0.3);

// ── Particles ─────────────────────────────────────────────
let particles = [];
function spawnParticles(x,y,color,n=6,speed=3){
  for(let i=0;i<n;i++){
    const a=rand(0,Math.PI*2),s=rand(1,speed);
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,decay:0.02+Math.random()*0.03,size:rand(2,5),color});
  }
}

// ── Damage popups ─────────────────────────────────────────
function popDmg(x,y,val,type='dmg'){
  const s=worldToScreen(x,y);
  const el=document.createElement('div');
  el.className='dmg-pop '+type;
  el.textContent=type==='dmg'?`-${val}`:type==='heal'?`+${val}`:type==='gold'?`+${val}💰`:`+${val}xp`;
  el.style.left=(s.x+rand(-24,24))+'px';
  el.style.top=(s.y-20)+'px';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),900);
}

// ── Announce ──────────────────────────────────────────────
function announce(txt,dur=2800){
  const el=document.createElement('div');
  el.className='announce-msg';
  el.textContent=txt;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),dur);
}

// ── Kill feed ─────────────────────────────────────────────
function killFeed(txt){
  const feed=document.getElementById('killfeed');
  const el=document.createElement('div');
  el.className='kill-entry';el.textContent=txt;
  feed.appendChild(el);
  setTimeout(()=>el.remove(),3500);
  while(feed.children.length>6)feed.removeChild(feed.firstChild);
}

// ── Player ────────────────────────────────────────────────
let P = null; // player object

function makePlayer(name){
  return {
    name,
    x:WW/2, y:WH/2,
    vx:0, vy:0,
    angle:0,
    hp:C.player.maxHealth, maxHp:C.player.maxHealth,
    food:C.player.maxFood, maxFood:C.player.maxFood,
    size:C.player.size,
    baseSpeed:C.player.speed,
    age:1, xp:0,
    score:0, kills:0, timeSurvived:0,
    gold:9999999,
    wood:9999990, stone:99990,
    dead:false,
    flashTimer:0,
    attackTimer:0,
    attackAnim:0,
    dashCooldown:0,
    dashTimer:0,
    activeSlot:0,
    isPoisoned:false, poisonTimer:0,
    isBurning:false, burnTimer:0,
    // Inventory — weapons
    primaryWeapon:'fist',     // slot 1 weapon key
    secondaryWeapon:null,     // slot 7 (secondary)
    unlockedWeapons:['fist'],
    // Inventory — buildings (by key)
    unlockedBuildings:['spike','wall_wood','windmill'],
    // Shop inventory
    ownedHats:['none'],
    ownedAccs:['none'],
    equippedHat:'none',
    equippedAcc:'none',
    // Stat bonuses from hat
    hatEffects:{},
    // Has CaseOh spike been unlocked?
    caseohUnlocked:false,
    // Booleans
    hasBow:false,
    ageUpPending:false,
    // Turret hat state
    turretHatCooldown:0,
    turretHatAngle:0,
  };
}

// Hat effect helpers
function getSpeed(){ return P.baseSpeed * (P.hatEffects.speedMult||1) * (P.hatEffects.berserk&&P.hp/P.maxHp<0.3?1.5:1); }
function getDmgMult(){ return (P.hatEffects.damageBonus||1) * (P.hatEffects.berserk&&P.hp/P.maxHp<0.3?1.25:1); }
function getDmgReduction(){ return P.hatEffects.damageReduction||0; }
function getRegenRate(){ return (C.player.healthRegenRate||0.025) + (P.hatEffects.regenRate||0)/60; }
function getLifesteal(){ return P.hatEffects.lifesteal||0; }
function isStealth(){ return !!(P.hatEffects.stealth); }
function getGatherBonus(){ return P.hatEffects.gatherBonus||0; }

// ── Resources ────────────────────────────────────────────
let resources = [];
function makeRes(type){
  const cfg=C.resources[type];
  return {
    type, id:Math.random().toString(36).slice(2),
    x:rand(200,WW-200), y:rand(200,WH-200),
    size:rand(cfg.minSize,cfg.maxSize),
    hp:cfg.health, maxHp:cfg.health,
    dead:false, respawnTimer:0, wobble:0,
    angle:rand(0,Math.PI*2),
  };
}
function spawnResources(){
  resources=[];
  for(const [type,cfg] of Object.entries(C.resources)){
    for(let i=0;i<cfg.count;i++) resources.push(makeRes(type));
  }
}

// ── Buildings ────────────────────────────────────────────
let buildings = [];

function placeBuilding(type){
  const cfg=C.buildings[type];
  if(!cfg)return;

  if(type==='spike_caseoh'&&P.age<100){
    announce('🚫 CaseOh Spike requires Age 100!'); return;
  }

  // Check cost
  for(const[r,a]of Object.entries(cfg.cost)){
    const have=r==='wood'?P.wood:r==='stone'?P.stone:r==='food'?P.food:0;
    if(have<a){ announce(`❌ Need ${a} ${r}!`); return; }
  }

  // Check max count
  if(cfg.maxCount){
    const count=buildings.filter(b=>b.type===type&&!b.dead&&b.owner==='player').length;
    if(count>=cfg.maxCount){ announce(`❌ Max ${cfg.maxCount} ${cfg.name}!`); return; }
  }

  // Deduct
  for(const[r,a]of Object.entries(cfg.cost)){
    if(r==='wood')P.wood-=a;
    else if(r==='stone')P.stone-=a;
    else if(r==='food')P.food-=a;
  }

  // Handle teleporter pairing
  if(type==='teleporter'){
    const existing=buildings.filter(b=>b.type==='teleporter'&&!b.dead&&b.owner==='player');
    if(existing.length>=2){ announce('❌ Already have 2 teleporters!'); deductBuilding(cfg,false); return; }
  }

  const pw=screenToWorld(mouse.x,mouse.y);
  const d=dist(P,pw);
  const range=120;
  let px=pw.x,py=pw.y;
  if(d>range){ const a=angle(P,pw); px=P.x+Math.cos(a)*range; py=P.y+Math.sin(a)*range; }

  buildings.push({
    type, id:Math.random().toString(36).slice(2),
    x:px, y:py,
    hp:cfg.health, maxHp:cfg.health,
    owner:'player',
    angle:angle(P,{x:px,y:py}),
    size:cfg.size||30,
    spawnTimer:150,
    windAngle:0,
    spinAngle:0,
    growTimer:cfg.growTime||0,
    turretCooldown:0,
    boostDir:angle(P,{x:px,y:py}),
    trapped:[],
    // Poison/fire tracking per spike
    isSpike:!!(cfg.damage),
    spikeDmg:cfg.damage||0,
  });

  sfxBuild();
  P.score+=5;
  updateHUD();
}

// ── Enemies ──────────────────────────────────────────────
let enemies = [];
function makeEnemy(type){
  const cfg=C.enemies[type];
  const margin=type==='moostafa'?400:300;
  // Bosses spawn at biome edges
  let ex=rand(margin,WW-margin), ey=rand(margin,WH-margin);
  if(type==='moostafa'){ ex=rand(WW*0.7,WW-200); ey=rand(WH*0.7,WH-200); }
  return {
    type, id:Math.random().toString(36).slice(2),
    x:ex, y:ey, vx:0, vy:0,
    hp:cfg.health, maxHp:cfg.health,
    angle:rand(0,Math.PI*2),
    size:cfg.size, speed:cfg.speed,
    dead:false,
    flashTimer:0,
    attackCooldown:0,
    wanderTimer:0,
    wanderAngle:rand(0,Math.PI*2),
    isCharging:false,
    chargeTimer:0, chargeAngle:0,
    poisonTimer:0,
    burnTimer:0,
    trapped:false,
    boss:!!(cfg.isBoss),
  };
}
function spawnEnemies(){
  enemies=[];
  for(const[type,cfg]of Object.entries(C.enemies)){
    for(let i=0;i<cfg.count;i++) enemies.push(makeEnemy(type));
  }
}

// ── Projectiles ───────────────────────────────────────────
let projectiles=[];
function fireProjectile(from,toX,toY,dmg,speed,range,isPlayer,color,pierce){
  const a=Math.atan2(toY-from.y,toX-from.x);
  projectiles.push({
    x:from.x, y:from.y,
    vx:Math.cos(a)*speed, vy:Math.sin(a)*speed,
    dmg, maxDist:range, distTraveled:0,
    isPlayer, color:color||'#f1c40f',
    size:7, dead:false, pierce:pierce||false,
  });
}

// ── Active slot & inventory ───────────────────────────────
// Slot layout:
// 0=fist/primary, 1=weapon slot, 2=2nd weapon choice,
// 3=spike, 4=wall, 5=windmill, 6=secondary weapon, 7=consumable

const SLOT_TYPES=['primary','weapon2','weapon3','building_spike','building_wall','building_windmill','secondary','consumable'];

function getSlotItem(n){
  if(n===0)return{kind:'weapon',key:P.primaryWeapon};
  if(n===1){
    // Second unlocked weapon
    const w=P.unlockedWeapons.filter(k=>k!=='fist'&&!C.weapons[k]?.isSecondary)[0];
    return w?{kind:'weapon',key:w}:{kind:'empty'};
  }
  if(n===2){
    const ws=P.unlockedWeapons.filter(k=>k!=='fist'&&!C.weapons[k]?.isSecondary);
    const w=ws[1];
    return w?{kind:'weapon',key:w}:{kind:'empty'};
  }
  if(n===3){
    // Spike (best unlocked)
    const spikes=['spike_caseoh','spike_fire','spike_spinning','spike_poison','spike_greater','spike'];
    const s=spikes.find(k=>P.unlockedBuildings.includes(k));
    return s?{kind:'building',key:s}:{kind:'empty'};
  }
  if(n===4){
    const walls=['wall_stone','wall_wood'];
    const w=walls.find(k=>P.unlockedBuildings.includes(k));
    return w?{kind:'building',key:w}:{kind:'empty'};
  }
  if(n===5){
    const mills=['power_mill','windmill_fast','windmill'];
    const m=mills.find(k=>P.unlockedBuildings.includes(k));
    return m?{kind:'building',key:m}:{kind:'empty'};
  }
  if(n===6){
    // Secondary weapon (bow, hammer, shield, etc.)
    const sec=P.unlockedWeapons.filter(k=>C.weapons[k]?.isSecondary)[0];
    return sec?{kind:'weapon',key:sec}:{kind:'empty'};
  }
  if(n===7) return {kind:'consumable',key:'apple'};
  return {kind:'empty'};
}

function setSlot(n){
  P.activeSlot=n;
  document.querySelectorAll('.slot').forEach(s=>s.classList.toggle('active',+s.dataset.slot===n));
}

// ── Actions ───────────────────────────────────────────────
function doAction(){
  if(!P||P.dead||paused)return;
  const item=getSlotItem(P.activeSlot);

  if(item.kind==='building'){
    placeBuilding(item.key); return;
  }
  if(item.kind==='consumable'){
    useConsumable(item.key); return;
  }
  if(item.kind==='weapon'||item.kind==='empty'){
    const wKey=item.key||'fist';
    const wCfg=C.weapons[wKey];
    if(P.attackTimer>0)return;
    const cd=wCfg?wCfg.speed:500;
    P.attackTimer=cd;
    P.attackAnim=1;
    executeAttack(wKey,wCfg);
  }
}

function executeAttack(wKey,wCfg){
  if(wCfg?.isRanged){
    // Fire projectile
    const rsc=wCfg.arrowResource||'wood';
    const cost=wCfg.arrowCost||4;
    if(rsc==='wood'&&P.wood<cost){ announce('❌ Not enough wood!'); return; }
    if(rsc==='stone'&&P.stone<cost){ announce('❌ Not enough stone!'); return; }
    if(rsc==='wood')P.wood-=cost;
    else if(rsc==='stone')P.stone-=cost;

    const spd=wKey==='musket'?18:10;
    const rng=wCfg.range||400;
    const rngM=(P.hatEffects.arrowRange||1);
    const spdM=(P.hatEffects.arrowSpeed||1);
    const dmg=Math.round((wCfg.damage||25)*getDmgMult());

    if(wKey==='repeater_crossbow'){
      for(let i=0;i<4;i++){
        setTimeout(()=>fireProjectile(P,mouse.wx,mouse.wy,dmg,spd*spdM,rng*rngM,true,'#f1c40f',false),i*60);
      }
    } else {
      fireProjectile(P,mouse.wx,mouse.wy,dmg,spd*spdM,rng*rngM,true,wKey==='musket'?'#bdc3c7':'#8B6914',false);
    }
    sfxShoot();
    updateHUD();
    return;
  }

  const dmgBase=wCfg?wCfg.damage:10;
  const range=wCfg?wCfg.range:45;
  const knock=wCfg?wCfg.knockback:3;
  const gather=wCfg?wCfg.gather:1;
  const gBonus=getGatherBonus()+(P.hatEffects.gatherBonus||0);
  const structDmg=wCfg?.structureDmg||dmgBase;

  sfxHit();

  // Hit resources
  for(const res of resources){
    if(res.dead)continue;
    if(dist(P,res)>range+res.size)continue;
    const cfg=C.resources[res.type];
    res.hp--;
    res.wobble=10;
    spawnParticles(res.x,res.y,res.type==='tree'?'#5a8c3c':res.type==='stone'?'#95a5a6':'#f1c40f',5);
    sfxCollect();
    if(res.hp<=0){
      res.dead=true; res.respawnTimer=cfg.respawnTime||15000;
      const g=gather+gBonus;
      if(res.type==='tree') P.wood   +=(cfg.giveWood||10)*g;
      if(res.type==='bush') P.food   +=(cfg.giveBerries||8)*g;
      if(res.type==='stone')P.stone  +=(cfg.giveStone||10)*g;
      if(res.type==='gold') P.gold   +=(cfg.giveGold||5)*g;
      addXP(5); P.score+=3;
    }
  }

  // Hit enemies
  for(const e of enemies){
    if(e.dead||e.trapped)continue;
    if(dist(P,e)>range+e.size)continue;
    const atk=angle(P,e);
    let dmg=Math.round(dmgBase*getDmgMult());
    // Hat: poison on hit
    if(P.hatEffects.poisonOnHit&&!e.isPoisoned){ e.poisonTimer=3000; e.isPoisoned=true; }
    // Hat: burn on hit
    if(P.hatEffects.burnOnHit){ e.burnTimer=2000; e.isBurning=true; }
    hurtEnemy(e,dmg,atk,knock);
  }

  updateHUD();
}

function hurtEnemy(e,dmg,atk,knock){
  e.hp-=dmg;
  e.flashTimer=200;
  popDmg(e.x,e.y,dmg,'dmg');
  spawnParticles(e.x,e.y,'#c0392b',4);

  // Lifesteal
  if(getLifesteal()>0){
    const steal=Math.round(dmg*getLifesteal());
    P.hp=Math.min(P.maxHp,P.hp+steal);
    if(steal>0) popDmg(P.x,P.y,steal,'heal');
  }

  // Knockback
  if(knock){
    e.vx+=Math.cos(atk)*knock;
    e.vy+=Math.sin(atk)*knock;
  }

  if(e.hp<=0) killEnemy(e);
}

function killEnemy(e){
  e.dead=true;
  const cfg=C.enemies[e.type];
  spawnParticles(e.x,e.y,'#c0392b',12);
  addXP(cfg.xpDrop);
  P.food+=cfg.foodDrop||0;
  P.kills++;
  P.score+=cfg.xpDrop*2;

  if(cfg.goldDrop){
    const drop=cfg.goldDrop*(P.hatEffects.goldOnKill?1.5:1);
    P.gold+=drop;
    popDmg(e.x,e.y,Math.round(drop),'gold');
    announce(`💀 ${cfg.name} defeated! +${Math.round(drop)} gold!`);
    sfxBoss();
  } else {
    killFeed(`☠️ You killed a ${cfg.name||e.type}!`);
  }

  setTimeout(()=>{ Object.assign(e,makeEnemy(e.type),{id:e.id}); },cfg.isBoss?30000:8000);
}

function useConsumable(key){
  const cfg=C.consumables[key];
  if(!cfg)return;
  const cost=cfg.cost?.food||0;
  if(P.food<cost){ announce(`❌ Need ${cost} food!`); return; }
  if(cost)P.food-=cost;
  if(cfg.foodRestore) P.food=Math.min(P.maxFood,P.food+cfg.foodRestore);
  if(cfg.healthRestore){
    P.hp=Math.min(P.maxHp,P.hp+cfg.healthRestore);
    popDmg(P.x,P.y,cfg.healthRestore,'heal');
  }
  sfxCollect(); updateHUD();
}

// ── Dash ─────────────────────────────────────────────────
function doDash(){
  if(!P||!P.hatEffects.canDash||P.dashCooldown>0)return;
  const a=Math.atan2(mouse.wy-P.y,mouse.wx-P.x);
  P.vx=Math.cos(a)*18; P.vy=Math.sin(a)*18;
  P.dashCooldown=P.hatEffects.dashCooldown||3000;
  spawnParticles(P.x,P.y,'#3498db',8,5);
}

// ── XP / Age-up ───────────────────────────────────────────
function addXP(amount){
  if(!P||P.dead)return;
  P.xp+=amount;
  popDmg(P.x,P.y-30,amount,'xp');

  const table=C.ages.xpTable;
  while(P.age<C.ages.maxAge){
    const needed=table[Math.min(P.age-1,table.length-1)]||Infinity;
    if(P.xp>=needed){
      P.xp=0; P.age++;
      onAgeUp();
    } else break;
  }
  updateXPBar();
}

function onAgeUp(){
  sfxLevelUp();
  P.maxHp+=5; P.hp=Math.min(P.maxHp,P.hp+15);

  // Age 100 special
  if(P.age>=100 && !P.caseohUnlocked){
    P.caseohUnlocked=true;
    P.unlockedBuildings.push('spike_caseoh');
    announce('🫃 LEGENDARY UNLOCKED: CaseOh Spike!',4000);
    sfxBoss();
    return;
  }

  const unlocks=C.ages.unlocks[P.age];
  if(!unlocks||unlocks.length===0){
    announce(`🎉 Age ${P.age}!`);
    return;
  }

  // Filter out items that require previous unlock
  const available=unlocks.filter(key=>{
    const wc=C.weapons[key],bc=C.buildings[key];
    if(wc?.reqWeapon&&!P.unlockedWeapons.includes(wc.reqWeapon))return false;
    if(bc?.reqBuilding&&!P.unlockedBuildings.includes(bc.reqBuilding))return false;
    return true;
  });
  if(available.length===0){ announce(`🎉 Age ${P.age}!`); return; }

  showAgeUp(available);
}

function showAgeUp(items){
  paused=true;
  document.getElementById('ageup-panel').style.display='flex';
  document.getElementById('ageup-inner').querySelector('h2').textContent=`⬆️ Age ${P.age}!`;
  const list=document.getElementById('ageup-choices');
  list.innerHTML='';

  for(const key of items){
    const wc=C.weapons[key];
    const bc=C.buildings[key];
    const cc=C.consumables[key];
    const cfg=wc||bc||cc;
    if(!cfg)continue;

    const div=document.createElement('div');
    const cat=wc?'weapon':bc?'building':'consumable';
    div.className='ageup-choice '+cat;
    div.innerHTML=`
      <span class="ageup-choice-emoji">${cfg.emoji}</span>
      <div class="ageup-choice-name">${cfg.name}</div>
      <div class="ageup-choice-desc">${cfg.desc||''}</div>
    `;
    div.addEventListener('click',()=>{
      selectAgeUpItem(key,wc?'weapon':bc?'building':'consumable');
      closeAgeUp();
    });
    list.appendChild(div);
  }
}

function selectAgeUpItem(key,cat){
  if(cat==='weapon'){
    if(!P.unlockedWeapons.includes(key))P.unlockedWeapons.push(key);
    P.primaryWeapon=key;
    announce(`✅ Unlocked: ${C.weapons[key].name}`);
  } else if(cat==='building'){
    if(!P.unlockedBuildings.includes(key))P.unlockedBuildings.push(key);
    announce(`✅ Unlocked: ${C.buildings[key].name}`);
  }
  updateToolbar();
  updateHUD();
}

function closeAgeUp(){
  paused=false;
  document.getElementById('ageup-panel').style.display='none';
}

// ── Hat Shop ─────────────────────────────────────────────
let shopTab='hats';

function toggleShop(){
  const s=document.getElementById('hat-shop');
  if(s.style.display==='flex'){ closeShop(); }
  else { openShop(); }
}

function openShop(){
  paused=true;
  const s=document.getElementById('hat-shop');
  s.style.display='flex';
  s.style.alignItems='center';
  s.style.justifyContent='center';
  document.getElementById('shop-gold-display').textContent=Math.floor(P.gold);
  renderShop();
}

function closeShop(){
  paused=false;
  document.getElementById('hat-shop').style.display='none';
}

function renderShop(){
  const grid=document.getElementById('shop-grid');
  grid.innerHTML='';
  const items=shopTab==='hats'?C.hats:C.accessories;
  document.getElementById('shop-gold-display').textContent=Math.floor(P.gold);

  for(const[key,cfg]of Object.entries(items)){
    if(cfg.shame)continue; // shame hat is auto-given
    const div=document.createElement('div');
    const owned=shopTab==='hats'?P.ownedHats.includes(key):P.ownedAccs.includes(key);
    const equipped=shopTab==='hats'?P.equippedHat===key:P.equippedAcc===key;
    const canAfford=owned||P.gold>=cfg.cost;
    const isLeg=cfg.legendary;

    div.className='shop-item'+(equipped?' equipped':owned?' owned':canAfford?'':' cant-afford');
    if(isLeg)div.style.background='linear-gradient(160deg,rgba(255,107,53,0.1),rgba(241,196,15,0.1))';

    if(equipped){
      const b=document.createElement('span');
      b.className='shop-badge equipped'; b.textContent='ON';
      div.appendChild(b);
    } else if(owned){
      const b=document.createElement('span');
      b.className='shop-badge owned'; b.textContent='OWNED';
      div.appendChild(b);
    } else if(isLeg){
      const b=document.createElement('span');
      b.className='shop-badge legendary'; b.textContent='LEGEND';
      div.appendChild(b);
    }

        const _costCls = owned ? 'shop-item-cost owned' : 'shop-item-cost';
    const _costLbl = owned ? (equipped ? 'Equipped' : 'Equip') : ('Gold ' + cfg.cost);
    div.innerHTML += '<span class="shop-item-emoji">' + cfg.emoji + '</span>'
      + '<div class="shop-item-name">' + cfg.name + '</div>'
      + '<div class="shop-item-desc">' + (cfg.desc || '') + '</div>'
      + '<div class="' + _costCls + '">' + _costLbl + '</div>';
    div.addEventListener('click',()=>{
      if(owned){
        // Equip/unequip
        if(shopTab==='hats'){
          P.equippedHat=equipped?'none':key;
        } else {
          P.equippedAcc=equipped?'none':key;
        }
      } else {
        if(!canAfford){ announce('❌ Not enough gold!'); return; }
        P.gold-=cfg.cost;
        if(shopTab==='hats'){ P.ownedHats.push(key); P.equippedHat=key; }
        else { P.ownedAccs.push(key); P.equippedAcc=key; }
        announce(`✅ Bought ${cfg.name}!`);
      }
      applyHatEffects();
      renderShop();
      updateHUD();
    });

    grid.appendChild(div);
  }
}

function applyHatEffects(){
  P.hatEffects={};
  const hat=C.hats[P.equippedHat]||{};
  const acc=C.accessories[P.equippedAcc]||{};

  // Merge hat + accessory effects
  for(const[k,v]of Object.entries(hat)){
    if(k==='cost'||k==='name'||k==='emoji'||k==='desc'||k==='free')continue;
    if(typeof v==='number') P.hatEffects[k]=(P.hatEffects[k]||0)+v;
    else P.hatEffects[k]=v;
  }
  for(const[k,v]of Object.entries(acc)){
    if(k==='cost'||k==='name'||k==='emoji'||k==='desc'||k==='free')continue;
    if(k==='regenRate') P.hatEffects[k]=(P.hatEffects[k]||0)+v;
    else if(k==='speedMult') P.hatEffects[k]=(P.hatEffects[k]||1)*v;
    else if(k==='damageBonus') P.hatEffects[k]=(P.hatEffects[k]||1)*v;
    else if(k==='meleeDmgMult') P.hatEffects[k]=v;
    else P.hatEffects[k]=v;
  }

  // Update equip display
  document.getElementById('hat-display').textContent=C.hats[P.equippedHat]?.emoji||'❌';
  document.getElementById('acc-display').textContent=C.accessories[P.equippedAcc]?.emoji||'❌';
}

document.querySelectorAll('.shop-tab').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.shop-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    shopTab=btn.dataset.tab;
    renderShop();
  });
});
document.getElementById('shop-close').addEventListener('click',closeShop);
document.getElementById('hat-display').addEventListener('click',openShop);
document.getElementById('acc-display').addEventListener('click',openShop);

// ── Toolbar Update ────────────────────────────────────────
function updateToolbar(){
  if(!P)return;
  const slots=[
    {emoji:'✊',name:'Fist'},
    ...[1,2].map(n=>{
      const it=getSlotItem(n);
      if(it.kind==='empty')return{emoji:'—',name:'Empty'};
      const cfg=C.weapons[it.key];
      return{emoji:cfg?.emoji||'?',name:cfg?.name||it.key};
    }),
    ...[3,4,5].map(n=>{
      const it=getSlotItem(n);
      if(it.kind==='empty')return{emoji:'—',name:'Empty'};
      const cfg=C.buildings[it.key];
      return{emoji:cfg?.emoji||'?',name:cfg?.name||it.key};
    }),
    (()=>{
      const it=getSlotItem(6);
      if(it.kind==='empty')return{emoji:'—',name:'2nd Wpn'};
      const cfg=C.weapons[it.key];
      return{emoji:cfg?.emoji||'?',name:cfg?.name||it.key};
    })(),
    {emoji:'🍎',name:'Apple'},
  ];

  [0,1,2,3,4,5,6,7].forEach(i=>{
    const e=document.getElementById(`s${i}e`);
    const n=document.getElementById(`s${i}n`);
    if(e&&slots[i])e.textContent=slots[i].emoji;
    if(n&&slots[i])n.textContent=slots[i].name;
  });
}

// ── HUD ───────────────────────────────────────────────────
function updateHUD(){
  if(!P)return;
  const hpPct=clamp(P.hp/P.maxHp*100,0,100);
  document.getElementById('hp-fill').style.width=hpPct+'%';
  document.getElementById('hp-fill').style.background=hpPct>40
    ?'linear-gradient(90deg,#2ecc71,#27ae60)':'linear-gradient(90deg,#e74c3c,#c0392b)';
  document.getElementById('hp-num').textContent=Math.ceil(P.hp);

  const fpPct=clamp(P.food/P.maxFood*100,0,100);
  document.getElementById('food-fill').style.width=fpPct+'%';
  document.getElementById('food-num').textContent=Math.ceil(P.food);

  document.getElementById('r-wood').textContent=Math.floor(P.wood);
  document.getElementById('r-stone').textContent=Math.floor(P.stone);
  document.getElementById('r-food').textContent=Math.floor(P.food);
  document.getElementById('r-gold').textContent=Math.floor(P.gold);
}

function updateXPBar(){
  if(!P)return;
  const table=C.ages.xpTable;
  const needed=table[Math.min(P.age-1,table.length-1)]||9999;
  const pct=Math.min(100,P.xp/needed*100);
  document.getElementById('xp-bar').style.width=pct+'%';
  document.getElementById('age-badge').textContent=`Age ${P.age}  •  ${Math.floor(P.xp)}/${needed} XP`;
}

// ── Leaderboard ───────────────────────────────────────────
function updateLB(){
  const rows=[
    {name:P.name,score:Math.floor(P.gold),you:true},
    {name:'FarmKing99',score:Math.floor(P.score*0.85+80),you:false},
    {name:'WoodCutter',score:Math.floor(P.score*0.65+35),you:false},
    {name:'StoneGod',score:Math.floor(P.score*0.5+20),you:false},
    {name:'SpeedRunner',score:Math.floor(P.score*0.3+10),you:false},
  ].sort((a,b)=>b.score-a.score).slice(0,C.ui.leaderboardSize);

  const lb=document.getElementById('lb-list');
  lb.innerHTML=rows.map((r,i)=>`
    <div class="lb-row ${r.you?'you':''}">
      <span>#${i+1} ${r.name}${r.you?' (you)':''}</span>
      <span>${r.score}</span>
    </div>
  `).join('');
}

// ── Chat ─────────────────────────────────────────────────
function openChat(){
  const w=document.getElementById('chat-input-wrap');
  w.classList.add('show');
  w.style.pointerEvents='all';
  document.getElementById('chat-input').focus();
}
function closeChat(){
  document.getElementById('chat-input-wrap').classList.remove('show');
}
function sendChat(t){
  if(!t.trim())return;
  const m=document.getElementById('chat-msgs');
  const el=document.createElement('div');
  el.className='chat-msg';
  el.innerHTML=`<b>${P.name}:</b> ${t.replace(/</g,'&lt;')}`;
  m.appendChild(el);
  setTimeout(()=>el.remove(),8000);
  while(m.children.length>6)m.removeChild(m.firstChild);
}
document.getElementById('chat-send').addEventListener('click',()=>{
  const i=document.getElementById('chat-input');
  sendChat(i.value); i.value=''; closeChat();
});
document.getElementById('chat-input').addEventListener('keydown',e=>{
  if(e.code==='Enter'){sendChat(e.target.value);e.target.value='';closeChat();}
  if(e.code==='Escape')closeChat();
  e.stopPropagation();
});

// ── Player Update ─────────────────────────────────────────
function updatePlayer(dt){
  if(!P||P.dead)return;

  // Angle to mouse
  P.angle=Math.atan2(mouse.wy-P.y,mouse.wx-P.x);

  // Movement
  let dx=0,dy=0;
  if(keys['KeyW']||keys['ArrowUp'])   dy-=1;
  if(keys['KeyS']||keys['ArrowDown']) dy+=1;
  if(keys['KeyA']||keys['ArrowLeft']) dx-=1;
  if(keys['KeyD']||keys['ArrowRight'])dx+=1;

  if(dx||dy){ const l=Math.hypot(dx,dy); dx/=l; dy/=l; }

  // Bull hat charge dir
  if(P.hatEffects.chargeEnabled&&keys['Space']){
    P.vx=dx*9; P.vy=dy*9;
    P.hp=Math.max(1,P.hp-P.hatEffects.healthDrain*dt/1000);
  } else {
    const spd=getSpeed();
    P.vx=lerp(P.vx,dx*spd,0.25);
    P.vy=lerp(P.vy,dy*spd,0.25);
  }

  P.x=clamp(P.x+P.vx,P.size,WW-P.size);
  P.y=clamp(P.y+P.vy,P.size,WH-P.size);

  // River effect
  if(C.world.riverEnabled){
    const rx=WW*C.world.riverX;
    if(Math.abs(P.x-rx)<C.world.riverWidth/2){
      const resist=1-(P.hatEffects.riverResist||0);
      P.y+=C.world.riverCurrentSpeed*resist;
    }
  }

  // Camera
  cam.x=lerp(cam.x,P.x,0.1);
  cam.y=lerp(cam.y,P.y,0.1);

  // Timers
  P.attackTimer=Math.max(0,P.attackTimer-dt);
  P.dashCooldown=Math.max(0,P.dashCooldown-dt);
  if(P.attackAnim>0)P.attackAnim-=0.06;
  P.flashTimer=Math.max(0,P.flashTimer-dt);

  // Food decay
  P.food=Math.max(0,P.food-C.player.foodDecayRate);

  // HP regen
  if(P.food>50&&P.hp<P.maxHp) P.hp=Math.min(P.maxHp,P.hp+getRegenRate());

  // Hat regen
  if(P.hatEffects.regenRate) P.hp=Math.min(P.maxHp,P.hp+P.hatEffects.regenRate/60);

  // Campfire / Healing pad regen
  for(const b of buildings){
    if(b.dead)continue;
    if(b.type==='campfire'&&dist(P,b)<C.buildings.campfire.healRadius)
      P.hp=Math.min(P.maxHp,P.hp+C.buildings.campfire.healRate);
    if(b.type==='healing_pad'&&dist(P,b)<C.buildings.healing_pad.healRadius)
      P.hp=Math.min(P.maxHp,P.hp+C.buildings.healing_pad.healRate);
  }

  // Poison
  if(P.isPoisoned){
    P.poisonTimer-=dt;
    P.hp-=5*dt/1000;
    if(P.poisonTimer<=0){P.isPoisoned=false;document.getElementById('poison-overlay').style.display='none';}
    else document.getElementById('poison-overlay').style.display='block';
  }

  // Cactus touch
  for(const res of resources){
    if(res.dead||res.type!=='cactus')continue;
    if(dist(P,res)<P.size+res.size){
      P.hp-=C.resources.cactus.touchDamage*dt/1000;
      P.flashTimer=200;
    }
  }

  // Windmill gold
  for(const b of buildings){
    if(b.dead||b.owner!=='player')continue;
    const bc=C.buildings[b.type];
    if(bc?.passiveGold) P.gold+=bc.passiveGold*dt/1000;
  }

  // Death
  if(P.hp<=0){ P.hp=0; doPlayerDeath(); }

  // Auto-attack
  if(mouse.down&&P.attackTimer<=0) doAction();

  // Turret hat
  if(P.hatEffects.isTurret){
    P.turretHatCooldown-=dt;
    if(P.turretHatCooldown<=0){
      P.turretHatCooldown=P.hatEffects.turretRate||1200;
      // Find nearest enemy
      let nearest=null,nd=9999;
      for(const e of enemies){
        if(e.dead)continue;
        const d2=dist(P,e);
        if(d2<nd&&d2<400){nd=d2;nearest=e;}
      }
      if(nearest){
        fireProjectile(P,nearest.x,nearest.y,(P.hatEffects.turretDmg||25)*getDmgMult(),12,420,true,'#e74c3c',false);
        sfxShoot();
      }
    }
  }

  // Score
  P.timeSurvived+=dt;
  P.score+=dt/1000;
}

// ── Enemy Update ──────────────────────────────────────────
function updateEnemies(dt){
  for(const e of enemies){
    if(e.dead)continue;
    const cfg=C.enemies[e.type];
    if(!cfg)continue;

    e.flashTimer=Math.max(0,e.flashTimer-dt);
    e.attackCooldown=Math.max(0,e.attackCooldown-dt);

    // Poison tick
    if(e.isPoisoned){ e.poisonTimer-=dt; e.hp-=(C.buildings.spike_poison?.poisonDps||5)*dt/1000; if(e.poisonTimer<=0)e.isPoisoned=false; }
    // Burn tick
    if(e.isBurning){ e.burnTimer-=dt; e.hp-=8*dt/1000; if(e.burnTimer<=0)e.isBurning=false; }

    // Trapped by pit
    if(e.trapped){
      // Occasionally try to escape
      e.trapTimer=(e.trapTimer||3000)-dt;
      if(e.trapTimer<=0){ e.trapped=false; }
      continue;
    }

    // Spike damage to enemies
    for(const b of buildings){
      if(b.dead||!b.isSpike||b.spawnTimer>0)continue;
      if(dist(e,b)<b.size+e.size){
        const bc=C.buildings[b.type];
        if(bc?.poison&&!e.isPoisoned){ e.isPoisoned=true; e.poisonTimer=bc.poisonDuration||5000; }
        if(bc?.burn&&!e.isBurning){ e.isBurning=true; e.burnTimer=bc.burnDuration||2000; }
        e.hp-=b.spikeDmg*dt/60;
        e.flashTimer=100;
        if(e.hp<=0){killEnemy(e);break;}
      }
    }
    if(e.dead)continue;

    // Bear hat: animals passive
    if(P.hatEffects.makesAnimalsPassive&&!cfg.isBoss) continue;

    const dp=dist(e,P);

    if(cfg.aggressive){
      if(e.type==='bull'&&!e.isCharging&&dp<(cfg.chargeRange||300)&&dp>(cfg.attackRange||45)){
        e.isCharging=true; e.chargeTimer=1200; e.chargeAngle=angle(e,P);
      }
      if(e.isCharging){
        e.chargeTimer-=dt;
        const spd=cfg.chargeSpeed||cfg.speed;
        e.vx=Math.cos(e.chargeAngle)*spd; e.vy=Math.sin(e.chargeAngle)*spd;
        if(e.chargeTimer<=0)e.isCharging=false;
      } else if(dp<(cfg.detectionRange||250)){
        const a=angle(e,P);
        e.vx=lerp(e.vx,Math.cos(a)*cfg.speed,0.12);
        e.vy=lerp(e.vy,Math.sin(a)*cfg.speed,0.12);
        e.angle=a;
      } else { wander(e,dt,cfg.speed*0.4); }

      // Attack player
      if(dp<(cfg.attackRange||35)&&e.attackCooldown<=0){
        let dmg=cfg.damage*(1-getDmgReduction());
        // Spike gear: reflect
        if(P.hatEffects.reflectDmg) hurtEnemy(e,Math.round(cfg.damage*P.hatEffects.reflectDmg),angle(P,e),0);
        hurtPlayer(dmg);
        e.attackCooldown=cfg.attackCooldown||1000;
      }

      // Boss: also breaks walls
      if(cfg.canBreakWalls){
        for(const b of buildings){
          if(b.dead)continue;
          if(dist(e,b)<b.size+e.size){
            b.hp-=50*dt/1000;
            if(b.hp<=0)b.dead=true;
          }
        }
      }

    } else {
      // Passive — flee
      if(dp<(cfg.fleeRange||100)){
        const a=angle(P,e);
        e.vx=lerp(e.vx,Math.cos(a)*cfg.speed*1.4,0.18);
        e.vy=lerp(e.vy,Math.sin(a)*cfg.speed*1.4,0.18);
        e.angle=a;
      } else { wander(e,dt,cfg.speed*0.35); }
    }

    e.x=clamp(e.x+e.vx,e.size,WW-e.size);
    e.y=clamp(e.y+e.vy,e.size,WH-e.size);
    e.vx*=0.85; e.vy*=0.85;

    // Pit trap trigger
    for(const b of buildings){
      if(b.dead||b.type!=='pit_trap')continue;
      if(dist(e,b)<b.size+e.size){
        e.trapped=true; e.trapTimer=3000;
        e.vx=0; e.vy=0;
      }
    }

    if(e.hp<=0)killEnemy(e);
  }
}

function wander(e,dt,speed){
  e.wanderTimer-=dt;
  if(e.wanderTimer<=0){ e.wanderTimer=rand(2000,4000); e.wanderAngle=rand(0,Math.PI*2); }
  e.vx=lerp(e.vx,Math.cos(e.wanderAngle)*speed,0.04);
  e.vy=lerp(e.vy,Math.sin(e.wanderAngle)*speed,0.04);
}

function hurtPlayer(dmg){
  if(P.dead)return;
  P.hp-=dmg;
  P.flashTimer=200;
  popDmg(P.x,P.y,Math.round(dmg),'dmg');
  spawnParticles(P.x,P.y,'#c0392b',3);
  sfxHit();
  const vig=document.getElementById('dmg-vignette');
  vig.style.opacity='1';
  setTimeout(()=>vig.style.opacity='0',250);
}

function doPlayerDeath(){
  P.dead=true;
  sfxDeath();
  document.getElementById('death-stats').innerHTML=`
    <b>Score:</b> ${Math.floor(P.score)}<br>
    <b>Age:</b> ${P.age}<br>
    <b>Kills:</b> ${P.kills}<br>
    <b>Gold:</b> ${Math.floor(P.gold)}<br>
    <b>Time:</b> ${Math.floor(P.timeSurvived/1000)}s
  `;
  document.getElementById('death-screen').style.display='flex';
}

// ── Projectile Update ─────────────────────────────────────
function updateProjectiles(dt){
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i];
    if(p.dead){projectiles.splice(i,1);continue;}
    p.x+=p.vx; p.y+=p.vy;
    p.distTraveled+=Math.hypot(p.vx,p.vy);
    if(p.distTraveled>p.maxDist){p.dead=true;continue;}

    if(p.isPlayer){
      for(const e of enemies){
        if(e.dead)continue;
        if(dist(p,e)<e.size+p.size){
          const dmg=Math.round(p.dmg*getDmgMult());
          hurtEnemy(e,dmg,angle(p,e),3);
          if(!p.pierce)p.dead=true;
          spawnParticles(p.x,p.y,'#f39c12',5);
          break;
        }
      }
      // Also hit buildings? (turret bullets hit player)
    } else {
      if(dist(p,P)<P.size+p.size){
        hurtPlayer(p.dmg);
        p.dead=true;
      }
    }
  }
}

// ── Buildings Update ──────────────────────────────────────
function updateBuildings(dt){
  for(const b of buildings){
    if(b.dead)continue;
    if(b.spawnTimer>0){b.spawnTimer-=dt;continue;}

    b.windAngle+=0.025;
    b.spinAngle+=0.05;

    // Turret
    if(b.type==='turret'){
      b.turretCooldown-=dt;
      if(b.turretCooldown<=0){
        b.turretCooldown=C.buildings.turret.turretRate||2000;
        // Find enemy in range
        let nearest=null,nd=9999;
        for(const e of enemies){
          if(e.dead)continue;
          const d2=dist(b,e);
          if(d2<(C.buildings.turret.turretRange||350)&&d2<nd){nd=d2;nearest=e;}
        }
        if(nearest){
          fireProjectile(b,nearest.x,nearest.y,C.buildings.turret.turretDmg||25,12,400,true,'#e74c3c',false);
          sfxShoot();
        }
      }
    }

    // Sapling growth
    if(b.type==='sapling'){
      b.growTimer-=dt;
      if(b.growTimer<=0){
        b.dead=true;
        resources.push({type:'tree',id:Math.random().toString(36).slice(2),x:b.x,y:b.y,size:22,hp:5,maxHp:5,dead:false,respawnTimer:0,wobble:0,angle:0});
      }
    }

    // Mine trigger
    if(b.type==='mine'&&!b.triggered){
      for(const e of enemies){
        if(e.dead)continue;
        if(dist(b,e)<b.size+e.size){
          b.triggered=true;
          b.dead=true;
          spawnParticles(b.x,b.y,'#e74c3c',20,5);
          // AOE
          for(const e2 of enemies){
            if(dist(b,e2)<80) hurtEnemy(e2,(C.buildings.mine?.mineDmg||100),angle(b,e2),10);
          }
          break;
        }
      }
    }
  }
}

// ── Resources Update ──────────────────────────────────────
function updateResources(dt){
  for(const res of resources){
    if(res.dead){
      res.respawnTimer-=dt;
      if(res.respawnTimer<=0) Object.assign(res,makeRes(res.type),{id:res.id});
    }
    if(res.wobble>0) res.wobble*=0.8;
  }
}

// ── Particles Update ──────────────────────────────────────
function updateParticles(){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx; p.y+=p.vy;
    p.vx*=0.88; p.vy*=0.88;
    p.life-=p.decay;
    if(p.life<=0) particles.splice(i,1);
  }
}

// ── DRAW ─────────────────────────────────────────────────
function drawWorld(){
  // Base
  ctx.fillStyle=C.world.backgroundColor;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Biomes
  if(C.world.biomes){
    // Snow (top-left)
    const sg=ctx.createRadialGradient(
      worldToScreen(WW*0.12,WH*0.12).x,worldToScreen(WW*0.12,WH*0.12).y,0,
      worldToScreen(WW*0.12,WH*0.12).x,worldToScreen(WW*0.12,WH*0.12).y,700
    );
    sg.addColorStop(0,'rgba(210,235,255,0.5)');sg.addColorStop(1,'rgba(210,235,255,0)');
    ctx.fillStyle=sg; ctx.fillRect(0,0,canvas.width,canvas.height);

    // Desert (bottom-right)
    const dg=ctx.createRadialGradient(
      worldToScreen(WW*0.82,WH*0.82).x,worldToScreen(WW*0.82,WH*0.82).y,0,
      worldToScreen(WW*0.82,WH*0.82).x,worldToScreen(WW*0.82,WH*0.82).y,800
    );
    dg.addColorStop(0,'rgba(218,177,80,0.5)');dg.addColorStop(1,'rgba(218,177,80,0)');
    ctx.fillStyle=dg; ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  // Grid
  ctx.strokeStyle=C.world.gridColor;ctx.lineWidth=0.5;ctx.globalAlpha=0.28;
  const gs=C.world.gridSize;
  const ox=((-(cam.x-canvas.width/2)%gs)+gs)%gs;
  const oy=((-(cam.y-canvas.height/2)%gs)+gs)%gs;
  for(let x=ox-gs;x<canvas.width+gs;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}
  for(let y=oy-gs;y<canvas.height+gs;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}
  ctx.globalAlpha=1;

  // River
  if(C.world.riverEnabled){
    const rs=worldToScreen(WW*C.world.riverX-C.world.riverWidth/2,0);
    const animOff=(Date.now()*0.001)*20%canvas.height;
    ctx.fillStyle=C.world.riverColor;
    ctx.fillRect(rs.x,0,C.world.riverWidth,canvas.height);
    // Flow lines
    ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=2;
    for(let y=-canvas.height+animOff;y<canvas.height;y+=80){
      ctx.beginPath();ctx.moveTo(rs.x+10,y);ctx.lineTo(rs.x+10,y+50);ctx.stroke();
      ctx.beginPath();ctx.moveTo(rs.x+C.world.riverWidth-10,y+30);ctx.lineTo(rs.x+C.world.riverWidth-10,y+80);ctx.stroke();
    }
  }

  // Border
  const b0=worldToScreen(0,0);
  ctx.strokeStyle=C.world.borderColor;ctx.lineWidth=6;
  ctx.strokeRect(b0.x,b0.y,WW,WH);
}

function drawResources(){
  for(const res of resources){
    if(res.dead)continue;
    const s=worldToScreen(res.x,res.y);
    if(s.x<-60||s.x>canvas.width+60||s.y<-60||s.y>canvas.height+60)continue;
    ctx.save();
    ctx.translate(s.x,s.y);
    if(res.wobble>0.1)ctx.rotate(Math.sin(Date.now()*0.05)*res.wobble*0.018);

    ctx.shadowBlur=7;ctx.shadowColor='rgba(0,0,0,0.3)';
    if(res.type==='tree'){
      ctx.fillStyle='#6B4226';ctx.fillRect(-4,0,8,res.size*0.55);
      ctx.fillStyle='#3d6b28';ctx.beginPath();ctx.arc(0,-res.size*0.25,res.size*0.9,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5a8c3c';ctx.beginPath();ctx.arc(-res.size*0.25,-res.size*0.5,res.size*0.7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#4aaa2a';ctx.beginPath();ctx.arc(res.size*0.2,-res.size*0.4,res.size*0.65,0,Math.PI*2);ctx.fill();
    } else if(res.type==='bush'){
      ctx.fillStyle='#1d8348';
      for(const[ox2,oy2,r2]of[[-5,3,res.size*0.8],[0,-4,res.size],[5,2,res.size*0.75]]){
        ctx.beginPath();ctx.arc(ox2,oy2,r2,0,Math.PI*2);ctx.fill();
      }
      ctx.fillStyle='#e74c3c';
      for(let i=0;i<5;i++){const a=(i/5)*Math.PI*2;ctx.beginPath();ctx.arc(Math.cos(a)*res.size*0.6,Math.sin(a)*res.size*0.6-3,3.5,0,Math.PI*2);ctx.fill();}
    } else if(res.type==='stone'){
      ctx.fillStyle='#7f8c8d';ctx.beginPath();ctx.arc(0,3,res.size,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#a9b4b4';ctx.beginPath();ctx.arc(-2,-1,res.size*0.88,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.2)';ctx.beginPath();ctx.arc(-res.size*0.3,-res.size*0.3,res.size*0.28,0,Math.PI*2);ctx.fill();
    } else if(res.type==='gold'){
      ctx.fillStyle='#d4ac0d';ctx.beginPath();ctx.arc(0,2,res.size,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#f1c40f';ctx.shadowColor='rgba(255,200,0,0.6)';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(-1,-1,res.size*0.88,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,0.3)';ctx.beginPath();ctx.arc(-res.size*0.28,-res.size*0.28,res.size*0.32,0,Math.PI*2);ctx.fill();
    } else if(res.type==='cactus'){
      ctx.fillStyle='#196f3d';ctx.fillRect(-6,-res.size,12,res.size*1.5);
      ctx.fillRect(-18,-res.size*0.3,12,10);ctx.fillRect(6,-res.size*0.5,12,10);
      ctx.fillStyle='#186a3b';ctx.shadowBlur=4;
      ctx.fillRect(-4,-res.size*1.1,8,res.size*1.6);
      // Spines
      ctx.strokeStyle='#117a65';ctx.lineWidth=1.5;
      for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(-6,i*10);ctx.lineTo(-12,i*10-4);ctx.stroke();}
    }
    ctx.shadowBlur=0;

    if(res.hp<res.maxHp){
      const pct=res.hp/res.maxHp;
      ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(-res.size,res.size+5,res.size*2,5);
      ctx.fillStyle=pct>0.5?'#2ecc71':'#e74c3c';ctx.fillRect(-res.size,res.size+5,res.size*2*pct,5);
    }
    ctx.restore();
  }
}

function drawBuildings(){
  for(const b of buildings){
    if(b.dead)continue;
    const s=worldToScreen(b.x,b.y);
    if(s.x<-120||s.x>canvas.width+120||s.y<-120||s.y>canvas.height+120)continue;

    ctx.save();ctx.translate(s.x,s.y);
    ctx.shadowBlur=6;ctx.shadowColor='rgba(0,0,0,0.35)';

    if(b.type==='wall_wood'){
      ctx.rotate(b.angle);ctx.fillStyle='#8B6914';
      ctx.fillRect(-b.size/2,-b.size*0.38,b.size,b.size*0.76);
      ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fillRect(-b.size/2,-b.size*0.38,b.size,b.size*0.2);
    } else if(b.type==='wall_stone'){
      ctx.rotate(b.angle);ctx.fillStyle='#95a5a6';
      ctx.fillRect(-b.size/2,-b.size*0.4,b.size,b.size*0.8);
      ctx.fillStyle='#7f8c8d';
      ctx.fillRect(-b.size/2,-b.size*0.4,b.size/2,b.size*0.8);
      ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(-b.size/2,-b.size*0.4,b.size,b.size*0.2);
    } else if(b.type.startsWith('spike')){
      drawSpike(b,ctx,s);
    } else if(b.type==='windmill'||b.type==='windmill_fast'||b.type==='power_mill'){
      const col=b.type==='power_mill'?'#9b59b6':b.type==='windmill_fast'?'#2980b9':'#3498db';
      ctx.fillStyle='#6B4226';ctx.fillRect(-8,-b.size,16,b.size*2);
      ctx.save();ctx.rotate(b.windAngle);
      ctx.fillStyle=col;
      for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.fillRect(-5,-b.size*1.2,10,b.size);ctx.restore();}
      ctx.restore();
      ctx.fillStyle='#f1c40f';ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();
    } else if(b.type==='campfire'){
      for(let i=0;i<3;i++){const a=(i/3)*Math.PI*2;ctx.fillStyle='#5a3a1a';ctx.fillRect(Math.cos(a)*b.size*0.7-4,Math.sin(a)*b.size*0.7-8,8,16);}
      const fl=0.8+Math.sin(Date.now()*0.012)*0.2;
      ctx.fillStyle=`rgba(255,${Math.floor(100+fl*80)},0,${fl})`;ctx.shadowColor='#e74c3c';ctx.shadowBlur=20;
      ctx.beginPath();ctx.arc(0,0,b.size*fl,0,Math.PI*2);ctx.fill();
    } else if(b.type==='pit_trap'){
      // Invisible — only shown to owner
      ctx.globalAlpha=0.4;
      ctx.fillStyle='#2c3e50';ctx.beginPath();ctx.arc(0,0,b.size,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#e74c3c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,b.size,0,Math.PI*2);ctx.stroke();
    } else if(b.type==='boost_pad'){
      ctx.rotate(b.boostDir);ctx.fillStyle='#3498db';
      ctx.fillRect(-b.size,-b.size*0.4,b.size*2,b.size*0.8);
      ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('➡️',0,0);
    } else if(b.type==='mine'){
      ctx.globalAlpha=0.5;ctx.fillStyle='#2c3e50';
      ctx.beginPath();ctx.arc(0,0,b.size,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#e74c3c';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(0,0,b.size,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);
    } else if(b.type==='turret'){
      ctx.fillStyle='#5d6d7e';ctx.beginPath();ctx.arc(0,0,b.size,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#34495e';ctx.fillRect(0,-6,b.size+10,12);
      ctx.fillStyle='#2c3e50';ctx.fillRect(b.size+2,-4,8,8);
    } else if(b.type==='teleporter'){
      ctx.fillStyle='#9b59b6';ctx.shadowColor='#9b59b6';ctx.shadowBlur=15;
      ctx.beginPath();ctx.arc(0,0,b.size,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='18px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('🌀',0,0);
    } else if(b.type==='sapling'){
      const g=(1-b.growTimer/C.buildings.sapling.growTime);
      ctx.fillStyle='#2ecc71';ctx.beginPath();ctx.arc(0,0,b.size*(0.4+g*0.6),0,Math.PI*2);ctx.fill();
    } else if(b.type==='spawn_pad'){
      ctx.fillStyle='#e67e22';ctx.beginPath();ctx.arc(0,0,b.size,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='18px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('🏠',0,0);
    } else if(b.type==='healing_pad'){
      ctx.fillStyle='#2ecc71';ctx.shadowColor='#2ecc71';ctx.shadowBlur=10;
      ctx.beginPath();ctx.arc(0,0,b.size,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='18px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('💚',0,0);
    }

    ctx.globalAlpha=1;ctx.shadowBlur=0;

    // HP bar
    if(b.hp<b.maxHp){
      const pct=b.hp/b.maxHp;
      ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(-b.size,b.size+6,b.size*2,5);
      ctx.fillStyle=pct>0.5?'#2ecc71':'#e74c3c';ctx.fillRect(-b.size,b.size+6,b.size*2*pct,5);
    }

    ctx.restore();
  }
}

function drawSpike(b,ctx,s){
  const type=b.type;
  const sz=b.size;

  if(type==='spike_caseoh'){
    // LEGENDARY CASEOH SPIKE — draw as big emoji + glow
    ctx.shadowColor='#ff6b35';ctx.shadowBlur=30;
    ctx.font=`${sz*2.2}px serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('🫃',0,0);
    // Crown on top
    ctx.font=`${sz*0.9}px serif`;
    ctx.fillText('💀',-sz,-sz);
    // Aura ring
    ctx.strokeStyle='rgba(255,107,53,0.5)';ctx.lineWidth=3;
    const pulse=0.8+Math.sin(Date.now()*0.005)*0.2;
    ctx.beginPath();ctx.arc(0,0,sz*1.8*pulse,0,Math.PI*2);ctx.stroke();
    return;
  }

  if(type==='spike_spinning'){
    ctx.rotate(b.spinAngle);
  }

  const colors={
    spike:'#95a5a6',
    spike_greater:'#e74c3c',
    spike_poison:'#8e44ad',
    spike_spinning:'#e67e22',
    spike_fire:'#e74c3c',
  };

  ctx.fillStyle=colors[type]||'#7f8c8d';
  ctx.shadowColor=type==='spike_poison'?'rgba(142,68,173,0.6)':type==='spike_fire'?'rgba(231,76,60,0.6)':'rgba(0,0,0,0.3)';

  // Draw spike triangles
  const points=type==='spike_spinning'?6:4;
  for(let i=0;i<points;i++){
    const a=(i/points)*Math.PI*2;
    ctx.save();ctx.rotate(a);
    ctx.beginPath();ctx.moveTo(0,-sz*1.25);ctx.lineTo(sz*0.4,sz*0.4);ctx.lineTo(-sz*0.4,sz*0.4);ctx.closePath();ctx.fill();
    ctx.restore();
  }

  // Fire effect
  if(type==='spike_fire'){
    const fl=0.7+Math.sin(Date.now()*0.015)*0.3;
    ctx.fillStyle=`rgba(255,${Math.floor(80+fl*100)},0,${fl*0.7})`;
    ctx.beginPath();ctx.arc(0,0,sz*fl,0,Math.PI*2);ctx.fill();
  }
  // Poison drip
  if(type==='spike_poison'){
    ctx.fillStyle='rgba(142,68,173,0.5)';
    ctx.beginPath();ctx.arc(0,0,sz*0.5,0,Math.PI*2);ctx.fill();
  }
}

function drawEnemies(){
  for(const e of enemies){
    if(e.dead)continue;
    const s=worldToScreen(e.x,e.y);
    if(s.x<-80||s.x>canvas.width+80||s.y<-80||s.y>canvas.height+80)continue;
    const cfg=C.enemies[e.type];
    if(!cfg)continue;

    ctx.save();ctx.translate(s.x,s.y);
    const fl=e.flashTimer>0&&(Math.sin(Date.now()*0.05)>0);
    ctx.globalAlpha=fl?0.5:1;

    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.18)';ctx.beginPath();
    ctx.ellipse(0,e.size*0.55,e.size*0.85,e.size*0.28,0,0,Math.PI*2);ctx.fill();

    // Body
    ctx.fillStyle=e.isBurning?'#e74c3c':e.isPoisoned?'#8e44ad':fl?'#fff':cfg.color;
    ctx.shadowBlur=cfg.isBoss?15:7;ctx.shadowColor=cfg.isBoss?'#e74c3c':'rgba(0,0,0,0.4)';
    ctx.beginPath();ctx.arc(0,0,e.size,0,Math.PI*2);ctx.fill();

    // Emoji
    ctx.shadowBlur=0;ctx.globalAlpha=1;
    ctx.font=`${e.size*1.5}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(cfg.emoji,0,0);

    // HP bar
    const pct=e.hp/cfg.health;
    ctx.globalAlpha=0.9;
    ctx.fillStyle='rgba(0,0,0,0.45)';ctx.fillRect(-e.size,-e.size-10,e.size*2,6);
    ctx.fillStyle=pct>0.5?'#2ecc71':'#e74c3c';ctx.fillRect(-e.size,-e.size-10,e.size*2*pct,6);

    // Boss name
    if(cfg.isBoss){
      ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.font='bold 13px Inter,sans-serif';
      ctx.textAlign='center';ctx.textBaseline='bottom';
      ctx.shadowBlur=3;ctx.shadowColor='#000';
      ctx.fillText(cfg.name,-3,-e.size-12);
    }

    ctx.globalAlpha=1;ctx.restore();
  }
}

function drawPlayer(){
  if(!P||P.dead)return;
  const s=worldToScreen(P.x,P.y);

  ctx.save();ctx.translate(s.x,s.y);

  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.18)';ctx.beginPath();
  ctx.ellipse(0,P.size*0.55,P.size*0.85,P.size*0.28,0,0,Math.PI*2);ctx.fill();

  // Weapon swing
  const sl=getSlotItem(P.activeSlot);
  if(P.attackAnim>0&&sl.kind==='weapon'){
    const wc=C.weapons[sl.key];
    if(wc&&!wc.isRanged&&wc.length){
      ctx.save();ctx.rotate(P.angle);
      const sw=P.attackAnim*0.7;
      ctx.rotate(-sw+0.25);
      ctx.fillStyle=wc.color||'#bdc3c7';ctx.shadowBlur=4;ctx.shadowColor='rgba(0,0,0,0.4)';
      ctx.fillRect(P.size-4,-4,wc.length,8);
      if(sl.key==='katana'){
        ctx.fillStyle='rgba(200,200,255,0.5)';ctx.fillRect(P.size-4,-4,wc.length,3);
      }
      ctx.restore();
    }
  }

  // Body
  const flash=P.flashTimer>0;
  const col=flash?'#e74c3c':P.isPoisoned?'#c39bd3':C.player.color;
  ctx.fillStyle=col;
  ctx.strokeStyle=C.player.outlineColor;ctx.lineWidth=2;
  ctx.shadowBlur=10;ctx.shadowColor=flash?'rgba(231,76,60,0.8)':'rgba(0,0,0,0.35)';
  ctx.beginPath();ctx.arc(0,0,P.size,0,Math.PI*2);ctx.fill();ctx.stroke();

  // Hat visual
  const hat=C.hats[P.equippedHat];
  if(hat&&hat.emoji!=='❌'){
    ctx.save();ctx.rotate(P.angle);
    ctx.font=`${P.size*1.1}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowBlur=0;
    ctx.fillText(hat.emoji,P.size*0.35,-P.size*0.5);
    ctx.restore();
  }

  // Accessory visual
  const acc=C.accessories[P.equippedAcc];
  if(acc&&acc.emoji!=='❌'){
    ctx.save();ctx.rotate(-P.angle);
    ctx.font=`${P.size*0.9}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowBlur=0;
    ctx.fillText(acc.emoji,-P.size*0.5,P.size*0.6);
    ctx.restore();
  }

  // Eyes
  ctx.shadowBlur=0;ctx.save();ctx.rotate(P.angle);
  ctx.fillStyle='#1a252f';
  ctx.beginPath();ctx.arc(P.size*0.42,-P.size*0.2,3.5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(P.size*0.42,P.size*0.2,3.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='white';
  ctx.beginPath();ctx.arc(P.size*0.44,-P.size*0.22,1.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(P.size*0.44,P.size*0.18,1.3,0,Math.PI*2);ctx.fill();
  ctx.restore();

  // Nametag
  if(!isStealth()){
    ctx.fillStyle='#fff';
    ctx.font='bold 13px Inter,sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
    ctx.shadowBlur=3;ctx.shadowColor='#000';
    ctx.fillText(P.name,0,-P.size-4);
  }

  ctx.restore();
}

function drawProjectiles(){
  for(const p of projectiles){
    if(p.dead)continue;
    const s=worldToScreen(p.x,p.y);
    ctx.save();
    ctx.fillStyle=p.color;
    ctx.shadowBlur=8;ctx.shadowColor=p.color;
    ctx.beginPath();ctx.arc(s.x,s.y,p.size,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
}

function drawParticles(){
  for(const p of particles){
    const s=worldToScreen(p.x,p.y);
    ctx.globalAlpha=p.life;
    ctx.fillStyle=p.color;
    ctx.beginPath();ctx.arc(s.x,s.y,p.size,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
}

function drawMinimap(){
  const sz=C.ui.minimapSize;
  const sx=sz/WW,sy=sz/WH;
  mmCtx.clearRect(0,0,sz,sz);
  mmCtx.fillStyle='#4a7a2c';mmCtx.fillRect(0,0,sz,sz);

  // River
  if(C.world.riverEnabled){
    mmCtx.fillStyle='rgba(52,152,219,0.5)';
    mmCtx.fillRect(WW*C.world.riverX*sx-2,0,4,sz);
  }

  // Resources
  const rColors={tree:'#2d6b1f',stone:'#7f8c8d',bush:'#e74c3c',gold:'#f1c40f',cactus:'#27ae60'};
  for(const r of resources){
    if(r.dead)continue;
    mmCtx.fillStyle=rColors[r.type]||'#fff';
    mmCtx.fillRect(r.x*sx-1,r.y*sy-1,2,2);
  }

  // Buildings
  mmCtx.fillStyle='#3498db';
  for(const b of buildings){if(!b.dead)mmCtx.fillRect(b.x*sx-2,b.y*sy-2,4,4);}

  // Enemies
  for(const e of enemies){
    if(e.dead)continue;
    mmCtx.fillStyle=C.enemies[e.type]?.isBoss?'#ff0000':C.enemies[e.type]?.aggressive?'#e74c3c':'#f39c12';
    mmCtx.beginPath();mmCtx.arc(e.x*sx,e.y*sy,C.enemies[e.type]?.isBoss?4:2,0,Math.PI*2);mmCtx.fill();
  }

  // Player
  if(P){
    mmCtx.fillStyle='#fff';mmCtx.strokeStyle='#e67e22';mmCtx.lineWidth=1.5;
    mmCtx.beginPath();mmCtx.arc(P.x*sx,P.y*sy,4,0,Math.PI*2);mmCtx.fill();mmCtx.stroke();
  }
}

// ── FPS ───────────────────────────────────────────────────
let lastT=performance.now(),frames=0,fpsVal=60,fpsAcc=0;

// ── MAIN LOOP ─────────────────────────────────────────────
function loop(now){
  const dt=Math.min(now-lastT,80);
  lastT=now;

  if(gameState==='playing'){
    if(!paused){
      updatePlayer(dt);
      updateEnemies(dt);
      updateBuildings(dt);
      updateResources(dt);
      updateProjectiles(dt);
      updateParticles();
    }

    drawWorld();
    drawResources();
    drawBuildings();
    drawParticles();
    drawProjectiles();
    drawEnemies();
    drawPlayer();
    drawMinimap();

    fpsAcc+=dt;frames++;
    if(fpsAcc>=600){
      fpsVal=Math.round(frames/(fpsAcc/1000));frames=0;fpsAcc=0;
      updateHUD();updateLB();
      if(C.ui.showFPS)document.getElementById('fps').textContent=fpsVal+' FPS';
      // CaseOh age check
      if(P&&!P.caseohUnlocked&&P.age>=100){
        P.caseohUnlocked=true;
        P.unlockedBuildings.push('spike_caseoh');
        announce('🫃 LEGENDARY: CaseOh Spike UNLOCKED at Age 100!',5000);
        sfxBoss();
        updateToolbar();
      }
    }
  }

  requestAnimationFrame(loop);
}

// ── START ─────────────────────────────────────────────────
function startGame(name){
  playerName=name||'Player';
  P=makePlayer(playerName);

  buildings=[];particles=[];projectiles=[];

  spawnResources();
  spawnEnemies();

  cam.x=P.x;cam.y=P.y;

  gameState='playing';
  document.getElementById('menu').style.display='none';
  document.getElementById('hud').style.display='block';
  document.getElementById('death-screen').style.display='none';
  document.getElementById('ageup-panel').style.display='none';

  applyHatEffects();
  updateHUD();
  updateXPBar();
  updateToolbar();

  announce(`🌿 Welcome, ${playerName}! Survive & dominate!`);
  setTimeout(()=>{
    const bossAge=Math.min(...Object.values(C.enemies).filter(e=>e.isBoss).map(()=>1));
    if(bossAge) announce('⚠️ Beware: MOOFIE and MOOSTAFA roam the land!',3000);
  },4000);
}

// ── BUTTON BINDINGS ───────────────────────────────────────
document.getElementById('btn-play').addEventListener('click',()=>{
  if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume();
  const n=document.getElementById('player-name-input').value.trim()||'Player';
  startGame(n);
});
document.getElementById('player-name-input').addEventListener('keydown',e=>{
  if(e.code==='Enter')document.getElementById('btn-play').click();
});
document.getElementById('btn-respawn').addEventListener('click',()=>{
  if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume();
  document.getElementById('death-screen').style.display='none';
  startGame(playerName);
});

document.querySelectorAll('.slot').forEach(slot=>{
  slot.addEventListener('click',()=>{ if(gameState==='playing')setSlot(+slot.dataset.slot); });
});

// ── BOOT ──────────────────────────────────────────────────
requestAnimationFrame(loop);
