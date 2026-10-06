import { Bullet } from "./Bullet.js";
import {
    BULLET_OWNER,
    ENEMY_BULLET_CONFIG,
    ENEMY_CONFIG,
    ENEMY_TYPE_CONFIG,
    ENEMY_TYPES,
    KAMIKAZE_FINAL_APPROACH_DISTANCE,
} from "../utils/constants.js";
import { getNormalizedDirection } from "../utils/Vector.js";
import { drawPixelMap, ENEMY_PIXEL_ART } from "../utils/PixelArt.js";

/**
 * Entidade comum para todos os inimigos cadastrados em ENEMY_TYPE_CONFIG.
 * Diferenças de comportamento são dados simples (linear, shooter, kamikaze),
 * mantendo a criação centralizada e evitando classes quase duplicadas.
 */
export class Enemy {
    constructor(x, y, type = ENEMY_TYPES.NORMAL, random = Math.random, options = {}) {
        const validType = ENEMY_TYPE_CONFIG[type] ? type : ENEMY_TYPES.NORMAL;
        const typeConfig = ENEMY_TYPE_CONFIG[validType];
        const difficultyMultiplier = options.difficultyMultiplier || 1;

        this.x = x;
        this.y = y;
        this.width = typeConfig.width ?? ENEMY_CONFIG.width;
        this.height = typeConfig.height ?? ENEMY_CONFIG.height;
        this.speed = (typeConfig.speed ?? ENEMY_CONFIG.speed) * difficultyMultiplier;
        this.type = validType;
        this.behavior = typeConfig.behavior || "linear";
        this.maxHealth = Math.max(1, Math.ceil(typeConfig.health * difficultyMultiplier));
        this.health = this.maxHealth;
        this.color = typeConfig.color;
        this.accentColor = typeConfig.accentColor;
        this.scoreValue = Math.round(typeConfig.scoreValue * difficultyMultiplier);
        this.energyReward = Math.round(typeConfig.energyReward * difficultyMultiplier);
        this.collisionDamage = typeConfig.collisionDamage ?? 1;
        this.canShoot = typeConfig.canShoot !== false;
        this.stopX = typeConfig.stopX ?? null;
        this.stopDuration = typeConfig.stopDuration ?? 0;
        this.stopTimeRemaining = 0;
        this.hasStopped = false;
        this.active = true;
        this.random = random;
        this.kamikazeTarget = null;
        this.kamikazeState = this.isKamikaze ? "targeting" : null;
        this.kamikazeVelocity = { x: -1, y: 0 };
        this.damageFlashRemaining = 0;
        this.visualTime = 0;
        this.isBossMinion = options.isBossMinion === true;
        this.shootCooldownMin = typeConfig.shootCooldownMin ?? ENEMY_CONFIG.shootCooldownMin;
        this.shootCooldownMax = typeConfig.shootCooldownMax ?? ENEMY_CONFIG.shootCooldownMax;
        this.shootCooldown = this.createShootCooldown();

        // A variação inicial impede uma formação inteira de disparar junta.
        this.shotCooldownRemaining = this.shootCooldown * (0.5 + (this.random() * 0.5));
    }

    get centerX() {
        return this.x + (this.width / 2);
    }

    get centerY() {
        return this.y + (this.height / 2);
    }

    get isKamikaze() {
        return this.behavior === "kamikaze";
    }

    createShootCooldown() {
        const range = this.shootCooldownMax - this.shootCooldownMin;
        return this.shootCooldownMin + (this.random() * range);
    }

    update(deltaTime, livingPlayers = []) {
        if (!this.active) return;

        this.damageFlashRemaining = Math.max(0, this.damageFlashRemaining - deltaTime);
        this.visualTime += deltaTime;

        if (this.behavior === "kamikaze") {
            this.updateKamikaze(deltaTime, livingPlayers);
        } else if (this.behavior === "shooter") {
            this.updateShooter(deltaTime);
        } else {
            this.x -= this.speed * deltaTime;
        }

        if (this.canShoot) {
            this.shotCooldownRemaining = Math.max(0, this.shotCooldownRemaining - deltaTime);
        }
    }

    updateShooter(deltaTime) {
        if (this.stopX !== null && !this.hasStopped) {
            if (this.x > this.stopX) {
                this.x -= this.speed * deltaTime;
                return;
            }

            this.x = this.stopX;
            this.hasStopped = true;
            this.stopTimeRemaining = this.stopDuration;
        }

        if (this.stopTimeRemaining > 0) {
            this.stopTimeRemaining = Math.max(0, this.stopTimeRemaining - deltaTime);
            return;
        }

        this.x -= this.speed * deltaTime;
    }

    updateKamikaze(deltaTime, livingPlayers) {
        if (this.kamikazeState === "escaping") {
            this.x += this.kamikazeVelocity.x * this.speed * deltaTime;
            this.y += this.kamikazeVelocity.y * this.speed * deltaTime;
            return;
        }

        const validTargets = livingPlayers.filter((player) => player.isAlive);
        const targetIsValid = this.kamikazeTarget?.isAlive
            && validTargets.includes(this.kamikazeTarget);
        if (!targetIsValid) {
            const canRetarget = this.kamikazeState === "targeting"
                || (this.kamikazeState === "attackRun"
                    && (!this.kamikazeTarget
                        || this.centerX - this.kamikazeTarget.centerX > KAMIKAZE_FINAL_APPROACH_DISTANCE));
            if (canRetarget && validTargets.length > 0) {
                this.kamikazeTarget = validTargets[Math.floor(this.random() * validTargets.length)];
                this.kamikazeState = "attackRun";
            } else {
                this.startKamikazeEscape();
            }
        }

        if (!this.kamikazeTarget || this.kamikazeState === "escaping") {
            this.x -= this.speed * deltaTime;
            return;
        }

        const direction = getNormalizedDirection(
            this.centerX,
            this.centerY,
            this.kamikazeTarget.centerX,
            this.kamikazeTarget.centerY,
            -1,
            0,
        );
        this.kamikazeVelocity = {
            // A kamikaze always continues toward the left after its pass. The
            // negative floor prevents a moving player from making it turn back.
            x: Math.min(direction.x, -0.25),
            y: direction.y,
        };
        this.x += direction.x * this.speed * deltaTime;
        this.y += direction.y * this.speed * deltaTime;

        if (this.centerX < this.kamikazeTarget.centerX) {
            this.startKamikazeEscape();
        }
    }

    startKamikazeEscape() {
        this.kamikazeState = "escaping";
        this.kamikazeVelocity.x = Math.min(this.kamikazeVelocity.x, -0.25);
    }

    /** Mira uma vez no alvo e deixa Bullet seguir em linha reta. */
    shootAt(player) {
        const playerIsAlive = typeof player?.isAlive === "boolean"
            ? player.isAlive
            : player?.health > 0;
        if (!this.active || !this.canShoot || !player || !playerIsAlive || this.shotCooldownRemaining > 0) return null;

        const direction = getNormalizedDirection(
            this.centerX,
            this.centerY,
            player.centerX,
            player.centerY,
            -1,
            0,
        );
        const muzzleDistance = Math.max(this.width, this.height) / 2;
        const bulletX = this.centerX
            + (direction.x * muzzleDistance)
            - (ENEMY_BULLET_CONFIG.width / 2);
        const bulletY = this.centerY
            + (direction.y * muzzleDistance)
            - (ENEMY_BULLET_CONFIG.height / 2);

        this.shootCooldown = this.createShootCooldown();
        this.shotCooldownRemaining = this.shootCooldown;
        return new Bullet(
            bulletX,
            bulletY,
            direction.x,
            direction.y,
            BULLET_OWNER.ENEMY,
        );
    }

    draw(context) {
        const flashing = this.damageFlashRemaining > 0
            && Math.floor(this.damageFlashRemaining * 60) % 2 === 0;
        const renderBody = flashing ? "#ffffff" : this.color;
        const palette = {
            P: flashing ? "#ffffff" : this.accentColor,
            B: renderBody,
            W: flashing ? "#ffffff" : this.color,
            C: this.type === ENEMY_TYPES.KAMIKAZE ? "#ff5f7a" : "#b8fff2",
            H: "#fff37a",
            S: flashing ? "#ffffff" : "#d9e5f1",
            R: "#ff315b",
            E: Math.floor(this.visualTime * 16) % 2 === 0 ? "#ff9f43" : "#fff37a",
            "-": "#ffcf4a",
        };
        drawPixelMap(
            context,
            Math.round(this.x),
            Math.round(this.y - 2),
            ENEMY_PIXEL_ART[this.type] || ENEMY_PIXEL_ART.normal,
            palette,
            3,
            { frame: Math.floor(this.visualTime * 12), animated: { E: ["E", "H"] } },
        );
        const renderMidY = this.y + Math.floor(this.height / 2);
        if (this.type === ENEMY_TYPES.SHOOTER) {
            context.fillStyle = "#ffcf4a";
            context.fillRect(this.x - 8, renderMidY - 3, 12, 6);
            context.fillStyle = "#ff5f7a";
            context.fillRect(this.x - 13, renderMidY - 1, 5, 2);
        }
        if (this.type === ENEMY_TYPES.STRONG) {
            context.fillStyle = "#f1f3ff";
            context.fillRect(this.x + 8, this.y + 2, 5, 4);
            context.fillRect(this.x + 8, this.y + this.height - 6, 5, 4);
        }
        if (this.type === ENEMY_TYPES.KAMIKAZE) {
            context.fillStyle = "#ff5f7a";
            context.fillRect(this.x - 8, renderMidY - 2, 8, 4);
        }
        return;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.damageFlashRemaining = 0.12;

        if (this.health === 0) {
            this.active = false;
            return true;
        }

        return false;
    }

    isOutsideLeft() {
        return this.x + this.width <= 0;
    }
}
