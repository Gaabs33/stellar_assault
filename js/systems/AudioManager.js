/**
 * AudioManager centralizado com efeitos retro sintetizados pela Web Audio API.
 *
 * O AudioContext e criado sob demanda e reutilizado durante toda a partida.
 * Isso evita criar um contexto por tiro e tambem respeita a politica dos
 * navegadores, que pode manter o contexto suspenso antes de uma interacao.
 */
export class AudioManager {
    constructor(options = {}) {
        this.masterVolume = options.masterVolume ?? 0.7;
        this.sfxVolume = options.sfxVolume ?? 0.8;
        this.contextFactory = options.contextFactory || null;
        this.audioContext = null;
        this.sounds = new Map();
        this.activeSounds = new Map();
        this.lastPlayedAt = new Map();
        this.noiseBuffer = null;
    }

    /** Retorna o unico contexto, sem falhar em testes ou browsers sem audio. */
    ensureContext() {
        if (this.audioContext) return this.audioContext;

        try {
            const AudioContextClass = this.contextFactory
                || globalThis.AudioContext
                || globalThis.webkitAudioContext;
            if (!AudioContextClass) return null;
            this.audioContext = new AudioContextClass();
        } catch {
            this.audioContext = null;
        }
        return this.audioContext;
    }

    /** Deve ser chamado por uma interacao valida de teclado ou pointer. */
    unlock() {
        const context = this.ensureContext();
        if (!context || context.state !== "suspended" || typeof context.resume !== "function") {
            return Promise.resolve(false);
        }

        return context.resume()
            .then(() => true)
            .catch(() => false);
    }

    setVolume(masterVolume = this.masterVolume, sfxVolume = this.sfxVolume) {
        this.masterVolume = Math.max(0, Math.min(1, masterVolume));
        this.sfxVolume = Math.max(0, Math.min(1, sfxVolume));
    }

    registerSound(name, source) {
        if (source) this.sounds.set(name, source);
    }

    /** Compatibilidade com chamadas antigas do projeto. */
    play(name, ...args) {
        const methods = {
            shot: "playPlayerShot",
            enemyShot: "playEnemyShot",
            machineGunShot: "playMachineGunShot",
            enemyHit: "playEnemyHit",
            explosion: "playEnemyExplosion",
            playerHit: "playPlayerDamage",
            power: "playPowerActivation",
            bossWarning: "playBossWarning",
            bossHit: "playBossHit",
            laserCharge: "playLaserCharge",
            laserFire: "playLaserFire",
            doubleLaserCharge: "playDoubleLaserCharge",
            doubleLaserFire: "playDoubleLaserFire",
            spreadShot: "playSpreadShot",
            burstShot: "playBurstShot",
            summon: "playSummon",
            projectileWall: "playProjectileWall",
            chargeAttack: "playChargeAttack",
            bossExplosion: "playBossExplosion",
            menuMove: "playMenuMove",
            menuSelect: "playMenuConfirm",
            menuConfirm: "playMenuConfirm",
            stageClear: "playStageClear",
        };
        const methodName = methods[name];
        return methodName && typeof this[methodName] === "function"
            ? this[methodName](...args)
            : false;
    }

    get currentTime() {
        return this.audioContext?.currentTime ?? 0;
    }

    canPlay(key, minimumInterval = 0) {
        const now = this.currentTime;
        const previous = this.lastPlayedAt.get(key) ?? -Infinity;
        if (now - previous < minimumInterval) return false;
        this.lastPlayedAt.set(key, now);
        return true;
    }

    playTone(options = {}) {
        const context = this.ensureContext();
        if (!context || this.masterVolume <= 0 || this.sfxVolume <= 0) return false;

        const now = context.currentTime + (options.when ?? 0);
        const duration = Math.max(0.01, options.duration ?? 0.08);
        const attack = Math.min(options.attack ?? 0.005, duration / 2);
        const release = Math.min(options.release ?? 0.04, duration / 2);
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const peak = Math.max(0.0001, (options.volume ?? 0.12) * this.masterVolume * this.sfxVolume);

        oscillator.type = options.type || "square";
        oscillator.frequency.setValueAtTime(options.frequency ?? 440, now);
        if (options.endFrequency) {
            oscillator.frequency.linearRampToValueAtTime(options.endFrequency, now + duration);
        }
        if (options.detune) oscillator.detune.setValueAtTime(options.detune, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(peak, now + attack);
        gain.gain.setValueAtTime(peak, now + Math.max(attack, duration - release));
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + duration + 0.02);
        oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
        };
        return true;
    }

    getNoiseBuffer() {
        const context = this.audioContext;
        if (!context) return null;
        if (this.noiseBuffer) return this.noiseBuffer;

        const length = Math.floor(context.sampleRate * 0.5);
        this.noiseBuffer = context.createBuffer(1, length, context.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let index = 0; index < data.length; index += 1) {
            data[index] = (Math.random() * 2) - 1;
        }
        return this.noiseBuffer;
    }

    playNoise(options = {}) {
        const context = this.ensureContext();
        const buffer = this.getNoiseBuffer();
        if (!context || !buffer) return false;

        const now = context.currentTime;
        const duration = Math.min(options.duration ?? 0.2, buffer.duration);
        const source = context.createBufferSource();
        const gain = context.createGain();
        const peak = Math.max(0.0001, (options.volume ?? 0.08) * this.masterVolume * this.sfxVolume);
        source.buffer = buffer;
        gain.gain.setValueAtTime(peak, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        if (options.filterFrequency && typeof context.createBiquadFilter === "function") {
            const filter = context.createBiquadFilter();
            filter.type = options.filterType || "bandpass";
            filter.frequency.setValueAtTime(options.filterFrequency, now);
            source.connect(filter);
            filter.connect(gain);
        } else {
            source.connect(gain);
        }
        gain.connect(context.destination);
        source.start(now);
        source.stop(now + duration + 0.02);
        source.onended = () => {
            source.disconnect();
            gain.disconnect();
        };
        return true;
    }

    playPlayerShot(playerId = "player1") {
        const context = this.ensureContext();
        if (!context || !this.canPlay(`playerShot-${playerId}`, 0.045)) return false;
        return this.playTone({
            type: "square",
            frequency: playerId === "player2" ? 660 : 580,
            endFrequency: playerId === "player2" ? 420 : 380,
            duration: 0.07,
            volume: 0.08,
        });
    }

    playEnemyShot() {
        const context = this.ensureContext();
        if (!context || !this.canPlay("enemyShot", 0.04)) return false;
        return this.playTone({
            type: "sawtooth",
            frequency: 220,
            endFrequency: 120,
            duration: 0.09,
            volume: 0.09,
        });
    }

    playMachineGunShot() {
        const context = this.ensureContext();
        if (!context || !this.canPlay("machineGunShot", 0.04)) return false;
        return this.playTone({
            type: "square",
            frequency: 175,
            endFrequency: 95,
            duration: 0.055,
            volume: 0.075,
        });
    }

    playEnemyHit() {
        const context = this.ensureContext();
        if (!context || !this.canPlay("enemyHit", 0.035)) return false;
        return this.playTone({
            type: "triangle",
            frequency: 260,
            endFrequency: 170,
            duration: 0.06,
            volume: 0.06,
        });
    }

    playEnemyExplosion() {
        const playedNoise = this.playNoise({
            duration: 0.22,
            volume: 0.13,
            filterFrequency: 700,
        });
        this.playTone({
            type: "sawtooth",
            frequency: 190,
            endFrequency: 55,
            duration: 0.24,
            volume: 0.1,
        });
        return playedNoise;
    }

    playPlayerDamage() {
        const context = this.ensureContext();
        if (!context || !this.canPlay("playerDamage", 0.25)) return false;
        return this.playTone({
            type: "square",
            frequency: 150,
            endFrequency: 75,
            duration: 0.18,
            volume: 0.13,
        });
    }

    playPowerActivation() {
        const context = this.ensureContext();
        if (!context || !this.canPlay("power", 0.2)) return false;
        this.playTone({ type: "triangle", frequency: 180, endFrequency: 720, duration: 0.42, volume: 0.11 });
        this.playTone({ type: "square", frequency: 360, endFrequency: 1080, duration: 0.3, volume: 0.055 });
        return true;
    }

    playBossWarning() {
        const context = this.ensureContext();
        if (!context || !this.canPlay("bossWarning", 1.5)) return false;
        [0, 0.32, 0.64].forEach((offset) => {
            this.playTone({ type: "square", frequency: 440, duration: 0.12, volume: 0.12, attack: 0.002, release: 0.04, when: offset });
        });
        return true;
    }

    playBossHit() {
        const context = this.ensureContext();
        if (!context || !this.canPlay("bossHit", 0.045)) return false;
        return this.playTone({ type: "triangle", frequency: 120, endFrequency: 75, duration: 0.08, volume: 0.065 });
    }

    playLaserCharge(duration = 2) {
        const context = this.ensureContext();
        if (!context || this.activeSounds.has("laserCharge")) return false;

        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const peak = 0.11 * this.masterVolume * this.sfxVolume;
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.linearRampToValueAtTime(900, now + duration);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(peak, now + 0.12);
        gain.gain.setValueAtTime(peak, now + Math.max(0.12, duration - 0.1));
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + duration + 0.03);
        this.activeSounds.set("laserCharge", { oscillator, gain });
        oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
            this.activeSounds.delete("laserCharge");
        };
        return true;
    }

    stopLaserCharge() {
        const active = this.activeSounds.get("laserCharge");
        const context = this.audioContext;
        if (!active || !context) return;
        const now = context.currentTime;
        active.gain.gain.cancelScheduledValues(now);
        active.gain.gain.setValueAtTime(0.0001, now);
        try {
            active.oscillator.stop(now + 0.02);
        } catch {
            // O oscillator ja pode ter terminado naturalmente.
        }
        this.activeSounds.delete("laserCharge");
    }

    playLaserFire() {
        this.stopLaserCharge();
        this.playTone({ type: "sawtooth", frequency: 90, endFrequency: 35, duration: 0.7, volume: 0.15 });
        this.playTone({ type: "square", frequency: 180, endFrequency: 55, duration: 0.5, volume: 0.07 });
        this.playNoise({ duration: 0.55, volume: 0.1, filterFrequency: 420 });
        return true;
    }

    playDoubleLaserCharge(duration = 2) {
        const context = this.ensureContext();
        if (!context || this.activeSounds.has("doubleLaserCharge")) return false;

        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const peak = 0.1 * this.masterVolume * this.sfxVolume;
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(140, now);
        oscillator.frequency.linearRampToValueAtTime(760, now + duration);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(peak, now + 0.1);
        gain.gain.setValueAtTime(peak, now + Math.max(0.1, duration - 0.1));
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + duration + 0.03);
        this.activeSounds.set("doubleLaserCharge", { oscillator, gain });
        oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
            this.activeSounds.delete("doubleLaserCharge");
        };
        return true;
    }

    stopDoubleLaserCharge() {
        const active = this.activeSounds.get("doubleLaserCharge");
        const context = this.audioContext;
        if (!active || !context) return;
        const now = context.currentTime;
        active.gain.gain.cancelScheduledValues(now);
        active.gain.gain.setValueAtTime(0.0001, now);
        try {
            active.oscillator.stop(now + 0.02);
        } catch {
            // O oscilador ja pode ter terminado naturalmente.
        }
        this.activeSounds.delete("doubleLaserCharge");
    }

    playDoubleLaserFire() {
        this.stopDoubleLaserCharge();
        this.playTone({ type: "sawtooth", frequency: 72, endFrequency: 28, duration: 0.75, volume: 0.16 });
        this.playTone({ type: "square", frequency: 145, endFrequency: 45, duration: 0.55, volume: 0.065 });
        this.playNoise({ duration: 0.48, volume: 0.09, filterFrequency: 360 });
        return true;
    }

    playSpreadShot() {
        const context = this.ensureContext();
        if (!context || !this.canPlay("spreadShot", 0.12)) return false;
        return this.playTone({ type: "triangle", frequency: 310, endFrequency: 150, duration: 0.11, volume: 0.07 });
    }

    playBurstShot() {
        const context = this.ensureContext();
        if (!context || !this.canPlay("burstShot", 0.08)) return false;
        return this.playTone({ type: "square", frequency: 250, endFrequency: 105, duration: 0.07, volume: 0.065 });
    }

    playSummon() {
        const context = this.ensureContext();
        if (!context || !this.canPlay("summon", 0.35)) return false;
        this.playTone({ type: "triangle", frequency: 180, endFrequency: 540, duration: 0.3, volume: 0.08 });
        return this.playTone({ type: "square", frequency: 360, endFrequency: 180, duration: 0.22, volume: 0.04 });
    }

    playProjectileWall() {
        const context = this.ensureContext();
        if (!context || !this.canPlay("projectileWall", 0.28)) return false;
        return this.playTone({ type: "sawtooth", frequency: 120, endFrequency: 70, duration: 0.18, volume: 0.07 });
    }

    playChargeAttack() {
        const context = this.ensureContext();
        if (!context || !this.canPlay("chargeAttack", 0.25)) return false;
        return this.playTone({ type: "square", frequency: 95, endFrequency: 260, duration: 0.22, volume: 0.09 });
    }

    playBossExplosion() {
        this.playNoise({ duration: 1.1, volume: 0.16, filterFrequency: 500 });
        this.playTone({ type: "sawtooth", frequency: 240, endFrequency: 35, duration: 1.2, volume: 0.16 });
        this.playTone({ type: "square", frequency: 120, endFrequency: 25, duration: 0.9, volume: 0.08 });
        return true;
    }

    playMenuMove() {
        return this.playTone({ type: "square", frequency: 520, endFrequency: 400, duration: 0.045, volume: 0.055 });
    }

    playMenuConfirm() {
        this.playTone({ type: "triangle", frequency: 440, endFrequency: 720, duration: 0.15, volume: 0.09 });
        return this.playTone({ type: "square", frequency: 660, duration: 0.09, volume: 0.045 });
    }

    playStageClear() {
        [0, 0.12, 0.24].forEach((offset, index) => {
            this.playTone({
                type: "triangle",
                frequency: 440 + (index * 110),
                duration: 0.22,
                volume: 0.1,
                when: offset,
            });
        });
        return true;
    }

    // Compatibilidade segura: não cria contexto, osciladores ou timers.
    playMusic() { return false; }
    playStageMusic() { return false; }
    stopMusic() { return false; }
}
