/** Controla uma rajada simples sem conhecer a entidade Boss por tipo. */
export class MachineGunAttack {
    constructor(config) {
        this.config = config;
        this.reset();
    }

    reset() {
        this.cooldownRemaining = this.config.initialCooldown ?? 1.5;
        this.shotsRemaining = 0;
        this.shotTimer = 0;
        this.target = null;
    }

    start(boss) {
        this.cooldownRemaining = 0;
        this.shotsRemaining = Math.max(1, Math.floor(this.config.shotsPerBurst ?? 4));
        this.shotTimer = 0;
        this.target = boss.pickLivingPlayer();
    }

    update(deltaTime, boss, bullets) {
        if (this.shotsRemaining > 0) {
            this.shotTimer -= deltaTime;
            if (this.shotTimer <= 0) {
                const target = this.target?.isAlive
                    ? this.target
                    : boss.pickLivingPlayer();
                if (target) {
                    const turretIndex = this.shotsRemaining % boss.turrets.length;
                    bullets.push(boss.createMachineGunBullet(target, turretIndex));
                }

                this.shotsRemaining -= 1;
                this.shotTimer = this.config.shotInterval;
                if (this.shotsRemaining === 0) {
                    this.cooldownRemaining = this.config.cooldown;
                    this.target = null;
                }
            }
            return { completed: this.shotsRemaining === 0, fired: true };
        }

        this.cooldownRemaining = Math.max(0, this.cooldownRemaining - deltaTime);
        if (this.cooldownRemaining === 0) {
            this.target = boss.pickLivingPlayer();
            if (this.target) {
                this.shotsRemaining = this.config.shotsPerBurst;
                this.shotTimer = this.config.shotInterval;
            }
        }
        return { completed: false, fired: false };
    }

    cancel() {
        this.reset();
    }
}
