const KRISTOFFER_JONER = {
  id: "kristoffer_joner",
  name: "Bjørn",
  nickname: "Trollet",
  country: "us",
  color: "#4a8c23",
  spriteBase: "images/characters/kristoffer_joner",
  portrait: "images/portraits/bjorn.png",
  frameSize: 256,
  feetOffset: 26,
  scale: 1.1,
  health: 115,
  speed: 4,
  animations: {
    idle:     { frames: 16, fps: 12, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    walk:     { frames: 16, fps: 14, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    punch:    { frames: 16, fps: 16, loop: false, damage: 12, hitFrame: 5, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    kick:     { frames: 16, fps: 14, loop: false, damage: 16, hitFrame: 6, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    crouchkick: { frames: 16, fps: 18, loop: false, damage: 13, hitFrame: 6, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    jumpkick:   { frames: 16, fps: 18, loop: false, damage: 16, hitFrame: 5, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    electric: { frames: 16, fps: 14, loop: false, damage: 22, hitFrame: 8, hitRange: 180, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    hit:      { frames: 16, fps: 14, loop: false, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    knockout: { frames: 16, fps: 10, loop: false, spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } },
    block:    { frames: 16, fps: 12, loop: true,  spritesheet: { columns: 4, frameWidth: 256, frameHeight: 256 } }
  },
  bodyBox:   { x: -23, y: -155, w: 46, h: 155 },
  attackBox: { x: 5,  y: -145, w: 150, h: 110 },
  electricBox: { x: -230, y: -170, w: 460, h: 170 }
};
