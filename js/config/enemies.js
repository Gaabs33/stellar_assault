/**
 * Catálogo de inimigos. A entidade Enemy interpreta estes dados e mantém um
 * único fluxo de dano, tiro e renderização para todas as variações.
 */
export const ENEMY_TYPES = Object.freeze({
    NORMAL: "normal",
    STRONG: "strong",
    FAST: "fast",
    SHOOTER: "shooter",
    KAMIKAZE: "kamikaze",
});

export const NORMAL_ENEMY_HEALTH = 1;
export const STRONG_ENEMY_HEALTH = 3;
export const NORMAL_ENEMY_ENERGY_REWARD = 20;
export const STRONG_ENEMY_ENERGY_REWARD = 35;
export const BOSS_HIT_ENERGY_REWARD = NORMAL_ENEMY_ENERGY_REWARD * 0.5;
export const NORMAL_ENEMY_SPAWN_CHANCE = 0.7;
export const ENEMY_SHOOT_COOLDOWN_MIN = 2.2;
export const ENEMY_SHOOT_COOLDOWN_MAX = 3.6;

const linearEnemy = {
    behavior: "linear",
    width: 56,
    height: 40,
    speed: 170,
    collisionDamage: 1,
    canShoot: true,
    shootCooldownMin: ENEMY_SHOOT_COOLDOWN_MIN,
    shootCooldownMax: ENEMY_SHOOT_COOLDOWN_MAX,
};

export const ENEMY_TYPE_CONFIG = Object.freeze({
    [ENEMY_TYPES.NORMAL]: Object.freeze({
        ...linearEnemy,
        health: NORMAL_ENEMY_HEALTH,
        color: "#ff5f7a",
        accentColor: "#922d50",
        scoreValue: 100,
        energyReward: NORMAL_ENEMY_ENERGY_REWARD,
    }),
    [ENEMY_TYPES.STRONG]: Object.freeze({
        ...linearEnemy,
        health: STRONG_ENEMY_HEALTH,
        color: "#ff9f43",
        accentColor: "#8f3f24",
        scoreValue: 300,
        energyReward: STRONG_ENEMY_ENERGY_REWARD,
    }),
    [ENEMY_TYPES.FAST]: Object.freeze({
        ...linearEnemy,
        speed: 320,
        health: 1,
        color: "#59f6e8",
        accentColor: "#16768a",
        scoreValue: 180,
        energyReward: 24,
        canShoot: false,
    }),
    [ENEMY_TYPES.SHOOTER]: Object.freeze({
        ...linearEnemy,
        behavior: "shooter",
        width: 62,
        height: 44,
        speed: 130,
        health: 2,
        color: "#c77dff",
        accentColor: "#54218a",
        scoreValue: 240,
        energyReward: 30,
        stopX: 900,
        stopDuration: 2.4,
        shootCooldownMin: 1.6,
        shootCooldownMax: 2.6,
    }),
    [ENEMY_TYPES.KAMIKAZE]: Object.freeze({
        ...linearEnemy,
        behavior: "kamikaze",
        speed: 280,
        health: 1,
        color: "#fff37a",
        accentColor: "#a65c18",
        scoreValue: 220,
        energyReward: 25,
        canShoot: false,
        collisionDamage: 1,
    }),
});

/** Valores comuns usados quando uma fase não substitui o intervalo de spawn. */
export const ENEMY_CONFIG = Object.freeze({
    width: 56,
    height: 40,
    speed: 170,
    spawnInterval: 2,
    normalSpawnChance: NORMAL_ENEMY_SPAWN_CHANCE,
    shootCooldownMin: ENEMY_SHOOT_COOLDOWN_MIN,
    shootCooldownMax: ENEMY_SHOOT_COOLDOWN_MAX,
});
