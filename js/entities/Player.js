import { Bullet } from "./Bullet.js";
import { drawPixelMap, PLAYER_PIXEL_ART } from "../utils/PixelArt.js";
import {
    BULLET_OWNER,
    PLAYER_BULLET_CONFIG,
    PLAYER_CONFIG,
    PLAYER_IDS,
    PLAYER_PRESETS,
    PLAY_AREA_BOTTOM_MARGIN,
    PLAY_AREA_TOP,
    POWER_DURATION,
    POWER_FIRE_RATE_MULTIPLIER,
    POWER_PROJECTILE_SPEED_MULTIPLIER,
} from "../utils/constants.js";

/** Representa a nave, seus recursos e ações de combate. */
export class Player {
    constructor(x, y, options = {}) {
        const preset = PLAYER_PRESETS[options.playerId] || PLAYER_PRESETS[PLAYER_IDS.ONE];

        this.width = PLAYER_CONFIG.width;
        this.height = PLAYER_CONFIG.height;
        this.speed = PLAYER_CONFIG.speed;
        this.playerId = options.playerId || preset.playerId;
        this.color = options.color || preset.color || PLAYER_CONFIG.color;
        this.controls = Object.freeze({
            ...preset.controls,
            ...(options.controls || {}),
        });
        this.maxHealth = PLAYER_CONFIG.maxHealth;
        this.maxEnergy = PLAYER_CONFIG.maxEnergy;
        this.invincibilityDuration = PLAYER_CONFIG.invincibilityDuration;
        this.baseShootCooldown = PLAYER_CONFIG.shootCooldown;
        this.spawnX = x;
        this.spawnY = y;
        this.visualTime = 0;
        this.visualTilt = 0;
        this.damageFlashRemaining = 0;

        this.reset(x, y);
    }

    get centerX() {
        return this.x + (this.width / 2);
    }

    get centerY() {
        return this.y + (this.height / 2);
    }

    get isPowerActive() {
        return this.powerTimeRemaining > 0;
    }

    get currentShootCooldown() {
        return this.isPowerActive
            ? this.baseShootCooldown / POWER_FIRE_RATE_MULTIPLIER
            : this.baseShootCooldown;
    }

    update(deltaTime, input, canvasWidth, canvasHeight) {
        if (!this.isAlive) return;

        this.visualTime += deltaTime;

        let directionX = 0;
        let directionY = 0;

        if (input.isDown(this.controls.left)) directionX -= 1;
        if (input.isDown(this.controls.right)) directionX += 1;
        if (input.isDown(this.controls.up)) directionY -= 1;
        if (input.isDown(this.controls.down)) directionY += 1;

        // Normalizar evita que duas teclas produzam velocidade diagonal maior.
        if (directionX !== 0 || directionY !== 0) {
            const directionLength = Math.hypot(directionX, directionY);
            directionX /= directionLength;
            directionY /= directionLength;
        }

        this.x += directionX * this.speed * deltaTime;
        this.y += directionY * this.speed * deltaTime;
        this.x = Math.max(0, Math.min(this.x, canvasWidth - this.width));
        this.y = Math.max(
            PLAY_AREA_TOP,
            Math.min(this.y, canvasHeight - PLAY_AREA_BOTTOM_MARGIN - this.height),
        );

        this.shotCooldownRemaining = Math.max(0, this.shotCooldownRemaining - deltaTime);
        this.invincibilityRemaining = Math.max(0, this.invincibilityRemaining - deltaTime);
        this.powerTimeRemaining = Math.max(0, this.powerTimeRemaining - deltaTime);
        this.damageFlashRemaining = Math.max(0, this.damageFlashRemaining - deltaTime);
        this.visualTilt += (((directionY * 4) - this.visualTilt) * Math.min(1, deltaTime * 12));
    }

    /**
     * Cria um tiro clássico horizontal. O jogador não possui mais mira:
     * todos os seus projéteis nascem na frente da nave e seguem para a direita.
     */
    shoot() {
        if (!this.isAlive || this.shotCooldownRemaining > 0) return null;

        const directionX = 1;
        const directionY = 0;

        const speedMultiplier = this.isPowerActive
            ? POWER_PROJECTILE_SPEED_MULTIPLIER
            : 1;
        const bulletX = this.x + this.width - 2;
        const bulletY = this.centerY
            - (PLAYER_BULLET_CONFIG.height / 2);

        this.shotCooldownRemaining = this.currentShootCooldown;
        return new Bullet(
            bulletX,
            bulletY,
            directionX,
            directionY,
            BULLET_OWNER.PLAYER,
            speedMultiplier,
            this.playerId,
        );
    }

    /**
     * Aplica dano somente quando o período de invencibilidade terminou.
     * Developer Mode passa por este mesmo ponto e bloqueia apenas a redução de
     * HP; colisões e projéteis continuam sendo processados normalmente.
     */
    takeDamage(amount, developerMode = false) {
        if (developerMode) return false;
        if (this.health <= 0 || this.invincibilityRemaining > 0) return false;

        this.health = Math.max(0, this.health - amount);
        this.invincibilityRemaining = this.invincibilityDuration;
        this.damageFlashRemaining = 0.18;
        return true;
    }

    addEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }

    /** Ativa o poder apenas com a barra cheia e fora de outra ativação. */
    activatePower() {
        if (!this.isAlive || this.isPowerActive || this.energy < this.maxEnergy) return false;

        this.energy = 0;
        this.powerTimeRemaining = POWER_DURATION;
        return true;
    }

    reset(x = this.spawnX, y = this.spawnY) {
        this.x = x;
        this.y = y;
        this.health = this.maxHealth;
        this.energy = 0;
        this.shotCooldownRemaining = 0;
        this.invincibilityRemaining = 0;
        this.powerTimeRemaining = 0;
        this.visualTime = 0;
        this.visualTilt = 0;
        this.damageFlashRemaining = 0;
    }

    get isAlive() {
        return this.health > 0;
    }

    draw(context) {
        if (!this.isAlive) return;

        // Piscar alterna frames visíveis e invisíveis durante a invencibilidade.
        const blinkOff = this.invincibilityRemaining > 0
            && Math.floor(this.invincibilityRemaining * 12) % 2 === 0;
        if (blinkOff) return;

        // Silhueta procedural 16-bit voltada à direita.
        const flash = this.damageFlashRemaining > 0
            && Math.floor(this.damageFlashRemaining * 80) % 2 === 0;
        const enginePulse = Math.floor(this.visualTime * 18) % 2;
        const tilt = Math.round(this.visualTilt);
        const isPlayerTwo = this.playerId === "player2";
        const palette = isPlayerTwo
            ? {
                P: flash ? "#ffffff" : "#0b4c58",
                B: flash ? "#ffffff" : "#36bf8b",
                W: flash ? "#ffffff" : "#75f2bf",
                C: "#d6fff0",
                H: "#fff37a",
                E: enginePulse ? "#fff37a" : "#ff9f43",
                F: "#ffffff",
            }
            : {
                P: flash ? "#ffffff" : "#16266b",
                B: flash ? "#ffffff" : "#327fe0",
                W: flash ? "#ffffff" : "#69c9ff",
                C: "#d7f1ff",
                H: "#fff37a",
                E: enginePulse ? "#fff37a" : "#ff9f43",
                F: "#ffffff",
            };
        drawPixelMap(
            context,
            Math.round(this.x + (isPlayerTwo ? 0 : 1)),
            Math.round(this.y - 2 + tilt),
            PLAYER_PIXEL_ART[isPlayerTwo ? "player2" : "player1"],
            palette,
            3,
            { frame: enginePulse, animated: { E: ["E", "F"] } },
        );
        context.fillStyle = this.isPowerActive ? "#fff37a" : (isPlayerTwo ? "#63e6a8" : "#59a7ff");
        context.fillRect(this.x + 55, this.centerY - 3 + tilt, 9, 6);
        context.fillStyle = "#f1f3ff";
        context.fillRect(this.x + 60, this.centerY - 1 + tilt, 5, 2);
        if (this.isPowerActive) {
            context.fillStyle = "#fff37a";
            context.fillRect(this.x + 3, this.y + 1 + tilt, 3, 3);
            context.fillRect(this.x + 3, this.y + this.height - 4 + tilt, 3, 3);
            context.fillRect(this.x + 52, this.y + 3 + tilt, 3, 3);
        }
    }
}
