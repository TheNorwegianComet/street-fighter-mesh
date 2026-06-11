const MATHIAS = {
  id: "mathias",
  name: "Mathias",
  nickname: "Vandreren",
  color: "#e8e8e8",
  spriteBase: "images/characters/mathias",
  portrait: "images/portraits/mathias.png",
  frameSize: 256,
  feetOffset: 26,
  scale: 1.05,
  health: 100,
  speed: 5,
  animations: {
    idle:     { frames: 16, fps: 12, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    walk:     { frames: 16, fps: 14, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    punch:    { frames: 16, fps: 20, loop: false, damage: 10, hitFrame: 5, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    kick:     { frames: 16, fps: 18, loop: false, damage: 14, hitFrame: 6, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    crouchkick: { frames: 16, fps: 18, loop: false, damage: 12, hitFrame: 6, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    jumpkick:   { frames: 16, fps: 18, loop: false, damage: 15, hitFrame: 5, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    hadouken: { frames: 16, fps: 16, loop: false, damage: 19, hitFrame: 8, hitRange: 220, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 }, isSpecial: true, projectile: "energy" },
    hit:      { frames: 16, fps: 14, loop: false, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    knockout: { frames: 16, fps: 10, loop: false, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    block:    { frames: 16, fps: 12, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } }
  },
  bodyBox:   { x: -23, y: -155, w: 46, h: 155 },
  attackBox: { x: 5,  y: -145, w: 155, h: 110 }
};
