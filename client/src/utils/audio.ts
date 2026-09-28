// ============================================================
// Web Audio API & Sound Effects Manager
// ============================================================

let audioCtx: AudioContext | null = null;
let sfxMasterGain: GainNode | null = null;
let sfxVolume = 0.8;
let isLofiOn = false;

export function unlockAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
    sfxMasterGain = audioCtx.createGain();
    sfxMasterGain.gain.setValueAtTime(sfxVolume, audioCtx.currentTime);
    sfxMasterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  if ('speechSynthesis' in window && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}

export function playActionSound(type?: string) {
  unlockAudioContext();
  if (!audioCtx || !sfxMasterGain) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type === 'allin' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(type === 'allin' ? 220 : 440, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(sfxMasterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch {
    // Ignore audio playback errors
  }
}

export function playEmptyClick() {
  unlockAudioContext();
  if (!audioCtx || !sfxMasterGain) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(sfxMasterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch {
    // Ignore
  }
}

export function playGunshot() {
  unlockAudioContext();
  if (!audioCtx || !sfxMasterGain) return;
  try {
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, audioCtx.currentTime + 0.35);
    oscGain.gain.setValueAtTime(0.9, audioCtx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    osc.connect(oscGain);
    oscGain.connect(sfxMasterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.38);

    const buffer = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.4), audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.35);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(sfxMasterGain);
    noise.start();
    noise.stop(audioCtx.currentTime + 0.38);
  } catch {
    // Ignore
  }
}

export function playGodSaveSound() {
  unlockAudioContext();
  if (!audioCtx || !sfxMasterGain) return;
  const ctx = audioCtx;
  const master = sfxMasterGain;
  try {
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);
      osc.connect(gain);
      gain.connect(master);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + 2.3);
    });
  } catch {
    // Ignore
  }
}

export function speakActionVoice(text: string) {
  unlockAudioContext();
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 1.15;
    utter.pitch = 0.95;
    utter.volume = Math.max(0.3, sfxVolume);
    window.speechSynthesis.speak(utter);
  } catch {
    // Ignore
  }
}

export function setSfxVolume(vol: number) {
  sfxVolume = vol / 100;
  if (sfxMasterGain && audioCtx) {
    sfxMasterGain.gain.setValueAtTime(sfxVolume, audioCtx.currentTime);
  }
}

export function setBgmVolume(vol: number) {
  const audio = document.getElementById('lofiBgm') as HTMLAudioElement | null;
  if (audio) {
    audio.volume = Math.pow(vol / 100, 2);
  }
}

export function toggleBgm(): boolean {
  unlockAudioContext();
  const audio = document.getElementById('lofiBgm') as HTMLAudioElement | null;
  if (!audio) return false;
  if (!isLofiOn) {
    audio.play().then(() => { isLofiOn = true; }).catch(() => {});
  } else {
    audio.pause();
    isLofiOn = false;
  }
  return isLofiOn;
}
