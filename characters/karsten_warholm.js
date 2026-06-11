const KARSTEN_WARHOLM = {
  id: "karsten_warholm",
  name: "Karsten Warholm",
  nickname: "Hekke-Kongen",
  color: "#e63946",
  spriteBase: "images/characters/runar_red",
  frameSize: 256,
  feetOffset: 26,
  scale: 1.3,
  health: 95,
  speed: 7,
  animations: {
    idle:     { frames: 16, fps: 14, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    walk:     { frames: 16, fps: 18, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    punch:    { frames: 10, fps: 20, loop: false, damage: 8,  hitFrame: 3, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    kick:     { frames: 10, fps: 18, loop: false, damage: 10, hitFrame: 4, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    hit:      { frames: 10, fps: 12, loop: false, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    knockout: { frames: 16, fps: 10, loop: false, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    block:    { frames: 16, fps: 12, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } }
  },
  bodyBox:   { x: -18, y: -155, w: 36, h: 155 },
  attackBox: { x: 10,  y: -130, w: 110, h: 80 }
};
