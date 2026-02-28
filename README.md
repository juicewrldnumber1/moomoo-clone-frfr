# 🐄 MooMoo Clone v2 — Full Edition

A massively expanded MooMoo.io clone with every system from the original, plus the legendary **CaseOh Spike** 🫃

## 🚀 Deploy to Vercel

```bash
npm i -g vercel
vercel
```
Or drag the folder to [vercel.com/new](https://vercel.com/new).

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| WASD / Arrows | Move |
| Left Click (hold) | Attack / Gather / Place |
| 1–8 | Select toolbar slot |
| **C** | Open Gold Shop (buy hats & accessories) |
| **T** | Chat |
| **Q** | Dash (requires Dash Cape hat) |
| Space | Charge (requires Bull Helmet) |
| ESC | Close menus |

---

## 📈 Age System (1–100)

Each age-up gives you a **choice** of one new item:

| Age | Choices |
|-----|---------|
| 1 | Windmill, Wood Wall, Spikes, Apple |
| 2 | Short Sword, Daggers, Hand Axe, Polearm, Bat, Stick |
| 3 | Cookie, Stone Wall |
| 4 | Pit Trap, Boost Pad |
| 5 | Greater Spikes, Faster Windmill, Mine, Sapling |
| 6 | Hunting Bow, Great Hammer, Shield, Mc Grabby |
| 7 | Turret, Teleporter, Poison Spikes, Cheese |
| 8 | Spinning Spikes, Crossbow, Great Axe, Katana, Power Mill |
| 9 | Musket, Repeater Crossbow, Fire Spikes |
| **100** | 🫃 **LEGENDARY: CaseOh Spike** |

---

## 🔺 Spike Tiers

| Spike | Damage | Special |
|-------|--------|---------|
| Spikes | 25 | Base — available from Age 1 |
| Greater Spikes | 35 | Stronger — Age 5 |
| Poison Spikes | 20 + 5/sec | Poisons enemies — Age 7 |
| Spinning Spikes | 30 | Rotates — Age 8 |
| Fire Spikes | 45 + burn | Burns enemies — Age 9 |
| **CaseOh Spike** 🫃 | **100** 💀 | LEGENDARY — Age 100 only. The man. The myth. Max 5. |

---

## 🎩 Hat Shop (buy with Gold)

Hats provide powerful bonuses. Buy with gold earned from windmills and kills:

| Hat | Effect | Cost |
|-----|--------|------|
| Booster Hat | +16% speed | 2000 |
| Cowboy Hat | +10% speed | 1000 |
| Soldier Helmet | -25% damage taken | 1000 |
| Medic Gear | +3 HP/sec regen | 3000 |
| Bush Gear | Stealth (hidden name/HP) | 2000 |
| Turret Gear | Auto-shoots nearby enemies | 5000 |
| Dark Knight | +20% dmg + 15% lifesteal | 5000 |
| Bloodthirster | 25% lifesteal + 10% dmg | 5000 |
| Spike Gear | 30% reflect on melee hits | 4000 |
| Barbarian Armor | +25% dmg (glass cannon) | 2000 |
| Assassin Gear | +12% speed, +15% dmg, stealth | 4000 |
| Angel Wings | +3 regen, -10% dmg taken | 4000 |
| Tank Gear | -50% dmg, +50 max HP | 5000 |
| Bear Head | Animals become passive | 2500 |
| Berserk Mask | At <30% HP: +50% speed & +25% dmg | 4000 |
| Crown | +10% dmg, +5% speed, +1 regen | 8000 |
| Corrupt X Wings | -20% dmg taken, +15% dmg, +2 regen | 6000 |
| ...and many more | | |

---

## 🏗️ Buildings

| Building | Description |
|----------|-------------|
| Wood Wall | Basic defense wall |
| Stone Wall | Stronger wall (Age 3) |
| Windmill → Power Mill | Generates 1-4 gold/sec |
| Turret | Auto-shoots enemies in range (Age 7) |
| Pit Trap | Invisible trap that freezes enemies (Age 4) |
| Boost Pad | Launches players (Age 4) |
| Mine | Invisible 100-dmg explosive (Age 5) |
| Teleporter | Place 2 to teleport between them (Age 7) |
| Sapling | Grows into a tree (unlimited) |
| Healing Pad | Area heal 15 HP/sec |
| Campfire | Area heal when nearby |
| Spawn Pad | Respawn here when you die |

---

## 👹 Enemies & Bosses

| Enemy | Type | Notes |
|-------|------|-------|
| 🐰 Rabbit | Passive | Flees from you |
| 🐺 Wolf | Aggressive | Chases you |
| 🐂 Bull | Aggressive | Charges at you |
| 👑 MOOFIE | **Boss** | Drops 5,000 gold |
| 💀 MOOSTAFA | **Boss** | Drops 10,000 gold, breaks walls |

---

## ⚙️ Customization — `public/config.js`

Everything is in `config.js`. Key sections:

- `game` — Title, subtitle
- `world` — Size, biomes, river speed
- `player` — Speed, health, food decay
- `resources` — Counts, drops, respawn times
- `ages` — XP table, what items unlock at each age
- `weapons` — Damage, range, speed, cost
- `buildings` — Health, damage, effects
- `enemies` — Speed, health, boss settings
- `hats` — Cost, all stat effects
- `accessories` — Cost, stat effects
- `graphics` — Colors, particles
- `audio` — Volume levels

---

## 📁 Structure

```
moomoo-clone-v2/
├── public/
│   ├── index.html   ← Full UI
│   ├── game.js      ← Full game engine
│   └── config.js    ← All customization ← EDIT THIS
├── vercel.json
└── README.md
```
