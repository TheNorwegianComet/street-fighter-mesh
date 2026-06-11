const GRAVITY = 2400;
const JUMP_VELOCITY = -950;
const SPECIAL_COOLDOWN = 3;
const ACTIVE_FRAMES = 4; // hvor mange frames etter hitFrame angrepet kan treffe

class Fighter {
  constructor(charData, playerIndex, controls) {
    this.data = charData;
    this.playerIndex = playerIndex;
    this.controls = controls;

    this.x = playerIndex === 0 ? 300 : 700;
    this.facing = playerIndex === 0 ? 1 : -1;
    this.health = charData.health;
    this.maxHealth = charData.health;

    this.state = "idle";
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.sprites = {};
    this.moving = 0;
    this.attacking = false;
    this.hasHit = false;
    this.hitStun = 0;
    this.knockedOut = false;
    this.blocking = false;

    // Fysikk
    this.airY = 0;   // vertikal offset fra bakken (negativ = i lufta)
    this.vy = 0;
    this.jumpVx = 0;
    this.kbVx = 0;   // knockback-glidning

    this.specialCooldown = 0;

    // CPU
    this.isCPU = false;
    this.aiTimer = 0;
    this.aiPlan = "approach";

    this.scale = charData.scale || 1.7;
    this.drawSize = charData.frameSize * this.scale;
  }

  async loadSprites() {
    this.sprites = {};
    this.sheetData = {};
    for (const [anim, info] of Object.entries(this.data.animations)) {

      if (info.spritesheet) {
        try {
          const img = await Game.loadImage(`${this.data.spriteBase}/${anim}/_spritesheet.png`);
          const cols = info.spritesheet.columns || 4;
          const fw = info.spritesheet.frameWidth || this.data.frameSize;
          const fh = info.spritesheet.frameHeight || this.data.frameSize;
          this.sheetData[anim] = { img, cols, fw, fh, count: info.frames };
          this.sprites[anim] = true;
          continue;
        } catch {
          // spritesheet failed, fall through
        }
      }

      const frames = [];
      for (let i = 1; i <= info.frames; i++) {
        const num = String(i).padStart(2, "0");
        const src = `${this.data.spriteBase}/${anim}/${num}.png`;
        try {
          const img = await Game.loadImage(src);
          frames.push(img);
        } catch {
          break;
        }
      }
      if (frames.length > 0) {
        this.sprites[anim] = frames;
      }
    }
  }

  getFrame(anim, index) {
    const sheet = this.sheetData[anim];
    if (sheet) {
      return { sheet: true, img: sheet.img, sx: (index % sheet.cols) * sheet.fw, sy: Math.floor(index / sheet.cols) * sheet.fh, sw: sheet.fw, sh: sheet.fh };
    }
    const frames = this.sprites[anim];
    if (Array.isArray(frames)) {
      return { sheet: false, img: frames[index % frames.length] };
    }
    return null;
  }

  getFrameCount(anim) {
    const sheet = this.sheetData[anim];
    if (sheet) return sheet.count;
    const frames = this.sprites[anim];
    if (Array.isArray(frames)) return frames.length;
    return 0;
  }

  getSpecialType() {
    if (this.data.animations.electric) return "electric";
    if (this.data.animations.hadouken) return "hadouken";
    if (this.data.animations.shoryuken) return "shoryuken";
    return null;
  }

  isSpecialAttack(type) {
    return type === "electric" || type === "hadouken" || type === "shoryuken";
  }

  handleInput(keys, game) {
    if (this.knockedOut || Game.roundOver) return;

    this.moving = 0;
    if (this.hitStun > 0 || this.attacking) return;

    const holdDown = keys[this.controls.down];
    const grounded = this.airY === 0;

    // Konsumer angreps-trykk først
    const punchPressed = game.consumePress(this.controls.punch);
    const kickPressed = game.consumePress(this.controls.kick);
    const jumpPressed = game.consumePress(this.controls.up);

    if (punchPressed) {
      this.blocking = false;
      const special = holdDown && grounded ? this.getSpecialType() : null;
      if (special && this.specialCooldown <= 0) {
        this.startAttack(special);
      } else {
        this.startAttack("punch");
      }
      return;
    }
    if (kickPressed) {
      this.blocking = false;
      if (!grounded && this.data.animations.jumpkick) {
        this.startAttack("jumpkick");
      } else if (holdDown && grounded && this.data.animations.crouchkick) {
        this.startAttack("crouchkick");
      } else {
        this.startAttack("kick");
      }
      return;
    }

    if (jumpPressed && grounded) {
      const dir = keys[this.controls.left] ? -1 : keys[this.controls.right] ? 1 : 0;
      this.startJump(dir);
      return;
    }

    if (!grounded) return; // ingen styring i lufta

    // Blokkering: hold bakover (vekk fra motstanderen) mens motstanderen angriper
    const opponent = game.fighters.find(f => f !== this);
    const holdBack = this.facing === 1 ? keys[this.controls.left] : keys[this.controls.right];
    if (holdBack && opponent && opponent.attacking && !opponent.knockedOut) {
      this.blocking = true;
      this.setState("block");
      return;
    }
    this.blocking = false;

    if (keys[this.controls.left]) this.moving = -1;
    if (keys[this.controls.right]) this.moving = 1;
  }

  // Enkel CPU-motstander: planlegger med menneskelig reaksjonstid
  updateAI(dt, game) {
    if (this.knockedOut || Game.roundOver) return;

    this.moving = 0;
    if (this.hitStun > 0 || this.attacking) return;

    const opponent = game.fighters.find(f => f !== this);
    if (!opponent || opponent.knockedOut) return;

    const dist = Math.abs(opponent.x - this.x);
    const dir = opponent.x > this.x ? 1 : -1;
    const grounded = this.airY === 0;

    this.aiTimer -= dt;
    if (this.aiTimer <= 0) {
      this.aiTimer = 0.25 + Math.random() * 0.3;
      const r = Math.random();
      if (opponent.attacking && dist < 280) {
        this.aiPlan = r < 0.5 ? "block" : r < 0.75 ? "retreat" : "attack";
      } else if (dist > 320) {
        this.aiPlan = r < 0.75 ? "approach" : r < 0.9 ? "jump" : "special";
      } else if (dist > 180) {
        this.aiPlan = r < 0.45 ? "approach" : r < 0.7 ? "special" : r < 0.85 ? "attack" : "jump";
      } else {
        this.aiPlan = r < 0.55 ? "attack" : r < 0.7 ? "special" : r < 0.85 ? "retreat" : "block";
      }
    }

    this.blocking = false;
    switch (this.aiPlan) {
      case "approach":
        this.moving = dir;
        break;
      case "retreat":
        this.moving = -dir;
        break;
      case "block":
        if (opponent.attacking && grounded) {
          this.blocking = true;
          this.setState("block");
        }
        break;
      case "jump":
        if (grounded) {
          this.startJump(dir);
          this.aiPlan = "approach";
        }
        break;
      case "special": {
        const special = this.getSpecialType();
        if (!special || this.specialCooldown > 0) {
          this.aiPlan = "approach";
          break;
        }
        const info = this.data.animations[special];
        const range = (info.hitRange || this.data.attackBox.w) * this.scale;
        if (grounded && dist < range + 60) {
          this.startAttack(special);
        } else {
          this.moving = dir;
        }
        break;
      }
      case "attack": {
        const reach = this.data.attackBox.w * this.scale + 30;
        if (!grounded && dist < reach + 60 && this.data.animations.jumpkick) {
          this.startAttack("jumpkick");
        } else if (dist < reach && grounded) {
          const r = Math.random();
          if (r < 0.25 && this.data.animations.crouchkick) {
            this.startAttack("crouchkick");
          } else {
            this.startAttack(r < 0.6 ? "punch" : "kick");
          }
        } else {
          this.moving = dir;
        }
        break;
      }
    }
  }

  startJump(dir) {
    this.blocking = false;
    this.vy = JUMP_VELOCITY;
    this.airY = -0.01;
    this.jumpVx = dir * this.data.speed * 55;
    this.setState("idle");
  }

  startAttack(type) {
    this.attacking = true;
    this.hasHit = false;
    this._projSpawned = false;
    this.attackType = type;
    this.attackTimer = 0;
    this.attackDuration = type === "electric" ? 0.8 : 0.35;
    if (this.isSpecialAttack(type)) {
      this.specialCooldown = SPECIAL_COOLDOWN;
    }
    if (this.sprites[type]) {
      this.setState(type);
    }
    if (type === "electric") {
      AudioSystem.playElectric();
    }
  }

  update(dt, game) {
    if (this.specialCooldown > 0) {
      this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    }

    this.applyPhysics(dt, game);

    if (this.knockedOut) {
      this.updateAnimation(dt);
      return;
    }

    if (this.hitStun > 0) {
      this.hitStun -= dt;
      if (this.hitStun <= 0) {
        this.hitStun = 0;
        this.specialStunned = 0;
        this.attacking = false;
        this.setState("idle");
      }
      this.updateAnimation(dt);
      return;
    }

    if (this.attacking) {
      this.attackTimer += dt;
      const hasSprites = !!this.sprites[this.attackType];

      if (hasSprites) {
        this.updateAnimation(dt);
        const animInfo = this.data.animations[this.attackType];
        const totalFrames = this.getFrameCount(this.attackType);
        const hitFrame = animInfo ? (animInfo.hitFrame || 0) : 0;
        if (animInfo && animInfo.projectile) {
          // Prosjektil-spesial: skyt prosjektilet på hitFrame — selve skaden
          // skjer når prosjektilet treffer, ikke via nærkamp-hitbox
          if (!this._projSpawned && this.frameIndex >= hitFrame) {
            this._projSpawned = true;
            Game.spawnProjectile(this, animInfo);
          }
        } else if (!this.hasHit && animInfo &&
            this.frameIndex >= hitFrame && this.frameIndex <= hitFrame + ACTIVE_FRAMES) {
          // Aktivt treff-vindu: bare noen frames etter hitFrame, ikke hele animasjonen
          this.checkHit(game);
        }
        if (this.frameIndex >= totalFrames - 1) {
          this.attacking = false;
          this.setState("idle");
        }
      } else {
        this.updateAnimation(dt);
        if (!this.hasHit && this.attackTimer >= this.attackDuration * 0.5) {
          this.checkHit(game);
        }
        if (this.attackTimer >= this.attackDuration) {
          this.attacking = false;
        }
      }
      return;
    }

    // Snu mot motstanderen (bare på bakken, så hopp over ikke flimrer)
    const opponent = game.fighters.find(f => f !== this);
    if (opponent && this.airY === 0) {
      this.facing = opponent.x > this.x ? 1 : -1;
    }

    if (this.blocking) {
      this.updateAnimation(dt);
      return;
    }

    if (this.airY < 0) {
      // I lufta — drift håndteres av applyPhysics
      this.updateAnimation(dt);
      return;
    }

    if (this.moving !== 0) {
      this.x += this.moving * this.data.speed * 60 * dt;
      this.setState("walk");
    } else {
      this.setState("idle");
    }

    this.updateAnimation(dt);
  }

  applyPhysics(dt, game) {
    // Knockback-glidning som dempes
    if (this.kbVx !== 0) {
      this.x += this.kbVx * dt;
      this.kbVx *= Math.pow(0.0001, dt);
      if (Math.abs(this.kbVx) < 5) this.kbVx = 0;
    }

    // Tyngdekraft / hoppbane
    if (this.airY < 0 || this.vy !== 0) {
      this.vy += GRAVITY * dt;
      this.airY += this.vy * dt;
      this.x += this.jumpVx * dt;
      if (this.airY >= 0) {
        this.airY = 0;
        this.vy = 0;
        this.jumpVx = 0;
      }
    }

    this.x = Math.max(50, Math.min(Game.width - 50, this.x));
  }

  updateAnimation(dt) {
    const animInfo = this.data.animations[this.state];
    if (!animInfo || !this.sprites[this.state]) return;
    const totalFrames = this.getFrameCount(this.state);
    if (totalFrames === 0) return;

    // Angrep og hit-reaksjoner spilles raskere for responsiv spillfølelse
    let fps = animInfo.fps;
    if (this.attacking && this.state === this.attackType) fps *= 1.7;
    else if (this.state === "hit") fps *= 1.6;

    this.frameTimer += dt;
    const frameDuration = 1 / fps;
    if (this.frameTimer >= frameDuration) {
      this.frameTimer -= frameDuration;
      this.frameIndex++;
      if (this.frameIndex >= totalFrames) {
        this.frameIndex = animInfo.loop ? 0 : totalFrames - 1;
      }
    }
  }

  checkHit(game) {
    const opponent = game.fighters.find(f => f !== this);
    if (!opponent || opponent.knockedOut) return;

    // Electric bruker en bred hitbox rundt karakteren
    if (this.attackType === "electric" && this.data.electricBox) {
      const eb = this.data.electricBox;
      const s = this.scale;
      const eBox = {
        x: this.x + eb.x * s,
        y: Game.groundY + this.airY + eb.y * s,
        w: eb.w * s,
        h: eb.h * s
      };
      const defBox = opponent.getBodyBox();
      if (this.boxOverlap(eBox, defBox)) {
        this.hasHit = true;
        const animInfo = this.data.animations.electric;
        const damage = animInfo ? animInfo.damage : 15;
        AudioSystem.playHit();
        opponent.takeHit(damage, this);
        Game.screenShake = Math.max(Game.screenShake, 6);
      }
      return;
    }

    const atkBox = this.getAttackBox();
    const defBox = opponent.getBodyBox();

    if (this.boxOverlap(atkBox, defBox)) {
      this.hasHit = true;
      const animInfo = this.data.animations[this.attackType];
      const damage = animInfo ? animInfo.damage : 5;
      opponent.takeHit(damage, this);
    }
  }

  takeHit(damage, attacker, forceSpecial) {
    const knockDir = attacker ? (attacker.x < this.x ? 1 : -1) : -this.facing;

    // Blokkering reduserer skade med 70 % og gir liten knockback
    if (this.blocking) {
      damage = Math.round(damage * 0.3);
      Game.screenShake = 1;
      AudioSystem.playBlock();
      this.health = Math.max(0, this.health - damage);
      this.kbVx = knockDir * 70;
      if (this.health <= 0) {
        this.knockedOut = true;
        this.blocking = false;
        if (this.sprites["knockout"]) this.setState("knockout");
        Game.endRound(this);
      }
      return;
    }

    AudioSystem.playHit();
    this.health = Math.max(0, this.health - damage);
    this.attacking = false;

    const knockForce = damage > 15 ? 40 : damage > 10 ? 25 : 15;
    this.kbVx = knockDir * knockForce * 12;

    Game.screenShake = Math.min(damage * 0.4, 8);

    if (this.health <= 0) {
      this.knockedOut = true;
      this.kbVx = knockDir * knockForce * 18;
      if (this.sprites["knockout"]) {
        this.setState("knockout");
      } else if (this.sprites["hit"]) {
        this.setState("hit");
      }
      Game.endRound(this);
    } else {
      // Hitstun skalerer med skade — tunge slag stunner lenger
      this.hitStun = 0.25 + damage * 0.015;
      // Spesialslag stunner DOBBELT så lenge
      const wasSpecial = forceSpecial || (attacker && attacker.attacking &&
        attacker.isSpecialAttack && attacker.isSpecialAttack(attacker.attackType));
      if (wasSpecial) {
        this.hitStun *= 2;
        this.specialStunned = this.hitStun;
      }
      if (this.sprites["hit"]) {
        this.setState("hit");
      }
    }
  }

  setState(newState) {
    if (this.state === newState) return;
    if (!this.sprites[newState]) return;
    this.state = newState;
    this.frameIndex = 0;
    this.frameTimer = 0;
  }

  render(ctx, debug) {
    if (!this.sprites[this.state]) return;
    const frameData = this.getFrame(this.state, this.frameIndex);
    if (!frameData) return;

    // Skygge på bakken (krymper når man hopper)
    const shScale = Math.max(0.4, 1 + this.airY / 500);
    ctx.save();
    ctx.globalAlpha = 0.25 * shScale;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(this.x, Game.groundY - 5, 50 * this.scale * shScale, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const feetOff = (this.data.feetOffset || 0) * this.scale;
    const drawY = Game.groundY + this.airY - this.drawSize + feetOff;

    ctx.save();

    const noAttackSprite = this.attacking && !this.sheetData[this.attackType] && !Array.isArray(this.sprites[this.attackType]);
    const isPunch = noAttackSprite && this.attackType === "punch";
    const isKick = noAttackSprite && this.attackType === "kick";
    const attackProgress = this.attacking ? Math.min(this.attackTimer / this.attackDuration, 1) : 0;
    const attackPhase = attackProgress < 0.4 ? attackProgress / 0.4 : (1 - attackProgress) / 0.6;

    let offsetX = 0;
    let offsetY = 0;
    let rotation = 0;

    if (isPunch) {
      offsetX = this.facing * 25 * attackPhase;
      rotation = this.facing * 0.15 * attackPhase;
    } else if (isKick) {
      offsetX = this.facing * 15 * attackPhase;
      offsetY = -10 * attackPhase;
      rotation = this.facing * -0.1 * attackPhase;
    }

    const anchorX = this.x + offsetX;
    const anchorY = Game.groundY + this.airY;

    ctx.translate(anchorX, anchorY);
    ctx.rotate(rotation);
    if (this.facing === -1) ctx.scale(-1, 1);

    if (frameData.sheet) {
      ctx.drawImage(frameData.img, frameData.sx, frameData.sy, frameData.sw, frameData.sh,
        -this.drawSize / 2, drawY - anchorY + offsetY, this.drawSize, this.drawSize);
    } else {
      ctx.drawImage(frameData.img, -this.drawSize / 2, drawY - anchorY + offsetY, this.drawSize, this.drawSize);
    }
    ctx.restore();

    if (noAttackSprite && attackPhase > 0.3) {
      const atkBox = this.getAttackBox();
      const color = isPunch ? "rgba(255,220,50,0.8)" : "rgba(100,180,255,0.8)";
      const size = (isPunch ? 14 : 18) * attackPhase;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(atkBox.x + atkBox.w / 2, atkBox.y + atkBox.h / 2, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Electric attack visual effect — MASSIVT lyn-show rundt karakteren
    if (this.attacking && this.attackType === "electric") {
      const progress = this.attackTimer / Math.max(this.attackDuration, 0.5);
      const intensity = progress < 0.2 ? progress / 0.2 : (progress < 0.75 ? 1 : (1 - progress) / 0.25);
      if (intensity > 0.05) {
        ctx.save();

        const cx = this.x;
        const cy = Game.groundY + this.airY - this.drawSize * 0.5;
        const reach = 130 * this.scale;

        // Blålig fullskjerm-blink på toppen av angrepet
        if (intensity > 0.85) {
          ctx.globalAlpha = (intensity - 0.85) * 1.2;
          ctx.fillStyle = "rgba(150,200,255,0.25)";
          ctx.fillRect(0, 0, Game.width, Game.height);
        }

        ctx.globalAlpha = intensity * 0.9;

        // Stor dobbel glød: hvit-blå kjerne + gul ytterkant
        const radius = reach * (0.9 + Math.sin(performance.now() * 0.03) * 0.15);
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        glow.addColorStop(0, "rgba(255,255,255,0.55)");
        glow.addColorStop(0.25, "rgba(160,220,255,0.4)");
        glow.addColorStop(0.55, "rgba(255,230,80,0.25)");
        glow.addColorStop(1, "rgba(255,200,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

        // Glød på bakken (strømmen sprer seg langs gulvet)
        const groundGlow = ctx.createRadialGradient(cx, Game.groundY, 0, cx, Game.groundY, reach * 1.2);
        groundGlow.addColorStop(0, "rgba(180,230,255,0.45)");
        groundGlow.addColorStop(1, "rgba(180,230,255,0)");
        ctx.fillStyle = groundGlow;
        ctx.fillRect(cx - reach * 1.2, Game.groundY - 14, reach * 2.4, 18);

        const drawBolt = (x1, y1, x2, y2, width, color) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          const segments = 5 + Math.floor(Math.random() * 4);
          let px = x1, py = y1;
          for (let s = 1; s <= segments; s++) {
            const t = s / segments;
            const lx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 34;
            const ly = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 34;
            ctx.lineTo(lx, ly);
            // Grener: små lyn som spriker ut
            if (Math.random() < 0.3) {
              ctx.moveTo(lx, ly);
              ctx.lineTo(lx + (Math.random() - 0.5) * 50, ly + (Math.random() - 0.5) * 50);
              ctx.moveTo(lx, ly);
            }
            px = lx; py = ly;
          }
          ctx.stroke();
        };

        ctx.shadowColor = "#aef";
        ctx.shadowBlur = 22;

        // 12 kraftige lyn rundt hele kroppen
        for (let bolt = 0; bolt < 12; bolt++) {
          const angle = (bolt / 12) * Math.PI * 2 + performance.now() * 0.008;
          const startX = cx + Math.cos(angle) * 12;
          const startY = cy + Math.sin(angle) * 12;
          const dist = (reach * 0.7 + Math.random() * reach * 0.6);
          const endX = cx + Math.cos(angle) * dist;
          const endY = cy + Math.sin(angle) * dist;
          const blue = 200 + Math.random() * 55;
          // Ytre tykt blått lyn + indre tynn hvit kjerne
          drawBolt(startX, startY, endX, endY, 4 + Math.random() * 3, `rgba(120,190,255,${0.8 * intensity})`);
          drawBolt(startX, startY, endX, endY, 1.5, `rgba(255,255,${blue},${0.95 * intensity})`);
        }

        // Lyn som slår ned i bakken på hver side
        for (let g = 0; g < 4; g++) {
          const gx = cx + (Math.random() - 0.5) * reach * 2;
          drawBolt(cx, cy, gx, Game.groundY - 4, 3, `rgba(160,215,255,${0.7 * intensity})`);
        }

        // Gnister som flyr
        ctx.shadowBlur = 8;
        ctx.fillStyle = `rgba(255,255,200,${0.9 * intensity})`;
        for (let sp = 0; sp < 14; sp++) {
          const sa = Math.random() * Math.PI * 2;
          const sd = Math.random() * reach * 1.1;
          const sx2 = cx + Math.cos(sa) * sd;
          const sy2 = cy + Math.sin(sa) * sd;
          ctx.beginPath();
          ctx.arc(sx2, sy2, 1.5 + Math.random() * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    if (this.blocking) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#4af";
      const bodyBox = this.getBodyBox();
      ctx.fillRect(bodyBox.x - 4, bodyBox.y - 4, bodyBox.w + 8, bodyBox.h + 8);
      ctx.strokeStyle = "#4af";
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6;
      ctx.strokeRect(bodyBox.x - 4, bodyBox.y - 4, bodyBox.w + 8, bodyBox.h + 8);
      ctx.restore();
    }

    if (this.hitStun > 0) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = this.specialStunned > 0 ? "#ffdd44" : "#fff";
      const bodyBox = this.getBodyBox();
      ctx.fillRect(bodyBox.x, bodyBox.y, bodyBox.w, bodyBox.h);
      ctx.restore();

      // Svimmel-stjerner som sirkler over hodet ved spesial-stun
      if (this.specialStunned > 0) {
        ctx.save();
        const headX = this.x;
        const headY = Game.groundY + this.airY - this.drawSize * 0.78;
        const t = performance.now() * 0.005;
        ctx.fillStyle = "#ffd700";
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 8;
        ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        for (let s = 0; s < 4; s++) {
          const a = t + (s / 4) * Math.PI * 2;
          const sx2 = headX + Math.cos(a) * 34;
          const sy2 = headY + Math.sin(a) * 10 - 6;
          ctx.globalAlpha = 0.5 + Math.sin(a * 2) * 0.4;
          ctx.fillText("★", sx2, sy2);
        }
        ctx.restore();
        ctx.textAlign = "left";
      }
    }

    if (debug) {
      const box = this.getBodyBox();
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.w, box.h);
      ctx.fillStyle = "rgba(0,255,0,0.15)";
      ctx.fillRect(box.x, box.y, box.w, box.h);

      if (this.attacking && !this.hasHit) {
        const atkBox = this.getAttackBox();
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(atkBox.x, atkBox.y, atkBox.w, atkBox.h);
        ctx.fillStyle = "rgba(255,0,0,0.25)";
        ctx.fillRect(atkBox.x, atkBox.y, atkBox.w, atkBox.h);
      }

      ctx.fillStyle = "#0f0";
      ctx.font = "11px monospace";
      ctx.fillText(this.data.name, box.x, box.y - 5);
      ctx.fillText(`state: ${this.state} f:${this.frameIndex}`, box.x, box.y - 18);
    }
  }

  getBodyBox() {
    const b = this.data.bodyBox;
    const s = this.scale;
    const fx = this.facing === 1 ? 1 : -1;
    const sw = b.w * s;
    return {
      x: this.x + b.x * s * fx - (this.facing === -1 ? sw : 0),
      y: Game.groundY + this.airY + b.y * s,
      w: sw,
      h: b.h * s
    };
  }

  getAttackBox() {
    const b = this.data.attackBox;
    const s = this.scale;
    const fx = this.facing === 1 ? 1 : -1;
    // Spesialslag med hitRange (f.eks. stretchy arm) når lenger enn vanlig attackBox
    const animInfo = this.attacking ? this.data.animations[this.attackType] : null;
    const rawW = animInfo && animInfo.hitRange ? animInfo.hitRange : b.w;
    const sw = rawW * s;
    return {
      x: this.x + b.x * s * fx - (this.facing === -1 ? sw : 0),
      y: Game.groundY + this.airY + b.y * s,
      w: sw,
      h: b.h * s
    };
  }

  boxOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  reset() {
    this.health = this.maxHealth;
    this.x = this.playerIndex === 0 ? 300 : 700;
    this.facing = this.playerIndex === 0 ? 1 : -1;
    this.state = "idle";
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.moving = 0;
    this.attacking = false;
    this.hasHit = false;
    this.hitStun = 0;
    this.knockedOut = false;
    this.blocking = false;
    this.airY = 0;
    this.vy = 0;
    this.jumpVx = 0;
    this.kbVx = 0;
    this.specialCooldown = 0;
    this.aiTimer = 0;
    this.aiPlan = "approach";
  }
}
