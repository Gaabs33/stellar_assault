import {
    GAME_HEIGHT,
    PLAY_AREA_BOTTOM_MARGIN,
    PLAY_AREA_TOP,
} from "../../utils/constants.js";

/** Dois feixes coordenados, com telegraph, carga e hit registry por feixe. */
export class DoubleLaserAttack {
    constructor(config = {}) {
        this.config = config;
        this.reset();
    }

    reset() {
        this.state = "idle";
        this.timeRemaining = 0;
        this.hitPlayers = [new Set(), new Set()];
    }

    get isCharging() {
        return this.state === "charging";
    }

    get isFiring() {
        return this.state === "firing";
    }

    start() {
        this.state = "charging";
        this.timeRemaining = this.config.chargeTime ?? 2;
        this.hitPlayers = [new Set(), new Set()];
    }

    update(deltaTime) {
        if (this.state === "charging") {
            this.timeRemaining = Math.max(0, this.timeRemaining - deltaTime);
            if (this.timeRemaining === 0) {
                this.state = "firing";
                this.timeRemaining = this.config.activeTime ?? 0.8;
                this.hitPlayers = [new Set(), new Set()];
                return { activated: true, finished: false };
            }
            return { activated: false, finished: false };
        }

        if (this.state === "firing") {
            this.timeRemaining = Math.max(0, this.timeRemaining - deltaTime);
            if (this.timeRemaining === 0) {
                this.state = "idle";
                return { activated: false, finished: true };
            }
        }

        return { activated: false, finished: false };
    }

    getBeamYs(boss) {
        const offsets = this.config.offsets || [-44, 44];
        const beamHeight = this.config.height ?? 30;
        const minimum = PLAY_AREA_TOP + (beamHeight / 2);
        const maximum = GAME_HEIGHT - PLAY_AREA_BOTTOM_MARGIN - (beamHeight / 2);
        return offsets.slice(0, 2).map((offset) => Math.max(
            minimum,
            Math.min(maximum, boss.y + (boss.height / 2) + offset),
        ));
    }

    cancel() {
        this.reset();
    }
}
