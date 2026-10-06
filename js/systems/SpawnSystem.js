import {
    ENEMY_CONFIG,
    ENEMY_TYPES,
} from "../utils/constants.js";
import { EnemyFactory } from "./EnemyFactory.js";

/** Controla intervalo de spawn e delega a criação para EnemyFactory. */
export class SpawnSystem {
    constructor(random = Math.random, factory = new EnemyFactory(random)) {
        this.random = random;
        this.factory = factory;
        this.timer = 0;
    }

    update(deltaTime, onSpawn, settings = {}) {
        this.timer += deltaTime;
        const spawnInterval = settings.interval ?? ENEMY_CONFIG.spawnInterval;

        while (this.timer >= spawnInterval) {
            onSpawn(this.createEnemy({
                normalSpawnChance: settings.normalChance,
                enemyWeights: settings.enemyWeights,
                difficultyMultiplier: settings.difficultyMultiplier,
            }));
            this.timer -= spawnInterval;
        }
    }

    /** Aceita createEnemy("fast") e a assinatura de opções legada. */
    createEnemy(typeOrOptions = {}, options = {}) {
        const requestedType = typeof typeOrOptions === "string"
            ? typeOrOptions
            : typeOrOptions.type;
        const settings = typeof typeOrOptions === "string" ? options : typeOrOptions;
        const type = requestedType || this.pickType(settings);

        return this.factory.create(type, settings);
    }

    pickType(settings = {}) {
        const weights = settings.enemyWeights;
        if (weights && Object.keys(weights).length > 0) {
            const entries = Object.entries(weights)
                .filter(([type, weight]) => weight > 0 && type in ENEMY_TYPES_VALUES)
                .map(([type, weight]) => [type, Number(weight)]);
            const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
            if (total > 0) {
                let roll = this.random() * total;
                for (const [type, weight] of entries) {
                    roll -= weight;
                    if (roll <= 0) return type;
                }
                return entries[entries.length - 1][0];
            }
        }

        return this.random() < (settings.normalSpawnChance ?? ENEMY_CONFIG.normalSpawnChance)
            ? ENEMY_TYPES.NORMAL
            : ENEMY_TYPES.STRONG;
    }

    reset() {
        this.timer = 0;
    }
}

const ENEMY_TYPES_VALUES = Object.freeze(Object.values(ENEMY_TYPES).reduce(
    (values, type) => ({ ...values, [type]: true }),
    {},
));
