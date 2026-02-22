/**
 * 🦞 LOBSTER MARIO - Underwater Adventure
 * Full rewrite with bug fixes: spawn, collision, enemy AI.
 */

// ==================== SETUP ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 800, H = 480;
const TILE = 40; // Bigger tiles = better hitboxes, less precision needed
const GRAVITY = 0.55;
const JUMP_FORCE = -12;
const MOVE_SPEED = 4.5;

canvas.width = W;
canvas.height = H;

// ==================== GAME STATE ====================
let state = 'title'; // title, playing, victory, gameover
let score = 0;
let level = 1;
let frame = 0;
let cameraX = 0;
let shakeTimer = 0;
let deathCooldown = 0; // prevent instant re-death on retry

// ==================== INPUT ====================
const keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.key] = false; });
canvas.addEventListener('click', () => {
    if (state === 'title') startGame();
    else if (state === 'victory') nextLevel();
    else if (state === 'gameover' && deathCooldown <= 0) restartGame();
});

// ==================== AUDIO ====================
let audioCtx = null;
function initAudio() {
    if (audioCtx) return;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { }
}
function playSound(freq, duration, type = 'square', slide = 0) {
    if (!audioCtx) return;
    try {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, audioCtx.currentTime);
        if (slide) o.frequency.exponentialRampToValueAtTime(slide, audioCtx.currentTime + duration);
        g.gain.setValueAtTime(0.07, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); o.stop(audioCtx.currentTime + duration);
    } catch (e) { }
}
function sfxJump() { playSound(250, 0.15, 'triangle', 600); }
function sfxCoin() { playSound(800, 0.08, 'sine', 1600); setTimeout(() => playSound(1200, 0.12, 'sine'), 80); }
function sfxStomp() { playSound(80, 0.12, 'square', 20); }
function sfxPowerup() { [400, 600, 800].forEach((f, i) => setTimeout(() => playSound(f, 0.1, 'sine', f * 2), i * 100)); }
function sfxHurt() { playSound(180, 0.25, 'sawtooth', 40); }

// ==================== LEVELS ====================
// Legend: # = blocks, ? = question block, P = pipe (2wide), G = goal chest
//         C = coin/pearl, E = enemy crab, S = shrimp powerup, @ = player spawn
// Map is 12 rows × TILE=40px = 480px height, player fills rows 10-11 above ground row 11

const LEVEL_DATA = [
    // LEVEL 1  (cols: 0123456789012345678901234567890123456789  = 40 cols * 40px = 1600px wide)
    [
        //col:  0         1         2         3
        //      0123456789012345678901234567890123456789
        "                                        ", // row 0
        "                                        ", // row 1
        "      C C C                   C C C     ", // row 2
        "      ?????           C C C   ?????     ", // row 3
        "                      ?????             ", // row 4
        "  ###        E   ###           ###      ", // row 5
        "        ##                 ##       PPG ", // row 6
        "             ###      E            PP  ", // row 7
        "  @  C          C S        C           ", // row 8
        "  E           E      E        E     E  ", // row 9
        "########################################", // row 10
        "########################################", // row 11
    ],
    // LEVEL 2
    [
        //      0123456789012345678901234567890123456789
        "                                        ", // row 0
        "         C C C               C C C      ", // row 1
        "         ?????               ?????      ", // row 2
        "                 C C C               G ", // row 3
        "    ###          ?????         ###   P ", // row 4
        "          ###                        P ", // row 5
        "  ##                 ###       ##    PP", // row 6
        "        E   ##  S        E              ", // row 7
        "  @  C          C         C      C E   ", // row 8
        "  E         E        E        E        ", // row 9
        "########################################", // row 10
        "########################################", // row 11
    ],
];

// ==================== TILE COLORS ====================
const COLORS = {
    '#': { body: '#7c5c40', top: '#9e7353', line: '#5a3d26' },
    '?': { body: '#f5a623', top: '#f7c45e', line: '#c77d00', mark: '#fff' },
    'P': { body: '#2e7d32', top: '#43a047', line: '#1b5e20' },
};

// ==================== CLASSES ====================

class Player {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.w = 28; this.h = 34;
        this.vx = 0; this.vy = 0;
        this.grounded = false;
        this.facing = 1;
        this.big = false;
        this.invincible = 0;
        this.walkFrame = 0;
    }

    get height() { return this.big ? 52 : this.h; }

    update(mapTiles) {
        if (this.invincible > 0) this.invincible--;

        // Horizontal
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) { this.vx = -MOVE_SPEED; this.facing = -1; }
        else if (keys['ArrowRight'] || keys['d'] || keys['D']) { this.vx = MOVE_SPEED; this.facing = 1; }
        else { this.vx *= 0.65; if (Math.abs(this.vx) < 0.3) this.vx = 0; }

        // Jump
        if ((keys['ArrowUp'] || keys['w'] || keys['W'] || keys[' ']) && this.grounded) {
            this.vy = JUMP_FORCE;
            this.grounded = false;
            sfxJump();
        }

        this.vy += GRAVITY;
        if (this.vy > 14) this.vy = 14;
        if (Math.abs(this.vx) > 0.5) this.walkFrame += 0.18;

        // Move X then resolve
        this.x += this.vx;
        this.collide(mapTiles, true);
        // Move Y then resolve
        this.y += this.vy;
        this.grounded = false;
        this.collide(mapTiles, false);

        // Clamp to level width
        if (this.x < 0) { this.x = 0; this.vx = 0; }
        const levelW = (mapTiles[0] ? mapTiles[0].length : 40) * TILE;
        if (this.x + this.w > levelW) { this.x = levelW - this.w; this.vx = 0; }

        // Fell off screen
        if (this.y > H + 60) this.die();
    }

    collide(mapTiles, horiz) {
        const ph = this.height;
        const left = Math.floor(this.x / TILE);
        const right = Math.floor((this.x + this.w - 1) / TILE);
        const top = Math.floor(this.y / TILE);
        const bottom = Math.floor((this.y + ph - 1) / TILE);

        for (let r = top; r <= bottom; r++) {
            for (let c = left; c <= right; c++) {
                const row = mapTiles[r];
                if (!row) continue;
                const ch = row[c];
                if (ch !== '#' && ch !== '?' && ch !== 'P') continue;
                const tx = c * TILE, ty = r * TILE;

                if (horiz) {
                    if (this.vx > 0) { this.x = tx - this.w; this.vx = 0; }
                    else if (this.vx < 0) { this.x = tx + TILE; this.vx = 0; }
                } else {
                    if (this.vy > 0) {
                        this.y = ty - ph; this.vy = 0; this.grounded = true;
                    } else if (this.vy < 0) {
                        this.y = ty + TILE; this.vy = 0;
                        if (ch === '?' && mapTiles[r]) {
                            mapTiles[r][c] = '#'; // Spend the ? block
                            score += 50;
                            sfxCoin();
                        }
                    }
                }
            }
        }
    }

    takeDamage() {
        if (this.invincible > 0) return;
        sfxHurt();
        if (this.big) {
            this.big = false;
            this.y += 18; // height shrink adjustment
            this.invincible = 90;
            shakeTimer = 8;
        } else {
            this.die();
        }
    }

    die() {
        state = 'gameover';
        shakeTimer = 20;
        deathCooldown = 60; // half-second cooldown before retry works
    }

    draw() {
        if (this.invincible > 0 && Math.floor(this.invincible / 5) % 2 === 0) return;
        const sx = this.x - cameraX;
        const ph = this.height;

        ctx.save();
        ctx.translate(sx + this.w / 2, this.y + ph);
        if (this.facing === -1) ctx.scale(-1, 1);

        // Scale for big mode
        const scale = this.big ? 1.5 : 1;
        ctx.scale(scale, scale);

        const bw = this.w / scale;
        const bh = this.h / scale;

        // --- Tail fan ---
        ctx.fillStyle = '#c62828';
        ctx.beginPath();
        ctx.moveTo(-10, -2); ctx.lineTo(0, 8); ctx.lineTo(10, -2);
        ctx.closePath(); ctx.fill();

        // --- Main body ---
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.roundRect(-bw / 2, -bh, bw, bh - 2, [6, 6, 2, 2]);
        ctx.fill();
        ctx.strokeStyle = '#b71c1c'; ctx.lineWidth = 1.5; ctx.stroke();

        // Segment lines
        ctx.strokeStyle = '#c62828'; ctx.lineWidth = 1;
        for (let i = 1; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(-bw / 2 + 2, -bh + i * (bh / 3));
            ctx.lineTo(bw / 2 - 2, -bh + i * (bh / 3));
            ctx.stroke();
        }

        // --- Head ---
        ctx.fillStyle = '#ef5350';
        ctx.beginPath();
        ctx.arc(0, -bh + 2, bw / 2 - 2, Math.PI, 0, false);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#b71c1c'; ctx.lineWidth = 1; ctx.stroke();

        // --- Eye stalks ---
        const ey = -bh - 6;
        ctx.strokeStyle = '#c62828'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-6, -bh + 2); ctx.lineTo(-8, ey); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6, -bh + 2); ctx.lineTo(8, ey); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-8, ey, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, ey, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a237e';
        ctx.beginPath(); ctx.arc(-8, ey, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, ey, 2, 0, Math.PI * 2); ctx.fill();

        // --- Antennae ---
        ctx.strokeStyle = '#ef9a9a'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-5, -bh); ctx.quadraticCurveTo(-20, -bh - 18, -26, -bh - 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(5, -bh); ctx.quadraticCurveTo(20, -bh - 18, 26, -bh - 10); ctx.stroke();

        // --- Claws ---
        const ca = Math.sin(frame * 0.06) * 0.35;
        for (const side of [-1, 1]) {
            ctx.save();
            ctx.translate(side * (bw / 2), -bh * 0.7);
            ctx.rotate(side * ca);
            ctx.fillStyle = '#e53935';
            ctx.beginPath(); ctx.ellipse(side * 8, 0, 9, 6, 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#b71c1c'; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = '#ef5350';
            ctx.beginPath(); ctx.moveTo(side * 13, -5); ctx.lineTo(side * 22, -8); ctx.lineTo(side * 18, 0); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(side * 13, 5); ctx.lineTo(side * 22, 8); ctx.lineTo(side * 18, 0); ctx.closePath(); ctx.fill();
            ctx.restore();
        }

        // --- Walking legs ---
        const lp = this.walkFrame;
        ctx.strokeStyle = '#c62828'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const lk = Math.sin(lp + i * 1.2) * 5;
            const oy = -bh * 0.5 + i * 8;
            ctx.beginPath(); ctx.moveTo(bw / 2 - 2, oy); ctx.lineTo(bw / 2 + 10, oy + 8 + lk); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-bw / 2 + 2, oy); ctx.lineTo(-bw / 2 - 10, oy + 8 - lk); ctx.stroke();
        }

        ctx.restore();
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.w = 32; this.h = 28;
        this.vx = -1.2;
        this.dead = false;
        this.deadTimer = 0;
    }

    update(mapTiles) {
        if (this.dead) { this.deadTimer++; return; }
        this.y += GRAVITY * 1.5; // Apply gravity to enemies too

        // Ground collision for enemy
        this.y += 0; // Already falling via vy equivalent
        const bottom = Math.floor((this.y + this.h) / TILE);
        const centerCol = Math.floor((this.x + this.w / 2) / TILE);
        if (mapTiles[bottom] && '#P'.includes(mapTiles[bottom][centerCol] || '')) {
            this.y = bottom * TILE - this.h;
        }

        this.x += this.vx;

        // Wall bounce
        const ahead = Math.floor((this.vx > 0 ? this.x + this.w + 2 : this.x - 2) / TILE);
        const mid = Math.floor((this.y + this.h / 2) / TILE);
        if (mapTiles[mid] && '#P'.includes(mapTiles[mid][ahead] || '')) {
            this.vx *= -1;
        }

        // Edge detection — don't walk off platforms
        const footCol = Math.floor((this.vx > 0 ? this.x + this.w : this.x) / TILE);
        const footRow = Math.floor((this.y + this.h + 2) / TILE);
        if (mapTiles[footRow] && !mapTiles[footRow][footCol]) {
            this.vx *= -1;
        }
    }

    draw() {
        if (this.dead && this.deadTimer > 25) return;
        const sx = this.x - cameraX;
        ctx.save();
        ctx.translate(sx + this.w / 2, this.y + this.h / 2);
        if (this.dead) {
            ctx.scale(1, -1);
            ctx.globalAlpha = Math.max(0, 1 - this.deadTimer / 25);
        }

        // Body
        ctx.fillStyle = '#ef6c00';
        ctx.beginPath(); ctx.ellipse(0, 3, 16, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#bf360c'; ctx.lineWidth = 1.5; ctx.stroke();

        // Shell pattern
        ctx.strokeStyle = '#e65100'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 3, 8, 0, Math.PI * 2); ctx.stroke();

        // Eye stalks
        ctx.strokeStyle = '#ef6c00'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-7, -5); ctx.lineTo(-9, -15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(7, -5); ctx.lineTo(9, -15); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-9, -15, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(9, -15, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a237e';
        ctx.beginPath(); ctx.arc(-9, -15, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(9, -15, 2, 0, Math.PI * 2); ctx.fill();

        // Claws
        const ca = Math.sin(frame * 0.1) * 0.4;
        ctx.fillStyle = '#ffa726';
        ctx.save(); ctx.translate(-16, -2); ctx.rotate(-0.4 - ca);
        ctx.beginPath(); ctx.ellipse(-6, 0, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.translate(16, -2); ctx.rotate(0.4 + ca);
        ctx.beginPath(); ctx.ellipse(6, 0, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Legs
        ctx.strokeStyle = '#e65100'; ctx.lineWidth = 2;
        const lk = Math.sin(frame * 0.15) * 4;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath(); ctx.moveTo(-10, 6 + i * 3); ctx.lineTo(-18, 14 + i * 3 + lk); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(10, 6 + i * 3); ctx.lineTo(18, 14 + i * 3 - lk); ctx.stroke();
        }

        ctx.restore();
    }
}

class Coin {
    constructor(x, y) { this.x = x; this.y = y; this.r = 10; this.collected = false; }
    draw() {
        if (this.collected) return;
        const sx = this.x - cameraX + this.r;
        const sy = this.y + this.r + Math.sin(frame * 0.07 + this.x) * 3;

        // Glow
        const grd = ctx.createRadialGradient(sx, sy, 2, sx, sy, 18);
        grd.addColorStop(0, 'rgba(255,255,255,0.5)');
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(sx, sy, 18, 0, Math.PI * 2); ctx.fill();

        // Pearl
        ctx.fillStyle = '#e0f7fa';
        ctx.beginPath(); ctx.arc(sx, sy, this.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath(); ctx.arc(sx - 3, sy - 3, 4, 0, Math.PI * 2); ctx.fill();
    }
}

class Powerup {
    constructor(x, y) {
        this.x = x; this.y = y; this.w = 28; this.h = 28;
        this.vx = 1.5; this.vy = 0; this.collected = false;
    }
    update(mapTiles) {
        if (this.collected) return;
        this.vy += GRAVITY;
        this.y += this.vy;
        // Ground
        const bot = Math.floor((this.y + this.h) / TILE);
        const col = Math.floor((this.x + this.w / 2) / TILE);
        if (mapTiles[bot] && '#P'.includes(mapTiles[bot][col] || '')) {
            this.y = bot * TILE - this.h; this.vy = 0;
        }
        this.x += this.vx;
        const ahead = Math.floor((this.vx > 0 ? this.x + this.w : this.x) / TILE);
        const mid = Math.floor((this.y + this.h / 2) / TILE);
        if (mapTiles[mid] && '#P'.includes(mapTiles[mid][ahead] || '')) this.vx *= -1;
        if (this.x < 0 || this.y > H + 40) this.collected = true; // Gone
    }
    draw() {
        if (this.collected) return;
        const sx = this.x - cameraX;
        const bob = Math.sin(frame * 0.07) * 2;
        ctx.save();
        ctx.translate(sx + this.w / 2, this.y + this.h / 2 + bob);

        // Shrimp shape
        ctx.strokeStyle = '#ff7043'; ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, 10, 0.3, Math.PI * 1.2); ctx.stroke();

        // Head
        ctx.fillStyle = '#ff8a65';
        ctx.beginPath(); ctx.arc(8, -7, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(9, -8, 1.5, 0, Math.PI * 2); ctx.fill();

        // Tail
        ctx.strokeStyle = '#ff5722'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-8, 6); ctx.lineTo(-14, 11); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-8, 6); ctx.lineTo(-14, 3); ctx.stroke();

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('RMP', 0, 18);

        ctx.restore();
    }
}

// ==================== LEVEL LOADING ====================
let player, enemies, coins, powerups, mapTiles, goalX, goalY;

function loadLevel(n) {
    const raw = LEVEL_DATA[(n - 1) % LEVEL_DATA.length];
    // Deep copy so mutations on ? blocks don't persist
    mapTiles = raw.map(row => row.split(''));

    enemies = []; coins = []; powerups = [];
    goalX = 0; goalY = 0;
    let spawnX = 60, spawnY = 9 * TILE - 34; // Default safe spawn (row 9, above ground)

    for (let r = 0; r < mapTiles.length; r++) {
        for (let c = 0; c < mapTiles[r].length; c++) {
            const ch = mapTiles[r][c];
            const px = c * TILE, py = r * TILE;
            if (ch === 'E') { enemies.push(new Enemy(px, py)); mapTiles[r][c] = ' '; }
            else if (ch === 'C') { coins.push(new Coin(px, py)); mapTiles[r][c] = ' '; }
            else if (ch === 'S') { powerups.push(new Powerup(px, py)); mapTiles[r][c] = ' '; }
            else if (ch === 'G') { goalX = px; goalY = py; mapTiles[r][c] = ' '; }
            else if (ch === '@') { spawnX = px; spawnY = py; mapTiles[r][c] = ' '; }
        }
    }

    player = new Player(spawnX, spawnY);
    cameraX = 0;
    deathCooldown = 60;
}

function startGame() { initAudio(); level = 1; score = 0; loadLevel(level); state = 'playing'; }
function nextLevel() { level++; loadLevel(level); state = 'playing'; }
function restartGame() { loadLevel(level); state = 'playing'; }

// ==================== DRAW HELPERS ====================
function drawTile(c, r, ch) {
    const sx = c * TILE - cameraX;
    if (sx + TILE < 0 || sx > W) return;
    const sy = r * TILE;
    const col = COLORS[ch];
    if (!col) return;

    // Body
    ctx.fillStyle = col.body;
    ctx.fillRect(sx, sy, TILE, TILE);

    // Top highlight
    ctx.fillStyle = col.top;
    ctx.fillRect(sx, sy, TILE, 5);

    // Outline
    ctx.strokeStyle = col.line || '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, sy + 0.5, TILE - 1, TILE - 1);

    // Inner brick lines for # blocks
    if (ch === '#') {
        ctx.strokeStyle = col.line;
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(sx, sy + TILE / 2); ctx.lineTo(sx + TILE, sy + TILE / 2); ctx.stroke();
        const offset = (r % 2 === 0) ? TILE / 2 : 0;
        ctx.beginPath(); ctx.moveTo(sx + offset, sy); ctx.lineTo(sx + offset, sy + TILE); ctx.stroke();
    }

    // ? mark
    if (ch === '?') {
        ctx.fillStyle = col.mark;
        ctx.font = `bold ${Math.floor(TILE * 0.55)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('?', sx + TILE / 2, sy + TILE / 2 + 1);
        ctx.textBaseline = 'alphabetic';
    }
}

function drawBackground() {
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#0d47a1');
    grd.addColorStop(0.5, '#0a3060');
    grd.addColorStop(1, '#061525');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Seaweed
    for (let i = 0; i < 15; i++) {
        const bx = (i * 173 + 50) % (W + 300);
        const by = H - 20;
        const h2 = 40 + (i * 31 % 60);
        const sway = Math.sin(frame * 0.015 + i) * 8;
        ctx.strokeStyle = `rgba(56, 142, 60, ${0.25 + (i % 3) * 0.08})`;
        ctx.lineWidth = 3 + (i % 3);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + sway, by - h2 / 2, bx + sway * 1.5, by - h2);
        ctx.stroke();
    }

    // Bubbles
    for (let i = 0; i < 10; i++) {
        const age = (frame * (0.4 + i * 0.08) + i * 60) % (H + 30);
        const bx = (i * 89 + 30) % W;
        const by = H - age;
        const r = 2 + i % 4;
        ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${0.12 + (i % 3) * 0.05})`;
        ctx.lineWidth = 1; ctx.stroke();
    }
}

function drawGoal() {
    const sx = goalX - cameraX;
    const sy = goalY;
    const bob = Math.sin(frame * 0.05) * 4;
    ctx.save();
    ctx.translate(sx + TILE / 2, sy + TILE / 2 + bob);

    // Body
    ctx.fillStyle = '#795548';
    ctx.fillRect(-20, -8, 40, 22);
    ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 1.5; ctx.strokeRect(-20, -8, 40, 22);

    // Lid
    ctx.fillStyle = '#a1887f';
    ctx.beginPath(); ctx.arc(0, -8, 20, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4e342e'; ctx.stroke();

    // Gold trim
    ctx.fillStyle = '#fdd835';
    ctx.fillRect(-20, -10, 40, 4);
    ctx.fillRect(-4, -6, 8, 10);

    // Sparkle
    const sp = 0.5 + Math.sin(frame * 0.12) * 0.5;
    ctx.globalAlpha = sp;
    ctx.fillStyle = '#fff176';
    ctx.beginPath(); ctx.arc(10, -14, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-12, -10, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();
}

function drawHUD() {
    ctx.fillStyle = 'rgba(0,0,30,0.55)';
    ctx.fillRect(0, 0, W, 38);
    ctx.strokeStyle = 'rgba(0,188,212,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 37, W, 0);

    ctx.fillStyle = '#ef5350';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🦞 LOBSTER MARIO', 12, 25);

    if (player.big) {
        ctx.fillStyle = '#76ff03';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('★ BIG!', 210, 25);
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`💎 ${score}`, W / 2, 25);

    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL ${level}`, W - 12, 25);
}

// ==================== SCREENS ====================
function drawTitle() {
    drawBackground();
    ctx.fillStyle = 'rgba(0,0,20,0.72)';
    ctx.fillRect(W / 2 - 260, H / 2 - 130, 520, 260);
    ctx.strokeStyle = '#00bcd4'; ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 260, H / 2 - 130, 520, 260);

    ctx.fillStyle = '#ef5350';
    ctx.font = 'bold 46px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🦞 LOBSTER MARIO', W / 2, H / 2 - 50);

    ctx.fillStyle = '#80deea';
    ctx.font = '20px sans-serif';
    ctx.fillText('Underwater Platformer Adventure', W / 2, H / 2 - 12);

    const blink = Math.sin(frame * 0.07) > 0;
    ctx.fillStyle = blink ? '#fff' : '#aaa';
    ctx.font = '16px sans-serif';
    ctx.fillText('🖱️ Click or press any key to START', W / 2, H / 2 + 40);

    ctx.fillStyle = '#90a4ae';
    ctx.font = '13px sans-serif';
    ctx.fillText('Arrow Keys / WASD  ·  Space or W to Jump  ·  Stomp crabs from above!', W / 2, H / 2 + 80);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(W / 2 - 220, H / 2 - 90, 440, 180);
    ctx.strokeStyle = '#fdd835'; ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 220, H / 2 - 90, 440, 180);
    ctx.fillStyle = '#fdd835';
    ctx.font = 'bold 38px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('✨ LEVEL CLEAR! ✨', W / 2, H / 2 - 20);
    ctx.fillStyle = '#fff'; ctx.font = '18px sans-serif';
    ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 20);
    const blink = Math.sin(frame * 0.07) > 0;
    ctx.fillStyle = blink ? '#80deea' : '#ccc';
    ctx.font = '15px sans-serif';
    ctx.fillText('Click for Next Level', W / 2, H / 2 + 60);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(W / 2 - 200, H / 2 - 80, 400, 160);
    ctx.strokeStyle = '#f44336'; ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 200, H / 2 - 80, 400, 160);
    ctx.fillStyle = '#f44336';
    ctx.font = 'bold 38px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 15);
    const blink = Math.sin(frame * 0.07) > 0;
    ctx.fillStyle = blink ? '#fff' : '#ccc';
    ctx.font = '16px sans-serif';
    ctx.fillText('Click or press Enter to Retry', W / 2, H / 2 + 35);
}

// ==================== MAIN LOOP ====================
function update() {
    frame++;
    if (deathCooldown > 0) deathCooldown--;

    // Allow keyboard start/retry from anywhere
    if (state === 'title' && (keys['Enter'] || keys[' '])) { startGame(); return; }
    if (state === 'gameover' && deathCooldown <= 0 && keys['Enter']) { restartGame(); return; }

    if (state !== 'playing') return;

    player.update(mapTiles);

    // Camera — smooth follow with clamp
    const targetCam = player.x - W / 3;
    const mapW = (mapTiles[0] ? mapTiles[0].length : 40) * TILE - W;
    cameraX += (targetCam - cameraX) * 0.12;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > mapW) cameraX = mapW;

    enemies.forEach(e => e.update(mapTiles));
    powerups.forEach(p => p.update(mapTiles));

    // Player vs Enemies
    enemies.forEach(e => {
        if (e.dead) return;
        const ph = player.height;
        const overlapX = player.x + player.w > e.x && player.x < e.x + e.w;
        const overlapY = player.y + ph > e.y && player.y < e.y + e.h;
        if (!overlapX || !overlapY) return;

        // Stomp: player falling and player's feet above enemy midpoint
        if (player.vy > 1 && (player.y + ph) < (e.y + e.h / 2 + 12)) {
            e.dead = true;
            player.vy = -9;
            score += 100;
            sfxStomp(); shakeTimer = 5;
        } else {
            player.takeDamage();
        }
    });

    // Player vs Coins
    coins.forEach(c => {
        if (c.collected) return;
        if (player.x + player.w > c.x && player.x < c.x + c.r * 2 &&
            player.y + player.height > c.y && player.y < c.y + c.r * 2) {
            c.collected = true; score += 10; sfxCoin();
        }
    });

    // Player vs Powerup
    powerups.forEach(p => {
        if (p.collected) return;
        if (player.x + player.w > p.x && player.x < p.x + p.w &&
            player.y + player.height > p.y && player.y < p.y + p.h) {
            p.collected = true; player.big = true; sfxPowerup();
        }
    });

    // Goal
    if (goalX > 0 &&
        player.x + player.w > goalX && player.x < goalX + TILE &&
        player.y + player.height > goalY && player.y < goalY + TILE) {
        score += 500; state = 'victory';
    }

    if (shakeTimer > 0) shakeTimer--;
}

function draw() {
    ctx.save();
    if (shakeTimer > 0) {
        ctx.translate(
            (Math.random() * 2 - 1) * shakeTimer,
            (Math.random() * 2 - 1) * shakeTimer
        );
    }

    if (state === 'title') { drawTitle(); ctx.restore(); return; }

    drawBackground();

    // Level tiles
    for (let r = 0; r < mapTiles.length; r++) {
        for (let c = 0; c < mapTiles[r].length; c++) {
            drawTile(c, r, mapTiles[r][c]);
        }
    }

    if (goalX > 0) drawGoal();
    coins.forEach(c => c.draw());
    powerups.forEach(p => p.draw());
    enemies.forEach(e => e.draw());
    player.draw();
    drawHUD();

    if (state === 'victory') drawVictory();
    if (state === 'gameover') drawGameOver();

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start!
gameLoop();
