const RISHI = {
  id: "rishi",
  name: "Rishi",
  nickname: "Mesterbokseren",
  color: "#1e5bd6",
  country: "in",
  spriteBase: "images/characters/rishi",
  portrait: "images/portraits/rishi.png",
  frameSize: 256,
  feetOffset: 26,
  scale: 1.1,
  health: 120,
  speed: 4,
  animations: {
    idle:     { frames: 16, fps: 12, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    walk:     { frames: 16, fps: 14, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    punch:    { frames: 16, fps: 22, loop: false, damage: 13, hitFrame: 5, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    kick:     { frames: 16, fps: 16, loop: false, damage: 11, hitFrame: 6, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    crouchkick: { frames: 16, fps: 18, loop: false, damage: 11, hitFrame: 6, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    jumpkick:   { frames: 16, fps: 18, loop: false, damage: 14, hitFrame: 5, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    hadouken:   { frames: 16, fps: 16, loop: false, damage: 22, hitFrame: 7, hitRange: 190, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 }, isSpecial: true },
    hit:      { frames: 16, fps: 14, loop: false, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    knockout: { frames: 16, fps: 10, loop: false, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    block:    { frames: 16, fps: 12, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    victory:  { frames: 16, fps: 12, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } }
  },
  bodyBox:   { x: -23, y: -155, w: 46, h: 155 },
  attackBox: { x: 5,  y: -145, w: 150, h: 110 }
};
