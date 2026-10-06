/** Carga legivel que trava o alvo e libera um projetil pesado. */
export class ChargeAttack {
    constructor(config = {}) {
        this.config = config;
        this.reset();
    }

    reset() {
        this.state = "idle";
        this.timeRemaining = 0;
        this.target = null;
    }

    get isCharging() {
        return this.state === "charging";
    }

    start(boss) {
        this.state = "charging";
        this.timeRemaining = this.config.chargeTime ?? 1.2;
        this.target = boss.pickLivingPlayer();
    }

    update(deltaTime, boss, bullets) {
        if (this.state !== "charging") return { completed: true, fired: false };
        this.timeRemaining = Math.max(0, this.timeRemaining - deltaTime);
        if (this.timeRemaining > 0) return { completed: false, fired: false };

        if (this.target?.isAlive) bullets.push(boss.createChargeBullet(this.target, this.config));
        this.state = "idle";
        return { completed: true, fired: true };
    }

    cancel() {
        this.reset();
    }
}
