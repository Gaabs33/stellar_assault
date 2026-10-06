import { Bullet } from "./Bullet.js";
import {
    BOSS_BULLET_CONFIG,
    BOSS_CONFIG,
    BULLET_OWNER,
    GAME_HEIGHT,
    GAME_WIDTH,
    PLAY_AREA_BOTTOM_MARGIN,
    PLAY_AREA_TOP,
} from "../utils/constants.js";
import { MachineGunAttack } from "../systems/attacks/MachineGunAttack.js";
import { LaserAttack } from "../systems/attacks/LaserAttack.js";
import { SpreadShotAttack } from "../systems/attacks/SpreadShotAttack.js";
import { BurstShotAttack } from "../systems/attacks/BurstShotAttack.js";
import { DoubleLaserAttack } from "../systems/attacks/DoubleLaserAttack.js";
import { ProjectileWallAttack } from "../systems/attacks/ProjectileWallAttack.js";
import { SummonMinionsAttack } from "../systems/attacks/SummonMinionsAttack.js";
import { ChargeAttack } from "../systems/attacks/ChargeAttack.js";
import { getNormalizedDirection } from "../utils/Vector.js";

/**
 * Entidade base de boss. Ataques sao componentes configuraveis; a entidade
 * apenas agenda a sequencia e devolve projeteis/solicitacoes ao Game.
 */
export class Boss {
    constructor(config = BOSS_CONFIG, random = Math.random) {
        this.config = config;
        this.random = random;
        this.width = config.width;
        this.height = config.height;
        this.x = GAME_WIDTH + this.width;
        this.y = config.combatY;
        this.health = config.maxHealth;
        this.maxHealth = config.maxHealth;
        this.active = true;
        this.status = "entering";
        this.verticalDirection = 1;
        this.minY = config.minY ?? PLAY_AREA_TOP;
        const configuredMaxY = config.maxY
            ?? (GAME_HEIGHT - this.height - PLAY_AREA_BOTTOM_MARGIN);
        this.maxY = Math.max(
            this.minY,
            Math.min(configuredMaxY, GAME_HEIGHT - this.height - PLAY_AREA_BOTTOM_MARGIN),
        );

        this.machineGunAttack = config.machineGun
            ? new MachineGunAttack(config.machineGun)
            : null;
        this.spreadAttack = config.spreadShot
            ? new SpreadShotAttack(config.spreadShot)
            : null;
        this.laserAttack = config.laser
            ? new LaserAttack(config.laser)
            : null;
        this.burstAttack = config.burstShot
            ? new BurstShotAttack(config.burstShot)
            : null;
        this.doubleLaserAttack = config.doubleLaser
            ? new DoubleLaserAttack(config.doubleLaser)
            : null;
        this.projectileWallAttack = config.projectileWall
            ? new ProjectileWallAttack(config.projectileWall)
            : null;
        this.summonMinionsAttack = config.summonMinions
            ? new SummonMinionsAttack(config.summonMinions)
            : null;
        this.chargeAttack = config.chargeAttack
            ? new ChargeAttack(config.chargeAttack)
            : null;

        this.attackComponents = Object.freeze({
            machineGun: this.machineGunAttack,
            laser: this.laserAttack,
            spreadShot: this.spreadAttack,
            burstShot: this.burstAttack,
            doubleLaser: this.doubleLaserAttack,
            projectileWall: this.projectileWallAttack,
            summonMinions: this.summonMinionsAttack,
            chargeAttack: this.chargeAttack,
        });
        this.attackSequence = config.attackSequence || [];
        this.usesAttackDirector = this.attackSequence.length > 0;
        this.attackIndex = 0;
        this.attackCooldownRemaining = config.attackCooldown ?? 0.9;
        this.activeAttackId = null;
        this.lastAttackId = null;
        this.attackState = "idle";
        this.attackTargetY = 0;
        this.defeatTimeRemaining = 0;
        this.visualTime = 0;
        this.damageFlashRemaining = 0;
        this.turrets = config.turrets || [
            { x: 24, y: 28 },
            { x: 24, y: config.height - 36 },
        ];
    }

    get centerX() {
        return this.x + (this.width / 2);
    }

    get centerY() {
        return this.y + (this.height / 2);
    }

    get laserCannonY() {
        return this.y + (this.config.laser?.cannonOffsetY ?? (this.height / 2));
    }

    get laserCannonX() {
        return this.x + (this.config.laser?.cannonOffsetX ?? 0);
    }

    get isAlive() {
        return this.active && this.health > 0 && this.status !== "defeated";
    }

    get isLaserCharging() {
        return this.laserAttack?.isCharging === true;
    }

    get isLaserActive() {
        return this.laserAttack?.isFiring === true;
    }

    get isDoubleLaserCharging() {
        return this.doubleLaserAttack?.isCharging === true;
    }

    get isDoubleLaserActive() {
        return this.doubleLaserAttack?.isFiring === true;
    }

    get doubleLaserBeams() {
        return this.doubleLaserAttack?.getBeamYs(this) || [];
    }

    get doubleLaserHitPlayers() {
        return this.doubleLaserAttack?.hitPlayers || [];
    }

    get attackId() {
        return this.activeAttackId || this.lastAttackId || "idle";
    }

    get attackStatus() {
        if (
            this.isLaserCharging
            || this.isDoubleLaserCharging
            || this.chargeAttack?.isCharging
            || this.projectileWallAttack?.isCharging
        ) {
            return "CHARGING";
        }
        if (this.isLaserActive || this.isDoubleLaserActive) return "FIRING";
        return this.attackState.toUpperCase();
    }

    get livingPlayers() {
        return this._players ? this._players.filter((player) => player.isAlive) : [];
    }

    // Estas propriedades mantem a API simples usada pelo Game e pelos testes.
    get laserState() { return this.laserAttack?.state || "idle"; }
    set laserState(value) {
        if (!this.laserAttack) return;
        this.laserAttack.state = value === "active" ? "firing" : value;
    }
    get laserTimeRemaining() { return this.laserAttack?.timeRemaining || 0; }
    set laserTimeRemaining(value) { if (this.laserAttack) this.laserAttack.timeRemaining = value; }
    get laserCooldownRemaining() { return this.laserAttack?.cooldownRemaining || 0; }
    set laserCooldownRemaining(value) { if (this.laserAttack) this.laserAttack.cooldownRemaining = value; }
    get laserY() { return this.laserAttack?.laserY || 0; }
    set laserY(value) { if (this.laserAttack) this.laserAttack.laserY = value; }
    get laserHitPlayers() { return this.laserAttack?.hitPlayers || new Set(); }
    get machineGunCooldownRemaining() { return this.machineGunAttack?.cooldownRemaining || 0; }
    set machineGunCooldownRemaining(value) { if (this.machineGunAttack) this.machineGunAttack.cooldownRemaining = value; }
    get machineGunShotsRemaining() { return this.machineGunAttack?.shotsRemaining || 0; }
    set machineGunShotsRemaining(value) { if (this.machineGunAttack) this.machineGunAttack.shotsRemaining = value; }

    update(deltaTime, players) {
        this._players = players;
        this.visualTime += deltaTime;
        this.damageFlashRemaining = Math.max(0, this.damageFlashRemaining - deltaTime);
        const bullets = [];
        const result = {
            bullets,
            summons: [],
            stageClear: false,
            attackId: this.attackId,
            attackStarted: false,
            attackFired: false,
            attackFinished: false,
            laserFired: false,
            laserCharging: false,
            doubleLaserFired: false,
            doubleLaserCharging: false,
        };

        if (this.status === "defeated") {
            this.defeatTimeRemaining = Math.max(
                0,
                this.defeatTimeRemaining - deltaTime,
            );
            if (this.defeatTimeRemaining === 0) {
                this.status = "finished";
                this.active = false;
                result.stageClear = true;
            }
            return result;
        }

        if (!this.isAlive) return result;

        if (this.status === "entering") {
            this.x -= this.config.entrySpeed * deltaTime;
            if (this.x <= this.config.combatX) {
                this.x = this.config.combatX;
                this.status = "fighting";
            }
        }

        if (this.status !== "fighting") return result;

        const laserWasCharging = this.laserAttack?.isCharging === true;
        const laserWasFiring = this.laserAttack?.isFiring === true;
        const doubleLaserWasFiring = this.doubleLaserAttack?.isFiring === true;
        if (!laserWasFiring && !doubleLaserWasFiring) this.updateMovement(deltaTime);

        if (this.usesAttackDirector) {
            Object.assign(result, this.updateDirectedAttacks(deltaTime, bullets));
        } else {
            const laserResult = this.laserAttack?.update(deltaTime, this)
                || { activated: false, charging: false, finished: false };
            const laserBusy = laserWasCharging
                || laserWasFiring
                || this.laserAttack?.isCharging
                || this.laserAttack?.isFiring;
            if (!laserBusy) {
                this.machineGunAttack?.update(deltaTime, this, bullets);
                this.spreadAttack?.update(deltaTime, this, bullets);
            }
            result.attackId = this.isLaserCharging || this.isLaserActive
                ? "laser"
                : this.machineGunShotsRemaining > 0 ? "machineGun" : "idle";
            this.activeAttackId = result.attackId === "idle" ? null : result.attackId;
            if (result.attackId !== "idle") this.lastAttackId = result.attackId;
            this.attackState = result.attackId === "idle" ? "idle" : "active";
            result.laserFired = laserResult.activated;
            result.laserCharging = laserResult.charging;
            result.attackFired = result.laserFired || this.machineGunShotsRemaining > 0;
        }

        result.attackId = result.attackId || this.attackId;
        return result;
    }

    updateDirectedAttacks(deltaTime, bullets) {
        const result = {
            attackId: this.activeAttackId || this.lastAttackId || "idle",
            attackStarted: false,
            attackFired: false,
            attackFinished: false,
            laserFired: false,
            laserCharging: false,
            doubleLaserFired: false,
            doubleLaserCharging: false,
            summons: [],
        };

        if (!this.activeAttackId) {
            this.attackCooldownRemaining = Math.max(
                0,
                this.attackCooldownRemaining - deltaTime,
            );
            if (this.attackCooldownRemaining > 0) return result;

            const nextAttack = this.selectNextAttack();
            if (!nextAttack) return result;
            this.activeAttackId = nextAttack;
            this.lastAttackId = nextAttack;
            this.attackState = "active";
            this.getAttackComponent(nextAttack)?.start(this);
            if (nextAttack === "chargeAttack") {
                this.attackTargetY = this.chargeAttack?.target?.centerY ?? this.centerY;
            }
            result.attackId = nextAttack;
            result.attackStarted = true;
            return result;
        }

        const attackId = this.activeAttackId;
        const component = this.getAttackComponent(attackId);
        if (!component) {
            this.finishDirectedAttack(result);
            return result;
        }

        const componentResult = component.update(deltaTime, this, bullets) || {};
        result.attackId = attackId;
        result.attackFired = componentResult.fired === true;
        result.summons = componentResult.summons || [];
        result.laserFired = attackId === "laser" && componentResult.activated === true;
        result.doubleLaserFired = attackId === "doubleLaser" && componentResult.activated === true;
        result.laserCharging = attackId === "laser" && component.isCharging;
        result.doubleLaserCharging = attackId === "doubleLaser" && component.isCharging;

        if (componentResult.completed) this.finishDirectedAttack(result);
        return result;
    }

    selectNextAttack() {
        const available = this.attackSequence.filter((attackId) => this.getAttackComponent(attackId));
        if (available.length === 0) return null;
        for (let offset = 0; offset < available.length; offset += 1) {
            const index = (this.attackIndex + offset) % available.length;
            const attackId = available[index];
            if (available.length === 1 || attackId !== this.lastAttackId) {
                this.attackIndex = (index + 1) % available.length;
                return attackId;
            }
        }
        return available[0];
    }

    getAttackComponent(attackId) {
        return this.attackComponents[attackId] || null;
    }

    finishDirectedAttack(result) {
        this.activeAttackId = null;
        this.attackState = "cooldown";
        this.attackCooldownRemaining = this.config.attackCooldown ?? 0.9;
        result.attackFinished = true;
    }

    updateMovement(deltaTime) {
        this.y += this.verticalDirection * this.config.verticalSpeed * deltaTime;
        if (this.y <= this.minY) {
            this.y = this.minY;
            this.verticalDirection = 1;
        } else if (this.y >= this.maxY) {
            this.y = this.maxY;
            this.verticalDirection = -1;
        }
    }

    pickLivingPlayer() {
        const players = this.livingPlayers;
        if (players.length === 0) return null;
        return players[Math.min(
            players.length - 1,
            Math.floor(this.random() * players.length),
        )];
    }

    createMachineGunBullet(target, turretIndex) {
        const turret = this.turrets[turretIndex % this.turrets.length];
        const originX = this.x + turret.x;
        const originY = this.y + turret.y;
        const direction = getNormalizedDirection(
            originX,
            originY,
            target.centerX,
            target.centerY,
            -1,
            0,
        );

        return this.createBossBullet(
            originX,
            originY,
            direction.x,
            direction.y,
            this.config.machineGun || {},
            "bossMachineGun",
        );
    }

    createSpreadShot(target, config = {}) {
        const originX = this.x + (config.originX ?? 24);
        const originY = this.y + (config.originY ?? (this.height / 2));
        const baseAngle = Math.atan2(
            target.centerY - originY,
            target.centerX - originX,
        );
        const count = Math.max(1, Math.floor(config.count ?? 3));
        const spread = config.spread ?? 0.32;
        const step = count === 1 ? 0 : spread / (count - 1);
        const firstAngle = baseAngle - (spread / 2);

        return Array.from({ length: count }, (_, index) => {
            const angle = firstAngle + (step * index);
            return this.createBossBullet(
                originX,
                originY,
                Math.cos(angle),
                Math.sin(angle),
                config,
                "bossSpread",
            );
        });
    }

    createBurstBullet(target, index, config = {}) {
        const originX = this.x + (config.originX ?? 24);
        const originY = this.y + (config.originY ?? (this.height / 2));
        const direction = getNormalizedDirection(
            originX,
            originY,
            target.centerX,
            target.centerY,
            -1,
            0,
        );
        const baseAngle = Math.atan2(direction.y, direction.x);
        const spread = config.spread ?? 0.08;
        const angle = baseAngle + ((index % 2 === 0 ? -1 : 1) * spread);
        return this.createBossBullet(
            originX,
            originY,
            Math.cos(angle),
            Math.sin(angle),
            config,
            "bossBurst",
        );
    }

    createChargeBullet(target, config = {}) {
        const originX = this.x;
        const originY = this.y + (this.height / 2);
        const direction = getNormalizedDirection(
            originX,
            originY,
            target.centerX,
            target.centerY,
            -1,
            0,
        );
        const bullet = this.createBossBullet(
            originX,
            originY,
            direction.x,
            direction.y,
            { ...config, speedMultiplier: config.speedMultiplier ?? 1.35 },
            "bossCharge",
        );
        bullet.width *= 1.5;
        bullet.height *= 1.5;
        return bullet;
    }

    createProjectileWall(config = {}) {
        const count = Math.max(3, Math.floor(config.count ?? 6));
        const gapIndex = config.gapIndex ?? Math.floor(count / 2);
        const gapSize = Math.max(1, Math.floor(config.gapSize ?? 1));
        const bullets = [];
        for (let index = 0; index < count; index += 1) {
            if (index >= gapIndex && index < gapIndex + gapSize) continue;
            const y = this.getProjectileWallY(config, index);
            bullets.push(this.createBossBullet(
                this.x,
                y,
                -1,
                0,
                config,
                "bossWall",
            ));
        }
        return bullets;
    }

    getProjectileWallY(config = {}, index = 0) {
        const spacing = config.spacing ?? 72;
        const startY = config.startY ?? (PLAY_AREA_TOP + 70);
        return Math.max(
            PLAY_AREA_TOP,
            Math.min(
                GAME_HEIGHT - PLAY_AREA_BOTTOM_MARGIN - BOSS_BULLET_CONFIG.height,
                startY + (index * spacing),
            ),
        );
    }

    createBossBullet(originX, originY, directionX, directionY, config = {}, sourceType) {
        const bullet = new Bullet(
            originX - (BOSS_BULLET_CONFIG.width / 2),
            originY - (BOSS_BULLET_CONFIG.height / 2),
            directionX,
            directionY,
            BULLET_OWNER.BOSS,
            config.speedMultiplier ?? 1,
            null,
            sourceType,
        );
        if (config.damage !== undefined) bullet.damage = config.damage;
        if (sourceType === "bossSpread") {
            bullet.width *= 1.2;
            bullet.height *= 1.2;
        }
        return bullet;
    }

    takeDamage(amount) {
        if (!this.isAlive) return false;

        this.health = Math.max(0, this.health - amount);
        this.damageFlashRemaining = 0.12;
        if (this.health === 0) {
            this.status = "defeated";
            this.defeatTimeRemaining = this.config.defeatDuration;
            Object.values(this.attackComponents).forEach((attack) => attack?.cancel?.());
            this.activeAttackId = null;
            this.attackState = "defeated";
            return true;
        }
        return false;
    }

    draw(context) {
        if (!this.active) return;

        if (this.status === "defeated") {
            this.drawDefeat(context);
            return;
        }

        if (this.isLaserCharging || this.isLaserActive) {
            context.fillStyle = this.isLaserActive
                ? (this.config.laser?.color || "#ff526d")
                : (this.config.laser?.telegraphColor || "#ffcf4a");
            context.globalAlpha = this.isLaserActive
                ? 0.9
                : (this.laserTimeRemaining * 5) % 2 > 1 ? 0.9 : 0.25;
            context.fillRect(
                0,
                this.laserY - (this.config.laser.height / 2),
                Math.max(0, this.laserCannonX),
                this.config.laser.height,
            );
            context.globalAlpha = 1;
        }

        if (this.isDoubleLaserCharging || this.isDoubleLaserActive) {
            const config = this.config.doubleLaser;
            context.fillStyle = this.isDoubleLaserActive
                ? (config.color || "#ff7b5c")
                : (config.telegraphColor || "#fff37a");
            context.globalAlpha = this.isDoubleLaserActive
                ? 0.88
                : (this.doubleLaserAttack.timeRemaining * 5) % 2 > 1 ? 0.9 : 0.25;
            this.doubleLaserBeams.forEach((beamY) => {
                context.fillRect(
                    0,
                    beamY - ((config.height ?? 30) / 2),
                    Math.max(0, this.x),
                    config.height ?? 30,
                );
            });
            context.globalAlpha = 1;
        }

        if (this.activeAttackId === "projectileWall" && this.projectileWallAttack?.isCharging) {
            const config = this.config.projectileWall;
            const count = Math.max(3, Math.floor(config.count ?? 6));
            const gapIndex = config.gapIndex ?? Math.floor(count / 2);
            const gapSize = Math.max(1, Math.floor(config.gapSize ?? 1));
            context.fillStyle = "#ff7b5c";
            context.globalAlpha = 0.3;
            for (let index = 0; index < count; index += 1) {
                if (index >= gapIndex && index < gapIndex + gapSize) continue;
                context.fillRect(
                    this.x - 30,
                    this.getProjectileWallY(config, index),
                    22,
                    BOSS_BULLET_CONFIG.height,
                );
            }
            context.globalAlpha = 1;
        }

        if (this.activeAttackId === "chargeAttack" && this.chargeAttack?.isCharging) {
            context.fillStyle = this.config.chargeAttack?.telegraphColor || "#ffcf4a";
            context.globalAlpha = 0.28;
            context.fillRect(0, this.attackTargetY - 4, Math.max(0, this.x), 8);
            context.globalAlpha = 1;
        }

        this.drawBossArt(context);
        return;

    }

    /**
     * Cada perfil usa uma construção diferente de casco. As peças são blocos
     * em degraus, como sprites de arcade ampliados, e não uma caixa colorida.
     */
    drawBossArt(context) {
        const x = Math.round(this.x);
        const y = Math.round(this.y);
        const w = Math.round(this.width);
        const h = Math.round(this.height);
        const flashing = this.damageFlashRemaining > 0
            && Math.floor(this.damageFlashRemaining * 60) % 2 === 0;
        const body = flashing ? "#ffffff" : (this.config.bodyColor || "#8c70d9");
        const armor = flashing ? "#f1f3ff" : (this.config.accentColor || "#3f2b78");
        const core = this.config.coreColor || "#59f6e8";
        const dark = "#090d20";
        const steel = "#b8c7d9";
        const hot = this.isLaserCharging || this.isDoubleLaserCharging ? "#ff5f7a" : core;
        const pulse = Math.floor(this.visualTime * 8) % 2;
        const rect = (rx, ry, rw, rh, color) => {
            context.fillStyle = color;
            context.fillRect(
                Math.round(x + rx),
                Math.round(y + ry),
                Math.max(1, Math.round(rw)),
                Math.max(1, Math.round(rh)),
            );
        };
        const plate = (rx, ry, rw, rh, color = body) => {
            rect(rx + 3, ry + 3, rw - 6, rh - 6, dark);
            rect(rx + 4, ry + 4, rw - 8, rh - 8, color);
            rect(rx + 7, ry + 5, Math.max(2, rw - 15), 3, steel);
        };
        const engine = (rx, ry, rw = 22, rh = 18, color = "#ff9f43") => {
            rect(rx, ry, rw, rh, dark);
            rect(rx + 4, ry + 4, rw - 8, rh - 8, armor);
            rect(rx + rw - 5, ry + 6, 5, rh - 12, pulse ? "#fff37a" : color);
        };
        const light = (rx, ry, rw = 7, rh = 5, color = core) => {
            rect(rx, ry, rw, rh, dark);
            rect(rx + 2, ry + 1, Math.max(2, rw - 3), Math.max(2, rh - 2), color);
        };
        const cannon = (rx, ry, color = core, length = 32) => {
            rect(rx, ry, length, 12, dark);
            rect(rx - 3, ry + 3, length + 3, 6, armor);
            rect(rx - 7, ry + 4, 8, 4, color);
            light(rx + length - 8, ry + 3, 6, 6, color);
        };

        switch (this.config.id) {
        case "dreadnought":
            // Casco militar com ponte, blindagem frontal e quatro motores.
            plate(28, 24, w - 64, h - 48, body);
            plate(52, 12, w - 130, h - 24, armor);
            rect(2, 48, 44, 74, armor);
            rect(12, 36, 28, 98, body);
            rect(76, 38, 76, 94, dark);
            rect(84, 30, 54, 18, steel);
            rect(94, 36, 35, 24, core);
            rect(100, 39, 22, 10, "#d7f1ff");
            cannon(8, 28, core, 38);
            cannon(8, h - 40, core, 38);
            cannon(66, 4, "#ffcf4a", 28);
            cannon(66, h - 16, "#ffcf4a", 28);
            [22, 58, 94, 130].forEach((engineY) => engine(w - 36, engineY, 30, 20, "#ff9f43"));
            [57, 72, 87, 102].forEach((lightX) => light(lightX, h / 2 - 3, 6, 6, core));
            break;
        case "asteroidCrusher":
            // Máquina industrial com broca frontal e núcleo em anéis.
            rect(62, 28, w - 88, h - 56, dark);
            plate(76, 20, w - 118, h - 40, body);
            plate(112, 35, 88, h - 70, armor);
            rect(8, 48, 68, 58, dark);
            rect(0, 58, 20, 38, steel);
            rect(16, 48, 14, 58, body);
            rect(28, 40, 15, 74, armor);
            rect(40, 32, 16, 90, steel);
            rect(56, 46, 16, 62, body);
            rect(96, 54, 54, 48, "#5b3d32");
            rect(108, 62, 34, 32, core);
            rect(116, 70, 18, 16, "#ff315b");
            [18, 42, 66, 90, 114].forEach((pipeY) => rect(188, pipeY, 52, 7, "#c08b52"));
            cannon(224, 42, "#ffcf4a", 42);
            cannon(224, h - 54, "#ffcf4a", 42);
            engine(w - 42, 50, 28, 22, "#ff7b5c");
            engine(w - 42, h - 72, 28, 22, "#ff7b5c");
            break;
        case "nebulaWraith":
            // Interceptor alienígena com asas curvas e cauda luminosa.
            rect(72, 34, 112, h - 68, dark);
            plate(92, 24, 84, h - 48, body);
            rect(112, 52, 48, h - 104, core);
            rect(124, 66, 24, h - 132, "#d6fff0");
            rect(34, 22, 58, 18, armor);
            rect(18, 34, 70, 16, body);
            rect(2, 48, 72, 15, armor);
            rect(18, h - 50, 70, 16, body);
            rect(2, h - 63, 72, 15, armor);
            rect(178, 38, 34, 18, body);
            rect(188, 52, 42, 16, armor);
            rect(178, h - 56, 34, 18, body);
            rect(188, h - 68, 42, 16, armor);
            [32, 58, 84, 110, 136].forEach((lightY) => light(56, lightY, 9, 6, core));
            cannon(8, h / 2 - 7, hot, 46);
            engine(198, 72, 26, 18, "#59f6e8");
            engine(198, h - 90, 26, 18, "#59f6e8");
            break;
        case "fleetCommander":
            // Carrier de comando com hangares e pods laterais independentes.
            plate(74, 36, 178, h - 72, body);
            plate(106, 18, 112, h - 36, armor);
            rect(124, 32, 70, 34, dark);
            rect(134, 38, 48, 20, core);
            rect(140, 42, 36, 9, "#d7f1ff");
            [0, 1].forEach((index) => {
                const podY = index === 0 ? 20 : h - 52;
                plate(24, podY, 86, 32, body);
                rect(36, podY + 11, 50, 8, "#193a5b");
                cannon(4, podY + 9, "#ffcf4a", 30);
                light(52, podY + 7, 8, 6, core);
                light(68, podY + 19, 8, 6, core);
            });
            rect(92, h / 2 - 20, 126, 40, dark);
            rect(104, h / 2 - 11, 102, 22, body);
            [118, 142, 166, 190].forEach((lightX) => light(lightX, h / 2 - 3, 8, 6, "#ffcf4a"));
            rect(250, 20, 22, h - 40, armor);
            rect(272, 36, 20, h - 72, body);
            engine(w - 30, 45, 22, 20, "#ff9f43");
            engine(w - 30, h - 65, 22, 20, "#ff9f43");
            break;
        case "planetBreaker":
            // Nave de guerra com foices e dois emissores de Double Laser.
            plate(58, 54, w - 104, h - 108, body);
            rect(94, 72, 112, h - 144, armor);
            rect(124, 78, 54, h - 156, dark);
            rect(140, 88, 22, h - 176, core);
            rect(146, 96, 10, h - 192, "#fff37a");
            rect(28, 30, 88, 18, body);
            rect(8, 16, 82, 15, armor);
            rect(0, 4, 60, 12, "#c37b50");
            rect(30, h - 48, 86, 18, body);
            rect(8, h - 32, 82, 15, armor);
            rect(0, h - 16, 60, 12, "#c37b50");
            cannon(6, 38, "#ff7b5c", 58);
            cannon(6, h - 50, "#ff7b5c", 58);
            [70, 94, 118, 190].forEach((engineX) => engine(engineX, h / 2 - 8, 25, 18, "#ff9f43"));
            break;
        case "scrapTitan":
            // Titã recuperado, assimétrico, com placas, tubos e sucata exposta.
            plate(62, 28, w - 94, h - 56, body);
            plate(94, 50, 104, h - 84, armor);
            rect(112, 68, 60, 44, "#111a29");
            rect(128, 78, 30, 24, core);
            rect(136, 84, 16, 12, "#fff37a");
            plate(18, 12, 68, 38, "#7b8586");
            plate(12, h - 48, 78, 40, "#4d5962");
            plate(208, 20, 76, 46, "#9a7655");
            plate(222, h - 64, 54, 52, "#4d5962");
            rect(36, 46, 8, h - 86, "#c08b52");
            rect(46, 56, 8, h - 100, "#c08b52");
            rect(184, 26, 10, 58, "#c08b52");
            cannon(0, 66, "#ffcf4a", 48);
            cannon(218, h / 2 - 6, "#ff7b5c", 50);
            engine(w - 38, 30, 30, 24, "#ff9f43");
            engine(w - 54, h - 54, 30, 24, "#59f6e8");
            break;
        case "ionSerpent":
            // Corpo segmentado biomecânico, quase uma criatura de energia.
            [0, 34, 68, 102, 136].forEach((segment, index) => {
                const segmentY = 30 + ((index % 2) * 18);
                plate(segment + 42, segmentY, 54, h - segmentY - 28, index % 2 ? body : armor);
                light(segment + 62, segmentY + 18, 12, 7, core);
            });
            rect(178, 42, 64, 60, dark);
            rect(188, 50, 46, 44, body);
            rect(198, 60, 26, 24, core);
            rect(204, 66, 14, 12, "#d6fff0");
            [10, 28, 46, 64, 82, 100].forEach((energyY) => rect(28, energyY, 18, 4, "#59f6e8"));
            rect(8, 16, 32, 10, armor);
            rect(8, h - 26, 32, 10, armor);
            cannon(0, h / 2 - 6, hot, 42);
            engine(w - 20, 58, 20, 22, "#59f6e8");
            break;
        case "stationGuardian":
            // Plataforma defensiva com torres, radar e hangares.
            rect(32, 54, w - 64, h - 108, dark);
            plate(60, 62, w - 120, h - 124, body);
            [18, 82, 146, 210, 274].forEach((towerX, index) => {
                const towerH = index % 2 === 0 ? 60 : 86;
                rect(towerX, 30, 24, towerH, armor);
                rect(towerX + 5, 38, 14, towerH - 16, body);
                cannon(towerX - 4, 16, core, 28);
                light(towerX + 7, 48, 8, 6, "#fff37a");
            });
            rect(94, 76, 144, 34, "#182b3d");
            rect(108, 84, 116, 18, core);
            rect(124, 88, 84, 8, "#d7f1ff");
            rect(78, h - 38, 178, 12, armor);
            engine(w - 50, 70, 34, 22, "#59f6e8");
            engine(w - 50, h - 92, 34, 22, "#59f6e8");
            break;
        case "mothershipShield":
            // Fortaleza com módulos laterais e projetor de escudo central.
            plate(78, 28, w - 126, h - 56, body);
            plate(112, 48, w - 190, h - 96, armor);
            [0, 1].forEach((index) => {
                const moduleY = index === 0 ? 8 : h - 52;
                plate(16, moduleY, 92, 44, armor);
                rect(28, moduleY + 12, 62, 16, body);
                [36, 54, 72].forEach((lightX) => light(lightX, moduleY + 17, 7, 5, core));
                cannon(0, moduleY + 16, "#ef6bff", 30);
            });
            rect(142, 62, 80, h - 124, dark);
            rect(158, 76, 48, h - 152, core);
            rect(170, 90, 24, h - 180, "#f1f3ff");
            rect(94, 26, 180, 10, "#bd5c70");
            rect(94, h - 36, 180, 10, "#bd5c70");
            engine(w - 46, 68, 32, 24, "#ef6bff");
            engine(w - 46, h - 92, 32, 24, "#ef6bff");
            break;
        case "overlordCore":
            // Núcleo alienígena final: lâminas, asas e um coração vertical.
            rect(136, 18, 90, h - 36, dark);
            plate(150, 32, 64, h - 64, steel);
            rect(168, 48, 28, h - 96, "#2b313e");
            rect(176, 58, 12, h - 116, "#ff9f43");
            rect(178, 72, 8, h - 144, "#fff37a");
            rect(80, 42, 70, 20, armor);
            rect(68, 58, 86, 16, body);
            rect(54, 74, 100, 14, steel);
            rect(42, 90, 112, 12, armor);
            rect(226, 42, 70, 20, armor);
            rect(226, 58, 86, 16, body);
            rect(226, 74, 100, 14, steel);
            rect(226, 90, 112, 12, armor);
            rect(18, 22, 50, 12, steel);
            rect(0, 12, 42, 10, body);
            rect(18, h - 34, 50, 12, steel);
            rect(0, h - 22, 42, 10, body);
            [92, 116, 244, 268].forEach((cannonX) => cannon(cannonX, 12, core, 36));
            [100, 126, 236, 262].forEach((engineX) => engine(engineX, h - 26, 22, 18, "#ff9f43"));
            [88, 112, 224, 248].forEach((lightX) => light(lightX, h / 2 - 3, 8, 6, core));
            break;
        default:
            plate(24, 20, w - 48, h - 40, body);
            cannon(4, h / 2 - 6, core, 38);
            engine(w - 40, 28, 28, 20);
            engine(w - 40, h - 48, 28, 20);
            light(w / 2 - 12, h / 2 - 8, 24, 16, core);
        }
    }

    drawDefeat(context) {
        const pulse = Math.max(0, this.defeatTimeRemaining / this.config.defeatDuration);
        context.fillStyle = "#fff37a";
        context.fillRect(this.x - 20, this.y + 20, this.width + 40, 8);
        context.fillRect(this.x + 35, this.y - 18, 8, this.height + 36);
        context.fillStyle = "#ff5f7a";
        context.globalAlpha = pulse;
        context.fillRect(this.x + 45, this.y + 25, this.width - 90, this.height - 50);
        context.globalAlpha = 1;
    }
}
