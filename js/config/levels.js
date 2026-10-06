/**
 * Campanha completa orientada a dados.
 *
 * A mesma classe Level interpreta todas as fases. Cada configuracao descreve
 * ritmo, tema, pesos de inimigos, ondas e boss, sem criar StageXX.js.
 */
const weights = (values) => Object.freeze({ ...values });

const group = (enemyType, count, interval, options = {}) => Object.freeze({
    enemyType,
    count,
    interval,
    ...options,
});

const wave = (id, progress, enemies) => Object.freeze({
    id,
    progress,
    type: "wave",
    enemies: Object.freeze(enemies),
});

const phases = (entries) => Object.freeze(entries.map((entry) => Object.freeze({
    until: entry.until,
    interval: entry.interval,
    enemyWeights: weights(entry.enemyWeights),
})));

const stage = (config) => Object.freeze({
    restoreHealth: 1,
    reviveHealth: 3,
    warningDuration: 2,
    transitionDuration: 3,
    ...config,
    spawnPhases: phases(config.spawnPhases),
    events: Object.freeze(config.events),
});

export const LEVELS = Object.freeze([
    stage({
        id: 1,
        name: "Outer Space",
        maxDistance: 4800,
        scrollSpeed: 100,
        enemySpawnRate: 0.55,
        backgroundType: "space",
        bossId: "dreadnought",
        difficultyMultiplier: 1,
        enemyWeights: weights({ normal: 0.72, strong: 0.12, fast: 0.16 }),
        spawnPhases: [
            { until: 0.25, interval: 2.35, enemyWeights: { normal: 1 } },
            { until: 0.50, interval: 2.1, enemyWeights: { normal: 0.68, fast: 0.32 } },
            { until: 0.75, interval: 1.9, enemyWeights: { normal: 0.65, strong: 0.35 } },
            { until: 1, interval: 1.7, enemyWeights: { normal: 0.45, strong: 0.3, fast: 0.25 } },
        ],
        events: [
            wave("outer-space-wave-25", 0.25, [
                group("normal", 4, 0.35),
                group("fast", 2, 0.3, { pattern: "top" }),
            ]),
            wave("outer-space-wave-50", 0.50, [
                group("normal", 3, 0.35),
                group("strong", 2, 0.4, { pattern: "bottom" }),
            ]),
            wave("outer-space-wave-75", 0.75, [
                group("fast", 3, 0.25),
                group("normal", 4, 0.3),
                group("strong", 2, 0.35),
            ]),
        ],
    }),
    stage({
        id: 2,
        name: "Asteroid Belt",
        maxDistance: 4950,
        scrollSpeed: 105,
        enemySpawnRate: 0.6,
        backgroundType: "asteroid",
        bossId: "asteroidCrusher",
        difficultyMultiplier: 1.02,
        enemyWeights: weights({ normal: 0.35, fast: 0.43, kamikaze: 0.22 }),
        spawnPhases: [
            { until: 0.25, interval: 2.2, enemyWeights: { normal: 0.5, fast: 0.35, kamikaze: 0.15 } },
            { until: 0.5, interval: 1.9, enemyWeights: { normal: 0.35, fast: 0.45, kamikaze: 0.2 } },
            { until: 0.75, interval: 1.65, enemyWeights: { normal: 0.25, fast: 0.5, kamikaze: 0.25 } },
            { until: 1, interval: 1.5, enemyWeights: { normal: 0.25, fast: 0.45, kamikaze: 0.3 } },
        ],
        events: [
            wave("asteroid-belt-wave-25", 0.25, [
                group("fast", 5, 0.22, { pattern: "top" }),
                group("normal", 2, 0.35),
            ]),
            wave("asteroid-belt-wave-50", 0.5, [
                group("kamikaze", 4, 0.28, { pattern: "bottom" }),
                group("fast", 4, 0.22),
            ]),
            wave("asteroid-belt-wave-75", 0.75, [
                group("fast", 5, 0.2, { pattern: "center" }),
                group("kamikaze", 3, 0.3),
                group("normal", 2, 0.35),
            ]),
        ],
    }),
    stage({
        id: 3,
        name: "Nebula",
        maxDistance: 5000,
        scrollSpeed: 105,
        enemySpawnRate: 0.62,
        backgroundType: "nebula",
        bossId: "nebulaWraith",
        difficultyMultiplier: 1.03,
        enemyWeights: weights({ shooter: 0.4, normal: 0.35, strong: 0.25 }),
        spawnPhases: [
            { until: 0.25, interval: 2.25, enemyWeights: { normal: 0.55, shooter: 0.3, strong: 0.15 } },
            { until: 0.5, interval: 2, enemyWeights: { normal: 0.4, shooter: 0.4, strong: 0.2 } },
            { until: 0.75, interval: 1.75, enemyWeights: { normal: 0.3, shooter: 0.45, strong: 0.25 } },
            { until: 1, interval: 1.55, enemyWeights: { normal: 0.25, shooter: 0.45, strong: 0.3 } },
        ],
        events: [
            wave("nebula-wave-25", 0.25, [
                group("shooter", 3, 0.45, { pattern: "top" }),
                group("normal", 3, 0.3),
            ]),
            wave("nebula-wave-50", 0.5, [
                group("shooter", 4, 0.4, { pattern: "bottom" }),
                group("strong", 2, 0.42),
            ]),
            wave("nebula-wave-75", 0.75, [
                group("normal", 4, 0.28),
                group("shooter", 4, 0.38, { pattern: "center" }),
                group("strong", 3, 0.4),
            ]),
        ],
    }),
    stage({
        id: 4,
        name: "Enemy Fleet",
        maxDistance: 4950,
        scrollSpeed: 100,
        enemySpawnRate: 0.66,
        backgroundType: "fleet",
        bossId: "fleetCommander",
        difficultyMultiplier: 1.05,
        enemyWeights: weights({ normal: 0.34, strong: 0.2, shooter: 0.27, fast: 0.19 }),
        spawnPhases: [
            { until: 0.25, interval: 2.15, enemyWeights: { normal: 0.5, strong: 0.2, shooter: 0.2, fast: 0.1 } },
            { until: 0.5, interval: 1.9, enemyWeights: { normal: 0.35, strong: 0.2, shooter: 0.3, fast: 0.15 } },
            { until: 0.75, interval: 1.65, enemyWeights: { normal: 0.3, strong: 0.2, shooter: 0.3, fast: 0.2 } },
            { until: 1, interval: 1.45, enemyWeights: { normal: 0.25, strong: 0.2, shooter: 0.3, fast: 0.25 } },
        ],
        events: [
            wave("fleet-wave-25", 0.25, [
                group("normal", 4, 0.25, { pattern: "top" }),
                group("fast", 3, 0.24, { pattern: "bottom" }),
            ]),
            wave("fleet-wave-50", 0.5, [
                group("shooter", 3, 0.38, { pattern: "top" }),
                group("strong", 3, 0.4, { pattern: "bottom" }),
            ]),
            wave("fleet-wave-75", 0.75, [
                group("normal", 4, 0.25),
                group("fast", 3, 0.22, { pattern: "top" }),
                group("shooter", 3, 0.35, { pattern: "bottom" }),
            ]),
        ],
    }),
    stage({
        id: 5,
        name: "Broken Planet",
        maxDistance: 5000,
        scrollSpeed: 100,
        enemySpawnRate: 0.68,
        backgroundType: "planet",
        bossId: "planetBreaker",
        difficultyMultiplier: 1.06,
        enemyWeights: weights({ kamikaze: 0.4, strong: 0.3, fast: 0.3 }),
        spawnPhases: [
            { until: 0.25, interval: 2.2, enemyWeights: { kamikaze: 0.25, strong: 0.35, fast: 0.4 } },
            { until: 0.5, interval: 1.9, enemyWeights: { kamikaze: 0.4, strong: 0.3, fast: 0.3 } },
            { until: 0.75, interval: 1.65, enemyWeights: { kamikaze: 0.45, strong: 0.3, fast: 0.25 } },
            { until: 1, interval: 1.45, enemyWeights: { kamikaze: 0.5, strong: 0.25, fast: 0.25 } },
        ],
        events: [
            wave("planet-wave-25", 0.25, [
                group("kamikaze", 4, 0.3, { pattern: "top" }),
                group("fast", 3, 0.22),
            ]),
            wave("planet-wave-50", 0.5, [
                group("strong", 3, 0.42, { pattern: "bottom" }),
                group("kamikaze", 4, 0.28),
            ]),
            wave("planet-wave-75", 0.75, [
                group("fast", 4, 0.2, { pattern: "top" }),
                group("kamikaze", 5, 0.26, { pattern: "bottom" }),
                group("strong", 2, 0.4),
            ]),
        ],
    }),
    stage({
        id: 6,
        name: "Debris Field",
        maxDistance: 5000,
        scrollSpeed: 105,
        enemySpawnRate: 0.7,
        backgroundType: "debris",
        bossId: "scrapTitan",
        difficultyMultiplier: 1.07,
        enemyWeights: weights({ shooter: 0.28, kamikaze: 0.28, fast: 0.28, normal: 0.16 }),
        spawnPhases: [
            { until: 0.25, interval: 2.15, enemyWeights: { normal: 0.35, fast: 0.3, shooter: 0.2, kamikaze: 0.15 } },
            { until: 0.5, interval: 1.85, enemyWeights: { normal: 0.2, fast: 0.3, shooter: 0.25, kamikaze: 0.25 } },
            { until: 0.75, interval: 1.6, enemyWeights: { normal: 0.15, fast: 0.3, shooter: 0.25, kamikaze: 0.3 } },
            { until: 1, interval: 1.4, enemyWeights: { normal: 0.12, fast: 0.3, shooter: 0.28, kamikaze: 0.3 } },
        ],
        events: [
            wave("debris-wave-25", 0.25, [
                group("shooter", 2, 0.4, { pattern: "top" }),
                group("kamikaze", 3, 0.28),
                group("fast", 3, 0.23, { pattern: "bottom" }),
            ]),
            wave("debris-wave-50", 0.5, [
                group("normal", 3, 0.3),
                group("shooter", 3, 0.38, { pattern: "bottom" }),
                group("kamikaze", 3, 0.28),
            ]),
            wave("debris-wave-75", 0.75, [
                group("fast", 4, 0.2, { pattern: "top" }),
                group("kamikaze", 4, 0.25, { pattern: "bottom" }),
                group("shooter", 3, 0.35, { pattern: "center" }),
            ]),
        ],
    }),
    stage({
        id: 7,
        name: "Ion Storm",
        maxDistance: 4950,
        scrollSpeed: 110,
        enemySpawnRate: 0.72,
        backgroundType: "ion",
        bossId: "ionSerpent",
        difficultyMultiplier: 1.08,
        enemyWeights: weights({ fast: 0.42, shooter: 0.32, strong: 0.26 }),
        spawnPhases: [
            { until: 0.25, interval: 2.05, enemyWeights: { fast: 0.45, shooter: 0.3, strong: 0.25 } },
            { until: 0.5, interval: 1.75, enemyWeights: { fast: 0.45, shooter: 0.3, strong: 0.25 } },
            { until: 0.75, interval: 1.5, enemyWeights: { fast: 0.42, shooter: 0.35, strong: 0.23 } },
            { until: 1, interval: 1.3, enemyWeights: { fast: 0.4, shooter: 0.35, strong: 0.25 } },
        ],
        events: [
            wave("ion-wave-25", 0.25, [
                group("fast", 5, 0.2, { pattern: "top" }),
                group("shooter", 2, 0.4, { pattern: "bottom" }),
            ]),
            wave("ion-wave-50", 0.5, [
                group("strong", 3, 0.38),
                group("fast", 5, 0.2, { pattern: "bottom" }),
            ]),
            wave("ion-wave-75", 0.75, [
                group("shooter", 4, 0.34, { pattern: "top" }),
                group("fast", 5, 0.18),
                group("strong", 2, 0.4),
            ]),
        ],
    }),
    stage({
        id: 8,
        name: "Space Station",
        maxDistance: 5100,
        scrollSpeed: 105,
        enemySpawnRate: 0.72,
        backgroundType: "station",
        bossId: "stationGuardian",
        difficultyMultiplier: 1.09,
        automaticReinforcements: {
            interval: 12,
            min: 1,
            max: 2,
            types: ["normal", "fast", "shooter"],
        },
        enemyWeights: weights({ shooter: 0.4, strong: 0.3, kamikaze: 0.18, normal: 0.12 }),
        spawnPhases: [
            { until: 0.25, interval: 2.1, enemyWeights: { normal: 0.3, strong: 0.25, shooter: 0.3, kamikaze: 0.15 } },
            { until: 0.5, interval: 1.8, enemyWeights: { normal: 0.15, strong: 0.3, shooter: 0.4, kamikaze: 0.15 } },
            { until: 0.75, interval: 1.55, enemyWeights: { normal: 0.1, strong: 0.3, shooter: 0.4, kamikaze: 0.2 } },
            { until: 1, interval: 1.35, enemyWeights: { normal: 0.08, strong: 0.3, shooter: 0.4, kamikaze: 0.22 } },
        ],
        events: [
            wave("station-wave-25", 0.25, [
                group("shooter", 3, 0.38, { pattern: "top" }),
                group("strong", 2, 0.42, { pattern: "bottom" }),
            ]),
            wave("station-wave-50", 0.5, [
                group("kamikaze", 4, 0.26),
                group("shooter", 3, 0.35, { pattern: "center" }),
                group("strong", 2, 0.4),
            ]),
            wave("station-wave-75", 0.75, [
                group("shooter", 4, 0.32, { pattern: "top" }),
                group("strong", 3, 0.4, { pattern: "bottom" }),
                group("kamikaze", 3, 0.25),
            ]),
        ],
    }),
    stage({
        id: 9,
        name: "Mothership Approach",
        maxDistance: 5200,
        scrollSpeed: 105,
        enemySpawnRate: 0.75,
        backgroundType: "mothership",
        bossId: "mothershipShield",
        difficultyMultiplier: 1.1,
        automaticReinforcements: {
            interval: 12,
            min: 1,
            max: 2,
            types: ["normal", "fast", "shooter"],
        },
        enemyWeights: weights({ normal: 0.2, strong: 0.2, fast: 0.2, shooter: 0.22, kamikaze: 0.18 }),
        spawnPhases: [
            { until: 0.25, interval: 2.05, enemyWeights: { normal: 0.35, strong: 0.2, fast: 0.2, shooter: 0.15, kamikaze: 0.1 } },
            { until: 0.5, interval: 1.75, enemyWeights: { normal: 0.25, strong: 0.2, fast: 0.2, shooter: 0.2, kamikaze: 0.15 } },
            { until: 0.75, interval: 1.5, enemyWeights: { normal: 0.18, strong: 0.2, fast: 0.22, shooter: 0.22, kamikaze: 0.18 } },
            { until: 1, interval: 1.3, enemyWeights: { normal: 0.15, strong: 0.2, fast: 0.22, shooter: 0.23, kamikaze: 0.2 } },
        ],
        events: [
            wave("mothership-wave-25", 0.25, [
                group("normal", 3, 0.28),
                group("fast", 3, 0.22, { pattern: "top" }),
                group("shooter", 2, 0.4, { pattern: "bottom" }),
            ]),
            wave("mothership-wave-50", 0.5, [
                group("strong", 3, 0.38),
                group("kamikaze", 3, 0.26, { pattern: "top" }),
                group("shooter", 3, 0.35, { pattern: "bottom" }),
            ]),
            wave("mothership-wave-75", 0.75, [
                group("normal", 4, 0.25),
                group("fast", 4, 0.2, { pattern: "top" }),
                group("strong", 2, 0.4),
                group("kamikaze", 3, 0.25, { pattern: "bottom" }),
            ]),
        ],
    }),
    stage({
        id: 10,
        name: "Final Assault",
        maxDistance: 5300,
        scrollSpeed: 105,
        enemySpawnRate: 0.78,
        backgroundType: "final",
        bossId: "overlordCore",
        difficultyMultiplier: 1.12,
        automaticReinforcements: {
            interval: 12,
            min: 1,
            max: 2,
            types: ["normal", "fast", "shooter"],
        },
        enemyWeights: weights({ normal: 0.18, strong: 0.2, fast: 0.2, shooter: 0.22, kamikaze: 0.2 }),
        spawnPhases: [
            { until: 0.25, interval: 2, enemyWeights: { normal: 0.3, strong: 0.2, fast: 0.2, shooter: 0.18, kamikaze: 0.12 } },
            { until: 0.5, interval: 1.7, enemyWeights: { normal: 0.2, strong: 0.2, fast: 0.2, shooter: 0.22, kamikaze: 0.18 } },
            { until: 0.75, interval: 1.45, enemyWeights: { normal: 0.16, strong: 0.2, fast: 0.2, shooter: 0.24, kamikaze: 0.2 } },
            { until: 1, interval: 1.25, enemyWeights: { normal: 0.14, strong: 0.2, fast: 0.2, shooter: 0.24, kamikaze: 0.22 } },
        ],
        events: [
            wave("final-wave-25", 0.25, [
                group("normal", 3, 0.25),
                group("fast", 3, 0.2, { pattern: "top" }),
                group("shooter", 2, 0.38, { pattern: "bottom" }),
            ]),
            wave("final-wave-50", 0.5, [
                group("strong", 3, 0.38),
                group("kamikaze", 4, 0.24, { pattern: "top" }),
                group("shooter", 3, 0.32, { pattern: "bottom" }),
            ]),
            wave("final-wave-75", 0.75, [
                group("normal", 4, 0.24),
                group("fast", 4, 0.18, { pattern: "top" }),
                group("shooter", 3, 0.3, { pattern: "center" }),
                group("kamikaze", 4, 0.22, { pattern: "bottom" }),
                group("strong", 2, 0.38),
            ]),
        ],
    }),
]);

// Alias de compatibilidade com a primeira implementacao do sistema de fases.
export const LEVEL_CONFIG = LEVELS;

/** Resumo usado por telas, documentacao e ferramentas de teste. */
export const FUTURE_LEVEL_BLUEPRINTS = Object.freeze(
    LEVELS.slice(1).map(({ id, name, backgroundType, bossId }) => Object.freeze({
        id,
        name,
        backgroundType,
        bossId,
    })),
);
