const Game = {
  canvas: null,
  ctx: null,
  width: 1024,
  height: 576,
  groundY: 500,
  debug: false,
  stage: null,
  stageImage: null,
  fighters: [],
  keys: {},
  lastTime: 0,
  roundOver: false,
  matchOver: false,
  winner: null,
  roundWins: [0, 0],
  currentRound: 1,
  roundTimer: 99,
  koTimer: 0,
  state: "select",
  screenShake: 0,

  // Input-buffer: trykk husker seg selv i 0.25s slik at input rett før
  // et angrep er ferdig ikke forsvinner (og gamle trykk ikke henger igjen)
  INPUT_BUFFER: 0.25,

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.pressed = {};
    this.fightStarted = false;
    this.announceTimer = 0;
    this.announcePhase = "";

    window.addEventListener("keydown", e => {
      if (e.repeat) return;
      this.keys[e.code] = true;
      this.pressed[e.code] = this.INPUT_BUFFER;

      // Init audio on first key press
      AudioSystem.init();
      AudioSystem.resume();

      if (this.state === "select") {
        SelectScreen.handleKey(e.code);
        e.preventDefault();
        return;
      }

      if (e.code === "KeyY") this.debug = !this.debug;
      if (e.code === "KeyR" && (this.matchOver || (this.state === "bonus" && BonusStage.finished))) {
        this.returnToSelect();
      }
      e.preventDefault();
    });
    window.addEventListener("keyup", e => {
      this.keys[e.code] = false;
    });
  },

  async loadStage(stageData) {
    this.stage = stageData;
    this.stageImage = await this.loadImage(stageData.background);
  },

  spriteVersion: 38,

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load: " + src));
      img.src = src + (src.includes("?") ? "&" : "?") + "v=" + Game.spriteVersion;
    });
  },

  async preloadStageImages(stages) {
    for (const s of stages) {
      try {
        s._image = await this.loadImage(s.background);
      } catch {
        s._image = null;
      }
    }
  },

  async addFighter(charData, playerIndex, controls) {
    const fighter = new Fighter(charData, playerIndex, controls);
    await fighter.loadSprites();
    this.fighters.push(fighter);
    return fighter;
  },

  async startFight() {
    const sel = SelectScreen.getSelections();
    this.state = "loading";

    this.fighters = [];
    this.projectiles = [];
    this.roundOver = false;
    this.matchOver = false;
    this.winner = null;
    this.roundWins = [0, 0];
    this.currentRound = 1;
    this.roundTimer = 99;
    this.koTimer = 0;

    try {
      this.stageImage = sel.stage._image;
      this.stage = sel.stage;
    } catch {
      this.stageImage = null;
    }

    await this.addFighter(sel.p1, 0, {
      left: "KeyA", right: "KeyD", up: "KeyW", down: "KeyS",
      punch: "KeyF", kick: "KeyG"
    });
    await this.addFighter(sel.p2, 1, {
      left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown",
      punch: "KeyN", kick: "KeyM"
    });

    if (sel.vsCPU) {
      this.fighters[1].isCPU = true;
    }

    this.bonusMode = false;
    AudioSystem.stopMusic();
    this.state = "announce";
    this.announcePhase = "round";
    this.announceTimer = 0;
    this.fightStarted = false;
    AudioSystem.announceRound(1);
  },

  async startBonus() {
    const sel = SelectScreen.getSelections();
    this.state = "loading";
    this.bonusMode = true;

    this.fighters = [];
    this.projectiles = [];
    this.roundOver = false;
    this.matchOver = false;
    this.winner = null;

    const stage = SelectScreen.stages[0];
    this.stage = stage;
    this.stageImage = stage._image || null;

    await this.addFighter(sel.p1, 0, {
      left: "KeyA", right: "KeyD", up: "KeyW", down: "KeyS",
      punch: "KeyF", kick: "KeyG"
    });
    this.fighters[0].x = 250;

    await BonusStage.init();

    AudioSystem.stopMusic();
    this.state = "announce";
    this.announcePhase = "round";
    this.announceTimer = 0;
    this.fightStarted = false;
    AudioSystem.speakAnnouncement("Bonus Stage");
  },

  startNextRound() {
    if (this.state !== "fight") return;
    this.currentRound++;
    this.roundOver = false;
    this.winner = null;
    this.roundTimer = 99;
    this.koTimer = 0;
    this.projectiles = [];
    this.fighters.forEach(f => f.reset());

    this.state = "announce";
    this.announcePhase = "round";
    this.announceTimer = 0;
    this.fightStarted = false;
    AudioSystem.announceRound(this.currentRound);
  },

  returnToSelect() {
    this.state = "select";
    this.bonusMode = false;
    this._starting = false;
    this.fighters = [];
    this.roundOver = false;
    this.matchOver = false;
    this.winner = null;
    this.roundWins = [0, 0];
    this.currentRound = 1;
    this.fightStarted = false;
    SelectScreen.phase = "character";
    SelectScreen.ready = [false, false];
    AudioSystem.startSelectMusic();
  },

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame(t => this.loop(t));
  },

  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame(t => this.loop(t));
  },

  consumePress(code) {
    if (this.pressed[code] > 0) {
      this.pressed[code] = 0;
      return true;
    }
    return false;
  },

  decayPressed(dt) {
    for (const code in this.pressed) {
      if (this.pressed[code] > 0) {
        this.pressed[code] = Math.max(0, this.pressed[code] - dt);
      }
    }
  },

  update(dt) {
    this.decayPressed(dt);

    if (this.state === "select") {
      SelectScreen.update(dt);
      // Start kampen når select-skjermen er klar (kan skje etter jubel, uten tastetrykk)
      if (SelectScreen.phase === "fight" && !this._starting) {
        this._starting = true;
        if (SelectScreen.getSelections().bonusMode) {
          this.startBonus();
        } else {
          this.startFight();
        }
      }
      return;
    }

    if (this.state === "announce") {
      this.announceTimer += dt;
      if (this.announcePhase === "round" && this.announceTimer >= 1.5) {
        this.announcePhase = "fight";
        this.announceTimer = 0;
        AudioSystem.announceFight();
      }
      if (this.announcePhase === "fight" && this.announceTimer >= 1.2) {
        this.state = this.bonusMode ? "bonus" : "fight";
        this.fightStarted = true;
        AudioSystem.startBattleMusic();
      }
      return;
    }

    if (this.state === "bonus") {
      this.updateBonus(dt);
      return;
    }

    if (this.state !== "fight") return;

    if (this.koTimer > 0) this.koTimer -= dt;

    // Rundetimer teller ned mens runden pågår
    if (!this.roundOver) {
      this.roundTimer -= dt;
      if (this.roundTimer <= 0) {
        this.roundTimer = 0;
        const [a, b] = this.fighters;
        const pctA = a.health / a.maxHealth;
        const pctB = b.health / b.maxHealth;
        if (pctA === pctB) {
          this.endRoundDraw();
        } else {
          this.endRound(pctA < pctB ? a : b, true);
        }
      }
    }

    for (const f of this.fighters) {
      if (f.isCPU) {
        f.updateAI(dt, this);
      } else {
        f.handleInput(this.keys, this);
      }
      f.update(dt, this);
    }

    this.updateProjectiles(dt);
    this.resolveBodyCollision();
  },

  // ---- Prosjektiler (hadouken/ice ball) — flyr til de treffer eller forlater banen ----
  projectiles: [],

  spawnProjectile(fighter, animInfo) {
    this.projectiles.push({
      x: fighter.x + fighter.facing * 55,
      y: this.groundY + fighter.airY - fighter.drawSize * 0.42,
      vx: fighter.facing * 460,
      damage: animInfo.damage || 15,
      type: animInfo.projectile,
      owner: fighter,
      trail: [],
      age: 0
    });
    AudioSystem.playBlock(); // kort "fwoosh"-aktig avfyringslyd
  },

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.age += dt;
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > 8) p.trail.pop();
      p.x += p.vx * dt;

      // Utenfor banen?
      if (p.x < -60 || p.x > this.width + 60) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Treff på motstander (i kamp)
      const opponent = this.fighters.find(f => f !== p.owner && !f.knockedOut);
      if (opponent) {
        const b = opponent.getBodyBox();
        if (p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h) {
          opponent.takeHit(p.damage, p.owner, true);
          this.screenShake = Math.max(this.screenShake, 5);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Treff på logoen (i bonus)
      if (this.state === "bonus" && !BonusStage.finished && BonusStage.intersects({ x: p.x - 10, y: p.y - 10, w: 20, h: 20 })) {
        BonusStage.hit(p.damage, p.owner.x);
        this.projectiles.splice(i, 1);
      }
    }
  },

  renderProjectiles(ctx) {
    for (const p of this.projectiles) {
      const colors = p.type === "ice"
        ? { core: "#eaf8ff", mid: "rgba(140,210,255,0.9)", glow: "rgba(80,170,255,0.35)" }
        : { core: "#ffffff", mid: "rgba(110,190,255,0.9)", glow: "rgba(60,140,255,0.35)" };

      // Hale
      for (let t = 0; t < p.trail.length; t++) {
        const tr = p.trail[t];
        const a = (1 - t / p.trail.length) * 0.4;
        ctx.fillStyle = colors.glow.replace("0.35", a.toFixed(2));
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, 14 * (1 - t / p.trail.length), 0, Math.PI * 2);
        ctx.fill();
      }

      // Kjerne med glød
      const pulse = 1 + Math.sin(p.age * 25) * 0.15;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 22 * pulse);
      g.addColorStop(0, colors.core);
      g.addColorStop(0.4, colors.mid);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 22 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Is-krystaller / energignister rundt
      ctx.fillStyle = colors.core;
      for (let s = 0; s < 3; s++) {
        const a = p.age * 12 + (s / 3) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(a) * 14, p.y + Math.sin(a) * 14, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  updateBonus(dt) {
    const f = this.fighters[0];
    if (!f) return;

    f.handleInput(this.keys, this);
    f.update(dt, this);

    // Snu mot skiltet
    if (!f.attacking && f.airY === 0) {
      f.facing = f.x < BonusStage.signX ? 1 : -1;
    }

    // Treffsjekk mot logoen
    if (f.attacking && !f.hasHit && !BonusStage.finished) {
      const animInfo = f.data.animations[f.attackType];
      const hitFrame = animInfo ? (animInfo.hitFrame || 0) : 0;
      const hasSprites = !!f.sprites[f.attackType];
      const inWindow = hasSprites
        ? (f.frameIndex >= hitFrame && f.frameIndex <= hitFrame + 4)
        : (f.attackTimer >= f.attackDuration * 0.5);
      if (inWindow && BonusStage.intersects(f.getAttackBox())) {
        f.hasHit = true;
        const dmg = animInfo && animInfo.damage ? animInfo.damage : 8;
        BonusStage.hit(dmg, f.x);
      }
    }

    this.updateProjectiles(dt);
    BonusStage.update(dt);
  },

  // Kroppene dytter hverandre — man kan ikke stå oppå motstanderen
  resolveBodyCollision() {
    const [a, b] = this.fighters;
    if (!a || !b || a.knockedOut || b.knockedOut) return;
    if (a.airY < 0 || b.airY < 0) return; // hopp over hverandre er lov

    const boxA = a.getBodyBox();
    const boxB = b.getBodyBox();
    if (!a.boxOverlap(boxA, boxB)) return;

    const overlap = Math.min(boxA.x + boxA.w, boxB.x + boxB.w) - Math.max(boxA.x, boxB.x);
    const push = overlap / 2 + 1;
    if (a.x <= b.x) {
      a.x -= push;
      b.x += push;
    } else {
      a.x += push;
      b.x -= push;
    }
    a.x = Math.max(50, Math.min(this.width - 50, a.x));
    b.x = Math.max(50, Math.min(this.width - 50, b.x));
  },

  endRound(loser, byTimeout = false) {
    if (this.roundOver) return;
    this.roundOver = true;
    this.winner = this.fighters.find(f => f !== loser) || null;
    AudioSystem.stopMusic();
    if (!byTimeout) {
      AudioSystem.playKO();
      this.koTimer = 1.2;
    }

    if (this.winner) {
      this.roundWins[this.winner.playerIndex]++;
    }

    if (this.winner && this.roundWins[this.winner.playerIndex] >= 2) {
      this.matchOver = true;
      setTimeout(() => {
        if (this.winner) AudioSystem.announceWinner(this.winner.data.name);
      }, 600);
    } else {
      setTimeout(() => this.startNextRound(), 2500);
    }
  },

  endRoundDraw() {
    if (this.roundOver) return;
    this.roundOver = true;
    this.winner = null;
    AudioSystem.stopMusic();
    setTimeout(() => this.startNextRound(), 2500);
  },

  render() {
    const ctx = this.ctx;

    if (this.state === "select") {
      SelectScreen.render(ctx, this.width, this.height);
      return;
    }

    if (this.state === "loading") {
      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = "#e63946";
      ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("LASTER...", this.width / 2, this.height / 2);
      ctx.textAlign = "left";
      return;
    }

    if (this.state === "announce") {
      if (this.stageImage) {
        ctx.drawImage(this.stageImage, 0, 0, this.width, this.height);
      } else {
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, this.width, this.height);
      }
      for (const f of this.fighters) {
        f.render(ctx, false);
      }

      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.textAlign = "center";
      if (this.announcePhase === "round") {
        const announceText = this.bonusMode ? "BONUS STAGE" : "ROUND " + this.currentRound;
        const pulse = 1 + Math.sin(this.announceTimer * 6) * 0.1;
        ctx.save();
        ctx.translate(this.width / 2, this.height / 2 - 20);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 60px 'Segoe UI', Arial, sans-serif";
        ctx.fillText(announceText, 0, 0);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText(announceText, 0, 0);
        ctx.restore();
      } else if (this.announcePhase === "fight") {
        const scale = Math.min(this.announceTimer * 4, 1.5);
        const alpha = Math.min(this.announceTimer * 3, 1);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.width / 2, this.height / 2 - 20);
        ctx.scale(scale, scale);
        ctx.fillStyle = "#e63946";
        ctx.font = "bold 80px 'Segoe UI', Arial, sans-serif";
        ctx.fillText("FIGHT!", 0, 0);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 4;
        ctx.strokeText("FIGHT!", 0, 0);
        ctx.restore();
      }
      ctx.textAlign = "left";

      if (!this.bonusMode) this.renderHealthBars(ctx);
      return;
    }

    if (this.state === "bonus") {
      this.renderBonus(ctx);
      return;
    }

    ctx.save();
    if (this.screenShake > 0.5) {
      const sx = (Math.random() - 0.5) * this.screenShake * 2;
      const sy = (Math.random() - 0.5) * this.screenShake * 2;
      ctx.translate(sx, sy);
      this.screenShake *= 0.85;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }

    if (this.stageImage) {
      ctx.drawImage(this.stageImage, 0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = "#2a2a3e";
      ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
    }

    for (const f of this.fighters) {
      f.render(ctx, this.debug);
    }
    this.renderProjectiles(ctx);
    ctx.restore();

    this.renderHealthBars(ctx);

    // K.O.!-flash
    if (this.koTimer > 0) {
      const t = 1.2 - this.koTimer;
      const scale = Math.min(t * 6, 1.6);
      ctx.save();
      ctx.globalAlpha = Math.min(t * 5, 1);
      ctx.translate(this.width / 2, this.height / 2 - 30);
      ctx.scale(scale, scale);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff2222";
      ctx.font = "bold 96px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("K.O.!", 0, 0);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 5;
      ctx.strokeText("K.O.!", 0, 0);
      ctx.restore();
      ctx.textAlign = "left";
    }

    if (this.matchOver) {
      this.renderWinScreen(ctx);
    } else if (this.roundOver && this.koTimer <= 0) {
      this.renderRoundBanner(ctx);
    }

    // Controls hint bar
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, this.height - 22, this.width, 22);
    ctx.font = "11px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "#e63946";
    ctx.textAlign = "left";
    ctx.fillText("P1: A/D Gå  W Hopp  F Slag  G Spark  Hold bak = Blokk  ↓+F Spesial", 10, this.height - 7);
    ctx.fillStyle = "#457b9d";
    ctx.textAlign = "right";
    if (this.fighters[1] && this.fighters[1].isCPU) {
      ctx.fillText("P2: CPU", this.width - 10, this.height - 7);
    } else {
      ctx.fillText("P2: ←/→ Gå  ↑ Hopp  N Slag  M Spark  Hold bak = Blokk  ↓+N Spesial", this.width - 10, this.height - 7);
    }
    ctx.textAlign = "left";

    if (this.debug) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(5, this.height - 47, 220, 20);
      ctx.fillStyle = "#0f0";
      ctx.font = "12px monospace";
      ctx.fillText("DEBUG [Y] — hitboxes visible", 10, this.height - 32);
    }
  },

  renderBonus(ctx) {
    ctx.save();
    if (this.screenShake > 0.5) {
      const sx = (Math.random() - 0.5) * this.screenShake * 2;
      const sy = (Math.random() - 0.5) * this.screenShake * 2;
      ctx.translate(sx, sy);
      this.screenShake *= 0.85;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }

    if (this.stageImage) {
      ctx.drawImage(this.stageImage, 0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = "#2a2a3e";
      ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
    }

    BonusStage.render(ctx);
    for (const f of this.fighters) {
      f.render(ctx, this.debug);
    }
    this.renderProjectiles(ctx);
    ctx.restore();

    BonusStage.renderUI(ctx);

    // Controls hint bar
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, this.height - 22, this.width, 22);
    ctx.font = "11px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "#e63946";
    ctx.textAlign = "left";
    ctx.fillText("A/D Gå  W Hopp  F Slag  G Spark  ↓+G Sweep  ↓+F Spesial — knus logoen!", 10, this.height - 7);
    ctx.textAlign = "left";
  },

  renderHealthBars(ctx) {
    const barW = 250;
    const barH = 24;
    const barY = 10;
    const padding = 30;

    for (let i = 0; i < this.fighters.length; i++) {
      const f = this.fighters[i];
      const barX = i === 0 ? padding : this.width - padding - barW;
      const pct = f.health / f.maxHealth;

      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

      ctx.fillStyle = "#333";
      ctx.fillRect(barX, barY, barW, barH);

      const healthColor = pct > 0.5 ? "#2ecc40" : pct > 0.25 ? "#ff851b" : "#e63946";
      if (i === 0) {
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barW * pct, barH);
      } else {
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX + barW * (1 - pct), barY, barW * pct, barH);
      }

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = i === 0 ? "left" : "right";
      const nameX = i === 0 ? barX + 8 : barX + barW - 8;
      ctx.fillText(f.data.name.toUpperCase(), nameX, barY + 17);

      ctx.font = "bold 12px monospace";
      const hpX = i === 0 ? barX + barW - 8 : barX + 8;
      ctx.textAlign = i === 0 ? "right" : "left";
      ctx.fillText(`${Math.ceil(f.health)} HP`, hpX, barY + 17);

      // Runde-indikatorer (best av 3)
      for (let r = 0; r < 2; r++) {
        const dotX = i === 0 ? barX + 10 + r * 18 : barX + barW - 10 - r * 18;
        const dotY = barY + barH + 12;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
        ctx.fillStyle = r < this.roundWins[i] ? "#ffcc00" : "rgba(0,0,0,0.5)";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Spesial-meter (cooldown)
      if (f.getSpecialType && f.getSpecialType()) {
        const meterW = 110;
        const meterH = 6;
        const meterX = i === 0 ? barX + 50 : barX + barW - 50 - meterW;
        const meterY = barY + barH + 8;
        const ready = f.specialCooldown <= 0;
        const fill = 1 - Math.min(f.specialCooldown / 3, 1);

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(meterX, meterY, meterW, meterH);
        ctx.fillStyle = ready ? "#ffcc00" : "#777";
        ctx.fillRect(meterX, meterY, meterW * fill, meterH);
        if (ready) {
          ctx.fillStyle = "#ffcc00";
          ctx.font = "bold 9px 'Segoe UI', Arial, sans-serif";
          ctx.textAlign = i === 0 ? "left" : "right";
          ctx.fillText("SPESIAL KLAR", i === 0 ? meterX : meterX + meterW, meterY + 16);
        }
      }
    }
    ctx.textAlign = "left";

    // Rundetimer i midten
    if (this.state === "fight" || this.state === "announce") {
      ctx.textAlign = "center";
      const secs = Math.ceil(this.roundTimer);
      ctx.fillStyle = secs <= 10 ? "#ff3333" : "#fff";
      ctx.font = "bold 34px monospace";
      ctx.fillText(String(secs), this.width / 2, barY + 30);
      ctx.fillStyle = "#888";
      ctx.font = "bold 12px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("RUNDE " + this.currentRound, this.width / 2, barY + 46);
      ctx.textAlign = "left";
    }
  },

  renderRoundBanner(ctx) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, this.height / 2 - 70, this.width, 120);

    ctx.textAlign = "center";
    if (this.winner) {
      ctx.fillStyle = "#ffcc00";
      ctx.font = "bold 42px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(this.winner.data.name.toUpperCase() + " VINNER RUNDEN", this.width / 2, this.height / 2 - 15);
    } else {
      ctx.fillStyle = "#aaa";
      ctx.font = "bold 42px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("UAVGJORT", this.width / 2, this.height / 2 - 15);
    }
    ctx.fillStyle = "#ccc";
    ctx.font = "18px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("Neste runde starter snart...", this.width / 2, this.height / 2 + 25);
    ctx.textAlign = "left";
  },

  renderWinScreen(ctx) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = "center";

    ctx.fillStyle = "#e63946";
    ctx.font = "bold 48px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(this.winner.data.name.toUpperCase(), this.width / 2, this.height / 2 - 20);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("WINS!", this.width / 2, this.height / 2 + 20);

    ctx.fillStyle = "#aaa";
    ctx.font = "18px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("Trykk R for å velge på nytt", this.width / 2, this.height / 2 + 65);

    ctx.textAlign = "left";
  }
};
