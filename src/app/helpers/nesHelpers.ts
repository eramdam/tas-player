export function runNESFrame(nes: any) {
  nes.ppu.startFrame()
  var cycles = 0;
  var emulateSound = true;
  var cpu = nes.cpu;
  var ppu = nes.ppu;
  var papu = nes.papu;

  FRAMELOOP: for (;;) {
    if (cpu.cyclesToHalt === 0) {
      // Execute a CPU instruction
      cycles = cpu.emulate();
      if (emulateSound) {
        papu.clockFrameCounter(cycles);
      }
      cycles *= 3;
    } else {
      if (cpu.cyclesToHalt > 8) {
        cycles = 24;
        if (emulateSound) {
          papu.clockFrameCounter(8);
        }
        cpu.cyclesToHalt -= 8;
      } else {
        cycles = cpu.cyclesToHalt * 3;
        if (emulateSound) {
          papu.clockFrameCounter(cpu.cyclesToHalt);
        }
        cpu.cyclesToHalt = 0;
      }
    }

    for (; cycles > 0; cycles--) {
      if (
        ppu.curX === ppu.spr0HitX &&
        ppu.f_spVisibility === 1 &&
        ppu.scanline - 21 === ppu.spr0HitY
      ) {
        // Set sprite 0 hit flag:
        ppu.setStatusFlag(ppu.STATUS_SPRITE0HIT, true);
      }

      if (ppu.requestEndFrame) {
        ppu.nmiCounter--;
        if (ppu.nmiCounter === 0) {
          ppu.requestEndFrame = false;
          ppu.startVBlank();
          break FRAMELOOP;
        }
      }

      ppu.curX++;
      if (ppu.curX === 341) {
        ppu.curX = 0;
        ppu.endScanline();
      }
    }
  }
  nes.fpsFrameCount++;
},