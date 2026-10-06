/** Catalogo de bosses e suas rotacoes de ataque orientadas a dados. */
const machineGun = (values = {}) => Object.freeze({
    shotsPerBurst: 4,
    shotInterval: 0.16,
    initialCooldown: 2,
    cooldown: 4,
    speed: 360,
    damage: 1,
    ...values,
});

const laser = (values = {}) => Object.freeze({
    chargeTime: 2,
    activeTime: 0.8,
    initialCooldown: 4,
    cooldown: 8,
    damage: 3,
    height: 48,
    cannonOffsetX: -18,
    cannonOffsetY: 0,
    color: "#ff526d",
    telegraphColor: "#ffcf4a",
    ...values,
});

const spreadShot = (values = {}) => Object.freeze({
    count: 5,
    spread: 0.56,
    speedMultiplier: 1,
    damage: 1,
    ...values,
});

const burstShot = (values = {}) => Object.freeze({
    count: 3,
    interval: 0.16,
    spread: 0.08,
    speedMultiplier: 1.05,
    damage: 1,
    ...values,
});

const doubleLaser = (values = {}) => Object.freeze({
    chargeTime: 2.1,
    activeTime: 0.8,
    height: 30,
    damage: 2,
    offsets: [-48, 48],
    color: "#ff7b5c",
    telegraphColor: "#fff37a",
    ...values,
});

const projectileWall = (values = {}) => Object.freeze({
    count: 6,
    gapIndex: 2,
    gapSize: 2,
    spacing: 76,
    speedMultiplier: 0.86,
    damage: 1,
    ...values,
});

const summonMinions = (minions, values = {}) => Object.freeze({
    minions,
    maxAlive: 4,
    ...values,
});

const chargeAttack = (values = {}) => Object.freeze({
    chargeTime: 1.15,
    speedMultiplier: 1.35,
    damage: 2,
    telegraphColor: "#ffcf4a",
    ...values,
});

const turrets = (height) => Object.freeze([
    Object.freeze({ x: 24, y: 28 }),
    Object.freeze({ x: 24, y: height - 36 }),
]);

const createBoss = (config) => {
    const attacks = config.attacks || [
        ...(config.machineGun ? [{ id: "machineGun", type: "machineGun" }] : []),
        ...(config.laser ? [{ id: "laser", type: "laser" }] : []),
        ...(config.doubleLaser ? [{ id: "doubleLaser", type: "doubleLaser" }] : []),
        ...(config.spreadShot ? [{ id: "spreadShot", type: "spreadShot" }] : []),
        ...(config.burstShot ? [{ id: "burstShot", type: "burstShot" }] : []),
        ...(config.projectileWall ? [{ id: "projectileWall", type: "projectileWall" }] : []),
        ...(config.summonMinions ? [{ id: "summonMinions", type: "summonMinions" }] : []),
        ...(config.chargeAttack ? [{ id: "chargeAttack", type: "chargeAttack" }] : []),
    ];
    return Object.freeze({
        combatX: 1010,
        combatY: 260,
        entrySpeed: 150,
        verticalSpeed: 68,
        minY: 145,
        maxY: 590,
        defeatDuration: 1,
        scoreReward: config.scoreValue,
        attackCooldown: 0.9,
        bodyColor: "#8c70d9",
        accentColor: "#3f2b78",
        coreColor: "#59f6e8",
        shape: "classic",
        ...config,
        attacks: Object.freeze(attacks),
        turrets: config.turrets || turrets(config.height),
    });
};

const dreadnought = createBoss({
    id: "dreadnought",
    name: "DREADNOUGHT",
    width: 260,
    height: 170,
    maxHealth: 80,
    combatX: 900,
    combatY: 260,
    entrySpeed: 120,
    verticalSpeed: 72,
    minY: 145,
    maxY: 590,
    scoreValue: 5000,
    machineGun: machineGun({
        shotsPerBurst: 5,
        shotInterval: 0.14,
        initialCooldown: 1.5,
        cooldown: 3.2,
    }),
    laser: laser({ cannonOffsetY: 85 }),
    legacyIndependentAttacks: true,
    bodyColor: "#8c70d9",
    accentColor: "#3f2b78",
    coreColor: "#59f6e8",
    shape: "classic",
});

const asteroidCrusher = createBoss({
    id: "asteroidCrusher",
    name: "ASTEROID CRUSHER",
    width: 290,
    height: 155,
    maxHealth: 90,
    combatY: 270,
    scoreValue: 6000,
    burstShot: burstShot({ count: 3, spread: 0.12 }),
    chargeAttack: chargeAttack({ chargeTime: 1.25, damage: 2 }),
    attackSequence: ["burstShot", "chargeAttack"],
    attackCooldown: 1.05,
    bodyColor: "#9b7652",
    accentColor: "#4f3427",
    coreColor: "#ffcf4a",
    shape: "asteroid",
});

const nebulaWraith = createBoss({
    id: "nebulaWraith",
    name: "NEBULA WRAITH",
    width: 235,
    height: 190,
    maxHealth: 100,
    combatY: 245,
    scoreValue: 7000,
    spreadShot: spreadShot({ count: 5, spread: 0.68, speedMultiplier: 0.95 }),
    laser: laser({ chargeTime: 1.8, activeTime: 0.7, cannonOffsetY: 95, color: "#ef6bff" }),
    attackSequence: ["spreadShot", "laser"],
    attackCooldown: 0.85,
    bodyColor: "#6d3c99",
    accentColor: "#271d55",
    coreColor: "#ef6bff",
    shape: "wraith",
});

const fleetCommander = createBoss({
    id: "fleetCommander",
    name: "FLEET COMMANDER",
    width: 310,
    height: 165,
    maxHealth: 110,
    combatY: 250,
    scoreValue: 8000,
    machineGun: machineGun({ shotsPerBurst: 5, shotInterval: 0.13, cooldown: 3.8 }),
    spreadShot: spreadShot({ count: 3, spread: 0.35 }),
    summonMinions: summonMinions([
        { type: "normal", pattern: "top" },
        { type: "fast", pattern: "bottom" },
        { type: "normal", pattern: "center" },
    ]),
    attackSequence: ["machineGun", "spreadShot", "summonMinions"],
    attackCooldown: 0.9,
    bodyColor: "#436b91",
    accentColor: "#1d304f",
    coreColor: "#ffcf4a",
    shape: "fleet",
});

const planetBreaker = createBoss({
    id: "planetBreaker",
    name: "PLANET BREAKER",
    width: 300,
    height: 200,
    maxHealth: 120,
    combatY: 230,
    scoreValue: 9000,
    doubleLaser: doubleLaser({ chargeTime: 2.2, activeTime: 0.9, offsets: [-58, 58], color: "#ff7b5c" }),
    burstShot: burstShot({ count: 3, spread: 0.1, speedMultiplier: 1.1 }),
    attackSequence: ["doubleLaser", "burstShot"],
    attackCooldown: 1.05,
    bodyColor: "#8f4e42",
    accentColor: "#4b2632",
    coreColor: "#ff7b5c",
    shape: "planet",
});

const scrapTitan = createBoss({
    id: "scrapTitan",
    name: "SCRAP TITAN",
    width: 325,
    height: 180,
    maxHealth: 130,
    combatY: 250,
    scoreValue: 10000,
    projectileWall: projectileWall({ count: 7, gapIndex: 3, gapSize: 2, spacing: 68 }),
    machineGun: machineGun({ shotsPerBurst: 5, shotInterval: 0.15, cooldown: 3.8 }),
    summonMinions: summonMinions([
        { type: "normal", pattern: "top" },
        { type: "strong", pattern: "bottom" },
        { type: "normal", pattern: "center" },
    ]),
    attackSequence: ["projectileWall", "machineGun", "summonMinions"],
    attackCooldown: 1.1,
    bodyColor: "#687078",
    accentColor: "#292f3b",
    coreColor: "#ffcf4a",
    shape: "titan",
});

const ionSerpent = createBoss({
    id: "ionSerpent",
    name: "ION SERPENT",
    width: 270,
    height: 145,
    maxHealth: 140,
    combatY: 280,
    scoreValue: 11000,
    spreadShot: spreadShot({ count: 5, spread: 0.62 }),
    doubleLaser: doubleLaser({ chargeTime: 1.9, activeTime: 0.75, offsets: [-38, 38], color: "#59f6e8" }),
    chargeAttack: chargeAttack({ chargeTime: 0.95, speedMultiplier: 1.45 }),
    attackSequence: ["spreadShot", "doubleLaser", "chargeAttack"],
    attackCooldown: 0.8,
    verticalSpeed: 82,
    bodyColor: "#237f91",
    accentColor: "#12384e",
    coreColor: "#59f6e8",
    shape: "serpent",
});

const stationGuardian = createBoss({
    id: "stationGuardian",
    name: "STATION GUARDIAN",
    width: 335,
    height: 190,
    maxHealth: 150,
    combatY: 230,
    scoreValue: 12000,
    machineGun: machineGun({ shotsPerBurst: 5, shotInterval: 0.14, cooldown: 3.8 }),
    projectileWall: projectileWall({ count: 6, gapIndex: 2, gapSize: 2, spacing: 78 }),
    summonMinions: summonMinions([
        { type: "shooter", pattern: "top" },
        { type: "normal", pattern: "bottom" },
        { type: "normal", pattern: "center" },
    ]),
    laser: laser({ chargeTime: 2, activeTime: 0.9, cannonOffsetY: 100, color: "#ffcf4a" }),
    attackSequence: ["machineGun", "projectileWall", "summonMinions", "laser"],
    attackCooldown: 1.05,
    bodyColor: "#6d6d82",
    accentColor: "#292941",
    coreColor: "#59f6e8",
    shape: "station",
});

const mothershipShield = createBoss({
    id: "mothershipShield",
    name: "MOTHERSHIP SHIELD",
    width: 360,
    height: 210,
    maxHealth: 165,
    combatY: 215,
    scoreValue: 13500,
    doubleLaser: doubleLaser({ chargeTime: 1.95, activeTime: 0.85, offsets: [-62, 62], color: "#ef6bff" }),
    spreadShot: spreadShot({ count: 5, spread: 0.6, speedMultiplier: 1.04 }),
    projectileWall: projectileWall({ count: 7, gapIndex: 3, gapSize: 2, spacing: 68 }),
    summonMinions: summonMinions([
        { type: "fast", pattern: "top" },
        { type: "shooter", pattern: "bottom" },
        { type: "fast", pattern: "center" },
    ]),
    attackSequence: ["doubleLaser", "spreadShot", "projectileWall", "summonMinions"],
    attackCooldown: 1.15,
    bodyColor: "#713c68",
    accentColor: "#2c1a3c",
    coreColor: "#ef6bff",
    shape: "mothership",
});

const overlordCore = createBoss({
    id: "overlordCore",
    name: "OVERLORD CORE",
    width: 390,
    height: 220,
    maxHealth: 180,
    combatY: 205,
    scoreValue: 16000,
    machineGun: machineGun({ shotsPerBurst: 6, shotInterval: 0.13, cooldown: 3.4 }),
    doubleLaser: doubleLaser({ chargeTime: 2, activeTime: 0.9, offsets: [-66, 66], height: 32, color: "#ff315b" }),
    spreadShot: spreadShot({ count: 5, spread: 0.7, speedMultiplier: 1.05 }),
    burstShot: burstShot({ count: 3, spread: 0.1, speedMultiplier: 1.08 }),
    projectileWall: projectileWall({ count: 7, gapIndex: 3, gapSize: 2, spacing: 68, speedMultiplier: 0.9 }),
    summonMinions: summonMinions([
        { type: "fast", pattern: "top" },
        { type: "shooter", pattern: "bottom" },
        { type: "normal", pattern: "center" },
    ]),
    attackSequence: ["machineGun", "doubleLaser", "spreadShot", "burstShot", "projectileWall", "summonMinions"],
    attackCooldown: 1.1,
    bodyColor: "#a13e54",
    accentColor: "#3a142a",
    coreColor: "#fff37a",
    shape: "core",
});

export const BOSSES = Object.freeze({
    dreadnought,
    asteroidCrusher,
    nebulaWraith,
    fleetCommander,
    planetBreaker,
    scrapTitan,
    ionSerpent,
    stationGuardian,
    mothershipShield,
    overlordCore,
});

export const BOSS_CONFIG = BOSSES.dreadnought;

export const BOSS_BULLET_CONFIG = Object.freeze({
    width: 14,
    height: 8,
    speed: BOSS_CONFIG.machineGun.speed,
    damage: BOSS_CONFIG.machineGun.damage,
    color: "#ffcf4a",
});
