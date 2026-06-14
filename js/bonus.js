// ============================================
// BONUS STAGE — KNUS EXCEL-ARKET!
// Inspirert av Street Fighter II sin bil-bonusbane:
// 40 sekunder, poeng per treff. HELE arket (tittellinje, kolonner,
// radnumre og celler) sprekker for hvert slag og knuses så til
// små glass-splinter.
// ============================================

const BonusStage = {
  // Datacelle-rutenett
  cols: 8,
  rows: 6,
  cellW: 70,
  cellH: 30,

  // Excel-"chrome"
  titleH: 28,      // grønn tittellinje
  colHeadH: 22,    // kolonnebokstaver (A, B, C ...)
  rowNumW: 36,     // radnummer-kolonne (1, 2, 3 ...)

  signX: 512,
  standH: 70,

  crackThreshold: 2, // antall sprekker før en flis knuses til splinter

  tiles: [],
  shards: [],
  hits: 0,
  score: 0,
  timer: 40,
  finished: false,
  destroyed: false,
  flashTimer: 0,
  resultTimer: 0,

  get dataW() { return this.cols * this.cellW; },
  get dataH() { return this.rows * this.cellH; },
  get sheetW() { return this.rowNumW + this.dataW; },
  get sheetH() { return this.titleH + this.colHeadH + this.dataH; },
  get signTop() { return Game.groundY - this.standH - this.sheetH; },
  get signLeft() { return this.signX - this.sheetW / 2; },

  async init() {
    this.tiles = [];
    this.shards = [];
    this.hits = 0;
    this.score = 0;
    this.timer = 40;
    this.finished = false;
    this.destroyed = false;
    this.flashTimer = 0;
    this.resultTimer = 0;

    // Tegn HELE Excel-arket (chrome + celler) på ett offscreen-canvas.
    const c = document.createElement("canvas");
    c.width = this.sheetW;
    c.height = this.sheetH;
    this._drawSheet(c.getContext("2d"));
    this._sheetCanvas = c;

    // Del hele arket i fliser. Kolonnene: radnummer-kolonne + datakolonner.
    // Radene: tittellinje + kolonneoverskrift + datarader.
    const colX = [0], colW = [this.rowNumW];
    for (let i = 0; i < this.cols; i++) { colX.push(this.rowNumW + i * this.cellW); colW.push(this.cellW); }
    const rowY = [0, this.titleH], rowH = [this.titleH, this.colHeadH];
    for (let r = 0; r < this.rows; r++) { rowY.push(this.titleH + this.colHeadH + r * this.cellH); rowH.push(this.cellH); }

    for (let ri = 0; ri < rowY.length; ri++) {
      for (let ci = 0; ci < colX.length; ci++) {
        const sx = colX[ci], sy = rowY[ri], sw = colW[ci], sh = rowH[ri];
        this.tiles.push({
          sx, sy, sw, sh,
          attached: true,
          cracks: 0,
          crackRays: this._makeCrackRays(sw, sh)
        });
      }
    }
  },

  // Tegner hele arket i ark-lokale koordinater (0..sheetW, 0..sheetH)
  _drawSheet(x) {
    const W = this.sheetW;

    // Tittellinje (grønn Excel-bjelke)
    x.fillStyle = "#217346";
    x.fillRect(0, 0, W, this.titleH);
    x.fillStyle = "#fff";
    x.font = "bold 14px 'Segoe UI', Arial, sans-serif";
    x.textAlign = "left";
    x.textBaseline = "middle";
    x.fillText("Mappe1 — Excel", 10, this.titleH / 2 + 1);
    x.fillStyle = "#1b5e3a";
    x.fillRect(W - 22, 7, 14, 14);
    x.fillStyle = "#fff";
    x.font = "bold 10px Arial";
    x.textAlign = "center";
    x.fillText("X", W - 15, 14 + 1);

    const headTop = this.titleH;
    // Hjørneboks (markér alt)
    x.fillStyle = "#e6e6e6";
    x.fillRect(0, headTop, this.rowNumW, this.colHeadH);
    x.strokeStyle = "#bdbdbd";
    x.lineWidth = 1;
    x.strokeRect(0.5, headTop + 0.5, this.rowNumW, this.colHeadH);

    // Kolonnebokstaver (A, B, C ...)
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.font = "12px 'Segoe UI', Arial, sans-serif";
    const dataLeft = this.rowNumW;
    for (let col = 0; col < this.cols; col++) {
      const cx = dataLeft + col * this.cellW;
      x.fillStyle = "#e6e6e6";
      x.fillRect(cx, headTop, this.cellW, this.colHeadH);
      x.strokeStyle = "#bdbdbd";
      x.strokeRect(cx + 0.5, headTop + 0.5, this.cellW, this.colHeadH);
      x.fillStyle = "#333";
      x.fillText(String.fromCharCode(65 + col), cx + this.cellW / 2, headTop + this.colHeadH / 2 + 1);
    }

    const dataTop = this.titleH + this.colHeadH;
    // Radnumre (1, 2, 3 ...)
    for (let r = 0; r < this.rows; r++) {
      const cy = dataTop + r * this.cellH;
      x.fillStyle = "#e6e6e6";
      x.fillRect(0, cy, this.rowNumW, this.cellH);
      x.strokeStyle = "#bdbdbd";
      x.strokeRect(0.5, cy + 0.5, this.rowNumW, this.cellH);
      x.fillStyle = "#333";
      x.textAlign = "center";
      x.fillText(String(r + 1), this.rowNumW / 2, cy + this.cellH / 2 + 1);
    }

    // Datacellene (hvit bakgrunn + rutenett + regneark-innhold)
    const headers = ["Avd", "Q1", "Q2", "Q3", "Q4", "Sum", "Vekst", "Mål"];
    const labels = ["Salg", "Drift", "Lønn", "Frakt", "Diverse"];
    const cw = this.cellW, ch = this.cellH;
    for (let r = 0; r < this.rows; r++) {
      for (let col = 0; col < this.cols; col++) {
        const cx = dataLeft + col * cw, cy = dataTop + r * ch;
        x.fillStyle = "#ffffff";
        x.fillRect(cx, cy, cw, ch);
        x.strokeStyle = "#d4d4d4";
        x.lineWidth = 1;
        x.strokeRect(cx + 0.5, cy + 0.5, cw, ch);
        x.textBaseline = "middle";
        if (r === 0) {
          x.fillStyle = "#1f5132";
          x.font = "bold 13px 'Segoe UI', Arial, sans-serif";
          x.textAlign = "center";
          x.fillText(headers[col] || "", cx + cw / 2, cy + ch / 2 + 1);
        } else if (col === 0) {
          x.fillStyle = "#222";
          x.font = "12px 'Segoe UI', Arial, sans-serif";
          x.textAlign = "left";
          x.fillText(labels[(r - 1) % labels.length], cx + 6, cy + ch / 2 + 1);
        } else if (Math.random() < 0.82) {
          const v = Math.floor(40 + Math.random() * 960) * 10;
          x.fillStyle = col === 6 ? "#1f7a33" : "#222";
          x.font = "12px Consolas, monospace";
          x.textAlign = "right";
          const txt = col === 6
            ? (Math.random() < 0.5 ? "+" : "−") + (1 + Math.floor(Math.random() * 28)) + "%"
            : v.toLocaleString("no-NO");
          x.fillText(txt, cx + cw - 6, cy + ch / 2 + 1);
        }
      }
    }
  },

  // Sprekk-stråler ut fra et tilfeldig anslagspunkt i flisen
  _makeCrackRays(w, h) {
    const ix = w * (0.35 + Math.random() * 0.3);
    const iy = h * (0.35 + Math.random() * 0.3);
    const rays = [];
    const count = 5;
    let ang = Math.random() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      ang += (Math.PI * 2 / count) * (0.6 + Math.random() * 0.8);
      const dx = Math.cos(ang), dy = Math.sin(ang);
      let t = Infinity;
      if (dx > 0) t = Math.min(t, (w - ix) / dx); else if (dx < 0) t = Math.min(t, (0 - ix) / dx);
      if (dy > 0) t = Math.min(t, (h - iy) / dy); else if (dy < 0) t = Math.min(t, (0 - iy) / dy);
      const ex = ix + dx * t, ey = iy + dy * t;
      const mx = ix + dx * t * 0.55 + (-dy) * (Math.random() - 0.5) * 6;
      const my = iy + dy * t * 0.55 + (dx) * (Math.random() - 0.5) * 6;
      rays.push([{ x: ix, y: iy }, { x: mx, y: my }, { x: ex, y: ey }]);
    }
    return rays;
  },

  remaining() {
    return this.tiles.filter(t => t.attached).length;
  },

  box() {
    return { x: this.signLeft, y: this.signTop, w: this.sheetW, h: this.sheetH + this.standH };
  },

  intersects(b) {
    if (this.remaining() === 0) return false;
    const s = this.box();
    return b.x < s.x + s.w && b.x + b.w > s.x && b.y < s.y + s.h && b.y + b.h > s.y;
  },

  hit(damage, fromX) {
    if (this.finished) return;
    this.hits++;
    this.flashTimer = 0.18;
    Game.screenShake = Math.max(Game.screenShake, 4);
    AudioSystem.playCrash();

    // Treff de nærmeste flisene — flere for hardere slag
    const n = Math.max(2, Math.round(damage / 3));
    const aimY = this.signTop + this.sheetH * 0.6;
    const attached = this.tiles.filter(t => t.attached);
    attached.sort((a, b) => {
      const ax = this.signLeft + a.sx + a.sw / 2, ay = this.signTop + a.sy + a.sh / 2;
      const bx = this.signLeft + b.sx + b.sw / 2, by = this.signTop + b.sy + b.sh / 2;
      return Math.hypot(ax - fromX, ay - aimY) - Math.hypot(bx - fromX, by - aimY) || (Math.random() - 0.5);
    });

    const dir = fromX < this.signX ? 1 : -1;
    for (let i = 0; i < n && i < attached.length; i++) {
      const t = attached[i];
      t.cracks++;
      this.score += 60;
      if (t.cracks >= this.crackThreshold) {
        t.attached = false;
        this._shatter(t, dir);
        this.score += 240;
      }
    }

    if (this.remaining() === 0) {
      this.destroyed = true;
      this.finished = true;
      const timeBonus = Math.ceil(this.timer) * 100;
      const perfectBonus = this.timer > 15 ? 5000 : 0;
      this.score += timeBonus + perfectBonus;
      this._perfect = perfectBonus > 0;
      AudioSystem.playDestruction();
      Game.screenShake = 10;
    }
  },

  // Sprenger en flis i mange små splinter
  _shatter(t, dir) {
    const sc = Math.max(2, Math.round(t.sw / 22));
    const sr = Math.max(2, Math.round(t.sh / 16));
    const sw = t.sw / sc, sh = t.sh / sr;
    for (let r = 0; r < sr; r++) {
      for (let c = 0; c < sc; c++) {
        this.shards.push({
          sx: t.sx + c * sw, sy: t.sy + r * sh, sw, sh,
          x: this.signLeft + t.sx + c * sw,
          y: this.signTop + t.sy + r * sh,
          vx: dir * (40 + Math.random() * 260) + (Math.random() - 0.5) * 140,
          vy: -(110 + Math.random() * 280),
          rot: 0,
          vr: (Math.random() - 0.5) * 18,
          life: 2.2
        });
      }
    }
  },

  update(dt) {
    if (!this.finished) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = 0;
        this.finished = true;
      }
    } else {
      this.resultTimer += dt;
    }
    if (this.flashTimer > 0) this.flashTimer -= dt;

    for (const s of this.shards) {
      s.vy += 1900 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += s.vr * dt;
      s.life -= dt;
    }
    this.shards = this.shards.filter(s => s.life > 0 && s.y < Game.height + 80);
  },

  _shownRays(cracks) {
    if (cracks <= 0) return 0;
    return Math.min(5, cracks * 2 + 1);
  },

  _drawCracks(ctx, t) {
    const shown = this._shownRays(t.cracks);
    if (shown <= 0) return;
    ctx.lineCap = "round";
    for (let i = 0; i < shown && i < t.crackRays.length; i++) {
      const ray = t.crackRays[i];
      ctx.strokeStyle = "rgba(40,40,40,0.55)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ray[0].x, ray[0].y);
      ctx.lineTo(ray[1].x, ray[1].y);
      ctx.lineTo(ray[2].x, ray[2].y);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(ray[0].x, ray[0].y);
      ctx.lineTo(ray[1].x, ray[1].y);
      ctx.lineTo(ray[2].x, ray[2].y);
      ctx.stroke();
    }
  },

  render(ctx) {
    // Stativ: to stålbein + fot (så lenge noe av arket står)
    if (this.remaining() > 0) {
      ctx.fillStyle = "#5a5e66";
      ctx.fillRect(this.signLeft + 40, Game.groundY - this.standH, 14, this.standH);
      ctx.fillRect(this.signLeft + this.sheetW - 54, Game.groundY - this.standH, 14, this.standH);
      ctx.fillStyle = "#43464d";
      ctx.fillRect(this.signLeft + 20, Game.groundY - 8, 54, 8);
      ctx.fillRect(this.signLeft + this.sheetW - 74, Game.groundY - 8, 54, 8);
    }

    // Skygge under arket (krymper etter hvert som det forsvinner)
    ctx.save();
    ctx.globalAlpha = 0.2 * (this.remaining() / this.tiles.length);
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(this.signX, Game.groundY - 4, this.sheetW * 0.45, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Fastsittende fliser (med risting rett etter treff) + sprekker
    const jx = this.flashTimer > 0 ? (Math.random() - 0.5) * 6 : 0;
    const jy = this.flashTimer > 0 ? (Math.random() - 0.5) * 4 : 0;
    for (const t of this.tiles) {
      if (!t.attached) continue;
      ctx.save();
      ctx.translate(this.signLeft + t.sx + jx, this.signTop + t.sy + jy);
      ctx.drawImage(this._sheetCanvas, t.sx, t.sy, t.sw, t.sh, 0, 0, t.sw, t.sh);
      this._drawCracks(ctx, t);
      ctx.restore();
    }

    // Flygende splinter
    for (const s of this.shards) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, s.life * 1.5);
      ctx.translate(s.x + s.sw / 2, s.y + s.sh / 2);
      ctx.rotate(s.rot);
      ctx.drawImage(this._sheetCanvas, s.sx, s.sy, s.sw, s.sh, -s.sw / 2, -s.sh / 2, s.sw, s.sh);
      ctx.restore();
    }

    // Hvit blink ved treff
    if (this.flashTimer > 0.12 && this.remaining() > 0) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#fff";
      const b = this.box();
      ctx.fillRect(b.x, b.y, b.w, this.sheetH);
      ctx.restore();
    }
  },

  renderUI(ctx) {
    // Tittel
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("BONUS STAGE — KNUS EXCEL-ARKET!", Game.width / 2, 34);

    // Timer
    const secs = Math.ceil(this.timer);
    ctx.fillStyle = secs <= 10 ? "#ff3333" : "#fff";
    ctx.font = "bold 40px monospace";
    ctx.fillText(String(secs), Game.width / 2, 80);

    // Poeng
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px monospace";
    ctx.fillText("POENG: " + this.score, 30, 40);
    ctx.fillText("TREFF: " + this.hits, 30, 64);

    // Resultat-overlay
    if (this.finished && this.resultTimer > 0.5) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, Game.width, Game.height);
      ctx.textAlign = "center";
      if (this.destroyed) {
        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 56px 'Segoe UI', Arial, sans-serif";
        ctx.fillText("EXCEL-ARKET ER KNUST!", Game.width / 2, Game.height / 2 - 50);
        if (this._perfect) {
          ctx.fillStyle = "#ff6b6b";
          ctx.font = "bold 32px 'Segoe UI', Arial, sans-serif";
          ctx.fillText("PERFEKT! +5000", Game.width / 2, Game.height / 2 - 5);
        }
      } else {
        ctx.fillStyle = "#aaa";
        ctx.font = "bold 56px 'Segoe UI', Arial, sans-serif";
        ctx.fillText("TIDEN ER UTE!", Game.width / 2, Game.height / 2 - 50);
      }
      ctx.fillStyle = "#fff";
      ctx.font = "bold 28px monospace";
      ctx.fillText("POENG: " + this.score, Game.width / 2, Game.height / 2 + 45);
      ctx.fillStyle = "#aaa";
      ctx.font = "18px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("Trykk R for å gå tilbake til menyen", Game.width / 2, Game.height / 2 + 90);
    }
    ctx.textAlign = "left";
  }
};
