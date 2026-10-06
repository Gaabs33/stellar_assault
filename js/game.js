import { Player } from "./entities/Player.js";
import { Boss } from "./entities/Boss.js";
import { checkCollision } from "./systems/Collision.js";
import { Level } from "./systems/Level.js";
import { SpawnSystem } from "./systems/SpawnSystem.js";
import { WaveSystem } from "./systems/WaveSystem.js";
import { ParallaxSystem } from "./systems/ParallaxSystem.js";
import { EffectsSystem } from "./systems/EffectsSystem.js";
import { AudioManager } from "./systems/AudioManager.js";
import { drawPixelFrame, drawSegmentedBar } from "./utils/PixelArt.js";
import {
    BULLET_OWNER,
    BOSS_HIT_ENERGY_REWARD,
    BOSSES,
    CAMPAIGN_TRANSITION_DURATION,
    DEVELOPER_SKIP_KEY,
    DEBUG,
    GAME_HEIGHT,
    GAME_STATES,
    GAME_WIDTH,
    HUD_SAFE_ZONE_HEIGHT,
    LEVELS,
    LEVEL_STATES,
    MAX_DELTA_TIME,
    PLAYER_IDS,
    PLAYER_PRESETS,
    STAGE_HEALTH_RESTORE,
    STAGE_REVIVE_HEALTH,
} from "./utils/constants.js";

/**
 * Coordena o loop, o menu e a interação entre entidades e sistemas.
 *
 * `gameState` representa o estado global atual: no menu somente a seleção é
 * processada; em playing a partida é atualizada; em gameOver o jogo aguarda
 * Enter para voltar ao menu. O mesmo Game atende os modos 1P e 2P por meio de
 * `players`, sem duplicar uma versão do jogo para cada modo.
 */
export class Game {
    constructor(canvas, input, spawnSystem = new SpawnSystem(), ui = {}) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.input = input;
        this.spawnSystem = spawnSystem;
        this.debugPanel = ui.debugPanel || null;
        this.statusElement = ui.statusElement || null;

        if (!this.context) {
            throw new Error("Não foi possível obter o contexto 2D do Canvas.");
        }

        this.canvas.width = GAME_WIDTH;
        this.canvas.height = GAME_HEIGHT;
        this.context.imageSmoothingEnabled = false;

        this.playerStartPositions = {
            [PLAYER_IDS.ONE]: {
                x: PLAYER_PRESETS[PLAYER_IDS.ONE].startX,
                y: PLAYER_PRESETS[PLAYER_IDS.ONE].startY,
            },
            [PLAYER_IDS.TWO]: {
                x: PLAYER_PRESETS[PLAYER_IDS.TWO].startX,
                y: PLAYER_PRESETS[PLAYER_IDS.TWO].startY,
            },
        };
        this.player1 = this.createPlayer(PLAYER_IDS.ONE);
        this.player2 = this.createPlayer(PLAYER_IDS.TWO);
        this.allPlayers = [this.player1, this.player2];

        // No menu, nenhum jogador é ativo. startGame() preenche esse array.
        this.players = [];
        this.playerCount = 0;
        this.selectedPlayerCount = 1;
        this.selectedMenuItem = 0;
        this.developerMode = false;
        this.debugEnabled = DEBUG;
        this.gameState = GAME_STATES.MENU;
        this.menuNavigationLocked = false;
        this.enterConsumed = false;
        this.developerSkipLocked = false;

        this.bullets = [];
        this.enemies = [];
        this.score = 0;
        this.levels = LEVELS;
        this.currentLevelIndex = 0;
        this.level = new Level(this.levels[this.currentLevelIndex]);
        this.boss = null;
        this.waveSystem = new WaveSystem(0.35);
        this.parallax = new ParallaxSystem(GAME_WIDTH, GAME_HEIGHT);
        this.effects = new EffectsSystem();
        this.audioManager = new AudioManager();
        this.campaignTime = 0;
        this.stageTime = 0;
        this.stageTimes = [];
        this.stageTransitionRemaining = 0;
        this.stageCompleted = false;
        this.stageIntroRemaining = 2.2;
        this.automaticReinforcementRemaining = this.currentStage.automaticReinforcements?.interval ?? 0;

        this.lastFrameTime = 0;
        this.animationFrameId = null;
        this.running = false;
        this.currentFps = 0;
        this.fpsElapsedTime = 0;
        this.fpsFrameCount = 0;
        this.gameLoop = this.gameLoop.bind(this);

        if (this.debugPanel) this.debugPanel.hidden = !this.debugEnabled;
        this.updateDebugPanel();
    }

    get waveSpawnQueue() {
        return this.waveSystem.queue;
    }

    createPlayer(playerId) {
        const preset = PLAYER_PRESETS[playerId];
        const position = this.playerStartPositions[playerId];
        return new Player(position.x, position.y, preset);
    }

    get alivePlayers() {
        return this.players.filter((player) => player.isAlive);
    }

    get isGameOver() {
        return this.gameState === GAME_STATES.GAME_OVER;
    }

    get levelDistance() {
        return this.level.levelDistance;
    }

    get levelMaxDistance() {
        return this.level.levelMaxDistance;
    }

    get levelProgress() {
        return this.level.progressRatio;
    }

    get levelEvents() {
        return this.level.events;
    }

    get currentStage() {
        return this.level.config;
    }

    get currentStageNumber() {
        return this.currentLevelIndex + 1;
    }

    get isFinalStage() {
        return this.currentLevelIndex === this.levels.length - 1;
    }

    start() {
        if (this.running) return;

        this.running = true;
        this.lastFrameTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }

    stop() {
        this.running = false;

        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    gameLoop(currentTime) {
        if (!this.running) return;

        const elapsedSeconds = (currentTime - this.lastFrameTime) / 1000;
        const deltaTime = Math.min(elapsedSeconds, MAX_DELTA_TIME);
        this.lastFrameTime = currentTime;

        this.update(deltaTime);
        this.draw();
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }

    update(deltaTime) {
        if (this.gameState === GAME_STATES.MENU) {
            this.handleMenuInput();
            this.parallax.update(deltaTime, 18);
            this.updateFps(deltaTime);
            this.updateDebugPanel();
            return;
        }

        if (this.gameState === GAME_STATES.CONTROLS_MENU) {
            this.handleControlsInput();
            this.parallax.update(deltaTime, 12);
            this.updateFps(deltaTime);
            this.updateDebugPanel();
            return;
        }

        if (this.gameState === GAME_STATES.GAME_OVER) {
            this.handleGameOverInput();
            this.updateFps(deltaTime);
            this.updateDebugPanel();
            return;
        }

        if (this.gameState === GAME_STATES.STAGE_CLEAR) {
            // A transicao automatica faz parte do tempo da campanha; o tempo
            // parado no menu continua fora do cronometro.
            this.campaignTime += deltaTime;
            this.stageTransitionRemaining = Math.max(
                0,
                this.stageTransitionRemaining - deltaTime,
            );
            this.handleStageClearInput();
            this.updateFps(deltaTime);
            this.updateDebugPanel();
            return;
        }

        if (this.gameState === GAME_STATES.CAMPAIGN_CLEAR) {
            this.handleCampaignClearInput();
            this.updateFps(deltaTime);
            this.updateDebugPanel();
            return;
        }

        this.campaignTime += deltaTime;
        this.stageTime += deltaTime;
        this.stageIntroRemaining = Math.max(0, this.stageIntroRemaining - deltaTime);

        this.players.forEach((player) => {
            player.update(deltaTime, this.input, GAME_WIDTH, GAME_HEIGHT);
        });
        this.handlePlayerActions();
        this.handleDeveloperSkip();

        const activeEnemyCount = this.enemies.filter((enemy) => enemy.active).length
            + this.waveSystem.pendingCount;
        const levelResult = this.level.update(
            deltaTime,
            activeEnemyCount,
            (event) => this.queueLevelEvent(event),
        );
        if (levelResult.warningStarted) this.audioManager.playBossWarning();
        if (levelResult.bossReady) this.createBoss();

        this.updateBackground(deltaTime);
        this.processWaveQueue(deltaTime);
        if (this.level.state === LEVEL_STATES.LEVEL_PLAYING) {
            this.spawnSystem.update(
                deltaTime,
                (enemy) => this.enemies.push(enemy),
                this.level.spawnSettings,
            );
        }
        this.updateEnemies(deltaTime);
        this.updateAutomaticBossReinforcements(deltaTime);
        this.updateBoss(deltaTime);
        this.bullets.forEach((bullet) => bullet.update(deltaTime));

        this.handleCollisions();
        this.handleBossLaserCollision();
        this.removeInactiveObjects();

        if (this.boss?.status === "finished" && !this.stageCompleted) {
            this.completeCurrentStage();
        }

        const allActivePlayersAreDead = this.playerCount === 1
            ? !this.player1.isAlive
            : this.alivePlayers.length === 0;
        if (allActivePlayersAreDead && this.gameState === GAME_STATES.PLAYING) {
            this.gameState = GAME_STATES.GAME_OVER;
        }
        this.effects.update(deltaTime);
        this.updateFps(deltaTime);
        this.updateDebugPanel();
    }

    /**
     * W/S e setas alternam a seleção uma vez por pressionamento. O bloqueio
     * evita várias trocas por frame enquanto a tecla permanece segurada.
     */
    handleMenuInput() {
        const upPressed = this.input.isDown("KeyW", "ArrowUp");
        const downPressed = this.input.isDown("KeyS", "ArrowDown");
        const verticalPressed = upPressed || downPressed;

        if (!verticalPressed) this.menuNavigationLocked = false;
        if (verticalPressed && !this.menuNavigationLocked) {
            if (upPressed !== downPressed) {
                const direction = downPressed ? 1 : -1;
                this.selectedMenuItem = (this.selectedMenuItem + direction + 5) % 5;
                if (this.selectedMenuItem < 2) {
                    this.selectedPlayerCount = this.selectedMenuItem + 1;
                }
                this.audioManager.unlock();
                this.audioManager.playMenuMove();
            }
            this.menuNavigationLocked = true;
        }

        const enterPressed = this.input.isDown("Enter");
        if (enterPressed) this.audioManager.unlock();
        if (!enterPressed) this.enterConsumed = false;
        if (enterPressed && !this.enterConsumed) {
            this.enterConsumed = true;
            if (this.selectedMenuItem === 2) {
                this.audioManager.playMenuConfirm();
                this.gameState = GAME_STATES.CONTROLS_MENU;
                this.input.clear();
                this.menuNavigationLocked = false;
                this.enterConsumed = false;
            } else if (this.selectedMenuItem === 3) {
                this.developerMode = !this.developerMode;
                this.audioManager.playMenuConfirm();
            } else if (this.selectedMenuItem === 4) {
                this.toggleDebug();
                this.audioManager.playMenuConfirm();
            } else {
                this.selectedPlayerCount = this.selectedMenuItem + 1;
                this.audioManager.playMenuConfirm();
                this.startGame(this.selectedPlayerCount);
            }
        }
    }

    handleControlsInput() {
        if (!this.input.isDown("Escape")) return;

        this.audioManager.unlock();
        this.audioManager.playMenuMove();
        this.gameState = GAME_STATES.MENU;
        this.input.clear();
        this.menuNavigationLocked = false;
        this.enterConsumed = false;
    }

    handleGameOverInput() {
        const enterPressed = this.input.isDown("Enter");
        if (!enterPressed) this.enterConsumed = false;
        if (enterPressed && !this.enterConsumed) {
            this.enterConsumed = true;
            this.audioManager.unlock();
            this.resetGame();
        }
    }

    handleStageClearInput() {
        const enterPressed = this.input.isDown("Enter");
        if (!enterPressed) this.enterConsumed = false;
        const transitionFinished = this.stageTransitionRemaining === 0;
        if ((enterPressed && !this.enterConsumed) || transitionFinished) {
            this.enterConsumed = true;
            this.advanceToNextStage();
        }
    }

    handleCampaignClearInput() {
        const enterPressed = this.input.isDown("Enter");
        if (!enterPressed) this.enterConsumed = false;
        if (enterPressed && !this.enterConsumed) {
            this.enterConsumed = true;
            this.audioManager.unlock();
            this.resetGame();
        }
    }

    /** Inicia 1P ou 2P usando o mesmo conjunto de entidades e sistemas. */
    startGame(playerCount) {
        this.playerCount = playerCount === 2 ? 2 : 1;
        this.players = this.playerCount === 1
            ? [this.player1]
            : [this.player1, this.player2];
        this.resetMatchState();
        this.gameState = GAME_STATES.PLAYING;
        this.input.clear();
        this.enterConsumed = false;
        this.menuNavigationLocked = false;
    }

    /**
     * Zera tudo que pertence a uma partida nova. Os dois objetos Player são
     * resetados, mas somente os que estão em `players` participam do modo atual.
     */
    resetMatchState() {
        this.allPlayers.forEach((player) => {
            const position = this.playerStartPositions[player.playerId];
            player.reset(position.x, position.y);
        });
        this.bullets = [];
        this.enemies = [];
        this.score = 0;
        this.currentLevelIndex = 0;
        this.level = new Level(this.levels[this.currentLevelIndex]);
        this.boss = null;
        this.waveSystem.reset();
        this.effects.reset();
        this.parallax.reset();
        this.spawnSystem.reset();
        this.campaignTime = 0;
        this.stageTime = 0;
        this.stageTimes = [];
        this.stageTransitionRemaining = 0;
        this.stageCompleted = false;
        this.stageIntroRemaining = 2.2;
        this.automaticReinforcementRemaining = this.currentStage.automaticReinforcements?.interval ?? 0;
        this.developerSkipLocked = false;
        this.fpsElapsedTime = 0;
        this.fpsFrameCount = 0;
        this.currentFps = 0;
    }

    loadStage(stageIndex) {
        this.currentLevelIndex = Math.max(0, Math.min(stageIndex, this.levels.length - 1));
        this.level = new Level(this.levels[this.currentLevelIndex]);
        this.boss = null;
        this.bullets = [];
        this.enemies = [];
        this.waveSystem.reset();
        this.effects.reset();
        this.parallax.reset();
        this.spawnSystem.reset();
        this.stageTime = 0;
        this.stageCompleted = false;
        this.stageTransitionRemaining = 0;
        this.stageIntroRemaining = 2.2;
        this.automaticReinforcementRemaining = this.currentStage.automaticReinforcements?.interval ?? 0;
    }

    preparePlayersForNextStage() {
        this.players.forEach((player) => {
            const position = this.playerStartPositions[player.playerId];
            player.x = position.x;
            player.y = position.y;
            player.shotCooldownRemaining = 0;
            player.invincibilityRemaining = 0;
            player.powerTimeRemaining = 0;
            if (player.isAlive) {
                player.health = Math.min(
                    player.maxHealth,
                    player.health + (this.currentStage.restoreHealth ?? STAGE_HEALTH_RESTORE),
                );
            } else {
                player.health = Math.min(
                    player.maxHealth,
                    this.currentStage.reviveHealth ?? STAGE_REVIVE_HEALTH,
                );
            }
        });
    }

    advanceToNextStage() {
        if (this.isFinalStage) return;

        this.preparePlayersForNextStage();
        this.loadStage(this.currentLevelIndex + 1);
        this.gameState = GAME_STATES.PLAYING;
        this.input.clear();
        this.enterConsumed = false;
        this.developerSkipLocked = false;
    }

    completeCurrentStage() {
        this.stageCompleted = true;
        this.clearBossMinions();
        this.score += this.boss.config.scoreReward ?? this.boss.config.scoreValue ?? 0;
        this.stageTimes.push(this.stageTime);
        this.level.markStageClear();
        this.audioManager.playStageClear();

        if (this.isFinalStage) {
            this.gameState = GAME_STATES.CAMPAIGN_CLEAR;
            return;
        }

        this.stageTransitionRemaining = this.currentStage.transitionDuration
            ?? CAMPAIGN_TRANSITION_DURATION;
        this.gameState = GAME_STATES.STAGE_CLEAR;
    }

    /** Atalho exclusivo de teste: PageDown avanca um checkpoint ou boss. */
    handleDeveloperSkip() {
        const pressed = this.input.isDown(DEVELOPER_SKIP_KEY);
        if (!pressed) this.developerSkipLocked = false;
        if (!this.developerMode || !pressed || this.developerSkipLocked) return;

        this.developerSkipLocked = true;
        if (this.level.state === LEVEL_STATES.LEVEL_PLAYING) {
            this.level.skipToNextCheckpoint();
        } else if (this.level.state === LEVEL_STATES.BOSS_WARNING) {
            this.level.warningTimeRemaining = 0;
        } else if (this.level.state === LEVEL_STATES.BOSS_FIGHT && this.boss?.isAlive) {
            this.boss.takeDamage(this.boss.health);
        }
    }

    /** Enter no Game Over retorna ao menu, permitindo escolher outro modo. */
    resetGame() {
        this.resetMatchState();
        this.players = [];
        this.playerCount = 0;
        this.selectedMenuItem = 0;
        this.selectedPlayerCount = 1;
        this.gameState = GAME_STATES.MENU;
        this.input.clear();
        this.enterConsumed = false;
        this.menuNavigationLocked = false;
    }

    queueLevelEvent(event) {
        this.waveSystem.queueEvent(event);
    }

    processWaveQueue(deltaTime) {
        if (![
            LEVEL_STATES.LEVEL_PLAYING,
            LEVEL_STATES.LEVEL_CLEARING,
        ].includes(this.level.state)) return;

        this.waveSystem.update(deltaTime, (spawnData) => {
            this.enemies.push(this.spawnSystem.createEnemy({
                type: spawnData.type,
                y: spawnData.y,
                position: spawnData.position,
                pattern: spawnData.pattern,
                difficultyMultiplier: this.level.config.difficultyMultiplier,
            }));
        });
    }

    updateBackground(deltaTime) {
        if (this.level.state === LEVEL_STATES.BOSS_FIGHT) return;

        this.parallax.update(deltaTime, this.level.config.scrollSpeed);
    }

    createBoss() {
        const bossConfig = BOSSES[this.level.config.bossId];
        if (!bossConfig) {
            this.level.markStageClear();
            this.gameState = GAME_STATES.STAGE_CLEAR;
            return;
        }
        this.boss = new Boss(bossConfig);
    }

    updateBoss(deltaTime) {
        if (!this.boss || this.level.state !== LEVEL_STATES.BOSS_FIGHT) return;

        const result = this.boss.update(deltaTime, this.alivePlayers);
        this.bullets.push(...result.bullets);
        result.bullets.forEach((bullet) => {
            if (bullet.sourceType === "bossSpread") this.audioManager.playSpreadShot();
            else if (bullet.sourceType === "bossBurst") this.audioManager.playBurstShot();
            else if (bullet.sourceType === "bossWall") this.audioManager.playProjectileWall();
            else if (bullet.sourceType === "bossCharge") this.audioManager.playChargeAttack();
            else if (bullet.sourceType?.startsWith("boss")) this.audioManager.playMachineGunShot();
        });
        if (result.attackStarted && result.attackId === "summonMinions") {
            this.audioManager.playSummon();
        }
        if (result.attackStarted && result.attackId === "doubleLaser") {
            this.audioManager.playDoubleLaserCharge(this.boss.config.doubleLaser.chargeTime);
        }
        if (result.attackStarted && result.attackId === "laser") {
            this.audioManager.playLaserCharge(this.boss.config.laser.chargeTime);
        }
        if (result.laserCharging && !result.attackStarted && !this.boss.usesAttackDirector) {
            this.audioManager.playLaserCharge(this.boss.config.laser.chargeTime);
        }
        if (result.laserFired) {
            this.effects.triggerShake(2, 0.18);
            this.audioManager.playLaserFire();
        }
        if (result.doubleLaserFired) {
            this.effects.triggerShake(2.5, 0.2);
            this.audioManager.playDoubleLaserFire();
        }
        if (result.summons.length > 0) this.spawnBossMinions(result.summons);
    }

    updateAutomaticBossReinforcements(deltaTime) {
        const reinforcementConfig = this.currentStage.automaticReinforcements;
        if (!reinforcementConfig || !this.boss || this.level.state !== LEVEL_STATES.BOSS_FIGHT) return;

        this.automaticReinforcementRemaining -= deltaTime;
        if (this.automaticReinforcementRemaining > 0) return;

        this.automaticReinforcementRemaining = reinforcementConfig.interval;
        const count = reinforcementConfig.min
            + Math.floor(Math.random() * ((reinforcementConfig.max ?? reinforcementConfig.min) - reinforcementConfig.min + 1));
        const types = reinforcementConfig.types || ["normal", "fast", "shooter"];
        const summons = Array.from({ length: count }, (_, index) => ({
            type: types[Math.floor(Math.random() * types.length)],
            y: 160 + (Math.random() * 510),
            position: "right",
            pattern: index % 2 === 0 ? "top" : "bottom",
        }));
        this.spawnBossMinions(summons);
        this.audioManager.playSummon();
    }

    handleBossLaserCollision() {
        if (!this.boss) return;

        if (this.boss.isLaserActive) {
            this.applyBossBeamCollision({
                x: 0,
                y: this.boss.laserY - (this.boss.config.laser.height / 2),
                width: Math.max(0, this.boss.laserCannonX),
                height: this.boss.config.laser.height,
            }, this.boss.laserHitPlayers, this.boss.config.laser.damage);
        }

        if (this.boss.isDoubleLaserActive) {
            this.boss.doubleLaserBeams.forEach((beamY, index) => {
                this.applyBossBeamCollision({
                    x: 0,
                    y: beamY - (this.boss.config.doubleLaser.height / 2),
                    width: Math.max(0, this.boss.x),
                    height: this.boss.config.doubleLaser.height,
                }, this.boss.doubleLaserHitPlayers[index], this.boss.config.doubleLaser.damage);
            });
        }
    }

    applyBossBeamCollision(beam, hitPlayers, damage) {
        if (!hitPlayers) return;
        this.players.forEach((player) => {
            if (
                !player.isAlive
                || hitPlayers.has(player.playerId)
                || !checkCollision(player, beam)
            ) return;

            // Cada registro vale apenas para este feixe/disparo.
            hitPlayers.add(player.playerId);
            if (player.takeDamage(damage, this.developerMode)) {
                this.audioManager.playPlayerDamage();
                this.effects.addExplosion(player.centerX, player.centerY, {
                    color: player.color,
                    particleCount: 6,
                    duration: 0.22,
                });
            }
        });
    }

    handlePlayerActions() {
        this.players.forEach((player) => {
            if (!player.isAlive) return;

            if (this.input.isDown(player.controls.shoot)) {
                const newBullet = player.shoot();
                if (newBullet) {
                    this.bullets.push(newBullet);
                    this.audioManager.unlock();
                    this.audioManager.playPlayerShot(player.playerId);
                }
            }

            if (this.input.isDown(player.controls.ability)) {
                if (player.activatePower()) {
                    this.audioManager.unlock();
                    this.audioManager.playPowerActivation();
                }
            }
        });
    }

    updateEnemies(deltaTime) {
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;

            enemy.update(deltaTime, this.alivePlayers);
            if (!enemy.canShoot || enemy.shotCooldownRemaining > 0) continue;

            const targets = this.alivePlayers;
            if (targets.length === 0) continue;

            // Em solo só existe P1; em 2P a escolha continua aleatória entre vivos.
            const targetIndex = Math.floor(Math.random() * targets.length);
            const enemyBullet = enemy.shootAt(targets[targetIndex]);
            if (enemyBullet) {
                this.bullets.push(enemyBullet);
                this.audioManager.playEnemyShot();
            }
        }
    }

    /** Método público simples, útil para testes e futuras ondas roteirizadas. */
    spawnEnemy(typeOrOptions = {}) {
        const enemy = this.spawnSystem.createEnemy(typeOrOptions);
        this.enemies.push(enemy);
        return enemy;
    }

    spawnBossMinions(summons) {
        if (!this.boss) return;

        const config = this.boss.config.summonMinions || {};
        const maxAlive = config.maxAlive ?? 4;
        let aliveMinions = this.enemies.filter(
            (enemy) => enemy.active && enemy.isBossMinion,
        ).length;
        if (aliveMinions >= maxAlive) return;

        summons.some((summon) => {
            if (aliveMinions >= maxAlive) return true;
            const enemy = this.spawnSystem.createEnemy({
                type: summon.type,
                y: summon.y,
                position: summon.position,
                pattern: summon.pattern,
                difficultyMultiplier: this.level.config.difficultyMultiplier,
                isBossMinion: true,
            });
            this.enemies.push(enemy);
            aliveMinions += 1;
            return false;
        });
        this.effects.addExplosion(this.boss.centerX, this.boss.centerY, {
            color: this.boss.config.coreColor || "#59f6e8",
            particleCount: 8,
            duration: 0.35,
        });
    }

    clearBossMinions() {
        this.enemies.forEach((enemy) => {
            if (enemy.isBossMinion) enemy.active = false;
        });
        this.enemies = this.enemies.filter((enemy) => !enemy.isBossMinion);
        this.bullets = this.bullets.filter((bullet) => bullet.owner !== BULLET_OWNER.ENEMY);
    }

    /**
     * owner separa as regras de colisão. A energia de uma destruição procura o
     * playerId gravado no Bullet, mantendo a recompensa independente por nave.
     */
    handleCollisions() {
        for (const bullet of this.bullets) {
            if (!bullet.active) continue;

            if (bullet.owner === BULLET_OWNER.PLAYER) {
                for (const enemy of this.enemies) {
                    if (!enemy.active || !checkCollision(bullet, enemy)) continue;

                    bullet.active = false;
                    const wasDestroyed = enemy.takeDamage(bullet.damage);

                    if (wasDestroyed) {
                        this.score += enemy.scoreValue;
                        this.effects.addExplosion(enemy.centerX, enemy.centerY, {
                            color: enemy.color,
                            particleCount: enemy.type === "strong" ? 14 : 9,
                        });
                        this.audioManager.playEnemyExplosion();
                        const owner = this.players.find(
                            (player) => player.playerId === bullet.playerId,
                        );
                        if (owner) owner.addEnergy(enemy.energyReward);
                    } else {
                        this.audioManager.playEnemyHit();
                    }
                    break;
                }

                if (
                    bullet.active
                    && this.level.state === LEVEL_STATES.BOSS_FIGHT
                    && this.boss?.isAlive
                    && checkCollision(bullet, this.boss)
                ) {
                    bullet.active = false;
                    const previousBossHealth = this.boss.health;
                    const bossDestroyed = this.boss.takeDamage(bullet.damage);
                    const owner = this.players.find(
                        (player) => player.playerId === bullet.playerId,
                    );
                    if (this.boss.health < previousBossHealth && owner) {
                        owner.addEnergy(BOSS_HIT_ENERGY_REWARD);
                    }
                    if (bossDestroyed) {
                        this.audioManager.stopLaserCharge();
                        this.audioManager.stopDoubleLaserCharge();
                        this.effects.addExplosion(this.boss.centerX, this.boss.centerY, {
                            color: "#ffcf4a",
                            particleCount: 24,
                            duration: this.boss.config.defeatDuration,
                        });
                        this.effects.triggerShake(5, 0.35);
                        this.audioManager.playBossExplosion();
                    } else {
                        this.audioManager.playBossHit();
                    }
                }
            } else {
                for (const player of this.players) {
                    if (!player.isAlive || !checkCollision(bullet, player)) continue;

                    // Um projétil inimigo é consumido no primeiro jogador atingido.
                    bullet.active = false;
                    if (player.takeDamage(bullet.damage, this.developerMode)) {
                        this.audioManager.playPlayerDamage();
                        this.effects.addExplosion(player.centerX, player.centerY, {
                            color: player.color,
                            particleCount: 6,
                            duration: 0.22,
                        });
                    }
                    break;
                }
            }
        }

        // Apenas o tipo kamikaze usa contato ofensivo com a nave.
        for (const enemy of this.enemies) {
            if (!enemy.active || !enemy.isKamikaze) continue;
            const target = this.players.find(
                (player) => player.isAlive && checkCollision(enemy, player),
            );
            if (!target) continue;

            enemy.active = false;
            if (target.takeDamage(enemy.collisionDamage, this.developerMode)) {
                this.audioManager.playPlayerDamage();
                this.effects.addExplosion(target.centerX, target.centerY, {
                    color: target.color,
                    particleCount: 7,
                    duration: 0.24,
                });
            }
            this.effects.addExplosion(enemy.centerX, enemy.centerY, {
                color: enemy.color,
                particleCount: 10,
            });
            this.audioManager.playEnemyExplosion();
        }
    }

    removeInactiveObjects() {
        this.bullets = this.bullets.filter(
            (bullet) => bullet.active
                && !bullet.isOutsideBounds(GAME_WIDTH, GAME_HEIGHT),
        );
        this.enemies = this.enemies.filter(
            (enemy) => enemy.active && !enemy.isOutsideLeft(),
        );
    }

    updateFps(deltaTime) {
        this.fpsElapsedTime += deltaTime;
        this.fpsFrameCount += 1;

        if (this.fpsElapsedTime >= 0.5) {
            this.currentFps = Math.round(this.fpsFrameCount / this.fpsElapsedTime);
            this.fpsElapsedTime = 0;
            this.fpsFrameCount = 0;
        }
    }

    draw() {
        this.context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.drawBackground();

        if (this.gameState === GAME_STATES.MENU) {
            this.drawMenu();
            return;
        }

        if (this.gameState === GAME_STATES.CONTROLS_MENU) {
            this.drawControlsMenu();
            return;
        }

        if (this.gameState === GAME_STATES.CAMPAIGN_CLEAR) {
            this.drawCampaignClear();
            return;
        }

        const canTransform = typeof this.context.save === "function"
            && typeof this.context.translate === "function"
            && typeof this.context.restore === "function";
        const shake = this.effects.getShakeOffset();
        if (canTransform) {
            this.context.save();
            this.context.translate(shake.x, shake.y);
        }
        this.players.forEach((player) => player.draw(this.context));
        this.enemies.forEach((enemy) => enemy.draw(this.context));
        this.boss?.draw(this.context);
        this.bullets.forEach((bullet) => bullet.draw(this.context));
        this.effects.draw(this.context);
        if (canTransform) this.context.restore();

        this.drawHud();
        if (this.stageIntroRemaining > 0 && this.gameState === GAME_STATES.PLAYING) {
            this.drawStageIntro();
        }
        if (this.gameState === GAME_STATES.GAME_OVER) this.drawGameOver();
        if (this.level.state === LEVEL_STATES.BOSS_WARNING) this.drawBossWarning();
        if (this.gameState === GAME_STATES.STAGE_CLEAR) this.drawStageClear();
    }

    drawBackground() {
        if (this.gameState === GAME_STATES.MENU || this.gameState === GAME_STATES.CONTROLS_MENU) {
            this.parallax.drawMenu(this.context);
            return;
        }
        this.parallax.draw(
            this.context,
            this.level.config.backgroundType,
            this.level.progressRatio,
        );
    }

    drawMenu() {
        this.context.fillStyle = "rgba(5, 5, 18, 0.56)";
        this.context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        drawPixelFrame(this.context, 250, 86, 940, 650, {
            outer: "#111a3b",
            edge: "#59f6e8",
            inner: "#080d24",
        });
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        const titlePulse = Math.floor(this.parallax.elapsed * 4) % 2;
        this.context.fillStyle = "#14255c";
        this.context.font = 'bold 64px "Courier New", monospace';
        this.context.fillText("STELLAR ASSAULT", GAME_WIDTH / 2 + 5, 180 + titlePulse);
        this.context.fillStyle = "#59f6e8";
        this.context.font = 'bold 64px "Courier New", monospace';
        this.context.fillText("STELLAR ASSAULT", GAME_WIDTH / 2, 175 + titlePulse);
        this.context.fillStyle = "#ff5f7a";
        this.context.font = 'bold 16px "Courier New", monospace';
        this.context.fillText("TACTICAL PIXEL OPERATIONS // 10-STAGE CAMPAIGN", GAME_WIDTH / 2, 220);
        this.context.fillStyle = "#f1f3ff";
        this.context.font = 'bold 24px "Courier New", monospace';
        this.context.fillText("SELECT MISSION MODE", GAME_WIDTH / 2, 275);

        const options = [
            { label: "1 JOGADOR", y: 350 },
            { label: "2 JOGADORES", y: 410 },
            { label: "CONTROLES", y: 470 },
            { label: `MODO DESENVOLVEDOR: ${this.developerMode ? "ON" : "OFF"}`, y: 530 },
            { label: `DEBUG: ${this.debugEnabled ? "ON" : "OFF"}`, y: 590 },
        ];
        options.forEach((option, index) => {
            const selected = index === this.selectedMenuItem;
            this.context.fillStyle = selected ? "#fff37a" : "#aeb4d6";
            if (selected) {
                this.context.fillStyle = "#fff37a";
                this.context.fillRect((GAME_WIDTH / 2) - 190, option.y - 14, 8, 28);
                this.context.fillRect((GAME_WIDTH / 2) + 182, option.y - 14, 8, 28);
            }
            this.context.fillText(
                `${selected ? ">" : " "} ${option.label}`,
                GAME_WIDTH / 2,
                option.y,
            );
        });

        this.context.fillStyle = "#aeb4d6";
        this.context.font = '18px "Courier New", monospace';
        this.context.fillText("W/S ou SETAS: SELECIONAR   ENTER: CONFIRMAR", GAME_WIDTH / 2, 665);
        this.context.fillStyle = "#59f6e8";
        this.context.font = '14px "Courier New", monospace';
        this.context.fillText("P1 WASD + SPACE/E   //   P2 ARROWS + RSHIFT/LSHIFT", GAME_WIDTH / 2, 705);
        this.context.textAlign = "left";
        this.context.textBaseline = "top";
    }

    drawControlsMenu() {
        this.context.fillStyle = "rgba(5, 5, 18, 0.9)";
        this.context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        drawPixelFrame(this.context, 180, 54, 1080, 570, {
            outer: "#111a3b",
            edge: "#59f6e8",
            inner: "#080d24",
        });
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillStyle = "#59f6e8";
        this.context.font = 'bold 46px "Courier New", monospace';
        this.context.fillText("CONTROLES", GAME_WIDTH / 2, 120);

        this.context.fillStyle = "#f1f3ff";
        this.context.font = 'bold 21px "Courier New", monospace';
        this.context.fillText("PLAYER 1", GAME_WIDTH / 2 - 260, 230);
        this.context.fillText("PLAYER 2", GAME_WIDTH / 2 + 260, 230);
        this.context.font = '18px "Courier New", monospace';
        const player1 = ["WASD - MOVIMENTO", "SPACE - TIRO", "E - ESPECIAL"];
        const player2 = ["SETAS - MOVIMENTO", "RIGHT SHIFT - TIRO", "LEFT SHIFT - ESPECIAL"];
        player1.forEach((line, index) => this.context.fillText(line, GAME_WIDTH / 2 - 260, 290 + (index * 42)));
        player2.forEach((line, index) => this.context.fillText(line, GAME_WIDTH / 2 + 260, 290 + (index * 42)));
        this.context.fillStyle = "#fff37a";
        this.context.fillText("ESC - VOLTAR", GAME_WIDTH / 2, 520);
        this.context.textAlign = "left";
        this.context.textBaseline = "top";
    }

    drawHud() {
        const formattedScore = String(this.score).padStart(6, "0");
        this.context.fillStyle = "rgba(5, 5, 18, 0.72)";
        this.context.fillRect(0, 0, GAME_WIDTH, HUD_SAFE_ZONE_HEIGHT);
        this.context.textBaseline = "top";
        this.context.textAlign = "right";
        this.context.font = 'bold 24px "Courier New", monospace';
        this.context.fillStyle = "#f1f3ff";
        this.context.fillText(`SCORE: ${formattedScore}`, GAME_WIDTH - 24, 18);

        this.drawPlayerStatus();
        if (this.level.state === LEVEL_STATES.BOSS_FIGHT) {
            this.drawBossHealthBar();
        } else {
            this.drawLevelProgress();
        }
        if (this.developerMode) this.drawDeveloperIndicator();
        this.context.textAlign = "left";
    }

    drawDeveloperIndicator() {
        this.context.textAlign = "right";
        this.context.font = 'bold 16px "Courier New", monospace';
        this.context.fillStyle = "#fff37a";
        this.context.fillText("DEV MODE - INVINCIBLE", GAME_WIDTH - 24, 52);
    }

    drawLevelProgress() {
        const barX = 470;
        const barY = 48;
        const barWidth = 340;
        const barHeight = 12;
        this.context.textAlign = "center";
        this.context.font = 'bold 18px "Courier New", monospace';
        this.context.fillStyle = "#f1f3ff";
        const stageLabel = `STAGE ${String(this.level.config.id).padStart(2, "0")}`;
        this.context.fillText(
            `${stageLabel} - ${this.level.config.name.toUpperCase()}`,
            barX + (barWidth / 2),
            18,
        );
        drawPixelFrame(this.context, barX - 8, barY - 8, barWidth + 16, barHeight + 16, {
            outer: "#17224b",
            edge: "#59f6e8",
            inner: "#090f25",
        });
        drawSegmentedBar(this.context, barX, barY, barWidth, barHeight, this.level.progressRatio, "#59f6e8", 20);
        this.context.fillStyle = "#aeb4d6";
        this.context.font = '14px "Courier New", monospace';
        this.context.fillText(`DISTANCE ${this.level.progressPercent}%`, barX + (barWidth / 2), 66);
    }

    drawBossHealthBar() {
        if (!this.boss) return;

        const barX = 330;
        const barY = 46;
        const barWidth = 620;
        const barHeight = 16;
        const ratio = Math.max(0, this.boss.health / this.boss.maxHealth);
        this.context.textAlign = "center";
        this.context.font = 'bold 18px "Courier New", monospace';
        this.context.fillStyle = "#ffcf4a";
        this.context.fillText(this.boss.config.name, barX + (barWidth / 2), 18);
        drawPixelFrame(this.context, barX - 8, barY - 8, barWidth + 16, barHeight + 16, {
            outer: "#321b44",
            edge: "#ff5f7a",
            inner: "#130d25",
        });
        drawSegmentedBar(this.context, barX, barY, barWidth, barHeight, ratio, "#ff5f7a", 30);
        this.context.fillStyle = "#f1f3ff";
        this.context.font = '14px "Courier New", monospace';
        this.context.fillText(
            `${this.boss.health} / ${this.boss.maxHealth}`,
            barX + (barWidth / 2),
            70,
        );
    }

    drawPlayerStatus() {
        this.players.forEach((player, index) => {
            this.drawSinglePlayerStatus(player, 24 + (index * 220), 16);
        });
    }

    drawSinglePlayerStatus(player, x, y) {
        const energyRatio = player.energy / player.maxEnergy;
        const label = player.playerId === PLAYER_IDS.ONE ? "P1" : "P2";
        const barX = x;
        const barY = y + 61;
        const barWidth = 180;
        const barHeight = 16;

        drawPixelFrame(this.context, x - 10, y - 8, 206, 94, {
            outer: "#121d40",
            edge: player.color,
            inner: "#080d20",
        });

        this.context.textAlign = "left";
        this.context.font = 'bold 20px "Courier New", monospace';
        this.context.fillStyle = player.color;
        this.context.fillText(`${label}${player.isAlive ? "" : " DEAD"}`, x, y);
        for (let index = 0; index < player.maxHealth; index += 1) {
            const heartX = x + 64 + (index * 17);
            this.context.fillStyle = index < player.health ? "#ff5f7a" : "#3a244c";
            this.context.fillRect(heartX, y + 1, 6, 5);
            this.context.fillRect(heartX - 2, y + 4, 10, 6);
            this.context.fillRect(heartX + 1, y + 10, 4, 3);
        }

        this.context.font = 'bold 16px "Courier New", monospace';
        this.context.fillStyle = "#f1f3ff";
        this.context.fillText(`ENERGY ${player.energy}/${player.maxEnergy}`, x, y + 32);
        this.context.fillStyle = player.energy >= player.maxEnergy
            ? "#fff37a"
            : player.color;
        drawSegmentedBar(
            this.context,
            barX,
            barY,
            barWidth,
            barHeight,
            energyRatio,
            player.energy >= player.maxEnergy ? "#fff37a" : player.color,
            10,
        );

        this.context.fillStyle = player.isPowerActive || player.energy >= player.maxEnergy
            ? "#fff37a"
            : "#aeb4d6";
        if (player.isPowerActive) {
            this.context.fillText(
                `${label} POWER: ${player.powerTimeRemaining.toFixed(1)}s`,
                x + 190,
                y + 32,
            );
        } else if (player.energy >= player.maxEnergy) {
            this.context.fillText(`${label} POWER READY`, x + 190, y + 32);
        }
    }

    drawBossWarning() {
        const visible = Math.floor(this.level.warningTimeRemaining * 4) % 2 === 0;
        if (!visible) return;

        this.context.fillStyle = "rgba(5, 5, 18, 0.45)";
        this.context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillStyle = "#ffcf4a";
        this.context.font = 'bold 58px "Courier New", monospace';
        this.context.fillText("WARNING", GAME_WIDTH / 2, (GAME_HEIGHT / 2) - 35);
        this.context.fillStyle = "#f1f3ff";
        this.context.font = 'bold 26px "Courier New", monospace';
        this.context.fillText("BOSS APPROACHING", GAME_WIDTH / 2, (GAME_HEIGHT / 2) + 35);
        this.context.textAlign = "left";
        this.context.textBaseline = "top";
    }

    drawStageIntro() {
        const progress = Math.max(0, Math.min(1, this.stageIntroRemaining / 2.2));
        const fade = progress < 0.35 ? progress / 0.35 : 1;
        this.context.globalAlpha = Math.min(0.86, fade * 0.86);
        this.context.fillStyle = "#050512";
        this.context.fillRect(0, 180, GAME_WIDTH, 250);
        this.context.globalAlpha = fade;
        this.context.fillStyle = "#59f6e8";
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.font = 'bold 20px "Courier New", monospace';
        this.context.fillText("OPERATION STELLAR ASSAULT", GAME_WIDTH / 2, 245);
        this.context.fillStyle = "#fff37a";
        this.context.font = 'bold 50px "Courier New", monospace';
        this.context.fillText(
            `STAGE ${String(this.currentStage.id).padStart(2, "0")}`,
            GAME_WIDTH / 2,
            305,
        );
        this.context.fillStyle = "#f1f3ff";
        this.context.font = 'bold 28px "Courier New", monospace';
        this.context.fillText(this.currentStage.name.toUpperCase(), GAME_WIDTH / 2, 365);
        this.context.fillStyle = "#ff5f7a";
        this.context.font = '16px "Courier New", monospace';
        this.context.fillText("SURVIVE THE APPROACH // DESTROY THE COMMAND CORE", GAME_WIDTH / 2, 405);
        this.context.globalAlpha = 1;
        this.context.textAlign = "left";
        this.context.textBaseline = "top";
    }

    drawStageClear() {
        this.context.fillStyle = "rgba(5, 5, 18, 0.84)";
        this.context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillStyle = "#59f6e8";
        this.context.font = 'bold 58px "Courier New", monospace';
        this.context.fillText(
            `STAGE ${String(this.level.config.id).padStart(2, "0")} CLEAR`,
            GAME_WIDTH / 2,
            (GAME_HEIGHT / 2) - 80,
        );
        this.context.fillStyle = "#fff37a";
        this.context.font = 'bold 30px "Courier New", monospace';
        this.context.fillText("STELLAR ASSAULT // MISSION COMPLETE", GAME_WIDTH / 2, (GAME_HEIGHT / 2) - 20);
        this.context.fillStyle = this.player1.color;
        this.context.fillRect((GAME_WIDTH / 2) - 115, (GAME_HEIGHT / 2) + 12, 46, 12);
        this.context.fillRect((GAME_WIDTH / 2) - 65, (GAME_HEIGHT / 2) + 8, 28, 20);
        if (this.playerCount === 2) {
            this.context.fillStyle = this.player2.color;
            this.context.fillRect((GAME_WIDTH / 2) + 25, (GAME_HEIGHT / 2) + 12, 46, 12);
            this.context.fillRect((GAME_WIDTH / 2) + 42, (GAME_HEIGHT / 2) + 8, 28, 20);
        }
        this.context.fillStyle = "#f1f3ff";
        this.context.font = 'bold 24px "Courier New", monospace';
        this.context.fillText(`SCORE: ${String(this.score).padStart(6, "0")}`, GAME_WIDTH / 2, (GAME_HEIGHT / 2) + 45);
        const nextStage = this.levels[this.currentLevelIndex + 1];
        if (nextStage) {
            this.context.fillStyle = "#fff37a";
            this.context.font = 'bold 22px "Courier New", monospace';
            this.context.fillText("NEXT STAGE", GAME_WIDTH / 2, (GAME_HEIGHT / 2) + 88);
            this.context.fillStyle = "#f1f3ff";
            this.context.fillText(
                `STAGE ${String(nextStage.id).padStart(2, "0")} - ${nextStage.name.toUpperCase()}`,
                GAME_WIDTH / 2,
                (GAME_HEIGHT / 2) + 120,
            );
        }
        this.context.font = 'bold 20px "Courier New", monospace';
        this.context.fillText(
            `ENTER: PROXIMA FASE   AUTO: ${this.stageTransitionRemaining.toFixed(1)}s`,
            GAME_WIDTH / 2,
            (GAME_HEIGHT / 2) + 165,
        );
        this.context.textAlign = "left";
        this.context.textBaseline = "top";
    }

    drawCampaignClear() {
        this.context.fillStyle = "rgba(5, 5, 18, 0.92)";
        this.context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillStyle = "#59f6e8";
        this.context.font = 'bold 62px "Courier New", monospace';
        this.context.fillText("STELLAR ASSAULT", GAME_WIDTH / 2, 190);
        this.context.fillStyle = "#f1f3ff";
        this.context.font = 'bold 30px "Courier New", monospace';
        this.context.fillText("MISSION ACCOMPLISHED", GAME_WIDTH / 2, 255);
        this.context.fillStyle = "#fff37a";
        this.context.font = 'bold 36px "Courier New", monospace';
        this.context.fillText("GALAXY SECURED", GAME_WIDTH / 2, 320);
        this.context.fillStyle = this.player1.color;
        this.context.fillRect((GAME_WIDTH / 2) - 160, 370, 62, 16);
        this.context.fillRect((GAME_WIDTH / 2) - 126, 360, 34, 34);
        if (this.playerCount === 2) {
            this.context.fillStyle = this.player2.color;
            this.context.fillRect((GAME_WIDTH / 2) + 98, 370, 62, 16);
            this.context.fillRect((GAME_WIDTH / 2) + 126, 360, 34, 34);
        }
        this.context.fillStyle = "#f1f3ff";
        this.context.font = 'bold 28px "Courier New", monospace';
        this.context.fillText("FINAL SCORE", GAME_WIDTH / 2, 450);
        this.context.fillStyle = "#59f6e8";
        this.context.font = 'bold 46px "Courier New", monospace';
        this.context.fillText(String(this.score).padStart(6, "0"), GAME_WIDTH / 2, 505);
        this.context.fillStyle = "#f1f3ff";
        this.context.font = 'bold 24px "Courier New", monospace';
        this.context.fillText(`CAMPAIGN TIME: ${this.formatTime(this.campaignTime)}`, GAME_WIDTH / 2, 565);
        this.context.fillStyle = "#fff37a";
        this.context.fillText("PRESSIONE ENTER PARA VOLTAR AO MENU", GAME_WIDTH / 2, 665);
        this.context.textAlign = "left";
        this.context.textBaseline = "top";
    }

    drawGameOver() {
        this.context.fillStyle = "rgba(5, 5, 18, 0.82)";
        this.context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillStyle = "#ff5f7a";
        this.context.font = 'bold 64px "Courier New", monospace';
        this.context.fillText("GAME OVER", GAME_WIDTH / 2, (GAME_HEIGHT / 2) - 30);
        this.context.fillStyle = "#f1f3ff";
        this.context.font = 'bold 24px "Courier New", monospace';
        this.context.fillText(
            `STAGE ${String(this.currentStageNumber).padStart(2, "0")}   SCORE: ${String(this.score).padStart(6, "0")}`,
            GAME_WIDTH / 2,
            (GAME_HEIGHT / 2) + 45,
        );
        this.context.font = 'bold 20px "Courier New", monospace';
        this.context.fillText("PRESSIONE ENTER PARA VOLTAR AO MENU", GAME_WIDTH / 2, (GAME_HEIGHT / 2) + 95);
        this.context.textAlign = "left";
        this.context.textBaseline = "top";
    }

    formatTime(seconds) {
        const safeSeconds = Math.max(0, Math.floor(seconds));
        const minutes = Math.floor(safeSeconds / 60);
        const remainder = safeSeconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
    }

    toggleDebug() {
        this.debugEnabled = !this.debugEnabled;
        if (this.debugPanel) this.debugPanel.hidden = !this.debugEnabled;
        this.updateDebugPanel();
    }

    updateDebugPanel() {
        if (this.debugPanel && this.debugEnabled && typeof this.debugPanel.querySelector === "function") {
            const playerBulletCount = this.bullets.filter(
                (bullet) => bullet.owner === BULLET_OWNER.PLAYER,
            ).length;
            const enemyBulletCount = this.bullets.length - playerBulletCount;
            const boss = this.boss;
            const values = {
                fps: this.currentFps,
                mode: `${this.playerCount}P`,
                stage: `${String(this.currentStageNumber).padStart(2, "0")} - ${this.currentStage.name}`,
                stageState: this.level.state,
                stageProgress: `${this.level.progressPercent}%`,
                stageTime: this.formatTime(this.stageTime),
                campaignTime: this.formatTime(this.campaignTime),
                enemies: this.enemies.length,
                playerBullets: playerBulletCount,
                enemyBullets: enemyBulletCount,
                bossState: boss?.status || "-",
                bossHp: boss ? `${boss.health}/${boss.maxHealth}` : "-",
                bossAttack: boss?.attackId || "-",
                bossAttackState: boss?.attackStatus || "-",
                bossMinions: this.enemies.filter(
                    (enemy) => enemy.active && enemy.isBossMinion,
                ).length,
                developer: this.developerMode ? "ON" : "OFF",
                p1: `${Math.round(this.player1.x)}, ${Math.round(this.player1.y)} HP ${this.player1.health}`,
                p2: this.playerCount === 2
                    ? `${Math.round(this.player2.x)}, ${Math.round(this.player2.y)} HP ${this.player2.health}`
                    : "inactive",
            };

            Object.entries(values).forEach(([key, value]) => {
                const node = this.debugPanel.querySelector(`[data-debug="${key}"]`);
                if (node) node.textContent = value;
            });
        }

        if (this.statusElement) {
            if (this.gameState === GAME_STATES.MENU) {
                this.statusElement.textContent = "Menu principal - escolha o modo";
            } else if (this.gameState === GAME_STATES.GAME_OVER) {
                this.statusElement.textContent = `Game Over - Stage ${this.currentStageNumber}`;
            } else if (this.gameState === GAME_STATES.CAMPAIGN_CLEAR) {
                this.statusElement.textContent = "Campanha concluida - galaxia segura";
            } else if (this.gameState === GAME_STATES.STAGE_CLEAR) {
                this.statusElement.textContent = "Stage Clear - preparando proxima fase";
            } else {
                this.statusElement.textContent = `Stage ${String(this.currentStageNumber).padStart(2, "0")} - ${this.currentStage.name}`;
            }
        }
    }
}
