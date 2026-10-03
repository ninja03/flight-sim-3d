// On-screen touch controls for phones/tablets.
// Builds a virtual joystick (pitch + roll) and momentary buttons, then feeds
// them into the shared Input object via input.setTouch(name, bool).
export class TouchControls {
  constructor(input, { onCamera, onReset } = {}) {
    this.input = input;

    document.body.classList.add('touch');
    const root = document.getElementById('touch');
    if (root) root.classList.remove('hidden');

    // --- left virtual joystick: pitch (vertical) + roll (horizontal) ---
    const stick = el('div', 'tc-stick');
    const knob = el('div', 'tc-knob');
    stick.appendChild(knob);
    if (root) root.appendChild(stick);
    this._bindStick(stick, knob);

    // --- right cluster: throttle up/down + air brake ---
    if (root) {
      root.appendChild(this._holdButton('tc-btn tc-thr-up', '▲', 'throttleUp'));
      root.appendChild(this._holdButton('tc-btn tc-thr-down', '▼', 'throttleDown'));
      root.appendChild(this._holdButton('tc-btn tc-brake', 'BRAKE', 'brake'));
      // --- top-right: camera toggle + reset (tap) ---
      root.appendChild(this._tapButton('tc-btn tc-cam', 'CAM', onCamera));
      root.appendChild(this._tapButton('tc-btn tc-rst', 'RST', onReset));
    }
  }

  _holdButton(cls, label, key) {
    const b = el('button', cls);
    b.textContent = label;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { b.setPointerCapture(e.pointerId); } catch (_) {}
      this.input.setTouch(key, true);
      b.classList.add('active');
    });
    const off = () => {
      this.input.setTouch(key, false);
      b.classList.remove('active');
    };
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
    b.addEventListener('lostpointercapture', off);
    return b;
  }

  _tapButton(cls, label, handler) {
    const b = el('button', cls);
    b.textContent = label;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (handler) handler();
      b.classList.add('active');
      setTimeout(() => b.classList.remove('active'), 160);
    });
    return b;
  }

  _bindStick(stick, knob) {
    let id = null, cx = 0, cy = 0, R = 0;

    const move = (e) => {
      if (e.pointerId !== id) return;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const mag = Math.hypot(dx, dy);
      if (mag > R) { dx = (dx / mag) * R; dy = (dy / mag) * R; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const dz = R * 0.22; // deadzone so light rests don't move the plane
      this.input.setTouch('rollRight', dx > dz);
      this.input.setTouch('rollLeft', dx < -dz);
      this.input.setTouch('pitchUp', dy < -dz);
      this.input.setTouch('pitchDown', dy > dz);
    };

    const start = (e) => {
      e.preventDefault();
      id = e.pointerId;
      const r = stick.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      R = r.width / 2;
      try { stick.setPointerCapture(id); } catch (_) {}
      move(e);
    };

    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      knob.style.transform = 'translate(0px, 0px)';
      ['rollLeft', 'rollRight', 'pitchUp', 'pitchDown'].forEach((k) => this.input.setTouch(k, false));
    };

    stick.addEventListener('pointerdown', start);
    stick.addEventListener('pointermove', move);
    stick.addEventListener('pointerup', end);
    stick.addEventListener('pointercancel', end);
  }
}

function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}