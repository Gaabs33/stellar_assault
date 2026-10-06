import {
    BULLET_OWNER,
    BOSS_BULLET_CONFIG,
    ENEMY_BULLET_CONFIG,
    PLAYER_IDS,
    PLAYER_BULLET_CONFIG,
} from "../utils/constants.js";
import { getNormalizedDirection } from "../utils/Vector.js";

/**
 * Representa projéteis do jogador e dos inimigos.
 *
 * owner separa as regras de colisão. directionX e directionY são definidos no
 * disparo e nunca recalculados; por isso o projétil mantém uma trajetória fixa.
 * playerId identifica qual nave criou o tiro e permite entregar a energia ao
 * jogador correto quando o inimigo é destruído.
 */
export class Bullet {
    constructor(
        x,
        y,
        directionX = 1,
        directionY = 0,
        owner = BULLET_OWNER.PLAYER,
        speedMultiplier = 1,
        playerId = owner === BULLET_OWNER.PLAYER ? PLAYER_IDS.ONE : null,
        sourceType = null,
    ) {
        const config = owner === BULLET_OWNER.BOSS
            ? BOSS_BULLET_CONFIG
            : owner === BULLET_OWNER.ENEMY
                ? ENEMY_BULLET_CONFIG
                : PLAYER_BULLET_CONFIG;
        const direction = getNormalizedDirection(
            0,
            0,
            directionX,
            directionY,
        );

        this.x = x;
        this.y = y;
        this.width = config.width;
        this.height = config.height;
        this.speed = config.speed * speedMultiplier;
        this.damage = config.damage;
        this.color = config.color;
        this.owner = owner;
        this.playerId = playerId;
        this.sourceType = sourceType;
        this.directionX = direction.x;
        this.directionY = direction.y;
        this.active = true;
    }

    update(deltaTime) {
        this.x += this.directionX * this.speed * deltaTime;
        this.y += this.directionY * this.speed * deltaTime;
    }

    draw(context) {
        // Forma procedural compacta; a origem define cor, trilha e núcleo.
        const trailLength = this.owner === BULLET_OWNER.BOSS ? 12 : 7;
        const pixel = (value) => Math.round(value);
        context.fillStyle = this.owner === BULLET_OWNER.BOSS ? "#ffcf4a" : "#ff9f43";
        context.fillRect(
            pixel(this.x - (this.directionX * trailLength)),
            pixel(this.y - (this.directionY * trailLength)),
            Math.max(3, pixel(this.width / 2)),
            Math.max(3, pixel(this.height / 2)),
        );
        context.fillStyle = this.color;
        context.fillRect(pixel(this.x), pixel(this.y), pixel(this.width), pixel(this.height));

        context.fillStyle = this.owner === BULLET_OWNER.PLAYER
            ? "#ff9f43"
            : this.owner === BULLET_OWNER.BOSS
                ? ({
                    bossSpread: "#ef6bff",
                    bossBurst: "#fff37a",
                    bossWall: "#ff7b5c",
                    bossCharge: "#59f6e8",
                }[this.sourceType] || "#fff37a")
                : "#b72f55";
        context.fillRect(
            pixel(this.x - (this.directionX * 4)),
            pixel(this.y - (this.directionY * 4)),
            Math.max(4, pixel(this.width / 2)),
            Math.max(4, pixel(this.height / 2)),
        );
        if (this.owner === BULLET_OWNER.BOSS && this.sourceType === "bossSpread") {
            context.fillStyle = "#f1f3ff";
            context.fillRect(pixel(this.x + (this.width / 2) - 2), pixel(this.y - 3), 4, pixel(this.height + 6));
        }
        if (this.owner === BULLET_OWNER.BOSS && this.sourceType === "bossCharge") {
            context.fillStyle = "#59f6e8";
            context.fillRect(pixel(this.x + 2), pixel(this.y - 4), Math.max(1, pixel(this.width - 4)), 3);
            context.fillRect(pixel(this.x + 2), pixel(this.y + this.height + 1), Math.max(1, pixel(this.width - 4)), 3);
        }
    }

    /** Retorna true somente quando o retângulo saiu por completo da tela. */
    isOutsideBounds(canvasWidth, canvasHeight) {
        return (
            this.x >= canvasWidth
            || this.x + this.width <= 0
            || this.y >= canvasHeight
            || this.y + this.height <= 0
        );
    }
}
