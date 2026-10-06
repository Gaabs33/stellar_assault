/**
 * Estados explícitos do laser. Durante CHARGING o Boss ainda se move; ao
 * entrar em FIRING o movimento já foi congelado e o canhão fica conectado ao
 * mesmo eixo Y até o fim do disparo.
 */
export const LASER_STATES = Object.freeze({
    IDLE: "idle",
    CHARGING: "charging",
    FIRING: "firing",
    COOLDOWN: "cooldown",
});

export class LaserAttack {
    constructor(config) {
        this.config = config;
        this.reset();
    }

    reset() {
        this.state = LASER_STATES.IDLE;
        this.timeRemaining = 0;
        this.cooldownRemaining = this.config.initialCooldown ?? 4;
        this.laserY = 0;
        this.hitPlayers = new Set();
    }

    get isCharging() {
        return this.state === LASER_STATES.CHARGING;
    }

    get isFiring() {
        return this.state === LASER_STATES.FIRING;
    }

    update(deltaTime, boss) {
        let activated = false;
        let charging = false;
        let finished = false;

        if (this.state === LASER_STATES.CHARGING) {
            this.laserY = boss.laserCannonY;
            this.timeRemaining = Math.max(0, this.timeRemaining - deltaTime);
            if (this.timeRemaining === 0) {
                // O Boss ja foi atualizado neste frame; esta e a posicao exata
                // em que o canhao dispara e onde ele ficara parado.
                this.laserY = boss.laserCannonY;
                this.state = LASER_STATES.FIRING;
                this.timeRemaining = this.config.activeTime;
                this.hitPlayers.clear();
                activated = true;
            }
            return { activated, charging, finished };
        }

        if (this.state === LASER_STATES.FIRING) {
            this.laserY = boss.laserCannonY;
            this.timeRemaining = Math.max(0, this.timeRemaining - deltaTime);
            if (this.timeRemaining === 0) {
                this.state = LASER_STATES.COOLDOWN;
                this.cooldownRemaining = this.config.cooldown;
                finished = true;
            }
            return { activated, charging, finished };
        }

        if (this.state === LASER_STATES.COOLDOWN) {
            this.cooldownRemaining = Math.max(0, this.cooldownRemaining - deltaTime);
            if (this.cooldownRemaining === 0) this.state = LASER_STATES.IDLE;
            return { activated, charging, finished };
        }

        this.cooldownRemaining = Math.max(0, this.cooldownRemaining - deltaTime);
        if (this.cooldownRemaining === 0) charging = this.start(boss);
        return { activated, charging, finished };
    }

    start(boss) {
        this.state = LASER_STATES.CHARGING;
        this.timeRemaining = this.config.chargeTime;
        this.cooldownRemaining = this.config.cooldown;
        this.laserY = boss.laserCannonY;
        this.hitPlayers.clear();
        return true;
    }
}
