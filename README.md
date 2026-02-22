# 🦞 Lobster Mario — Free Underwater Platformer Browser Game

> **Play free online — No download, no install. 100% browser-based.**  
> A Mario-inspired 2D platformer where you pilot a lobster through thrilling underwater levels, stomp enemy crabs, collect pearls, and unlock power-ups. Built with pure JavaScript and HTML5 Canvas.

---

<div align="center">

![Lobster Mario Gameplay](grabgame/)

[![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-f7df1e?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5 Canvas](https://img.shields.io/badge/Renderer-HTML5%20Canvas-e34c26?logo=html5)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![No Dependencies](https://img.shields.io/badge/Dependencies-Zero-00c853)](.)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

**🌏 Available Worldwide · 🇲🇾 Malaysia · 🇸🇬 Singapore · 🇵🇭 Philippines · 🇮🇩 Indonesia · 🇺🇸 USA · 🇬🇧 UK · 🇦🇺 Australia**

</div>

---

## 🎮 About the Game

**Lobster Mario** is a charming, free-to-play **HTML5 browser platformer game** that takes the classic jump-and-run formula into the deep ocean. You play as a spirited red lobster navigating hand-crafted underwater levels filled with platforms, surprises, and crab enemies.

This game runs entirely in your browser — no plugins, no accounts, no ads. Open the file and play instantly.

### Why You'll Love It

- 🎯 **True retro-platformer feel** — tight controls, satisfying stomps, and a rewarding skill curve  
- 🌊 **Atmospheric underwater world** — animated coral, rising bubbles, and rich ocean-blue visuals  
- 🎵 **Synthesized audio** — dynamic sound effects generated via the Web Audio API (no external audio files needed)  
- ⚡ **Silky smooth 60 FPS** — pure `requestAnimationFrame` rendering with no framework overhead  
- 📱 **Responsive canvas** — plays great on desktop and laptop screens  

---

## 🚀 Quick Start

### Option 1 — Open Directly in Browser
```
Double-click index.html → Chrome / Edge / Firefox
```

### Option 2 — Run Local Server (Recommended)
```bash
# Using Node.js (npx)
npx serve .

# Using Python 3
python -m http.server 8080
```
Then visit `http://localhost:8080`

---

## 🕹️ How to Play

| Action | Keys |
|--------|------|
| Move Left / Right | `←` `→` Arrow Keys or `A` `D` |
| Jump | `↑` Arrow, `W`, or `Spacebar` |
| Stomp Enemies | Jump on top of a crab 🦀 |
| Start / Retry | Click the canvas |

### 🏆 Objectives

1. **Survive** — avoid touching crabs from the side
2. **Collect 💎 Pearls** for +10 points each
3. **Find 🦐 Shrimps** to grow into *Big Lobster* (gain an extra hit!)
4. **Reach the 📦 Treasure Chest** to clear the level (+500 pts)
5. Hit **`?` blocks** from below for secret bonus points!

---

## ✨ Game Features

### 🦞 Lobster Character
- Fully animated custom sprite: claws that open/close, walking legs, eye stalks, antennae, and a tail fan
- **Big Lobster mode**: grow after collecting a Shrimp power-up
- **Invincibility frames**: flash-blink protection after taking damage

### 🦀 Crab Enemies
- Patrol platforms with realistic edge-detection — they won't walk off ledges
- Animated eye stalks and walking legs
- Satisfying screen-shake on stomp defeats

### 🗺️ Level Design (Hand-Crafted)
- **2 unique scrolling levels** with increasing challenge
- Platforms, pipes, question blocks, and hidden bonuses
- Scrolling camera that smoothly follows the player

### 🔊 Synthesized Audio (Zero Files)
All sounds are synthesized in real-time using the **Web Audio API**:
- 🎵 Jump (triangle wave sweep)
- 💎 Coin collect (frequency arpeggiation)
- 👟 Stomp (low square wave)
- ⬆️ Power-up (rising melody)
- 💥 Hurt (sawtooth pulse)

### 📷 Victory & Game Over Screens
- Level Clear screen with score display
- Game Over screen with one-click retry (with cooldown to prevent accidental re-death)
- Title screen with control guide

---

## 🏗️ Technical Architecture

```
lobster-mario/
├── index.html      # Entry point — minimal HTML5 shell
└── game.js         # ~800 lines of self-contained Vanilla JS game engine
```

| Component | Implementation |
|-----------|---------------|
| **Renderer** | HTML5 Canvas 2D API |
| **Game Loop** | `requestAnimationFrame` at native FPS |
| **Physics** | AABB tile-based collision, gravity, friction |
| **Entities** | ES6 Classes: `Player`, `Enemy`, `Coin`, `Powerup` |
| **Audio** | Web Audio API oscillators (no .mp3/.wav files) |
| **Camera** | Smooth lerp horizontal follow with level clamp |
| **Levels** | ASCII tile map strings → parsed at runtime |
| **State** | `title → playing → victory / gameover` FSM |

### Level Tile Legend
```
@  Player Spawn    #  Solid Block    ? Question Block
P  Pipe            G  Goal Chest     C  Pearl Coin
E  Enemy Crab      S  Shrimp Powerup
```

---

## 🌍 SEO & Discoverability Notes

This project is optimized for the following search queries:

**Primary Keywords:**
- `free browser platformer game no download`
- `HTML5 Mario game JavaScript open source`
- `lobster platformer game online`
- `canvas 2d game tutorial JavaScript`

**GEO Markets Targeted:**
| Region | Relevant Search Terms |
|--------|-----------------------|
| 🇲🇾 Malaysia | `permainan browser percuma`, `game platform HTML5 Malaysia` |
| 🇸🇬 Singapore | `free online game Singapore`, `best browser game 2025` |
| 🇵🇭 Philippines | `libreng laro browser`, `HTML5 platformer game` |
| 🇮🇩 Indonesia | `game browser gratis`, `platform game HTML5 Indonesia` |
| 🇺🇸 🇬🇧 🇦🇺 | `free Mario-like game online`, `JavaScript game open source` |

---

## 🛣️ Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| V1 MVP | Core platformer mechanics | ✅ Done |
| V2 | Level progression, audio, power-ups, health | ✅ Done |
| V3 | Background music loop | 🔲 Planned |
| V3 | Mobile touch controls | 🔲 Planned |
| V3 | High score (localStorage) | 🔲 Planned |
| V3 | More enemy types | 🔲 Planned |
| V4 | Level editor | 💡 Idea |
| V4 | Multiplayer co-op | 💡 Idea |

---

## 🤝 Contributing

Pull requests are welcome! If you'd like to add a level, improve enemy AI, or add mobile controls:

1. Fork the repository
2. Create a branch: `git checkout -b feature/new-level`
3. Make your changes in `game.js`
4. Submit a Pull Request with a short description

**Level Design Guide:** Edit the `LEVEL_DATA` array in `game.js`.  
Each level is an array of 12 strings (rows), each 40 characters wide (cols × 40px = 1600px level width).

---

## 📜 License

MIT License © 2025 — Free to use, modify, and distribute.

---

## 👥 Team Credits

| Role | Contribution |
|------|-------------|
| 🦾 **Alex** (Lead Engineer) | Game engine, physics, sprite rendering, audio synthesis |
| 📋 **Emma** (Product Manager) | Feature spec, level design guidelines, roadmap prioritization |
| 📈 **Sarah** (SEO Specialist) | README structure, keyword strategy, geo-targeting |
| 🎯 **Mike** (Team Lead) | Sprint planning, architecture review, bug triage |

---

<div align="center">

**Made with ❤️ and a lot of 🦞**

*If this made you smile, give it a ⭐ — it helps others find the game!*

</div>



