/** Rajada curta de projeteis com alvo travado durante toda a sequencia. */
export class BurstShotAttack {
    constructor(config = {}) {
        this.config = config;
        this.reset();
    }

    reset() {
        this.state = "idle";
        this.target = null;
        this.shotsRemaining = 0;
        this.shotIndex = 0;
        this.shotTimer = 0;
    }

    start(boss) {
        this.state = "firing";
        this.target = boss.pickLivingPlayer();
        this.shotsRemaining = Math.max(1, Math.floor(this.config.count ?? 3));
        this.shotIndex = 0;
        this.shotTimer = 0;
    }

    update(deltaTime, boss, bullets) {
        if (this.state !== "firing") return { completed: true, fired: false };
        if (!this.target?.isAlive) {
            this.state = "idle";
            return { completed: true, fired: false };
        }

        this.shotTimer -= deltaTime;
        if (this.shotTimer > 0) return { completed: false, fired: false };

        bullets.push(boss.createBurstBullet(this.target, this.shotIndex, this.config));
        this.shotsRemaining -= 1;
        this.shotIndex += 1;
        this.shotTimer = this.config.interval ?? 0.14;
        const completed = this.shotsRemaining === 0;
        if (completed) this.state = "idle";
        return { completed, fired: true };
    }

    cancel() {
        this.reset();
    }
}
