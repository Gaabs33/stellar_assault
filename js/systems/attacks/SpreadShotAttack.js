/** Dispara uma pequena abertura de projeteis sem depender de um boss especifico. */
export class SpreadShotAttack {
    constructor(config) {
        this.config = config;
        this.reset();
    }

    reset() {
        this.cooldownRemaining = this.config.initialCooldown ?? 3;
        this.target = null;
    }

    start(boss) {
        this.cooldownRemaining = 0;
        this.target = boss.pickLivingPlayer();
    }

    update(deltaTime, boss, bullets) {
        this.cooldownRemaining = Math.max(0, this.cooldownRemaining - deltaTime);
        if (this.cooldownRemaining > 0) return { completed: false, fired: false };

        this.target = this.target?.isAlive ? this.target : boss.pickLivingPlayer();
        if (!this.target) return { completed: true, fired: false };

        bullets.push(...boss.createSpreadShot(this.target, this.config));
        this.cooldownRemaining = this.config.cooldown ?? 5;
        return { completed: true, fired: true };
    }

    cancel() {
        this.reset();
    }
}
