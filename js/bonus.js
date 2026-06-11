// ============================================
// BONUS STAGE — Knus Finago-logoen!
// Inspirert av Street Fighter II sin bil-bonusbane:
// 40 sekunder, poeng per treff, del-for-del-ødeleggelse.
// ============================================

const BonusStage = {
  cols: 8,
  rows: 4,
  signW: 460,
  signH: 200,
  signX: 512,
  standH: 80,

  pieces: [],
  hits: 0,
  score: 0,
  timer: 40,
  finished: false,
  destroyed: false,
  flashTimer: 0,
  resultTimer: 0,

  get signTop() { return Game.groundY - this.standH - this.signH; },
  get signLeft() { return this.signX - this.signW / 2; },

  async init() {
    this.pieces = [];
    this.hits = 0;
    this.score = 0;
    this.timer = 40;
    this.finished = false;
    this.destroyed = false;
    this.flashTimer = 0;
    this.resultTimer = 0;

    if (!this._logoImg) {
      try {
        this._logoImg = await Game.loadImage("images/ui/finago_logo.svg");
      } catch {
        this._logoImg = null;
      }
    }

    // Tegn skiltet (hvit plate med Finago-logoen) på et offscreen-canvas
    const c = document.createElement("canvas");
    c.width = this.signW;
    c.height = this.signH;
    const x = c.getContext("2d");

    x.fillStyle = "#f7f7f4";
    x.fillRect(0, 0, c.width, c.height);
    const edge = x.createLinearGradient(0, 0, 0, c.height);
    edge.addColorStop(0, "rgba(255,255,255,0.9)");
    edge.addColorStop(1, "rgba(180,180,175,0.6)");
    x.strokeStyle = edge;
    x.lineWidth = 8;
    x.strokeRect(4, 4, c.width - 8, c.height - 8);

    if (this._logoImg) {
      // Logo-SVG er 142x54 — skaler til å fylle skiltet pent
      const lw = 360;
      const lh = lw * (54 / 142);
      x.drawImage(this._logoImg, (c.width - lw) / 2, (c.height - lh) / 2, lw, lh);
    } else {
      x.fillStyle = "#111";
      x.font = "bold 84px 'Segoe UI', Arial, sans-serif";
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText("Finago", c.width / 2, c.height / 2);
    }
    this._signCanvas = c;

    // Del skiltet i biter
    const pw = this.signW / this.cols;
    const ph = this.signH / this.rows;
    for (let r = 0; r < this.rows; r++) {
      for (let col = 0; col < this.cols; col++) {
        this.pieces.push({
          sx: col * pw, sy: r * ph, w: pw, h: ph,
          gx: col, gy: r,
          attached: true,
          x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0
        });
      }
    }
  },

  remaining() {
    return this.pieces.filter(p => p.attached).length;
  },

  box() {
    return { x: this.signLeft, y: this.signTop, w: this.signW, h: this.signH + this.standH };
  },

  intersects(b) {
    if (this.remaining() === 0) return false;
    const s = this.box();
    return b.x < s.x + s.w && b.x + b.w > s.x && b.y < s.y + s.h && b.y + b.h > s.y;
  },

  hit(damage, fromX) {
    if (this.finished) return;
    this.hits++;
    this.score += 300;
    this.flashTimer = 0.18;
    Game.screenShake = Math.max(Game.screenShake, 5);
    AudioSystem.playCrash();

    // Løsne biter nærmest angriperen — flere biter for hardere slag
    const n = Math.max(1, Math.round(damage / 4));
    const pw = this.signW / this.cols;
    const ph = this.signH / this.rows;
    const attached = this.pieces.filter(p => p.attached);
    attached.sort((a, b) => {
      const ax = this.signLeft + a.gx * pw + pw / 2;
      const bx = this.signLeft + b.gx * pw + pw / 2;
      return Math.abs(ax - fromX) - Math.abs(bx - fromX) || Math.random() - 0.5;
    });
    const dir = fromX < this.signX ? 1 : -1;
    for (let i = 0; i < n && i < attached.length; i++) {
      const p = attached[i];
      p.attached = false;
      p.x = this.signLeft + p.gx * pw;
      p.y = this.signTop + p.gy * ph;
      p.vx = dir * (120 + Math.random() * 240);
      p.vy = -(160 + Math.random() * 260);
      p.vr = (Math.random() - 0.5) * 12;
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

    for (const p of this.pieces) {
      if (!p.attached) {
        p.vy += 1900 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
      }
    }
  },

  render(ctx) {
    const pw = this.signW / this.cols;
    const ph = this.signH / this.rows;

    // Stativ: to stålbein + fot
    if (this.remaining() > 0) {
      ctx.fillStyle = "#5a5e66";
      ctx.fillRect(this.signLeft + 40, Game.groundY - this.standH, 14, this.standH);
      ctx.fillRect(this.signLeft + this.signW - 54, Game.groundY - this.standH, 14, this.standH);
      ctx.fillStyle = "#43464d";
      ctx.fillRect(this.signLeft + 20, Game.groundY - 8, 54, 8);
      ctx.fillRect(this.signLeft + this.signW - 74, Game.groundY - 8, 54, 8);
    }

    // Skygge under skiltet
    ctx.save();
    ctx.globalAlpha = 0.2 * (this.remaining() / this.pieces.length);
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(this.signX, Game.groundY - 4, this.signW * 0.45, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Fastmonterte biter (med risting rett etter treff)
    const jx = this.flashTimer > 0 ? (Math.random() - 0.5) * 6 : 0;
    const jy = this.flashTimer > 0 ? (Math.random() - 0.5) * 4 : 0;
    for (const p of this.pieces) {
      if (p.attached) {
        ctx.drawImage(this._signCanvas, p.sx, p.sy, p.w, p.h,
          this.signLeft + p.gx * pw + jx, this.signTop + p.gy * ph + jy, p.w, p.h);
      }
    }

    // Fallende biter
    for (const p of this.pieces) {
      if (!p.attached && p.y < Game.height + 80) {
        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate(p.rot);
        ctx.drawImage(this._signCanvas, p.sx, p.sy, p.w, p.h, -p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }

    // Hvit blink ved treff
    if (this.flashTimer > 0.12) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#fff";
      const b = this.box();
      ctx.fillRect(b.x, b.y, b.w, this.signH);
      ctx.restore();
    }
  },

  renderUI(ctx) {
    // Tittel
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("BONUS STAGE — KNUS FINAGO-LOGOEN!", Game.width / 2, 34);

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
        ctx.fillText("LOGOEN ER KNUST!", Game.width / 2, Game.height / 2 - 50);
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
