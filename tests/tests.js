import { Bullet } from "../js/entities/Bullet.js";
import { Enemy } from "../js/entities/Enemy.js";
import { Player } from "../js/entities/Player.js";
import { Game } from "../js/game.js";
import { Boss } from "../js/entities/Boss.js";
import { checkCollision } from "../js/systems/Collision.js";
import { Input } from "../js/systems/Input.js";
import { Level } from "../js/systems/Level.js";
import { SpawnSystem } from "../js/systems/SpawnSystem.js";
import { WaveSystem } from "../js/systems/WaveSystem.js";
import { ParallaxSystem } from "../js/systems/ParallaxSystem.js";
import { EffectsSystem } from "../js/systems/EffectsSystem.js";
import { AudioManager } from "../js/systems/AudioManager.js";
import { ENEMY_PIXEL_ART, PLAYER_PIXEL_ART } from "../js/utils/PixelArt.js";
import {
    BULLET_OWNER,
    BOSS_HIT_ENERGY_REWARD,
    BOSSES,
    BOSS_CONFIG,
    ENEMY_CONFIG,
    ENEMY_TYPE_CONFIG,
    ENEMY_TYPES,
    FUTURE_LEVEL_BLUEPRINTS,
    GAME_HEIGHT,
    GAME_WIDTH,
    LEVELS,
    LEVEL_CONFIG,
    LEVEL_STATES,
    PLAY_AREA_BOTTOM_MARGIN,
    PLAY_AREA_TOP,
    HUD_SAFE_ZONE_HEIGHT,
    NORMAL_ENEMY_ENERGY_REWARD,
    PLAYER_BULLET_SPEED,
    PLAYER_IDS,
    PLAYER_MAX_ENERGY,
    PLAYER_MAX_HEALTH,
    PLAYER_SHOOT_COOLDOWN,
    POWER_DURATION,
    POWER_FIRE_RATE_MULTIPLIER,
    POWER_PROJECTILE_SPEED_MULTIPLIER,
    STRONG_ENEMY_ENERGY_REWARD,
} from "../js/utils/constants.js";
import { getNormalizedDirection } from "../js/utils/Vector.js";

const results = [];

function test(name, callback) {
    try {
        callback();
        results.push(`✓ ${name}`);
    } catch (error) {
        results.push(`✗ ${name}: ${error.message}`);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function almostEqual(actual, expected, tolerance = 0.001) {
    return Math.abs(actual - expected) <= tolerance;
}

function createInput() {
    const pressedKeys = new Set();

    return {
        pressedKeys,
        isDown(...codes) {
            return codes.some((code) => this.pressedKeys.has(code));
        },
        clear() {
            this.pressedKeys.clear();
        },
    };
}

function createFakeContext() {
    return {
        imageSmoothingEnabled: true,
        fillStyle: "",
        font: "",
        textAlign: "left",
        textBaseline: "top",
        fillRectCalls: [],
        fillTextCalls: [],
        clearRect() {},
        fillRect(x, y, width, height) {
            this.fillRectCalls.push({ x, y, width, height, color: this.fillStyle });
        },
        fillText(text, x, y) {
            this.fillTextCalls.push({ text, x, y, color: this.fillStyle });
        },
    };
}

function createFakeCanvas() {
    const context = createFakeContext();
    return {
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        getContext: () => context,
        context,
    };
}

function createFakeAudioContextFactory(counter) {
    function parameter() {
        return {
            setValueAtTime() {},
            linearRampToValueAtTime() {},
            exponentialRampToValueAtTime() {},
            cancelScheduledValues() {},
        };
    }

    function node() {
        return {
            connect() {},
            disconnect() {},
            start() {},
            stop() {},
            frequency: parameter(),
            detune: parameter(),
            gain: parameter(),
            onended: null,
        };
    }

    return function FakeAudioContext() {
        counter.count += 1;
        this.state = "suspended";
        this.currentTime = 0;
        this.sampleRate = 44100;
        this.destination = {};
        this.resume = () => {
            this.state = "running";
            return Promise.resolve();
        };
        this.createOscillator = () => node();
        this.createGain = () => node();
        this.createBiquadFilter = () => node();
        this.createBufferSource = () => node();
        this.createBuffer = (_channels, length) => ({
            duration: length / this.sampleRate,
            getChannelData: () => new Float32Array(length),
        });
    };
}

function createGame(input = createInput(), playerCount = 2) {
    const game = new Game(createFakeCanvas(), input);
    if (playerCount !== null) game.startGame(playerCount);
    return game;
}

test("Game inicia no menu sem ativar jogadores", () => {
    const game = new Game(createFakeCanvas(), createInput());
    assert(game.gameState === "menu", "o estado inicial deveria ser MENU");
    assert(game.playerCount === 0, "a partida começou antes da confirmação");
    assert(game.players.length === 0, "há jogadores ativos antes de escolher o modo");
});

test("Menu alterna entre 1P e 2P com W/S ou setas e confirma com Enter", () => {
    const input = createInput();
    const game = new Game(createFakeCanvas(), input);
    input.pressedKeys.add("KeyS");
    game.update(0);
    assert(game.selectedPlayerCount === 2, "seta para baixo não selecionou 2P");
    input.pressedKeys.clear();
    game.update(0);
    input.pressedKeys.add("Enter");
    game.update(0);
    assert(game.gameState === "playing" && game.playerCount === 2, "Enter não iniciou 2P");
    assert(game.players.length === 2, "2P não ativou as duas naves");
});

test("Setas tambem alternam a selecao do menu", () => {
    const input = createInput();
    const game = new Game(createFakeCanvas(), input);
    input.pressedKeys.add("ArrowDown");
    game.update(0);
    assert(game.selectedPlayerCount === 2, "ArrowDown nao selecionou 2P");
    input.pressedKeys.clear();
    game.update(0);
    input.pressedKeys.add("ArrowUp");
    game.update(0);
    assert(game.selectedPlayerCount === 1, "ArrowUp nao selecionou 1P");
});

test("Modo desenvolvedor inicia OFF e alterna sem iniciar a partida", () => {
    const input = createInput();
    const game = new Game(createFakeCanvas(), input);
    assert(!game.developerMode, "Developer Mode deveria iniciar desligado");
    input.pressedKeys.add("KeyS");
    game.update(0);
    input.pressedKeys.clear();
    game.update(0);
    input.pressedKeys.add("KeyS");
    game.update(0);
    input.pressedKeys.clear();
    game.update(0);
    input.pressedKeys.add("KeyS");
    game.update(0);
    input.pressedKeys.clear();
    game.update(0);
    input.pressedKeys.add("Enter");
    game.update(0);
    assert(game.developerMode, "Enter não ativou o Developer Mode");
    assert(game.gameState === "menu", "selecionar Developer Mode iniciou a partida");
    input.pressedKeys.clear();
    game.update(0);
    input.pressedKeys.add("Enter");
    game.update(0);
    assert(!game.developerMode, "Enter não desativou o Developer Mode");
    assert(game.gameState === "menu", "desativar Developer Mode iniciou a partida");
});

test("Debug inicia desligado e pode ser alternado no menu", () => {
    const input = createInput();
    const game = new Game(createFakeCanvas(), input);
    assert(!game.debugEnabled, "Debug deveria iniciar OFF");
    for (let index = 0; index < 4; index += 1) {
        input.pressedKeys.add("KeyS");
        game.update(0);
        input.pressedKeys.clear();
        game.update(0);
    }
    input.pressedKeys.add("Enter");
    game.update(0);
    assert(game.debugEnabled, "toggle de Debug nao foi ativado");
    assert(game.gameState === "menu", "Debug iniciou uma partida");
});

test("AudioManager desativa musica e preserva a API de SFX", () => {
    const audio = new AudioManager();
    assert(audio.playMusic("menuMusic") === false, "musica de menu deveria estar desativada");
    assert(audio.playStageMusic(1) === false, "musica de fase deveria estar desativada");
    assert(audio.play("missing") === false, "audio ausente gerou erro ou retorno incorreto");
    audio.setVolume(0.5, 0.75);
    assert(audio.masterVolume === 0.5 && audio.sfxVolume === 0.75, "volumes de SFX nao foram configurados");
});

test("Stage 08+ possui reforcos automaticos e cadencia avancada de boss", () => {
    assert(LEVELS[7].automaticReinforcements.interval === 12, "Stage 08 nao configurou reforcos de 12s");
    assert(LEVELS[9].automaticReinforcements.max === 2, "Stage 10 excedeu o limite de reforcos planejado");
    assert(BOSSES.scrapTitan.machineGun.shotInterval >= 0.13, "Scrap Titan dispara rapido demais");
    assert(BOSSES.overlordCore.machineGun.shotInterval >= 0.13, "Overlord Core dispara rapido demais");
});

test("Catalogo visual possui silhuetas pixeladas para players e cinco inimigos", () => {
    assert(PLAYER_PIXEL_ART.player1.length >= 10, "Player 1 sem densidade visual");
    assert(PLAYER_PIXEL_ART.player2.length >= 9, "Player 2 sem densidade visual");
    const enemyMaps = Object.values(ENEMY_PIXEL_ART);
    assert(enemyMaps.length === 5, "catalogo de inimigos incompleto");
    assert(new Set(enemyMaps.map((rows) => rows.join("\n"))).size === 5, "inimigos reutilizaram a mesma silhueta");
});

test("Os dez bosses possuem perfis de silhueta e detalhamento próprios", () => {
    const profiles = Object.values(BOSSES);
    const shapes = new Set(profiles.map((config) => config.shape));
    assert(profiles.length === 10, "catalogo de bosses incompleto");
    assert(shapes.size === 10, "bosses compartilham uma mesma silhueta base");
    profiles.forEach((config) => {
        const boss = new Boss(config);
        const context = createFakeContext();
        boss.x = 820;
        boss.y = 220;
        boss.draw(context);
        assert(context.fillRectCalls.length >= 25, `${config.name} possui poucos detalhes visuais`);
    });
});

test("Menu abre tela de controles e Escape retorna ao menu", () => {
    const input = createInput();
    const game = new Game(createFakeCanvas(), input);
    input.pressedKeys.add("KeyS");
    game.update(0);
    input.pressedKeys.clear();
    game.update(0);
    input.pressedKeys.add("KeyS");
    game.update(0);
    input.pressedKeys.clear();
    game.update(0);
    input.pressedKeys.add("Enter");
    game.update(0);
    assert(game.gameState === "controlsMenu", "CONTROLES nao abriu a tela correta");
    input.pressedKeys.clear();
    input.pressedKeys.add("Escape");
    game.update(0);
    assert(game.gameState === "menu", "Escape nao voltou ao menu");
});

test("Menu inicia modo solo com apenas Player 1 ativo", () => {
    const input = createInput();
    const game = new Game(createFakeCanvas(), input);
    input.pressedKeys.add("Enter");
    game.update(0);
    assert(game.gameState === "playing" && game.playerCount === 1, "Enter não iniciou 1P");
    assert(game.players.length === 1 && game.players[0] === game.player1, "Player 2 ficou ativo no solo");
});

test("Input usa event.code e bloqueia somente teclas do jogo", () => {
    const target = new EventTarget();
    const input = new Input(target);
    const keyDown = new KeyboardEvent("keydown", {
        code: "ArrowUp",
        cancelable: true,
    });
    target.dispatchEvent(keyDown);
    assert(input.isDown("ArrowUp"), "ArrowUp deveria estar pressionada");
    assert(keyDown.defaultPrevented, "ArrowUp deveria impedir rolagem");
    const letter = new KeyboardEvent("keydown", { code: "KeyZ", cancelable: true });
    target.dispatchEvent(letter);
    assert(!letter.defaultPrevented, "tecla fora do jogo foi bloqueada");
    target.dispatchEvent(new Event("blur"));
    assert(!input.isDown("ArrowUp"), "blur deveria limpar as teclas");
    input.destroy();
});

test("Input diferencia ShiftLeft e ShiftRight", () => {
    const target = new EventTarget();
    const input = new Input(target);
    target.dispatchEvent(new KeyboardEvent("keydown", { code: "ShiftLeft" }));
    assert(input.isDown("ShiftLeft"), "ShiftLeft não foi registrado");
    assert(!input.isDown("ShiftRight"), "ShiftRight foi confundido com ShiftLeft");
    target.dispatchEvent(new KeyboardEvent("keydown", { code: "ShiftRight" }));
    assert(input.isDown("ShiftLeft", "ShiftRight"), "duas teclas não ficaram simultâneas");
    input.destroy();
});

test("Input não possui estado nem listeners de mouse", () => {
    const input = new Input(new EventTarget());
    assert(!("mouse" in input), "estado antigo do mouse ainda existe");
    assert(typeof input.isRightMouseDown === "undefined", "API antiga do mouse ainda existe");
    input.destroy();
});

test("Game cria duas instâncias configuradas da mesma classe Player", () => {
    const game = createGame();
    assert(game.players.length === 2, "o jogo não criou dois jogadores");
    assert(game.player1 instanceof Player && game.player2 instanceof Player, "Player não foi reutilizado");
    assert(game.player1.playerId === PLAYER_IDS.ONE, "ID do Player 1 incorreto");
    assert(game.player2.playerId === PLAYER_IDS.TWO, "ID do Player 2 incorreto");
    assert(game.player1.color !== game.player2.color, "cores dos jogadores deveriam ser diferentes");
    assert(game.player1.y !== game.player2.y, "naves nasceram sobrepostas");
});

test("Player 1 usa WASD e Player 2 usa setas simultaneamente", () => {
    const input = createInput();
    const game = createGame(input);
    const p1Start = { x: game.player1.x, y: game.player1.y };
    const p2Start = { x: game.player2.x, y: game.player2.y };
    input.pressedKeys.add("KeyD");
    input.pressedKeys.add("ArrowDown");
    game.update(0.5);
    assert(game.player1.x > p1Start.x && game.player1.y === p1Start.y, "WASD não moveu apenas o Player 1");
    assert(game.player2.y > p2Start.y && game.player2.x === p2Start.x, "setas não moveram apenas o Player 2");
});

test("Movimento diagonal é normalizado e ambos ficam dentro do Canvas", () => {
    const input = createInput();
    const game = createGame(input);
    input.pressedKeys.add("KeyD");
    input.pressedKeys.add("KeyW");
    const startX = game.player1.x;
    const startY = game.player1.y;
    game.update(1);
    assert(
        almostEqual(Math.hypot(game.player1.x - startX, game.player1.y - startY), game.player1.speed),
        "velocidade diagonal ficou diferente da reta",
    );
    game.player1.x = GAME_WIDTH;
    game.player1.y = GAME_HEIGHT;
    game.player2.x = -10;
    game.player2.y = -10;
    game.update(0);
    assert(game.player1.x === GAME_WIDTH - game.player1.width, "limite do Player 1 incorreto");
    assert(
        game.player1.y === GAME_HEIGHT - PLAY_AREA_BOTTOM_MARGIN - game.player1.height,
        "limite inferior do Player 1 incorreto",
    );
    assert(game.player2.x === 0 && game.player2.y === PLAY_AREA_TOP, "limite seguro do Player 2 incorreto");
});

test("Space e ShiftRight criam tiros independentes", () => {
    const input = createInput();
    const game = createGame(input);
    input.pressedKeys.add("Space");
    input.pressedKeys.add("ShiftRight");
    game.update(0);
    assert(game.bullets.length === 2, "os dois jogadores não atiraram simultaneamente");
    assert(game.bullets.some((bullet) => bullet.playerId === PLAYER_IDS.ONE), "tiro do Player 1 sem dono");
    assert(game.bullets.some((bullet) => bullet.playerId === PLAYER_IDS.TWO), "tiro do Player 2 sem dono");
});

test("Segurar tiro respeita cooldowns independentes", () => {
    const input = createInput();
    const game = createGame(input);
    input.pressedKeys.add("Space");
    input.pressedKeys.add("ShiftRight");
    game.update(0);
    game.update(PLAYER_SHOOT_COOLDOWN / 2);
    assert(game.bullets.length === 2, "cooldown permitiu tiros antecipados");
    game.player2.shotCooldownRemaining = 0;
    game.update(0);
    assert(game.bullets.length === 3, "cooldown de um Player bloqueou o outro");
    game.update((PLAYER_SHOOT_COOLDOWN / 2) + 0.001);
    assert(game.bullets.length === 4, "novo tiro não foi liberado após o cooldown");
});

test("Tiros dos jogadores seguem somente para a direita", () => {
    const player = new Player(100, 100);
    const bullet = player.shoot();
    const startX = bullet.x;
    const startY = bullet.y;
    bullet.update(0.5);
    assert(bullet.directionX === 1 && bullet.directionY === 0, "direção horizontal incorreta");
    assert(bullet.x > startX, "tiro não avançou para a direita");
    assert(bullet.y === startY, "tiro alterou a trajetória vertical");
    assert(bullet.speed === PLAYER_BULLET_SPEED, "velocidade normal do tiro incorreta");
});

test("Mouse e botão direito não controlam mais o jogo", () => {
    const input = createInput();
    const game = createGame(input);
    game.update(0);
    assert(game.bullets.length === 0, "um update vazio criou tiro");
    assert(!game.drawCrosshair, "mira visual antiga ainda existe");
});

test("Inimigos normal e forte preservam seus HP", () => {
    const normal = new Enemy(100, 100, ENEMY_TYPES.NORMAL);
    const strong = new Enemy(100, 100, ENEMY_TYPES.STRONG);
    assert(normal.takeDamage(1) && normal.health === 0, "normal não morreu com 1 HP");
    assert(!strong.takeDamage(1) && strong.health === 2, "forte não perdeu o primeiro HP");
    assert(!strong.takeDamage(1) && strong.health === 1, "forte não perdeu o segundo HP");
    assert(strong.takeDamage(1) && strong.health === 0, "forte não morreu com 3 tiros");
});

test("Enemy mira no jogador vivo somente no instante do disparo", () => {
    const enemy = new Enemy(900, 100, ENEMY_TYPES.NORMAL, () => 0.5);
    const player = new Player(100, 300);
    enemy.shotCooldownRemaining = 0;
    const bullet = enemy.shootAt(player);
    const expected = getNormalizedDirection(enemy.centerX, enemy.centerY, player.centerX, player.centerY);
    assert(bullet instanceof Bullet, "inimigo não disparou");
    assert(almostEqual(bullet.directionX, expected.x), "direção X inimiga incorreta");
    assert(almostEqual(bullet.directionY, expected.y), "direção Y inimiga incorreta");
    player.x = 700;
    bullet.update(0.1);
    assert(almostEqual(bullet.directionX, expected.x), "tiro inimigo perseguiu o jogador");
});

test("Inimigo escolhe Player 2 quando Player 1 está morto", () => {
    const game = createGame();
    game.player1.health = 0;
    const enemy = new Enemy(900, 100, ENEMY_TYPES.NORMAL, () => 0.5);
    enemy.shotCooldownRemaining = 0;
    game.enemies.push(enemy);
    game.updateEnemies(0);
    const bullet = game.bullets[0];
    const expected = getNormalizedDirection(enemy.centerX, enemy.centerY, game.player2.centerX, game.player2.centerY);
    assert(bullet && almostEqual(bullet.directionX, expected.x), "inimigo não mirou o jogador vivo");
    assert(almostEqual(bullet.directionY, expected.y), "direção para o jogador vivo incorreta");
});

test("Tiro inimigo atinge apenas o primeiro Player sobreposto", () => {
    const game = createGame();
    game.player2.x = game.player1.x;
    game.player2.y = game.player1.y;
    game.bullets.push(new Bullet(game.player1.x, game.player1.y, -1, 0, BULLET_OWNER.ENEMY));
    game.handleCollisions();
    assert(game.player1.health === PLAYER_MAX_HEALTH - 1, "primeiro jogador não recebeu dano");
    assert(game.player2.health === PLAYER_MAX_HEALTH, "um tiro atingiu os dois jogadores");
});

test("Vida e invencibilidade são independentes", () => {
    const game = createGame();
    assert(game.player1.takeDamage(1), "Player 1 não recebeu dano");
    assert(!game.player1.takeDamage(1), "invencibilidade do Player 1 falhou");
    assert(game.player1.health === 4 && game.player2.health === 5, "HP não é independente");
    game.player1.update(1, createInput(), GAME_WIDTH, GAME_HEIGHT);
    assert(game.player1.takeDamage(1), "invencibilidade não terminou");
    assert(game.player1.health === 3 && game.player2.health === 5, "dano vazou para o Player 2");
});

test("Energia da destruição pertence ao dono do Bullet", () => {
    const game = createGame();
    const enemy1 = new Enemy(300, 200, ENEMY_TYPES.NORMAL);
    const enemy2 = new Enemy(500, 200, ENEMY_TYPES.STRONG);
    enemy2.health = 1;
    game.enemies.push(enemy1, enemy2);
    game.bullets.push(
        new Bullet(300, 200, 1, 0, BULLET_OWNER.PLAYER, 1, PLAYER_IDS.ONE),
        new Bullet(500, 200, 1, 0, BULLET_OWNER.PLAYER, 1, PLAYER_IDS.TWO),
    );
    game.handleCollisions();
    assert(game.player1.energy === NORMAL_ENEMY_ENERGY_REWARD, "energia não foi para o Player 1");
    assert(game.player2.energy === STRONG_ENEMY_ENERGY_REWARD, "energia não foi para o Player 2");
});

test("Energia individual respeita o máximo", () => {
    const game = createGame();
    game.player1.energy = PLAYER_MAX_ENERGY - 1;
    game.player1.addEnergy(50);
    assert(game.player1.energy === PLAYER_MAX_ENERGY, "energia do Player 1 ultrapassou o máximo");
    assert(game.player2.energy === 0, "energia do Player 2 foi alterada");
});

test("Poder do Player 1 é ativado com E sem afetar Player 2", () => {
    const input = createInput();
    const game = createGame(input);
    game.player1.energy = game.player1.maxEnergy;
    game.player2.energy = game.player2.maxEnergy;
    input.pressedKeys.add("KeyE");
    game.update(0);
    assert(game.player1.isPowerActive, "Player 1 não ativou o poder");
    assert(!game.player2.isPowerActive, "Player 2 ativou sem seu comando");
    assert(game.player1.energy === 0 && game.player2.energy === game.player2.maxEnergy, "energia do poder vazou");
});

test("ShiftRight atira e ShiftLeft ativa o poder do Player 2", () => {
    const input = createInput();
    const game = createGame(input);
    game.player2.energy = game.player2.maxEnergy;
    input.pressedKeys.add("ShiftRight");
    input.pressedKeys.add("ShiftLeft");
    game.update(0);
    assert(game.player2.isPowerActive, "ShiftLeft não ativou o poder");
    assert(game.bullets.some((bullet) => bullet.playerId === PLAYER_IDS.TWO), "ShiftLeft não atirou");
});

test("Poder dobra fire rate e velocidade do projétil", () => {
    const normalPlayer = new Player(100, 100);
    const normalBullet = normalPlayer.shoot();
    const poweredPlayer = new Player(100, 100);
    poweredPlayer.energy = poweredPlayer.maxEnergy;
    poweredPlayer.activatePower();
    const poweredBullet = poweredPlayer.shoot();
    assert(
        almostEqual(poweredPlayer.shotCooldownRemaining, PLAYER_SHOOT_COOLDOWN / POWER_FIRE_RATE_MULTIPLIER),
        "intervalo do poder não foi reduzido pela metade",
    );
    assert(poweredBullet.speed === normalBullet.speed * POWER_PROJECTILE_SPEED_MULTIPLIER, "velocidade do poder não dobrou");
});

test("Poder termina depois da duração configurada", () => {
    const player = new Player(100, 100);
    player.energy = player.maxEnergy;
    player.activatePower();
    player.update(POWER_DURATION - 0.01, createInput(), GAME_WIDTH, GAME_HEIGHT);
    assert(player.isPowerActive, "poder terminou cedo");
    player.update(0.02, createInput(), GAME_WIDTH, GAME_HEIGHT);
    assert(!player.isPowerActive, "poder continuou além da duração");
});

test("Game Over cooperativo só ocorre quando os dois morrerem", () => {
    const game = createGame();
    game.player1.health = 0;
    game.update(0);
    assert(!game.isGameOver, "jogo terminou com Player 2 vivo");
    game.player2.health = 0;
    game.update(0);
    assert(game.isGameOver, "jogo não terminou com os dois mortos");
});

test("Os dois Shift do Player 2 possuem funcoes exclusivas", () => {
    const powerInput = createInput();
    const powerGame = createGame(powerInput);
    powerGame.player2.energy = powerGame.player2.maxEnergy;
    powerInput.pressedKeys.add("ShiftLeft");
    powerGame.update(0);
    assert(powerGame.player2.isPowerActive, "ShiftLeft nao ativou o especial");
    assert(powerGame.bullets.length === 0, "ShiftLeft tambem disparou");

    const shootInput = createInput();
    const shootGame = createGame(shootInput);
    shootGame.player2.energy = shootGame.player2.maxEnergy;
    shootInput.pressedKeys.add("ShiftRight");
    shootGame.update(0);
    assert(!shootGame.player2.isPowerActive, "ShiftRight ativou o especial");
    assert(shootGame.bullets.some((bullet) => bullet.playerId === PLAYER_IDS.TWO), "ShiftRight nao disparou");
});

test("Modo solo mantém apenas Player 1 no update, tiros e HUD", () => {
    const input = createInput();
    const game = createGame(input, 1);
    const player2StartX = game.player2.x;
    input.pressedKeys.add("ArrowRight");
    input.pressedKeys.add("ShiftRight");
    input.pressedKeys.add("Space");
    game.update(0.5);
    assert(game.player2.x === player2StartX, "Player 2 recebeu update no modo solo");
    assert(game.bullets.every((bullet) => bullet.playerId === PLAYER_IDS.ONE), "Player 2 disparou no solo");
    game.draw();
    assert(!game.context.fillTextCalls.some((call) => call.text.startsWith("P2")), "HUD do Player 2 apareceu no solo");
});

test("Game Over solo ocorre assim que Player 1 morre", () => {
    const game = createGame(createInput(), 1);
    game.player1.health = 0;
    game.update(0);
    assert(game.isGameOver, "Game Over solo esperou por Player 2");
});

test("Player morto fica inativo enquanto o parceiro continua jogando", () => {
    const input = createInput();
    const game = createGame(input);
    game.player1.health = 0;
    const deadPosition = { x: game.player1.x, y: game.player1.y };
    input.pressedKeys.add("KeyD");
    input.pressedKeys.add("ArrowRight");
    input.pressedKeys.add("Space");
    game.update(0.5);
    assert(game.player1.x === deadPosition.x && game.player1.y === deadPosition.y, "Player morto se moveu");
    assert(game.bullets.every((bullet) => bullet.playerId !== PLAYER_IDS.ONE), "Player morto disparou");
    assert(game.player2.x > 120, "Player vivo não continuou jogando");
});

test("Enter reinicia os dois jogadores e o estado da partida", () => {
    const input = createInput();
    const game = createGame(input);
    game.player1.health = 0;
    game.player2.health = 0;
    game.player1.energy = 100;
    game.player2.energy = 90;
    game.player1.x = 900;
    game.player2.y = 20;
    game.player1.powerTimeRemaining = 4;
    game.score = 900;
    game.bullets.push(new Bullet(10, 10));
    game.enemies.push(new Enemy(500, 100));
    game.spawnSystem.timer = 1.5;
    game.update(0);
    assert(game.isGameOver, "partida nao entrou em Game Over");
    input.pressedKeys.add("Enter");
    game.update(0);
    assert(game.gameState === "menu", "Game Over nao retornou ao menu");
    assert(game.playerCount === 0 && game.players.length === 0, "jogadores ativos ficaram no menu");
    assert(!game.isGameOver, "Game Over não foi encerrado");
    assert(game.player1.health === PLAYER_MAX_HEALTH && game.player2.health === PLAYER_MAX_HEALTH, "HP não foi restaurado");
    assert(game.player1.energy === 0 && game.player2.energy === 0 && game.score === 0, "estado de recursos não zerou");
    assert(game.bullets.length === 0 && game.enemies.length === 0, "objetos não foram removidos");
    assert(game.spawnSystem.timer === 0, "timer de spawn não zerou");
    assert(game.player1.powerTimeRemaining === 0, "timer do poder não zerou");
});

test("HUD mostra estados separados e POWER READY individual", () => {
    const canvas = createFakeCanvas();
    const game = new Game(canvas, createInput());
    game.startGame(2);
    game.player1.energy = game.player1.maxEnergy;
    game.player2.health = 3;
    game.drawPlayerStatus();
    assert(canvas.context.fillTextCalls.some((call) => call.text.includes("P1 POWER READY")), "HUD do Player 1 ausente");
    assert(canvas.context.fillTextCalls.some((call) => call.text.includes("P2")), "HUD do Player 2 ausente");
});

test("Level avanca por distancia, dispara ondas uma vez e inicia o aviso", () => {
    const level = new Level({
        maxDistance: 100,
        scrollSpeed: 10,
        warningDuration: 2,
        spawnPhases: [{ until: 1, interval: 2, normalChance: 1 }],
        events: [
            { flag: "wave25Triggered", threshold: 0.25, normal: 1, strong: 0 },
            { flag: "wave50Triggered", threshold: 0.50, normal: 1, strong: 1 },
            { flag: "wave75Triggered", threshold: 0.75, normal: 1, strong: 1 },
        ],
    });
    const waves = [];
    level.update(2.5, 1, (event) => waves.push(event.flag));
    assert(level.progressPercent === 25, "distancia virtual nao chegou a 25%");
    assert(waves.length === 1, "onda de 25% nao foi disparada");
    level.update(0, 1, (event) => waves.push(event.flag));
    assert(waves.length === 1, "a mesma onda foi disparada novamente");

    level.update(7.5, 1, (event) => waves.push(event.flag));
    assert(level.progressPercent === 100, "distancia nao parou em 100%");
    assert(level.state === LEVEL_STATES.LEVEL_CLEARING, "fase nao entrou em limpeza");
    assert(waves.length === 3, "marcos de 50% e 75% nao foram disparados");

    const warning = level.update(0, 0, () => {});
    assert(warning.warningStarted, "aviso nao iniciou apos limpar inimigos");
    assert(level.state === LEVEL_STATES.BOSS_WARNING, "estado de aviso incorreto");
    level.update(2, 0, () => {});
    assert(level.state === LEVEL_STATES.BOSS_FIGHT, "boss nao ficou pronto apos o aviso");
});

test("DREADNOUGHT entra, dispara rajada e congela o laser somente durante o disparo", () => {
    const boss = new Boss(BOSS_CONFIG);
    const player = new Player(120, 220);
    const burstBullets = [];
    const entryDuration = (
        (GAME_WIDTH + BOSS_CONFIG.width - BOSS_CONFIG.combatX)
        / BOSS_CONFIG.entrySpeed
    ) + 0.01;

    boss.laserCooldownRemaining = 99;
    boss.update(entryDuration, [player]);
    assert(boss.status === "fighting", "boss nao entrou na area de combate");
    for (let shot = 0; shot < BOSS_CONFIG.machineGun.shotsPerBurst; shot += 1) {
        burstBullets.push(...boss.update(BOSS_CONFIG.machineGun.shotInterval, [player]).bullets);
    }
    assert(burstBullets.length === 5, "rajada nao possui cinco tiros");
    assert(burstBullets.every((bullet) => bullet.owner === BULLET_OWNER.BOSS), "rajada usa owner incorreto");
    assert(burstBullets.every((bullet) => bullet.damage === BOSS_CONFIG.machineGun.damage), "dano da rajada incorreto");

    const laserBoss = new Boss(BOSS_CONFIG);
    laserBoss.machineGunShotsRemaining = 2;
    laserBoss.machineGunAttack.shotTimer = 0;
    const enteringLaser = laserBoss.update(entryDuration, [player]);
    assert(laserBoss.isLaserCharging, "laser nao iniciou carregamento");
    assert(enteringLaser.bullets.length === 0, "metralhadora disparou ao iniciar a carga");
    const chargingY = laserBoss.laserY;
    const yBeforeChargeEnd = laserBoss.y;
    const chargingResult = laserBoss.update(BOSS_CONFIG.laser.chargeTime / 2, [player]);
    assert(laserBoss.isLaserCharging, "laser terminou a carga cedo");
    assert(laserBoss.y !== yBeforeChargeEnd, "boss parou durante o carregamento");
    assert(laserBoss.laserY === laserBoss.laserCannonY, "telegraph nao acompanhou o canhao");
    assert(chargingResult.bullets.length === 0, "metralhadora disparou durante a carga");
    const firingResult = laserBoss.update(BOSS_CONFIG.laser.chargeTime / 2, [player]);
    assert(laserBoss.isLaserActive, "laser nao ficou ativo apos a carga");
    assert(laserBoss.laserY === laserBoss.laserCannonY && laserBoss.laserY !== chargingY, "laser nao conectou ao eixo atual do boss");
    assert(firingResult.bullets.length === 0, "metralhadora disparou na transicao para o laser");
    const firingY = laserBoss.y;
    const activeResult = laserBoss.update(BOSS_CONFIG.laser.activeTime / 2, [player]);
    assert(laserBoss.y === firingY, "boss se moveu durante o disparo");
    assert(activeResult.bullets.length === 0, "metralhadora disparou durante o laser");
    laserBoss.update(BOSS_CONFIG.laser.activeTime / 2, [player]);
    assert(!laserBoss.isLaserActive, "laser nao terminou no tempo configurado");
    laserBoss.update(0.01, [player]);
    assert(laserBoss.y !== firingY, "boss nao voltou a se mover apos o laser");
});

test("Laser do boss pode atingir os dois jogadores apenas uma vez", () => {
    const game = createGame(createInput(), 2);
    game.boss = new Boss(BOSS_CONFIG);
    game.boss.laserState = "active";
    game.boss.laserY = game.player1.centerY;
    game.player2.y = game.player1.y;
    game.handleBossLaserCollision();
    game.handleBossLaserCollision();
    assert(game.player1.health === PLAYER_MAX_HEALTH - BOSS_CONFIG.laser.damage, "laser nao atingiu P1");
    assert(game.player2.health === PLAYER_MAX_HEALTH - BOSS_CONFIG.laser.damage, "laser nao atingiu P2");
});

test("Boss derrotado informa fim e mantem HP configuravel", () => {
    const boss = new Boss(BOSS_CONFIG);
    assert(boss.health === 80 && boss.maxHealth === 80, "HP inicial do boss incorreto");
    assert(!boss.takeDamage(79) && boss.health === 1, "dano parcial do boss incorreto");
    assert(boss.takeDamage(1) && boss.health === 0, "boss nao entrou em derrota");
    assert(boss.update(BOSS_CONFIG.defeatDuration, []).stageClear, "derrota nao concluiu a luta");
});

test("Game transforma a derrota do boss em Stage Clear e soma a recompensa", () => {
    const game = createGame(createInput(), 1);
    game.level.state = LEVEL_STATES.BOSS_FIGHT;
    game.boss = new Boss(BOSS_CONFIG);
    game.boss.takeDamage(BOSS_CONFIG.maxHealth);
    game.update(BOSS_CONFIG.defeatDuration);
    assert(game.gameState === "stageClear", "Game nao entrou em Stage Clear");
    assert(game.score === BOSS_CONFIG.scoreValue, "recompensa do boss nao foi somada");
});

test("Developer Mode bloqueia apenas a reducao de HP e consome o projetil", () => {
    const game = createGame(createInput(), 1);
    game.developerMode = true;
    let damageSounds = 0;
    game.audioManager.playPlayerDamage = () => {
        damageSounds += 1;
    };
    game.bullets.push(new Bullet(game.player1.x, game.player1.y, -1, 0, BULLET_OWNER.ENEMY));
    game.handleCollisions();
    assert(game.player1.health === PLAYER_MAX_HEALTH, "Developer Mode reduziu HP");
    assert(game.bullets[0].active === false, "colisao foi removida pelo Developer Mode");
    assert(damageSounds === 0, "Developer Mode tocou dano sem reduzir HP");
});

test("Spawn preserva tipos e limites verticais", () => {
    const normalSystem = new SpawnSystem(() => 0.5);
    const strongSystem = new SpawnSystem(() => 0.9);
    const normal = normalSystem.createEnemy();
    const strong = strongSystem.createEnemy();
    assert(normal.type === ENEMY_TYPES.NORMAL, "roll normal criou tipo errado");
    assert(strong.type === ENEMY_TYPES.STRONG, "roll forte criou tipo errado");
    assert(strong.y >= 0 && strong.y + strong.height <= GAME_HEIGHT, "spawn vertical inválido");
});

test("Catalogo de inimigos possui os cinco tipos configurados", () => {
    const types = [
        ENEMY_TYPES.NORMAL,
        ENEMY_TYPES.STRONG,
        ENEMY_TYPES.FAST,
        ENEMY_TYPES.SHOOTER,
        ENEMY_TYPES.KAMIKAZE,
    ];
    assert(types.every((type) => ENEMY_TYPE_CONFIG[type]), "algum tipo nao possui configuracao");
    assert(ENEMY_TYPE_CONFIG[ENEMY_TYPES.FAST].speed > ENEMY_CONFIG.speed, "FAST nao e mais rapido");
    assert(ENEMY_TYPE_CONFIG[ENEMY_TYPES.SHOOTER].health === 2, "SHOOTER nao possui 2 HP");
    assert(ENEMY_TYPE_CONFIG[ENEMY_TYPES.KAMIKAZE].collisionDamage === 1, "KAMIKAZE nao possui dano de contato");
});

test("Factory cria Fast e Shooter com comportamentos distintos", () => {
    const system = new SpawnSystem(() => 0.5);
    const fast = system.createEnemy(ENEMY_TYPES.FAST);
    const shooter = system.createEnemy(ENEMY_TYPES.SHOOTER);
    const fastStart = fast.x;
    fast.update(0.5, []);
    assert(fast.x < fastStart - (ENEMY_CONFIG.speed * 0.5), "FAST nao se moveu mais que o normal");

    shooter.update(1, []);
    shooter.update(0, []);
    assert(shooter.x === ENEMY_TYPE_CONFIG[ENEMY_TYPES.SHOOTER].stopX, "SHOOTER nao parou na posicao configurada");
    shooter.shotCooldownRemaining = 0;
    const bullet = shooter.shootAt(new Player(100, shooter.y));
    assert(bullet && shooter.health === 2, "SHOOTER nao disparou ou perdeu HP indevidamente");
});

test("Kamikaze escolhe somente jogador vivo e causa dano de contato", () => {
    const game = createGame(createInput(), 2);
    game.player1.health = 0;
    const kamikaze = new Enemy(game.player2.x, game.player2.y, ENEMY_TYPES.KAMIKAZE, () => 0.5);
    game.enemies.push(kamikaze);
    game.handleCollisions();
    assert(kamikaze.active === false, "KAMIKAZE nao desapareceu no impacto");
    assert(game.player2.health === PLAYER_MAX_HEALTH - 1, "KAMIKAZE nao causou dano ao jogador vivo");

    const tracking = new Enemy(900, 100, ENEMY_TYPES.KAMIKAZE, () => 0.5);
    tracking.update(0.1, [game.player1, game.player2]);
    assert(tracking.kamikazeTarget === game.player2, "KAMIKAZE escolheu jogador morto");
});

test("Kamikaze faz uma unica passagem e entra em ESCAPING sem retornar", () => {
    const game = createGame(createInput(), 2);
    const kamikaze = new Enemy(900, game.player1.y, ENEMY_TYPES.KAMIKAZE, () => 0);
    const target = game.player1;
    let escapeX = null;

    for (let step = 0; step < 80 && kamikaze.kamikazeState !== "escaping"; step += 1) {
        kamikaze.update(0.1, [target, game.player2]);
    }
    assert(kamikaze.kamikazeTarget === target, "Kamikaze trocou o alvo durante a passagem");
    assert(kamikaze.kamikazeState === "escaping", "Kamikaze nao entrou em ESCAPING");
    escapeX = kamikaze.x;
    kamikaze.update(0.5, [target, game.player2]);
    assert(kamikaze.x < escapeX, "Kamikaze retornou para a direita depois da passagem");

    const retargetable = new Enemy(900, game.player1.y, ENEMY_TYPES.KAMIKAZE, () => 0);
    retargetable.update(0.1, [game.player1, game.player2]);
    game.player1.health = 0;
    retargetable.update(0.1, [game.player1, game.player2]);
    assert(retargetable.kamikazeTarget === game.player2, "Kamikaze nao retargeteou durante a aproximacao inicial");
});

test("Hit valido no boss entrega energia somente ao jogador do projetil", () => {
    const game = createGame(createInput(), 2);
    game.level.state = LEVEL_STATES.BOSS_FIGHT;
    game.boss = new Boss(BOSS_CONFIG);
    game.boss.status = "fighting";
    game.bullets.push(new Bullet(
        game.boss.x,
        game.boss.y,
        1,
        0,
        BULLET_OWNER.PLAYER,
        1,
        PLAYER_IDS.ONE,
    ));
    game.handleCollisions();
    assert(game.player1.energy === BOSS_HIT_ENERGY_REWARD, "P1 nao recebeu energia do hit no boss");
    assert(game.player2.energy === 0, "P2 recebeu energia pelo hit de P1");
    assert(game.bullets[0].active === false, "projetil do boss nao foi consumido");

    game.player1.energy = game.player1.maxEnergy - 1;
    game.bullets.push(new Bullet(
        game.boss.x,
        game.boss.y,
        1,
        0,
        BULLET_OWNER.PLAYER,
        1,
        PLAYER_IDS.TWO,
    ));
    game.handleCollisions();
    assert(game.player2.energy === BOSS_HIT_ENERGY_REWARD, "P2 nao recebeu energia pelo proprio hit");
    assert(game.player1.energy === game.player1.maxEnergy - 1, "energia foi distribuida ao jogador errado");
    const p2AfterHit = game.player2.energy;
    game.handleCollisions();
    assert(game.player2.energy === p2AfterHit, "o mesmo projetil concedeu energia duas vezes");
    game.player1.energy = game.player1.maxEnergy - 1;
    game.bullets.push(new Bullet(
        game.boss.x,
        game.boss.y,
        1,
        0,
        BULLET_OWNER.PLAYER,
        1,
        PLAYER_IDS.ONE,
    ));
    game.handleCollisions();
    assert(game.player1.energy === game.player1.maxEnergy, "energia do hit ultrapassou ou ignorou o limite");
    assert(BOSS_HIT_ENERGY_REWARD === NORMAL_ENEMY_ENERGY_REWARD * 0.5, "reward de hit nao e 50% do inimigo normal");
    assert(game.player2.energy <= game.player2.maxEnergy, "energia ultrapassou o limite");

    const missed = new Bullet(0, 0, 1, 0, BULLET_OWNER.PLAYER, 1, PLAYER_IDS.ONE);
    game.bullets.push(missed);
    const beforeMiss = game.player1.energy;
    game.handleCollisions();
    assert(game.player1.energy === beforeMiss, "tiro que errou concedeu energia");

    const deadBossGame = createGame(createInput(), 1);
    deadBossGame.level.state = LEVEL_STATES.BOSS_FIGHT;
    deadBossGame.boss = new Boss(BOSS_CONFIG);
    deadBossGame.boss.takeDamage(deadBossGame.boss.maxHealth);
    deadBossGame.bullets.push(new Bullet(
        deadBossGame.boss.x,
        deadBossGame.boss.y,
        1,
        0,
        BULLET_OWNER.PLAYER,
        1,
        PLAYER_IDS.ONE,
    ));
    deadBossGame.handleCollisions();
    assert(deadBossGame.player1.energy === 0, "boss morto concedeu energia em hit posterior");
});

test("Ataques avancados do boss possuem telegraph, feixes duplos e rotacao", () => {
    const planetBoss = new Boss(BOSSES.planetBreaker, () => 0.5);
    planetBoss.status = "fighting";
    planetBoss.attackCooldownRemaining = 0;
    planetBoss.update(0, []);
    const charging = planetBoss.update(planetBoss.config.doubleLaser.chargeTime, []);
    assert(planetBoss.isDoubleLaserActive && charging.doubleLaserFired, "Double Laser nao iniciou dois feixes");
    assert(planetBoss.doubleLaserBeams.length === 2, "Double Laser nao possui dois telegraphs");
    const yDuringFire = planetBoss.y;
    planetBoss.update(0.1, []);
    assert(planetBoss.y === yDuringFire, "boss se moveu durante o Double Laser ativo");

    const collisionGame = createGame(createInput(), 2);
    collisionGame.level.state = LEVEL_STATES.BOSS_FIGHT;
    collisionGame.boss = new Boss(BOSSES.planetBreaker);
    collisionGame.boss.status = "fighting";
    collisionGame.boss.attackCooldownRemaining = 0;
    collisionGame.updateBoss(0);
    collisionGame.updateBoss(collisionGame.boss.config.doubleLaser.chargeTime);
    const beams = collisionGame.boss.doubleLaserBeams;
    collisionGame.player1.y = beams[0] - (collisionGame.player1.height / 2);
    collisionGame.player2.y = beams[1] - (collisionGame.player2.height / 2);
    collisionGame.handleBossLaserCollision();
    collisionGame.handleBossLaserCollision();
    assert(collisionGame.player1.health === PLAYER_MAX_HEALTH - 2, "primeiro feixe nao aplicou dano configurado");
    assert(collisionGame.player2.health === PLAYER_MAX_HEALTH - 2, "segundo feixe nao aplicou dano configurado");

    const expected = {
        dreadnought: ["machineGun", "laser"],
        asteroidCrusher: ["burstShot", "chargeAttack"],
        nebulaWraith: ["spreadShot", "laser"],
        fleetCommander: ["machineGun", "spreadShot", "summonMinions"],
        planetBreaker: ["doubleLaser", "burstShot"],
        scrapTitan: ["projectileWall", "machineGun", "summonMinions"],
        ionSerpent: ["spreadShot", "doubleLaser", "chargeAttack"],
        stationGuardian: ["machineGun", "projectileWall", "summonMinions", "laser"],
        mothershipShield: ["doubleLaser", "spreadShot", "projectileWall", "summonMinions"],
        overlordCore: ["machineGun", "doubleLaser", "spreadShot", "burstShot", "projectileWall", "summonMinions"],
    };
    Object.entries(expected).forEach(([id, sequence]) => {
        const boss = new Boss(BOSSES[id]);
        assert(
            JSON.stringify(BOSSES[id].attackSequence || BOSSES[id].attacks.map((attack) => attack.id)) === JSON.stringify(sequence),
            `${id} possui rotacao de ataques incorreta`,
        );
        assert(
            sequence.every((attackId) => boss.getAttackComponent(attackId)),
            `${id} referencia componente de ataque inexistente`,
        );
    });
});

test("Boss invoca minions limitados e a limpeza nao impede Stage Clear", () => {
    const game = createGame(createInput(), 2);
    game.level.state = LEVEL_STATES.BOSS_FIGHT;
    game.boss = new Boss(BOSSES.fleetCommander);
    game.boss.status = "fighting";
    game.boss.attackIndex = 2;
    game.boss.attackCooldownRemaining = 0;
    game.updateBoss(0);
    game.updateBoss(0);
    assert(game.enemies.length === 3, "boss nao invocou a onda de minions");
    assert(game.enemies.every((enemy) => enemy.isBossMinion), "minion nao foi marcado como auxiliar do boss");
    assert(game.enemies.every((enemy) => enemy.y >= PLAY_AREA_TOP), "minion surgiu dentro do HUD");
    const minion = game.enemies[0];
    game.bullets.push(new Bullet(minion.x, minion.y, 1, 0, BULLET_OWNER.PLAYER, 1, PLAYER_IDS.ONE));
    game.handleCollisions();
    assert(game.score === minion.scoreValue, "minion destruido nao concedeu score");
    assert(game.player1.energy === minion.energyReward, "minion destruido nao concedeu energia");

    game.boss.takeDamage(game.boss.health);
    game.update(game.boss.config.defeatDuration);
    assert(game.enemies.length === 0, "minions permaneceram apos a derrota do boss");
    assert(game.gameState === "stageClear", "minions impediram Stage Clear");
});

test("WaveSystem preserva ordem, tipo e intervalo dos grupos", () => {
    const waves = new WaveSystem(0.2);
    const spawned = [];
    waves.queueEvent({
        type: "wave",
        enemies: [
            { enemyType: ENEMY_TYPES.FAST, count: 2, interval: 0.1 },
            { enemyType: ENEMY_TYPES.SHOOTER, count: 1, interval: 0.3 },
        ],
    });
    waves.update(0.1, (item) => spawned.push(item));
    waves.update(0.1, (item) => spawned.push(item));
    waves.update(0.3, (item) => spawned.push(item));
    assert(spawned.map((item) => item.type).join(",") === "fast,fast,shooter", "ordem da onda foi alterada");
    assert(waves.pendingCount === 0, "fila de onda nao foi esvaziada");
});

test("LevelConfig e BossConfig sao catalogos extensivos sem duplicar logica", () => {
    const stage = LEVEL_CONFIG[0];
    assert(stage.backgroundType === "space", "Stage 01 nao possui tema de cenario");
    assert(stage.bossId === BOSS_CONFIG.id, "fase nao referencia boss por id");
    assert(stage.difficultyMultiplier === 1, "fase nao possui dificuldade configurada");
    assert(FUTURE_LEVEL_BLUEPRINTS.length === 9, "roteiro futuro nao possui fases 02-10");
});

test("Campanha possui dez fases com tres ondas e bosses unicos", () => {
    assert(LEVELS.length === 10, "campanha nao possui dez fases");
    assert(new Set(LEVELS.map((stage) => stage.id)).size === 10, "IDs de fases repetidos");
    assert(LEVELS.every((stage) => stage.events.length >= 3), "alguma fase nao possui tres ondas");
    assert(LEVELS.every((stage) => stage.enemyWeights && stage.bossId), "configuracao de fase incompleta");
    assert(LEVELS.every((stage) => BOSSES[stage.bossId]), "alguma fase referencia boss inexistente");
    assert(new Set(LEVELS.map((stage) => stage.bossId)).size === 10, "bosses da campanha nao sao unicos");
    assert(Object.keys(BOSSES).length === 10, "catalogo nao possui dez bosses");
    assert(LEVELS.every((stage) => stage.maxDistance / stage.scrollSpeed < 55), "fase normal excede o planejamento de duracao");
});

test("SpawnSystem respeita a HUD Safe Zone em todos os tipos", () => {
    const spawnSystem = new SpawnSystem(() => 0.5);
    Object.values(ENEMY_TYPES).forEach((type) => {
        const enemy = spawnSystem.createEnemy({ type });
        assert(enemy.y >= PLAY_AREA_TOP, `${type} surgiu dentro do HUD`);
        assert(
            enemy.y + enemy.height <= GAME_HEIGHT - PLAY_AREA_BOTTOM_MARGIN,
            `${type} surgiu fora da margem inferior segura`,
        );
    });
    assert(HUD_SAFE_ZONE_HEIGHT < PLAY_AREA_TOP, "safe zone do HUD conflita com a area jogavel");
});

test("Game avanca para a proxima fase preservando score e revivendo parceiro", () => {
    const input = createInput();
    const game = createGame(input, 2);
    game.player1.health = 2;
    game.player2.health = 0;
    game.level.state = LEVEL_STATES.BOSS_FIGHT;
    game.boss = new Boss(BOSS_CONFIG);
    game.boss.takeDamage(BOSS_CONFIG.maxHealth);
    game.update(BOSS_CONFIG.defeatDuration);
    assert(game.gameState === "stageClear", "Stage Clear nao foi exibido entre fases");
    const scoreAfterStage = game.score;
    input.pressedKeys.add("Enter");
    game.update(0);
    assert(game.gameState === "playing" && game.currentStageNumber === 2, "Stage 02 nao carregou");
    assert(game.score === scoreAfterStage, "score foi reiniciado na transicao");
    assert(game.player1.health === 3, "cura entre fases incorreta");
    assert(game.player2.health === 3, "jogador morto nao foi revivido");
    assert(game.levelDistance === 0 && game.enemies.length === 0 && game.bullets.length === 0, "estado da fase anterior vazou");
});

test("Stage 10 conclui a campanha e Enter retorna ao menu", () => {
    const input = createInput();
    const game = createGame(input, 1);
    game.currentLevelIndex = 9;
    game.level = new Level(LEVELS[9]);
    game.level.state = LEVEL_STATES.BOSS_FIGHT;
    game.boss = new Boss(BOSSES.overlordCore);
    game.boss.takeDamage(game.boss.maxHealth);
    game.update(game.boss.config.defeatDuration);
    assert(game.gameState === "campaignClear", "tela final nao apareceu");
    input.pressedKeys.add("Enter");
    game.update(0);
    assert(game.gameState === "menu", "tela final nao retornou ao menu");
});

test("PageDown acelera a campanha somente no Developer Mode", () => {
    const input = createInput();
    const game = createGame(input, 1);
    input.pressedKeys.add("PageDown");
    game.update(0);
    assert(game.level.progressPercent === 0, "PageDown funcionou sem Developer Mode");
    game.developerMode = true;
    input.pressedKeys.clear();
    game.update(0);
    input.pressedKeys.add("PageDown");
    game.update(0);
    assert(game.level.progressPercent === 25, "PageDown nao avancou ao proximo checkpoint");
});

test("Parallax possui tres camadas fixas que se movem em velocidades diferentes", () => {
    const parallax = new ParallaxSystem(1280, 720, () => 0.5);
    const before = parallax.layers.map((layer) => layer.stars[0].x);
    const counts = parallax.layers.map((layer) => layer.stars.length);
    parallax.update(1, 100);
    const moved = parallax.layers.map((layer, index) => before[index] - layer.stars[0].x);
    assert(moved[0] < moved[1] && moved[1] < moved[2], "camadas nao possuem velocidades distintas");
    assert(parallax.layers.every((layer, index) => layer.stars.length === counts[index]), "parallax cresceu infinitamente");
});

test("EffectsSystem remove explosoes e encerra screen shake", () => {
    const effects = new EffectsSystem(() => 0.75);
    effects.addExplosion(100, 100);
    effects.triggerShake(3, 0.2);
    assert(effects.effects.length === 1, "explosao nao foi criada");
    assert(effects.getShakeOffset().x !== 0 || effects.getShakeOffset().y !== 0, "screen shake nao iniciou");
    effects.update(1);
    assert(effects.effects.length === 0, "explosao nao foi removida");
    assert(effects.getShakeOffset().x === 0 && effects.getShakeOffset().y === 0, "screen shake nao terminou");
});

test("AudioManager funciona sem assets e preserva volumes", () => {
    const audio = new AudioManager();
    assert(audio.play("missing") === false, "audio ausente gerou erro ou retorno incorreto");
    audio.setVolume(0.5, 0.75);
    assert(audio.masterVolume === 0.5 && audio.sfxVolume === 0.75, "volumes nao foram configurados");
});

test("AudioManager reutiliza um unico AudioContext e encerra carga do laser", () => {
    const counter = { count: 0 };
    const audio = new AudioManager({
        contextFactory: createFakeAudioContextFactory(counter),
    });
    audio.unlock();
    audio.playPlayerShot();
    audio.playEnemyShot();
    audio.playMachineGunShot();
    audio.playEnemyHit();
    audio.playEnemyExplosion();
    audio.playPlayerDamage();
    audio.playPowerActivation();
    audio.playBossWarning();
    audio.playBossHit();
    audio.playLaserCharge();
    audio.stopLaserCharge();
    audio.playLaserFire();
    audio.playDoubleLaserCharge();
    audio.stopDoubleLaserCharge();
    audio.playDoubleLaserFire();
    audio.playSpreadShot();
    audio.playBurstShot();
    audio.playSummon();
    audio.playProjectileWall();
    audio.playChargeAttack();
    audio.playBossExplosion();
    audio.playMenuMove();
    audio.playMenuConfirm();
    audio.playStageClear();
    assert(counter.count === 1, "mais de um AudioContext foi criado");
    assert(audio.audioContext.state === "running", "AudioContext nao foi retomado apos interacao");
    assert(!audio.activeSounds.has("laserCharge"), "carga do laser ficou ativa");
});

test("AABB e descarte de objetos continuam funcionando", () => {
    assert(checkCollision(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 5, y: 5, width: 10, height: 10 },
    ), "sobreposição não detectada");
    assert(!checkCollision(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 10, y: 10, width: 10, height: 10 },
    ), "objetos separados foram tratados como colisão");
    const game = createGame();
    game.bullets.push(new Bullet(GAME_WIDTH, 10, 1, 0));
    game.enemies.push(new Enemy(-100, 10));
    game.removeInactiveObjects();
    assert(game.bullets.length === 0 && game.enemies.length === 0, "objetos fora da tela permaneceram");
});

const failures = results.filter((result) => result.startsWith("✗"));
const output = document.querySelector("#testOutput");
output.textContent = `${results.join("\n")}\n\n${results.length - failures.length}/${results.length} testes passaram.`;
document.body.dataset.testStatus = failures.length === 0 ? "passed" : "failed";
