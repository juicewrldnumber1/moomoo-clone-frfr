// ============================================================
//  MOOMOO CLONE v2 - FULL GAME CONFIGURATION
//  Edit anything here to fully customize your game!
// ============================================================

const CONFIG = {

  // ── GAME IDENTITY ──────────────────────────────────────────
  game: {
    title: "MooMoo Clone",
    subtitle: "Survive. Gather. Dominate.",
    favicon: "🐄",
  },

  // ── WORLD ─────────────────────────────────────────────────
  world: {
    width: 5600,
    height: 5600,
    backgroundColor: "#7ec850",
    gridColor: "#6db843",
    gridSize: 64,
    biomes: true,
    borderColor: "#4a7c2e",
    riverEnabled: true,
    riverX: 0.5,          // fraction of world width
    riverWidth: 80,
    riverColor: "rgba(52,152,219,0.7)",
    riverCurrentSpeed: 1.2,
  },

  // ── PLAYER ────────────────────────────────────────────────
  player: {
    speed: 3.5,
    size: 22,
    startHealth: 100,
    maxHealth: 100,
    startFood: 100,
    maxFood: 100,
    foodDecayRate: 0.004,
    healthRegenRate: 0.025,
    damageFlashDuration: 200,
    color: "#e8c87a",
    outlineColor: "#8B4513",
  },

  // ── RESOURCES ─────────────────────────────────────────────
  resources: {
    tree: {
      count: 200,
      minSize: 18, maxSize: 32,
      health: 5, giveWood: 10,
      color: "#5a8c3c", trunkColor: "#8B6914", leafColor: "#4a7a2c",
      respawnTime: 15000,
    },
    bush: {
      count: 130,
      minSize: 14, maxSize: 22,
      health: 3, giveBerries: 8,
      color: "#e74c3c", bodyColor: "#27ae60",
      respawnTime: 12000,
    },
    stone: {
      count: 110,
      minSize: 16, maxSize: 28,
      health: 8, giveStone: 10,
      color: "#95a5a6", darkColor: "#7f8c8d",
      respawnTime: 20000,
    },
    gold: {
      count: 45,
      minSize: 14, maxSize: 20,
      health: 10, giveGold: 5,
      color: "#f1c40f", darkColor: "#d4ac0d",
      respawnTime: 30000,
    },
    cactus: {
      count: 35,
      minSize: 16, maxSize: 24,
      health: 999,
      touchDamage: 35,
      giveFood: 5,
      color: "#2ecc71", spineColor: "#27ae60",
      respawnTime: 99999,
      biome: "desert",
    },
  },

  // ── AGE SYSTEM ────────────────────────────────────────────
  // Each age unlock offers a CHOICE from a list.
  // type: weapon | building | consumable | upgrade
  ages: {
    maxAge: 100,
    // XP required to reach each age (indexed from age 1)
    xpTable: [0, 100, 200, 350, 500, 750, 1050, 1400, 1800, 2300],
    // Items unlocked per age (player chooses ONE)
    unlocks: {
      1:  ["windmill","wall_wood","spike","apple"],
      2:  ["sword","daggers","hand_axe","polearm","bat","stick"],
      3:  ["cookie","wall_stone"],
      4:  ["pit_trap","boost_pad"],
      5:  ["spike_greater","windmill_fast","mine","sapling"],
      6:  ["bow","great_hammer","shield","mc_grabby"],
      7:  ["turret","teleporter","spike_poison","cheese"],
      8:  ["spike_spinning","crossbow","great_axe","katana","power_mill"],
      9:  ["musket","repeater_crossbow","spike_fire"],
    },
  },

  // ── WEAPONS (all) ─────────────────────────────────────────
  weapons: {
    fist: {
      name:"Fist",emoji:"✊",damage:10,range:45,knockback:3,speed:500,gather:1,
      desc:"Your bare hands. Not great, not terrible.",color:"#e8c87a",length:0
    },
    stick: {
      name:"Stick",emoji:"🪵",damage:1,range:50,knockback:1,speed:300,gather:7,
      desc:"Terrible damage but outstanding resource gathering.",color:"#8B6914",length:38
    },
    hand_axe: {
      name:"Hand Axe",emoji:"🪓",damage:30,range:50,knockback:4,speed:700,gather:2,
      desc:"Gathers 6 resources instead of 5. Solid all-rounder.",color:"#95a5a6",length:34,
      gatherBonus:1
    },
    great_axe: {
      name:"Great Axe",emoji:"⚔️",damage:35,range:54,knockback:5,speed:750,gather:4,
      desc:"Massive gathering bonus (+3 gold on ore). Requires Hand Axe.",color:"#e74c3c",length:40,
      reqWeapon:"hand_axe", gatherBonus:3
    },
    sword: {
      name:"Short Sword",emoji:"🗡️",damage:30,range:55,knockback:4,speed:550,gather:1,
      desc:"Good damage and reach. Slightly reduces movement speed.",color:"#bdc3c7",length:42,
      speedMult:0.9
    },
    katana: {
      name:"Katana",emoji:"⚔️",damage:40,range:60,knockback:5,speed:500,gather:1,
      desc:"High damage and reach. Requires Short Sword.",color:"#e8e8e8",length:50,
      reqWeapon:"sword"
    },
    daggers: {
      name:"Daggers",emoji:"🗡️",damage:20,range:38,knockback:2,speed:200,gather:1,
      desc:"Lightning fast attacks. Boosts movement speed +13%.",color:"#silver",length:26,
      speedMult:1.13
    },
    polearm: {
      name:"Polearm",emoji:"🏹",damage:45,range:70,knockback:6,speed:800,gather:1,
      desc:"Highest melee damage but very slow. -30% move speed.",color:"#8B6914",length:60,
      speedMult:0.7
    },
    bat: {
      name:"Bat",emoji:"🏏",damage:20,range:48,knockback:10,speed:450,gather:1,
      desc:"Huge knockback. Great for crowd control.",color:"#8B4513",length:40
    },
    great_hammer: {
      name:"Great Hammer",emoji:"🔨",damage:10,range:50,knockback:8,speed:600,gather:1,
      desc:"Deals 70 damage to structures. Secondary weapon.",color:"#7f8c8d",length:42,
      structureDmg:70, isSecondary:true
    },
    shield: {
      name:"Shield",emoji:"🛡️",damage:0,range:0,knockback:0,speed:0,gather:0,
      desc:"Blocks all projectiles. Reduces melee damage by 80%.",color:"#8B6914",length:0,
      isSecondary:true, blockProjectiles:true, meleeDamageReduction:0.8
    },
    mc_grabby: {
      name:"Mc Grabby",emoji:"✋",damage:0,range:50,knockback:0,speed:500,gather:4,
      desc:"Steals 250 gold from players hit. 0 damage.",color:"#e67e22",length:44,
      isSecondary:true, stealGold:250
    },
    bow: {
      name:"Hunting Bow",emoji:"🏹",damage:25,range:400,knockback:3,speed:800,gather:0,
      desc:"Ranged. Each arrow costs 4 wood. 25 damage.",color:"#8B6914",length:0,
      isRanged:true, arrowCost:4, isSecondary:true
    },
    crossbow: {
      name:"Crossbow",emoji:"🏹",damage:35,range:450,knockback:4,speed:1000,gather:0,
      desc:"Better ranged weapon. 5 wood per arrow. Req Bow.",color:"#7f8c8d",length:0,
      isRanged:true, arrowCost:5, reqWeapon:"bow", isSecondary:true
    },
    repeater_crossbow: {
      name:"Repeater Crossbow",emoji:"🏹",damage:30,range:420,knockback:3,speed:250,gather:0,
      desc:"Fires rapidly. 10 wood per arrow. Req Crossbow.",color:"#2c3e50",length:0,
      isRanged:true, arrowCost:10, reqWeapon:"crossbow", isSecondary:true
    },
    musket: {
      name:"Musket",emoji:"🔫",damage:70,range:600,knockback:8,speed:3000,gather:0,
      desc:"Massive damage, very slow. 1 stone per shot. Secondary.",color:"#5a5a5a",length:0,
      isRanged:true, arrowCost:1, arrowResource:"stone", isSecondary:true
    },
  },

  // ── BUILDINGS (all) ────────────────────────────────────────
  buildings: {
    wall_wood: {
      name:"Wood Wall",emoji:"🪵",health:200,cost:{wood:10},size:50,
      color:"#8B6914",desc:"Basic wood wall. Good for quick defense.",
      category:"wall"
    },
    wall_stone: {
      name:"Stone Wall",emoji:"🪨",health:400,cost:{wood:15,stone:15},size:50,
      color:"#95a5a6",desc:"Much stronger than wood walls.",
      category:"wall"
    },
    spike: {
      name:"Spikes",emoji:"🔺",health:375,damage:25,cost:{wood:20,stone:5},size:28,
      color:"#7f8c8d",desc:"Deals 25 damage on contact. Max 15.",
      category:"trap", maxCount:15
    },
    spike_greater: {
      name:"Greater Spikes",emoji:"🔺",health:400,damage:35,cost:{wood:30,stone:10},size:30,
      color:"#e74c3c",desc:"Deals 35 damage. Upgraded spikes.",
      category:"trap", maxCount:15
    },
    spike_poison: {
      name:"Poison Spikes",emoji:"☠️",health:400,damage:20,cost:{wood:35,stone:15},size:30,
      color:"#8e44ad",desc:"Deals 20 + 5/sec poison damage.",
      category:"trap", maxCount:15, poison:true, poisonDps:5, poisonDuration:5000
    },
    spike_spinning: {
      name:"Spinning Spikes",emoji:"🌀",health:450,damage:30,cost:{wood:30,stone:20},size:32,
      color:"#e67e22",desc:"Rotates! Deals 30 damage. Harder to avoid.",
      category:"trap", maxCount:15, spins:true
    },
    spike_fire: {
      name:"Fire Spikes",emoji:"🔥",health:350,damage:45,cost:{wood:40,stone:20},size:32,
      color:"#e74c3c",desc:"45 damage + brief burn effect.",
      category:"trap", maxCount:15, burn:true, burnDps:8, burnDuration:2000
    },
    spike_caseoh: {
      name:"CaseOh Spike 😤",emoji:"🫃",health:999,damage:100,cost:{wood:0,stone:0},size:42,
      color:"#ff6b35",
      desc:"💀 LEGENDARY. 100 damage. Unlocked at Age 100 only. The man, the myth.",
      category:"trap", maxCount:5, legendary:true, ageRequired:100,
      isCaseoh:true
    },
    windmill: {
      name:"Windmill",emoji:"🌀",health:400,cost:{wood:50,stone:10},size:35,
      color:"#3498db",passiveGold:1,
      desc:"Generates 1 gold/sec. Max 7.",
      category:"util", maxCount:7
    },
    windmill_fast: {
      name:"Faster Windmill",emoji:"🌀",health:400,cost:{wood:60,stone:20},size:35,
      color:"#2980b9",passiveGold:2,
      desc:"2 gold/sec. Req Windmill. Max 7.",
      category:"util", maxCount:7, reqBuilding:"windmill"
    },
    power_mill: {
      name:"Power Mill",emoji:"⚡",health:400,cost:{wood:100,stone:50},size:38,
      color:"#9b59b6",passiveGold:4,
      desc:"4 gold/sec. The ultimate windmill. Max 7.",
      category:"util", maxCount:7, reqBuilding:"windmill_fast"
    },
    campfire: {
      name:"Campfire",emoji:"🔥",health:100,cost:{wood:30},size:25,
      color:"#e74c3c",healRate:0.08,healRadius:90,
      desc:"Heals you when you stand near it.",
      category:"util"
    },
    pit_trap: {
      name:"Pit Trap",emoji:"⬛",health:500,cost:{wood:30,stone:20},size:30,
      color:"#2c3e50",desc:"Invisible to enemies. Stops movement when stepped on.",
      category:"trap", maxCount:12, invisible:true, traps:true
    },
    boost_pad: {
      name:"Boost Pad",emoji:"➡️",health:150,cost:{wood:20,stone:5},size:28,
      color:"#3498db",desc:"Launches players in the direction it faces.",
      category:"util", maxCount:12, boostForce:12
    },
    mine: {
      name:"Mine",emoji:"💣",health:200,cost:{stone:30},size:24,
      color:"#2c3e50",desc:"Invisible trap. Deals 100 damage on trigger.",
      category:"trap", maxCount:8, invisible:true, mineDmg:100
    },
    turret: {
      name:"Turret",emoji:"🔫",health:800,cost:{wood:200,stone:150},size:30,
      color:"#7f8c8d",turretDmg:25,turretRange:350,turretRate:2000,
      desc:"Auto-shoots enemies in range. 25 dmg cannonballs.",
      category:"util", maxCount:4
    },
    teleporter: {
      name:"Teleporter",emoji:"🌀",health:250,cost:{wood:100,stone:100},size:28,
      color:"#9b59b6",
      desc:"Place 2 to teleport between them.",
      category:"util", maxCount:2
    },
    sapling: {
      name:"Sapling",emoji:"🌱",health:150,cost:{wood:30},size:20,
      color:"#2ecc71",
      desc:"Grows into a tree over time. Unlimited placements.",
      category:"util", growTime:20000
    },
    spawn_pad: {
      name:"Spawn Pad",emoji:"🏠",health:200,cost:{wood:50,stone:30},size:28,
      color:"#e67e22",
      desc:"Respawn here when you die.",
      category:"util", maxCount:1
    },
    healing_pad: {
      name:"Healing Pad",emoji:"💚",health:200,cost:{wood:50,stone:50},size:28,
      color:"#2ecc71",healRate:0.25,healRadius:70,
      desc:"Heals 15 HP/sec in range.",
      category:"util", maxCount:4
    },
  },

  // ── CONSUMABLES ────────────────────────────────────────────
  consumables: {
    apple: {
      name:"Apple",emoji:"🍎",foodRestore:20,cost:{food:0},
      desc:"Restores 20 food. Free from bushes.",free:true
    },
    cookie: {
      name:"Cookie",emoji:"🍪",healthRestore:40,healthRegen:0,cost:{food:15},
      desc:"Restores 40 HP immediately.",ageRequired:3
    },
    cheese: {
      name:"Cheese",emoji:"🧀",healthRestore:30,healthRegen:10,
      cost:{food:25},desc:"30 HP now + 50 HP over 5 seconds.",ageRequired:7
    },
  },

  // ── HATS (Gold Shop) ──────────────────────────────────────
  hats: {
    // --- FREE (unlocked by default / age) ---
    none: { name:"None", emoji:"❌", cost:0, free:true, desc:"Bare head." },
    moo_head: {
      name:"Moo Head",emoji:"🐄",cost:0,free:true,ageRequired:1,
      desc:"Cosmetic. You look like a cow."
    },

    // --- MOVEMENT ---
    booster_hat: {
      name:"Booster Hat",emoji:"🚀",cost:2000,
      speedMult:1.16,
      desc:"+16% move speed. Great all-purpose hat."
    },
    cowboy_hat: {
      name:"Cowboy Hat",emoji:"🤠",cost:1000,
      speedMult:1.10,
      desc:"+10% move speed. Yeehaw."
    },
    winter_cap: {
      name:"Winter Cap",emoji:"🎿",cost:1000,
      noSnowPenalty:true,
      desc:"Negates snow movement penalty."
    },
    flipper_hat: {
      name:"Flipper Hat",emoji:"🐬",cost:1500,
      riverResist:0.5,
      desc:"50% resistance to river current."
    },
    dash_cape: {
      name:"Dash Cape",emoji:"💨",cost:3000,
      speedMult:1.20,dashCooldown:3000,canDash:true,
      desc:"+20% speed + dash ability (Q key)."
    },

    // --- DAMAGE ---
    soldier_helmet: {
      name:"Soldier Helmet",emoji:"⛑️",cost:1000,
      damageReduction:0.25,
      desc:"Take 25% less damage from all sources."
    },
    samurai_armor: {
      name:"Samurai Armor",emoji:"🥷",cost:3000,
      damageReduction:0.15,speedMult:0.95,damageBonus:1.1,
      desc:"+10% damage, -15% incoming, slight speed cost."
    },
    barbarian_armor: {
      name:"Barbarian Armor",emoji:"🪖",cost:2000,
      damageBonus:1.25,damageReduction:-0.2,
      desc:"+25% damage but -20% armor (glass cannon)."
    },
    assassin_gear: {
      name:"Assassin Gear",emoji:"🗡️",cost:4000,
      speedMult:1.12,damageBonus:1.15,stealth:true,
      desc:"+12% speed, +15% damage, name hidden to enemies."
    },
    dark_knight: {
      name:"Dark Knight",emoji:"🖤",cost:5000,
      damageBonus:1.20,lifesteal:0.15,
      desc:"+20% damage, 15% lifesteal on hits."
    },
    bull_helmet: {
      name:"Bull Helmet",emoji:"🐂",cost:3000,
      chargeDamageBonus:2.0,chargeEnabled:true,healthDrain:0.5,
      desc:"Enables charge. 2x charge damage. Drains HP over time."
    },

    // --- HEALING / TANK ---
    medic_gear: {
      name:"Medic Gear",emoji:"⚕️",cost:3000,
      regenRate:3,
      desc:"+3 HP/second passive regeneration."
    },
    apple_cap: {
      name:"Apple Cap",emoji:"🍎",cost:1000,
      foodEffect:1.5,
      desc:"Food restores 50% more health."
    },
    tank_gear: {
      name:"Tank Gear",emoji:"🛡️",cost:5000,
      damageReduction:0.5,speedMult:0.85,maxHealthBonus:50,
      desc:"-50% damage taken, -15% speed, +50 max HP."
    },
    emp_helmet: {
      name:"EMP Helmet",emoji:"⚡",cost:4000,
      turretImmune:true,
      desc:"Turrets cannot target you."
    },

    // --- UTILITY / SPECIAL ---
    bush_gear: {
      name:"Bush Gear",emoji:"🌿",cost:2000,
      stealth:true, hideNameplate:true,
      desc:"Your name & health bar are hidden from enemies."
    },
    marksman_cap: {
      name:"Marksman Cap",emoji:"🎯",cost:2000,
      arrowSpeed:1.3, arrowRange:1.25,
      desc:"Arrows fly 25% farther and faster."
    },
    turret_gear: {
      name:"Turret Gear",emoji:"🔫",cost:5000,
      isTurret:true, turretDmg:25, turretRate:1200, speedMult:0.8,
      desc:"Shoots cannonballs automatically. -20% speed."
    },
    mining_helmet: {
      name:"Mining Helmet",emoji:"⛏️",cost:1000,
      gatherBonus:1,
      desc:"+1 resource per gather hit."
    },
    spike_gear: {
      name:"Spike Gear",emoji:"🔺",cost:4000,
      reflectDmg:0.3,
      desc:"Reflects 30% of melee damage back to attacker."
    },
    bloodthirster: {
      name:"Bloodthirster",emoji:"🩸",cost:5000,
      lifesteal:0.25, damageBonus:1.1,
      desc:"25% lifesteal + 10% damage."
    },
    anti_venom: {
      name:"Anti Venom Gear",emoji:"🐍",cost:2000,
      poisonImmune:true,
      desc:"Immune to all poison effects."
    },
    plague_mask: {
      name:"Plague Mask",emoji:"😷",cost:3000,
      poisonOnHit:true, poisonDps:5,
      desc:"Attacks apply 5 DPS poison for 3 seconds."
    },
    thief_gear: {
      name:"Thief Gear",emoji:"💰",cost:2000,
      goldOnKill:0.5,
      desc:"Gain 50% of enemy's gold when you kill them."
    },
    scavenger_gear: {
      name:"Scavenger Gear",emoji:"🦅",cost:3000,
      respawnResources:0.5,
      desc:"Keep 50% of resources on death."
    },
    angel_wings: {
      name:"Angel Wings",emoji:"👼",cost:4000,
      regenRate:3, damageReduction:0.1,
      desc:"+3 HP/sec regen and -10% incoming damage."
    },
    blood_wings: {
      name:"Blood Wings",emoji:"🦇",cost:5000,
      lifesteal:0.20, speedMult:1.08,
      desc:"20% lifesteal, +8% speed. Looks sick."
    },
    devil_tail: {
      name:"Devil's Tail",emoji:"😈",cost:3000,
      damageBonus:1.15, burnOnHit:true,
      desc:"+15% damage. Attacks burn enemies briefly."
    },
    crown: {
      name:"Crown",emoji:"👑",cost:8000,
      damageBonus:1.1, speedMult:1.05, regenRate:1,
      desc:"All-around +10% DMG, +5% speed, +1 regen. Prestige flex."
    },
    ninja_gear: {
      name:"Ninja Gear",emoji:"🥷",cost:4000,
      speedMult:1.18, stealth:true, damageBonus:1.05,
      desc:"+18% speed, hidden name, +5% dmg. Classic ninja."
    },
    bear_head: {
      name:"Bear Head",emoji:"🐻",cost:2500,
      makesAnimalsPassive:true,
      desc:"Animals become passive towards you. No animal aggro."
    },
    bull_mask: {
      name:"Bull Mask",emoji:"🐂",cost:2500,
      speedMult:0.85, damageReduction:0.3,
      desc:"-15% speed, -30% incoming. Tank look."
    },
    berserk_mask: {
      name:"Berserk Mask",emoji:"😡",cost:4000,
      lowHealthBonus:true,
      desc:"When below 30% HP: +50% speed & +25% damage."
    },
    corrupt_wings: {
      name:"Corrupt X Wings",emoji:"🖤",cost:6000,
      damageReduction:0.2, damageBonus:1.15, regenRate:2,
      desc:"The ultimate edgy flex. -20% dmg taken, +15% given, +2 regen."
    },

    // ── THE MEME HAT ──────────────────────────────────────────
    shame_hat: {
      name:"SHAME! 🤡",emoji:"🃏",cost:0,
      shame:true, noHeal:true, free:true,
      desc:"Hacks are for losers! Auto-equip on cheat detection. Disables healing."
    },
  },

  // ── ACCESSORIES (Gold Shop) ───────────────────────────────
  accessories: {
    none: { name:"None",emoji:"❌",cost:0,free:true,desc:"Nothing equipped." },
    monkey_tail: {
      name:"Monkey Tail",emoji:"🐒",cost:2000,
      speedMult:1.35, meleeDmgMult:0.2,
      desc:"+35% speed but only 20% melee damage. Ranged builds."
    },
    apple_basket: {
      name:"Apple Basket",emoji:"🍎",cost:1500,
      foodEffect:2.0, regenRate:0.5,
      desc:"Double food regen effect. Passive +0.5 HP/sec."
    },
    cookie_cape: {
      name:"Cookie Cape",emoji:"🍪",cost:2500,
      healOverTime:10, healDuration:8,
      desc:"Cookies heal +10 bonus HP over 8 seconds."
    },
    dragon_cape: {
      name:"Dragon Cape",emoji:"🐉",cost:5000,
      damageBonus:1.2, burnOnHit:true,
      desc:"+20% damage. Attacks ignite enemies (8 DPS for 2s)."
    },
    cow_cape: {
      name:"Cow Cape",emoji:"🐄",cost:500,
      desc:"Cosmetic only. Moo."
    },
    angel_wings_acc: {
      name:"Angel Wings",emoji:"👼",cost:4000,
      regenRate:3,
      desc:"+3 HP/second passive regen."
    },
  },

  // ── ENEMIES ────────────────────────────────────────────────
  enemies: {
    rabbit: {
      name:"Rabbit",emoji:"🐰",count:20,speed:2.0,size:14,health:30,damage:5,
      color:"#f5f5dc",aggressive:false,detectionRange:150,fleeRange:100,
      xpDrop:5,foodDrop:3
    },
    wolf: {
      name:"Wolf",emoji:"🐺",count:12,speed:2.8,size:18,health:80,damage:15,
      color:"#808080",aggressive:true,detectionRange:250,attackRange:35,
      attackCooldown:1000,xpDrop:15,foodDrop:8
    },
    bull: {
      name:"Bull",emoji:"🐂",count:6,speed:2.0,size:24,health:200,damage:30,
      color:"#8B4513",aggressive:true,chargeSpeed:5.5,chargeRange:300,
      detectionRange:200,attackRange:45,attackCooldown:1500,
      xpDrop:40,foodDrop:20
    },
    // Bosses
    moofie: {
      name:"MOOFIE 👑",emoji:"🐄",count:1,speed:3.5,size:40,health:2000,damage:40,
      color:"#e74c3c",aggressive:true,detectionRange:400,attackRange:55,
      attackCooldown:800,xpDrop:500,goldDrop:5000,isBoss:true,
      desc:"The boss of the plains. Drops 5000 gold."
    },
    moostafa: {
      name:"MOOSTAFA 💀",emoji:"👹",count:1,speed:4.0,size:36,health:3000,damage:50,
      color:"#8B0000",aggressive:true,detectionRange:450,attackRange:60,
      attackCooldown:700,xpDrop:800,goldDrop:10000,isBoss:true, canBreakWalls:true,
      desc:"The desert boss. Drops 10000 gold. Breaks walls."
    },
  },

  // ── GRAPHICS ──────────────────────────────────────────────
  graphics: {
    shadowBlur: 8,
    shadowColor: "rgba(0,0,0,0.3)",
    nametagFont: "bold 13px 'Segoe UI', sans-serif",
    nametagColor: "#fff",
    nametagShadow: "#000",
    healthBarHeight: 6,
    healthBarGoodColor: "#2ecc71",
    healthBarLowColor: "#e74c3c",
    healthBarBgColor: "rgba(0,0,0,0.4)",
    particleCount: 12,
    particleLifetime: 600,
    bloodColor: "#c0392b",
    poisonColor: "#8e44ad",
    fireColor: "#e74c3c",
    goldColor: "#f1c40f",
  },

  // ── AUDIO ─────────────────────────────────────────────────
  audio: {
    enabled: true,
    masterVolume: 0.4,
    hitVolume: 0.6,
    collectVolume: 0.5,
    buildVolume: 0.4,
    deathVolume: 0.8,
  },

  // ── UI ────────────────────────────────────────────────────
  ui: {
    primaryColor: "#e67e22",
    secondaryColor: "#2c3e50",
    accentColor: "#e74c3c",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    minimapSize: 160,
    minimapOpacity: 0.85,
    showFPS: true,
    leaderboardSize: 10,
  },
};

if (typeof module !== 'undefined') module.exports = CONFIG;
