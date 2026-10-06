import { Enemy } from "../entities/Enemy.js";
import {
    ENEMY_TYPES,
    GAME_HEIGHT,
    GAME_WIDTH,
    PLAY_AREA_BOTTOM_MARGIN,
    PLAY_AREA_TOP,
} from "../utils/constants.js";

/** Único ponto responsável por transformar dados de spawn em Enemy. */
export class EnemyFactory {
    constructor(random = Math.random) {
        this.random = random;
    }

    create(type = ENEMY_TYPES.NORMAL, options = {}) {
        const hasPosition = options.y !== undefined || typeof options.position === "number"
            || typeof options.position?.y === "number";
        const enemy = new Enemy(
            options.x ?? GAME_WIDTH,
            0,
            type,
            this.random,
            options,
        );

        const requestedY = hasPosition
            ? (options.y ?? options.position.y ?? options.position)
            : this.resolveSpawnY(enemy, options.pattern);
        enemy.y = this.clampSpawnY(requestedY, enemy);
        return enemy;
    }

    clampSpawnY(y, enemy) {
        const minY = PLAY_AREA_TOP;
        const maxY = Math.max(minY, GAME_HEIGHT - PLAY_AREA_BOTTOM_MARGIN - enemy.height);
        return Math.max(minY, Math.min(Number.isFinite(y) ? y : minY, maxY));
    }

    resolveSpawnY(enemy, pattern) {
        const minY = PLAY_AREA_TOP;
        const maxY = Math.max(minY, GAME_HEIGHT - PLAY_AREA_BOTTOM_MARGIN - enemy.height);
        const range = maxY - minY;
        if (pattern === "top") return minY + (range * 0.2);
        if (pattern === "bottom") return minY + (range * 0.8);
        if (pattern === "center") return minY + (range * 0.5);
        return minY + (this.random() * range);
    }
}
