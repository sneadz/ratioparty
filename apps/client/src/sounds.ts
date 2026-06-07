// ─── Web Audio API — tous les sons du jeu ────────────────────────────────────

let _ctx: AudioContext | null = null
let _master: GainNode | null = null

function ctx(): AudioContext {
  if (!_ctx) _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function master(): GainNode {
  const c = ctx()
  if (!_master) {
    _master = c.createGain()
    _master.gain.value = 0.8
    _master.connect(c.destination)
  }
  return _master
}

export function setVolume(v: number) {
  master().gain.value = Math.max(0, Math.min(1, v))
}

export function getVolume(): number {
  return _master?.gain.value ?? 0.8
}

function note(freq: number, type: OscillatorType, volume: number, start: number, duration: number) {
  const c = ctx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(master())
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.start(start)
  osc.stop(start + duration)
}

/** Tick discret quand le curseur bouge */
export function playTick() {
  const c = ctx()
  note(1100, 'sine', 0.06, c.currentTime, 0.025)
}

/** Confirmation quand on valide sa réponse */
export function playLockGuess() {
  const c = ctx()
  note(440, 'sine', 0.18, c.currentTime,        0.12)
  note(660, 'sine', 0.18, c.currentTime + 0.09, 0.18)
}

/** Son selon le score du round (appelé au reveal) */
export function playScore(score: number) {
  const c = ctx()
  const t = c.currentTime

  if (score === 4) {
    // Fanfare montante — do mi sol do
    [523, 659, 784, 1047].forEach((f, i) => note(f, 'square', 0.12, t + i * 0.1, 0.22))
  } else if (score === 3) {
    // Deux notes positives
    note(523, 'sine', 0.18, t,        0.18)
    note(784, 'sine', 0.18, t + 0.12, 0.22)
  } else if (score === 2) {
    // Note neutre unique
    note(440, 'sine', 0.14, t, 0.3)
  } else {
    // Fail descendant
    [392, 330, 262].forEach((f, i) => note(f, 'sawtooth', 0.1, t + i * 0.14, 0.22))
  }
}

/** Whoosh au clic "Go next" */
export function playGoNext() {
  const c = ctx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(master())
  osc.type = 'sine'
  osc.frequency.setValueAtTime(280, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(700, c.currentTime + 0.18)
  gain.gain.setValueAtTime(0.14, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.18)
  osc.start(c.currentTime)
  osc.stop(c.currentTime + 0.18)
}
