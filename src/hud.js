// Updates the DOM HUD readouts.
export class HUD {
  constructor() {
    this.speed = document.getElementById('hud-speed');
    this.alt = document.getElementById('hud-alt');
    this.vs = document.getElementById('hud-vs');
    this.head = document.getElementById('hud-head');
    this.thr = document.getElementById('hud-thr');
    this.score = document.getElementById('hud-score');
    this.mode = document.getElementById('hud-mode');
    this.msg = document.getElementById('message');
    this._t = null;
  }

  update(aircraft, score, total) {
    this.speed.textContent = Math.round(aircraft.speed * 3.6);
    this.alt.textContent = Math.round(aircraft.altitude);
    this.vs.textContent = Math.round(aircraft._vs);

    let hdg = (-aircraft.heading * 180 / Math.PI) % 360;
    if (hdg < 0) hdg += 360;
    this.head.textContent = Math.round(hdg).toString().padStart(3, '0');

    this.thr.textContent = Math.round(aircraft.throttle * 100) + '%';
    this.score.textContent = `${score}/${total}`;
  }

  setMode(text) {
    this.mode.textContent = text;
  }

  showMessage(text, ms = 2000) {
    this.msg.textContent = text;
    this.msg.style.opacity = '1';
    clearTimeout(this._t);
    if (ms < 100000) {
      this._t = setTimeout(() => {
        this.msg.style.opacity = '0';
      }, ms);
    }
  }

  clearMessage() {
    clearTimeout(this._t);
    this.msg.style.opacity = '0';
  }
}
