const RUNAR_RED = {
  id: "runar_red",
  name: "Runar",
  nickname: "Mandora Boss",
  color: "#e63946",
  spriteBase: "images/characters/runar_red",
  portrait: "images/portraits/runar.png",
  frameSize: 256,
  feetOffset: 26,
  scale: 1.05,
  health: 100,
  speed: 4,
  animations: {
    idle:     { frames: 16, fps: 12, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    walk:     { frames: 16, fps: 14, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    punch:    { frames: 16, fps: 20, loop: false, damage: 8,  hitFrame: 5, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    kick:     { frames: 16, fps: 18, loop: false, damage: 12, hitFrame: 6, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    crouchkick: { frames: 16, fps: 18, loop: false, damage: 11, hitFrame: 6, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    jumpkick:   { frames: 16, fps: 18, loop: false, damage: 14, hitFrame: 5, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    hadouken: { frames: 16, fps: 16, loop: false, damage: 18, hitFrame: 6, hitRange: 120, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 }, isSpecial: true },
    hit:      { frames: 16, fps: 14, loop: false, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    knockout: { frames: 16, fps: 10, loop: false, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    block:    { frames: 16, fps: 12, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } }
  },
  bodyBox:   { x: -23, y: -155, w: 46, h: 155 },
  attackBox: { x: 5,  y: -145, w: 150, h: 110 }
};
