/**
 * Configurações compartilhadas e valores de balanceamento.
 *
 * Centralizar estes números permite ajustar a dificuldade sem procurar valores
 * espalhados pelas classes. Tempos são expressos em segundos e velocidades em
 * pixels lógicos por segundo.
 */
export const GAME_WIDTH = 1440;
export const GAME_HEIGHT = 810;
export const HUD_SAFE_ZONE_HEIGHT = 110;
export const PLAY_AREA_TOP = 120;
export const PLAY_AREA_BOTTOM_MARGIN = 28;
export const PLAY_AREA_BOTTOM = GAME_HEIGHT - PLAY_AREA_BOTTOM_MARGIN;
// O painel técnico só aparece quando o jogador o ativa no menu.
export const DEBUG = false;
export const MAX_DELTA_TIME = 0.1;

export const CAMPAIGN_TRANSITION_DURATION = 3;
export const STAGE_HEALTH_RESTORE = 1;
export const STAGE_REVIVE_HEALTH = 3;
export const DEVELOPER_SKIP_KEY = "PageDown";
export const KAMIKAZE_FINAL_APPROACH_DISTANCE = 220;

export const PLAYER_MAX_HEALTH = 5;
export const PLAYER_MAX_ENERGY = 100;
export const PLAYER_INVINCIBILITY_DURATION = 1;
export const PLAYER_SHOOT_COOLDOWN = 0.25;
export const PLAYER_BULLET_SPEED = 780;

export const POWER_DURATION = 8;
export const POWER_FIRE_RATE_MULTIPLIER = 2;
export const POWER_PROJECTILE_SPEED_MULTIPLIER = 2;

export const PLAYER_IDS = Object.freeze({
    ONE: "player1",
    TWO: "player2",
});

/** Estados globais que controlam menu, partida, Game Over e Stage Clear. */
export const GAME_STATES = Object.freeze({
    MAIN_MENU: "menu",
    MENU: "menu",
    CONTROLS_MENU: "controlsMenu",
    PLAYING: "playing",
    GAME_OVER: "gameOver",
    STAGE_CLEAR: "stageClear",
    CAMPAIGN_CLEAR: "campaignClear",
});

export const MENU_STATES = Object.freeze({
    MAIN_MENU: GAME_STATES.MAIN_MENU,
    CONTROLS_MENU: GAME_STATES.CONTROLS_MENU,
});

export const LEVEL_STATES = Object.freeze({
    LEVEL_PLAYING: "LEVEL_PLAYING",
    LEVEL_CLEARING: "LEVEL_CLEARING",
    BOSS_WARNING: "BOSS_WARNING",
    BOSS_FIGHT: "BOSS_FIGHT",
    STAGE_CLEAR: "STAGE_CLEAR",
});

/**
 * Configuração orientada a dados. Novas fases poderão reutilizar Level com
 * outras distâncias, velocidades, fases de spawn e eventos.
 */
export {
    FUTURE_LEVEL_BLUEPRINTS,
    LEVEL_CONFIG,
    LEVELS,
} from "../config/levels.js";

export {
    BOSS_BULLET_CONFIG,
    BOSS_CONFIG,
    BOSSES,
} from "../config/bosses.js";

export {
    ENEMY_CONFIG,
    ENEMY_SHOOT_COOLDOWN_MAX,
    ENEMY_SHOOT_COOLDOWN_MIN,
    ENEMY_TYPE_CONFIG,
    ENEMY_TYPES,
    BOSS_HIT_ENERGY_REWARD,
    NORMAL_ENEMY_HEALTH,
    NORMAL_ENEMY_ENERGY_REWARD,
    NORMAL_ENEMY_SPAWN_CHANCE,
    STRONG_ENEMY_HEALTH,
    STRONG_ENEMY_ENERGY_REWARD,
} from "../config/enemies.js";

export const PLAYER_CONFIG = Object.freeze({
    width: 64,
    height: 32,
    speed: 360,
    color: "#59a7ff",
    maxHealth: PLAYER_MAX_HEALTH,
    maxEnergy: PLAYER_MAX_ENERGY,
    invincibilityDuration: PLAYER_INVINCIBILITY_DURATION,
    shootCooldown: PLAYER_SHOOT_COOLDOWN,
});

/**
 * Configurações específicas de cada nave. A classe Player é reutilizada para
 * as duas instâncias; somente os dados de controle, cor e posição mudam.
 */
export const PLAYER_PRESETS = Object.freeze({
    [PLAYER_IDS.ONE]: Object.freeze({
        playerId: PLAYER_IDS.ONE,
        color: "#59a7ff",
        startX: 120,
        startY: 220,
        controls: Object.freeze({
            up: "KeyW",
            down: "KeyS",
            left: "KeyA",
            right: "KeyD",
            shoot: "Space",
            ability: "KeyE",
        }),
    }),
    [PLAYER_IDS.TWO]: Object.freeze({
        playerId: PLAYER_IDS.TWO,
        color: "#63e6a8",
        startX: 120,
        startY: 468,
        controls: Object.freeze({
            up: "ArrowUp",
            down: "ArrowDown",
            left: "ArrowLeft",
            right: "ArrowRight",
            shoot: "ShiftRight",
            ability: "ShiftLeft",
        }),
    }),
});

export const BULLET_OWNER = Object.freeze({
    PLAYER: "player",
    ENEMY: "enemy",
    BOSS: "boss",
});

export const PLAYER_BULLET_CONFIG = Object.freeze({
    width: 18,
    height: 6,
    speed: PLAYER_BULLET_SPEED,
    damage: 1,
    color: "#fff37a",
});

export const ENEMY_BULLET_CONFIG = Object.freeze({
    width: 12,
    height: 8,
    speed: 330,
    damage: 1,
    color: "#ff8b5f",
});
