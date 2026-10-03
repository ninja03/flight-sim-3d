// Input aggregated from keyboard AND on-screen touch controls.
// The aircraft reads the boolean getters below, so both sources feed the
// same flight model.
export class Input {
  constructor() {
    this.keys = new Set();
    this.touch = {
      pitchUp: false, pitchDown: false,
      rollLeft: false, rollRight: false,
      yawLeft: false, yawRight: false,
      throttleUp: false, throttleDown: false,
      brake: false,
    };

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.clearTouch();
    });
  }

  isDown(...codes) {
    return codes.some((c) => this.keys.has(c));
  }

  setTouch(name, value) {
    if (name in this.touch) this.touch[name] = value;
  }

  clearTouch() {
    for (const k in this.touch) this.touch[k] = false;
  }

  get pitchUp() { return this.isDown('KeyS', 'ArrowDown') || this.touch.pitchUp; }
  get pitchDown() { return this.isDown('KeyW', 'ArrowUp') || this.touch.pitchDown; }
  get rollLeft() { return this.isDown('KeyA', 'ArrowLeft') || this.touch.rollLeft; }
  get rollRight() { return this.isDown('KeyD', 'ArrowRight') || this.touch.rollRight; }
  get yawLeft() { return this.isDown('KeyQ') || this.touch.yawLeft; }
  get yawRight() { return this.isDown('KeyE') || this.touch.yawRight; }
  get throttleUp() { return this.isDown('ShiftLeft', 'ShiftRight') || this.touch.throttleUp; }
  get throttleDown() { return this.isDown('ControlLeft', 'ControlRight') || this.touch.throttleDown; }
  get brake() { return this.isDown('Space') || this.touch.brake; }
}
