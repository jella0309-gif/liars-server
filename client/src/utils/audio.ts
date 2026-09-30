// ============================================================
// Web Audio API & Sound Effects Manager
// ============================================================

let audioCtx: AudioContext | null = null;
let sfxMasterGain: GainNode | null = null;
let sfxVolume = 0.8;
let isLofiOn = false;
let ambientGain: GainNode | null = null;
let bgmVolume = 0.2;
const ambientVoices: OscillatorNode[] = [];

export function unlockAudioContext() {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
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
    osc.frequency.setValueAtTime(
      type === 'allin' ? 220 : 440,
      audioCtx.currentTime
    );
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
    osc.frequency.exponentialRampToValueAtTime(
      300,
      audioCtx.currentTime + 0.04
    );
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

let rouletteSpinTimer: ReturnType<typeof setInterval> | null = null;

export function playBulletLoadSound() {
  unlockAudioContext();

  if (!audioCtx || !sfxMasterGain) return;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(900, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      180,
      audioCtx.currentTime + 0.07
    );

    gain.gain.setValueAtTime(0.22, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + 0.08
    );

    osc.connect(gain);
    gain.connect(sfxMasterGain);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.09);
  } catch {
    // Ignore audio playback errors
  }
}

function playCylinderTick() {
  unlockAudioContext();

  if (!audioCtx || !sfxMasterGain) return;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + 0.06
    );

    osc.connect(gain);
    gain.connect(sfxMasterGain);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.07);
  } catch {
    // Ignore audio playback errors
  }
}

export function playCylinderSpinSound() {
  stopCylinderSpinSound();
  playCylinderTick();

  rouletteSpinTimer = setInterval(() => {
    playCylinderTick();
  }, 95);
}

export function stopCylinderSpinSound() {
  if (rouletteSpinTimer) {
    clearInterval(rouletteSpinTimer);
    rouletteSpinTimer = null;
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
    osc.frequency.exponentialRampToValueAtTime(
      35,
      audioCtx.currentTime + 0.35
    );

    oscGain.gain.setValueAtTime(0.9, audioCtx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + 0.35
    );

    osc.connect(oscGain);
    oscGain.connect(sfxMasterGain);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.38);

    const buffer = audioCtx.createBuffer(
      1,
      Math.floor(audioCtx.sampleRate * 0.4),
      audioCtx.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(
      100,
      audioCtx.currentTime + 0.35
    );

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + 0.35
    );

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(sfxMasterGain);

    noise.start();
    noise.stop(audioCtx.currentTime + 0.38);
  } catch {
    // Ignore audio playback errors
  }
}

export function playGodSaveSound() {
  unlockAudioContext();
  if (!audioCtx || !sfxMasterGain) return;
  const ctx = audioCtx;
  const master = sfxMasterGain;
  try {
    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51];
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

const actionVoiceFiles: Record<string, string> = {
  call: '/call.mp3',
  fold: '/fold.mp3',
  allin: '/allin.mp3',
};

const actionVoiceBuffers = new Map<string, AudioBuffer>();
let currentVoiceSource: AudioBufferSourceNode | null = null;

async function loadActionVoice(type: string) {
  if (!audioCtx) return null;

  const cached = actionVoiceBuffers.get(type);
  if (cached) return cached;

  const file = actionVoiceFiles[type];
  if (!file) return null;

  try {
    const response = await fetch(file);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await audioCtx.decodeAudioData(arrayBuffer);

    actionVoiceBuffers.set(type, buffer);
    return buffer;
  } catch {
    return null;
  }
}

export function speakActionVoice(type: string) {
  unlockAudioContext();

  if (!audioCtx || !sfxMasterGain) return;

  const ctx = audioCtx;
  const master = sfxMasterGain;

  void loadActionVoice(type).then((buffer) => {
    if (!buffer || audioCtx !== ctx) return;

    try {
      currentVoiceSource?.stop();
    } catch {
      // Ignore
    }

    const source = ctx.createBufferSource();
const voiceGain = ctx.createGain();

source.buffer = buffer;

// Tăng giọng đọc lên khoảng 2,2 lần
voiceGain.gain.setValueAtTime(2.2, ctx.currentTime);

source.connect(voiceGain);
voiceGain.connect(master);
source.start();

    currentVoiceSource = source;

    source.onended = () => {
      if (currentVoiceSource === source) {
        currentVoiceSource = null;
      }
    };
  });
}

export function setSfxVolume(vol: number) {
  sfxVolume = vol / 100;
  if (sfxMasterGain && audioCtx) {
    sfxMasterGain.gain.setValueAtTime(sfxVolume, audioCtx.currentTime);
  }
}

let bgmAudio: HTMLAudioElement | null = null;
let bgmInitialized = false;

function initBgm() {
  if (!bgmAudio) {
    bgmAudio = new Audio('/bgm.mp3');
    bgmAudio.loop = true;
    bgmAudio.volume = bgmVolume;
  }
}

export function autoStartBgmOnFirstInteraction() {
  if (bgmInitialized) return;
  const startAudio = () => {
    unlockAudioContext();
    initBgm();
    if (!isLofiOn) {
      isLofiOn = true;
      bgmAudio?.play().catch(() => {});
    }
    bgmInitialized = true;
    window.removeEventListener('pointerdown', startAudio);
    window.removeEventListener('keydown', startAudio);
  };

  window.addEventListener('pointerdown', startAudio, { once: true });
  window.addEventListener('keydown', startAudio, { once: true });
}

if (typeof window !== 'undefined') {
  autoStartBgmOnFirstInteraction();
}

export function setBgmVolume(vol: number) {
  bgmVolume = vol / 100;
  if (bgmAudio) {
    bgmAudio.volume = bgmVolume;
  }
}

export function toggleBgm(): boolean {
  unlockAudioContext();
  initBgm();

  isLofiOn = !isLofiOn;

  if (isLofiOn) {
    bgmAudio?.play().catch(() => {});
  } else {
    bgmAudio?.pause();
  }

  return isLofiOn;
}
