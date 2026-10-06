/** Parede parcial de projeteis com uma abertura configuravel. */
export class ProjectileWallAttack {
    constructor(config = {}) {
        this.config = config;
        this.reset();
    }

    reset() {
        this.state = "idle";
        this.timeRemaining = 0;
        this.emitted = false;
    }

    start() {
        this.state = "charging";
        this.timeRemaining = this.config.chargeTime ?? 0.65;
        this.emitted = false;
    }

    get isCharging() {
        return this.state === "charging";
    }

    update(deltaTime, boss, bullets) {
        if (this.emitted) return { completed: true, fired: false };
        this.timeRemaining = Math.max(0, this.timeRemaining - deltaTime);
        if (this.timeRemaining > 0) return { completed: false, fired: false };
        bullets.push(...boss.createProjectileWall(this.config));
        this.emitted = true;
        this.state = "idle";
        return { completed: true, fired: true };
    }

    cancel() {
        this.reset();
    }
}
