const STIAN_BLIPP = {
  id: "stian_blipp",
  name: "Shaishank",
  nickname: "Showmannen",
  country: "in",
  color: "#cc2200",
  spriteBase: "images/characters/stian_blipp",
  portrait: "images/portraits/shaishank.png",
  frameSize: 256,
  feetOffset: 26,
  scale: 1.15,
  health: 130,
  speed: 3,
  animations: {
    idle:     { frames: 16, fps: 10, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    walk:     { frames: 16, fps: 12, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    punch:    { frames: 16, fps: 14, loop: false, damage: 14, hitFrame: 6, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    kick:     { frames: 16, fps: 12, loop: false, damage: 20, hitFrame: 7, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    crouchkick: { frames: 16, fps: 16, loop: false, damage: 14, hitFrame: 6, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    jumpkick:   { frames: 16, fps: 16, loop: false, damage: 17, hitFrame: 5, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    hadouken:   { frames: 16, fps: 14, loop: false, damage: 21, hitFrame: 6, hitRange: 140, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 }, isSpecial: true },
    hit:      { frames: 16, fps: 14, loop: false, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    knockout: { frames: 16, fps: 10, loop: false, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    block:    { frames: 16, fps: 10, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } }
  },
  bodyBox:   { x: -23, y: -155, w: 46, h: 155 },
  attackBox: { x: 5,  y: -145, w: 150, h: 110 }
};
