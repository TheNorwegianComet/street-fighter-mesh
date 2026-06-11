const SelectScreen = {
  roster: [],
  stages: [],
  phase: "title",
  p1Choice: 0,
  p2Choice: 1,
  stageChoice: 0,
  activePlayer: 1,
  ready: [false, false],
  animTimer: 0,
  modeChoice: 0, // 0 = 1 spiller (mot CPU), 1 = 2 spillere

  init(roster, stages) {
    this.roster = roster;
    this.stages = stages;
    this.phase = "title";
    this.p1Choice = 0;
    this.p2Choice = Math.min(1, roster.length - 1);
    this.stageChoice = 0;
    this.activePlayer = 1;
    this.ready = [false, false];
    this.modeChoice = 0;
    this.loadPortraits(roster);
  },

  loadPortraits(roster) {
    if (!this._globeImg) {
      Game.loadImage("images/ui/globe.jpg")
        .then(img => { this._globeImg = img; })
        .catch(() => {});
    }
    for (const char of roster) {
      if (char._portrait) continue;
      if (char.portrait) {
        Game.loadImage(char.portrait)
          .then(img => { char._portrait = { img, isSheet: false }; })
          .catch(() => {});
      } else if (char.animations.idle && char.animations.idle.spritesheet) {
        Game.loadImage(`${char.spriteBase}/idle/_spritesheet.png`)
          .then(img => { char._portrait = { img, isSheet: true }; })
          .catch(() => {});
      }
    }
    // Jubel-animasjoner (victory-spritesheets) for de som har dem
    for (const char of roster) {
      if (char._victory !== undefined) continue;
      char._victory = null;
      Game.loadImage(`${char.spriteBase}/victory/_spritesheet.png`)
        .then(img => { char._victory = img; })
        .catch(() => {});
    }
  },

  // Jubel når en fighter velges: lyd + victory-animasjon i det store portrettet
  celebrate(char, playerIndex) {
    AudioSystem.playCheer(char.id);
    this._celebrating = this._celebrating || [0, 0];
    this._celebrating[playerIndex] = 2.2; // sekunder med jubel-animasjon
  },

  handleKey(code) {
    if (this.phase === "title") {
      if (code === "KeyW" || code === "ArrowUp") {
        this.modeChoice = (this.modeChoice + 2) % 3;
        AudioSystem.playCursorMove();
        return;
      }
      if (code === "KeyS" || code === "ArrowDown") {
        this.modeChoice = (this.modeChoice + 1) % 3;
        AudioSystem.playCursorMove();
        return;
      }
      if (code === "Space" || code === "Enter") {
        this.phase = "character";
        this.activePlayer = 1;
        this.ready = [false, false];
        AudioSystem.playSelect();
        AudioSystem.startSelectMusic();
      }
      return;
    }

    if (this.phase === "character") {
      if (!this.ready[0]) {
        if (code === "KeyA") { this.p1Choice = (this.p1Choice - 1 + this.roster.length) % this.roster.length; AudioSystem.playCursorMove(); }
        if (code === "KeyD") { this.p1Choice = (this.p1Choice + 1) % this.roster.length; AudioSystem.playCursorMove(); }
        if (code === "KeyF" || code === "KeyG" || code === "Space") { this.ready[0] = true; AudioSystem.playSelect(); this.celebrate(this.roster[this.p1Choice], 0); }
      } else if (!this.ready[1]) {
        if (code === "ArrowLeft") { this.p2Choice = (this.p2Choice - 1 + this.roster.length) % this.roster.length; AudioSystem.playCursorMove(); }
        if (code === "ArrowRight") { this.p2Choice = (this.p2Choice + 1) % this.roster.length; AudioSystem.playCursorMove(); }
        if (code === "KeyN" || code === "KeyM" || code === "Enter") { this.ready[1] = true; AudioSystem.playSelect(); this.celebrate(this.roster[this.p2Choice], 1); }
      }

      if (code === "Backspace" || code === "Escape") {
        if (this.modeChoice === 0) {
          if (this.ready[0]) { this.ready = [false, false]; return; }
          this.phase = "title";
          return;
        }
        if (this.ready[1]) { this.ready[1] = false; return; }
        if (this.ready[0]) { this.ready[0] = false; return; }
        this.phase = "title";
      }

      // 1-spiller: CPU velger motstander automatisk
      if (this.modeChoice === 0 && this.ready[0] && !this.ready[1]) {
        let pick = Math.floor(Math.random() * this.roster.length);
        if (pick === this.p1Choice) pick = (pick + 1) % this.roster.length;
        this.p2Choice = pick;
        this.ready[1] = true;
        AudioSystem.playSelect();
      }

      // Overgang til neste fase skjer i update() når jubelen er ferdig
      return;
    }

    if (this.phase === "stage") {
      if (code === "KeyA" || code === "ArrowLeft") {
        this.stageChoice = (this.stageChoice - 1 + this.stages.length) % this.stages.length;
        AudioSystem.playCursorMove();
      }
      if (code === "KeyD" || code === "ArrowRight") {
        this.stageChoice = (this.stageChoice + 1) % this.stages.length;
        AudioSystem.playCursorMove();
      }
      if (code === "Space" || code === "Enter" || code === "KeyF" || code === "Numpad1") {
        this.phase = "fight";
        AudioSystem.playSelect();
      }
      if (code === "Backspace" || code === "Escape") {
        this.phase = "character";
        this.ready = [false, false];
      }
      return;
    }
  },

  update(dt) {
    this.animTimer += dt;
    if (this._celebrating) {
      this._celebrating[0] = Math.max(0, this._celebrating[0] - dt);
      this._celebrating[1] = Math.max(0, this._celebrating[1] - dt);
    }

    // Gå videre fra karaktervalg først når jubelen er ferdig spilt
    if (this.phase === "character") {
      const celebrating = this._celebrating && (this._celebrating[0] > 0 || this._celebrating[1] > 0);
      if (!celebrating) {
        if (this.modeChoice === 2 && this.ready[0]) {
          this.phase = "fight";
        } else if (this.ready[0] && this.ready[1]) {
          this.phase = "stage";
        }
      }
    }
  },

  render(ctx, w, h) {
    if (this.phase === "title") {
      this.renderTitle(ctx, w, h);
    } else if (this.phase === "character") {
      this.renderCharacterSelect(ctx, w, h);
    } else if (this.phase === "stage") {
      this.renderStageSelect(ctx, w, h);
    }
  },

  renderTitle(ctx, w, h) {
    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, w, h);

    const grd = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.5);
    grd.addColorStop(0, "#e63946");
    grd.addColorStop(1, "#ff6b6b");

    ctx.textAlign = "center";

    ctx.fillStyle = grd;
    ctx.font = "bold 56px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("STREET FIGHTER", w / 2, h * 0.32);
    ctx.font = "bold 72px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("MESH", w / 2, h * 0.46);

    ctx.fillStyle = "#555";
    ctx.font = "16px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("Mandora Edition", w / 2, h * 0.54);

    // Modusvalg
    const modes = ["1 SPILLER (mot CPU)", "2 SPILLERE", "BONUS STAGE"];
    for (let i = 0; i < modes.length; i++) {
      const selected = this.modeChoice === i;
      const y = h * 0.66 + i * 36;
      ctx.fillStyle = selected ? "#fff" : "#555";
      ctx.font = selected ? "bold 24px 'Segoe UI', Arial, sans-serif" : "20px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(modes[i], w / 2, y);
      if (selected && Math.sin(this.animTimer * 5) > 0) {
        ctx.fillText("►", w / 2 - 170, y);
        ctx.fillText("◄", w / 2 + 170, y);
      }
    }

    ctx.fillStyle = "#444";
    ctx.font = "13px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("W/S velg modus — Space/Enter for å starte", w / 2, h * 0.85);

    ctx.textAlign = "left";
  },

  // ---- SF2-stil karaktervalg ----

  renderCharacterSelect(ctx, w, h) {
    // Mørkeblå bakgrunn med gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#13256b");
    bg.addColorStop(0.5, "#0a1740");
    bg.addColorStop(1, "#050d24");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    this.drawGlobe(ctx, w / 2, 225, 285, 160);

    // Tittel
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 26px 'Segoe UI', Arial, sans-serif";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 6;
    ctx.fillText("VELG KARAKTER", w / 2, 36);
    ctx.shadowBlur = 0;

    // Instruksjon
    ctx.fillStyle = "#9ab";
    ctx.font = "13px 'Segoe UI', Arial, sans-serif";
    if (!this.ready[0]) {
      ctx.fillText("SPILLER 1: A/D velg — F bekreft", w / 2, 58);
    } else if (!this.ready[1]) {
      ctx.fillText(this.modeChoice === 0 ? "" : "SPILLER 2: ←/→ velg — N bekreft", w / 2, 58);
    }

    const p1 = this.roster[this.p1Choice];
    const p2 = this.roster[this.p2Choice];

    // Store portretter på sidene
    this.drawBigPortrait(ctx, p1, 18, 80, 290, 360, false, 0);
    this.drawBigPortrait(ctx, p2, w - 308, 80, 290, 360, true, 1);

    // 1P / 2P merker
    ctx.textAlign = "left";
    ctx.fillStyle = "#e63946";
    ctx.font = "bold 34px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("1P", 28, 70);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffd700";
    ctx.fillText("2P", w - 28, 70);

    // Flagg + navn i hjørnene, sentrert i den smale stripen utenfor kort-panelet
    this.drawFlag(ctx, p1.country || "no", 24, 455, 40, 26);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 12px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(p1.name.toUpperCase(), 44, 502, 82);

    this.drawFlag(ctx, p2.country || "no", w - 64, 455, 40, 26);
    ctx.fillStyle = "#ffd700";
    ctx.fillText(p2.name.toUpperCase(), w - 44, 502, 82);
    ctx.textAlign = "left";

    // Portrettkort-rad nederst
    const n = this.roster.length;
    const cardW = n > 9 ? 78 : n > 8 ? 86 : 98;
    const cardH = 96;
    const gap = 6;
    const totalW = n * cardW + (n - 1) * gap;
    const startX = (w - totalW) / 2;
    const cardY = 448;

    // Mørk panel-plate bak kortene
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(startX - 12, cardY - 10, totalW + 24, cardH + 42);

    for (let i = 0; i < n; i++) {
      const x = startX + i * (cardW + gap);
      const char = this.roster[i];
      const isP1 = this.p1Choice === i;
      const isP2 = this.p2Choice === i;

      ctx.fillStyle = "#0d1a36";
      ctx.fillRect(x, cardY, cardW, cardH);
      this.drawHeadshot(ctx, char, x + 2, cardY + 2, cardW - 4, cardH - 4);

      // Metallramme
      ctx.strokeStyle = "#7d8aa3";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, cardY, cardW, cardH);

      if (isP1) {
        ctx.strokeStyle = "#e63946";
        ctx.lineWidth = this.ready[0] ? 4 : (Math.sin(this.animTimer * 6) > 0 ? 4 : 2);
        ctx.strokeRect(x + 2, cardY + 2, cardW - 4, cardH - 4);
        ctx.fillStyle = "#e63946";
        ctx.fillRect(x + 4, cardY + cardH - 22, 30, 18);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("1P", x + 9, cardY + cardH - 8);
      }
      if (isP2) {
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = this.ready[1] ? 4 : (Math.sin(this.animTimer * 6) > 0 ? 4 : 2);
        ctx.strokeRect(x + (isP1 ? 5 : 2), cardY + (isP1 ? 5 : 2), cardW - (isP1 ? 10 : 4), cardH - (isP1 ? 10 : 4));
        ctx.fillStyle = "#ffd700";
        ctx.fillRect(x + cardW - 34, cardY + cardH - 22, 30, 18);
        ctx.fillStyle = "#000";
        ctx.font = "bold 12px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("2P", x + cardW - 29, cardY + cardH - 8);
      }

      // Navn under kortet
      ctx.fillStyle = (isP1 || isP2) ? "#fff" : "#8a93a6";
      ctx.font = "bold 12px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(char.name, x + cardW / 2, cardY + cardH + 18);
    }

    ctx.fillStyle = "#445";
    ctx.font = "11px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Esc = tilbake", w / 2, h - 4);
    ctx.textAlign = "left";
  },

  drawGlobe(ctx, gx, gy, grx, gry) {
    // Glød rundt kloden
    const glow = ctx.createRadialGradient(gx, gy, 40, gx, gy, grx + 70);
    glow.addColorStop(0, "rgba(90,150,255,0.28)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(gx - grx - 90, gy - gry - 90, (grx + 90) * 2, (gry + 90) * 2);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(gx, gy, grx, gry, 0, 0, Math.PI * 2);
    ctx.clip();

    if (this._globeImg) {
      // Ekte jordklode fra referansebildet, klippet til ellipsen
      ctx.drawImage(this._globeImg, gx - grx, gy - gry, grx * 2, gry * 2);
    } else {
      // Fallback mens bildet laster
      const ocean = ctx.createRadialGradient(gx - 70, gy - 50, 30, gx, gy, grx);
      ocean.addColorStop(0, "#5598e8");
      ocean.addColorStop(0.65, "#1d50a0");
      ocean.addColorStop(1, "#0c2a60");
      ctx.fillStyle = ocean;
      ctx.fillRect(gx - grx, gy - gry, grx * 2, gry * 2);
    }
    ctx.restore();

    // Kant
    ctx.strokeStyle = "rgba(160,205,255,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(gx, gy, grx, gry, 0, 0, Math.PI * 2);
    ctx.stroke();
  },

  drawBigPortrait(ctx, char, x, y, maxW, maxH, mirror, playerIndex) {
    // Jubel-animasjon: spill victory-spritesheet mens karakteren feirer å bli valgt
    const celebrating = this._celebrating && playerIndex !== undefined && this._celebrating[playerIndex] > 0;
    if (celebrating && char._victory) {
      const frame = Math.floor(this.animTimer * 14) % 16;
      const fsx = (frame % 4) * 256;
      const fsy = Math.floor(frame / 4) * 256;
      const size = Math.min(maxW, maxH);
      const dx = x + (maxW - size) / 2;
      const dy = y + (maxH - size);
      ctx.save();
      if (mirror) {
        ctx.translate(dx + size / 2, 0);
        ctx.scale(-1, 1);
        ctx.translate(-(dx + size / 2), 0);
      }
      ctx.shadowColor = "rgba(255,215,0,0.5)";
      ctx.shadowBlur = 24;
      ctx.drawImage(char._victory, fsx, fsy, 256, 256, dx, dy, size, size);
      ctx.restore();
      return;
    }

    const p = char._portrait;
    if (!p || !p.img) {
      // Fallback: farget silhuett
      ctx.fillStyle = char.color || "#333";
      ctx.globalAlpha = 0.4;
      ctx.fillRect(x + maxW * 0.2, y + maxH * 0.15, maxW * 0.6, maxH * 0.85);
      ctx.globalAlpha = 1;
      return;
    }

    let sx, sy, sw, sh;
    if (p.isSheet) {
      sx = 0; sy = 0; sw = 256; sh = 256;
    } else {
      sx = 0; sy = 0; sw = p.img.naturalWidth; sh = p.img.naturalHeight;
    }

    const scale = Math.min(maxW / sw, maxH / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = x + (maxW - dw) / 2;
    const dy = y + (maxH - dh); // bunn-anker

    ctx.save();
    if (mirror) {
      ctx.translate(dx + dw / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(dx + dw / 2), 0);
    }
    // Skygge bak figuren
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 18;
    ctx.drawImage(p.img, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.restore();
  },

  drawHeadshot(ctx, char, dx, dy, dw, dh) {
    const p = char._portrait;
    if (!p || !p.img) {
      ctx.fillStyle = char.color || "#555";
      ctx.fillRect(dx, dy, dw, dh);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 28px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(char.name[0], dx + dw / 2, dy + dh / 2 + 10);
      return;
    }

    let sx, sy, sw, sh;
    if (p.isSheet) {
      // Ansiktsutsnitt fra idle-frame 0 (256x256)
      sx = 64; sy = 8; sw = 128; sh = 128 * (dh / dw);
    } else {
      // Ansiktsutsnitt øverst-midt i helfigur-bildet
      const iw = p.img.naturalWidth;
      const ih = p.img.naturalHeight;
      sw = iw * 0.46;
      sh = sw * (dh / dw);
      sx = (iw - sw) / 2;
      sy = ih * 0.02;
    }
    ctx.drawImage(p.img, sx, sy, sw, sh, dx, dy, dw, dh);
  },

  drawFlag(ctx, country, x, y, w, h) {
    switch (country) {
      case "ca": // Canada
        ctx.fillStyle = "#fff";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#d80621";
        ctx.fillRect(x, y, w * 0.25, h);
        ctx.fillRect(x + w * 0.75, y, w * 0.25, h);
        // Stilisert lønneblad
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.32);
        ctx.lineTo(w * 0.06, -h * 0.1);
        ctx.lineTo(w * 0.16, -h * 0.16);
        ctx.lineTo(w * 0.1, h * 0.08);
        ctx.lineTo(w * 0.05, h * 0.05);
        ctx.lineTo(w * 0.02, h * 0.32);
        ctx.lineTo(-w * 0.02, h * 0.32);
        ctx.lineTo(-w * 0.05, h * 0.05);
        ctx.lineTo(-w * 0.1, h * 0.08);
        ctx.lineTo(-w * 0.16, -h * 0.16);
        ctx.lineTo(-w * 0.06, -h * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;

      case "in": // India
        ctx.fillStyle = "#ff9933";
        ctx.fillRect(x, y, w, h / 3);
        ctx.fillStyle = "#fff";
        ctx.fillRect(x, y + h / 3, w, h / 3);
        ctx.fillStyle = "#138808";
        ctx.fillRect(x, y + (h / 3) * 2, w, h / 3);
        // Ashoka-chakra
        ctx.strokeStyle = "#000088";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, h * 0.14, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case "mk": { // Nord-Makedonia — rød med gul sol (Kutlesh-solen)
        ctx.fillStyle = "#d20000";
        ctx.fillRect(x, y, w, h);
        const cx2 = x + w / 2;
        const cy2 = y + h / 2;
        ctx.fillStyle = "#ffe600";
        // Solskive
        ctx.beginPath();
        ctx.arc(cx2, cy2, h * 0.18, 0, Math.PI * 2);
        ctx.fill();
        // 8 stråler som videre seg utover
        for (let r = 0; r < 8; r++) {
          const a = (r / 8) * Math.PI * 2 + Math.PI / 8;
          ctx.beginPath();
          ctx.moveTo(cx2 + Math.cos(a - 0.08) * h * 0.22, cy2 + Math.sin(a - 0.08) * h * 0.22);
          ctx.lineTo(cx2 + Math.cos(a + 0.08) * h * 0.22, cy2 + Math.sin(a + 0.08) * h * 0.22);
          ctx.lineTo(cx2 + Math.cos(a + 0.16) * w * 0.75, cy2 + Math.sin(a + 0.16) * w * 0.75);
          ctx.lineTo(cx2 + Math.cos(a - 0.16) * w * 0.75, cy2 + Math.sin(a - 0.16) * w * 0.75);
          ctx.closePath();
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.clip();
          ctx.fillStyle = "#ffe600";
          ctx.beginPath();
          ctx.moveTo(cx2 + Math.cos(a - 0.06) * h * 0.2, cy2 + Math.sin(a - 0.06) * h * 0.2);
          ctx.lineTo(cx2 + Math.cos(a) * w, cy2 + Math.sin(a) * w);
          ctx.lineTo(cx2 + Math.cos(a + 0.06) * h * 0.2, cy2 + Math.sin(a + 0.06) * h * 0.2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        break;
      }

      case "us": // USA
        ctx.fillStyle = "#fff";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#b22234";
        for (let s = 0; s < 7; s++) {
          ctx.fillRect(x, y + (h / 13) * s * 2, w, h / 13);
        }
        ctx.fillStyle = "#3c3b6e";
        ctx.fillRect(x, y, w * 0.42, h * 0.54);
        ctx.fillStyle = "#fff";
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 4; c++) {
            ctx.beginPath();
            ctx.arc(x + w * 0.06 + c * w * 0.1, y + h * 0.1 + r * h * 0.17, 1.1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;

      default: // Norge
        ctx.fillStyle = "#ba0c2f";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#fff";
        ctx.fillRect(x + w * 0.27, y, w * 0.19, h);
        ctx.fillRect(x, y + h * 0.38, w, h * 0.24);
        ctx.fillStyle = "#00205b";
        ctx.fillRect(x + w * 0.32, y, w * 0.09, h);
        ctx.fillRect(x, y + h * 0.44, w, h * 0.12);
        break;
    }
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  },

  renderStageSelect(ctx, w, h) {
    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = "center";
    ctx.fillStyle = "#e63946";
    ctx.font = "bold 32px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("VELG BANE", w / 2, 45);

    ctx.fillStyle = "#aaa";
    ctx.font = "16px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("A/D eller ←/→ for å velge, Space/Enter for å starte", w / 2, 75);

    const stage = this.stages[this.stageChoice];
    const previewW = 500;
    const previewH = 280;
    const px = (w - previewW) / 2;
    const py = 100;

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(px, py, previewW, previewH);

    if (stage._image) {
      ctx.drawImage(stage._image, px, py, previewW, previewH);
    }

    ctx.strokeStyle = "#e63946";
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, previewW, previewH);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(stage.name, w / 2, py + previewH + 35);

    ctx.fillStyle = "#666";
    ctx.font = "14px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(`${this.stageChoice + 1} / ${this.stages.length}`, w / 2, py + previewH + 60);

    const p1 = this.roster[this.p1Choice];
    const p2 = this.roster[this.p2Choice];
    ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "#e63946";
    ctx.fillText(p1.name, w * 0.2, h - 40);
    ctx.fillStyle = "#888";
    ctx.fillText("VS", w / 2, h - 40);
    ctx.fillStyle = "#457b9d";
    ctx.fillText(p2.name, w * 0.8, h - 40);

    ctx.fillStyle = "#444";
    ctx.font = "12px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("Esc = tilbake", w / 2, h - 15);

    ctx.textAlign = "left";
  },

  getSelections() {
    return {
      p1: this.roster[this.p1Choice],
      p2: this.roster[this.p2Choice],
      stage: this.stages[this.stageChoice],
      vsCPU: this.modeChoice === 0,
      bonusMode: this.modeChoice === 2
    };
  }
};
