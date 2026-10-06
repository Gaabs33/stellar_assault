import {
    LEVEL_CONFIG,
    LEVEL_STATES,
} from "../utils/constants.js";

/**
 * Controla a progressao virtual de qualquer fase configurada.
 *
 * A classe nao conhece Stage 01, nomes de eventos ou tipos de inimigo. Ela
 * apenas compara distancia com eventos ordenados e informa ao Game quando um
 * evento deve ser executado. Eventos disparados ficam em um Set, em vez de
 * exigir uma flag wave25Triggered para cada fase.
 */
export class Level {
    constructor(config = LEVEL_CONFIG[0]) {
        this.config = config;
        this.reset();
    }

    reset() {
        this.levelDistance = 0;
        this.levelMaxDistance = this.config.maxDistance;
        this.state = LEVEL_STATES.LEVEL_PLAYING;
        this.warningTimeRemaining = 0;
        this.triggeredEvents = new Set();
    }

    get progressRatio() {
        return Math.max(
            0,
            Math.min(1, this.levelDistance / this.levelMaxDistance),
        );
    }

    get progressPercent() {
        return Math.round(this.progressRatio * 100);
    }

    /** Retorna eventos com status sem alterar a configuração original. */
    get events() {
        return (this.config.events || []).map((event, index) => ({
            ...event,
            eventId: event.id || event.flag || `event-${index}`,
            triggered: this.triggeredEvents.has(event.id || event.flag || `event-${index}`),
        }));
    }

    get spawnSettings() {
        const phases = this.config.spawnPhases || [];
        const phase = phases.find(
            (spawnPhase) => this.progressRatio < spawnPhase.until,
        );
        if (phase) return this.withDifficulty(phase);

        const rate = Math.max(0.01, this.config.enemySpawnRate || 0.5);
        return this.withDifficulty({
            interval: 1 / rate,
            normalChance: this.config.normalSpawnChance ?? 0.7,
            enemyWeights: this.config.enemyWeights,
        });
    }

    withDifficulty(settings) {
        return {
            ...settings,
            enemyWeights: settings.enemyWeights || this.config.enemyWeights,
            difficultyMultiplier: this.config.difficultyMultiplier || 1,
        };
    }

    /** Avanca para o proximo marco de onda; usado apenas pelo Developer Mode. */
    skipToNextCheckpoint() {
        const nextEvent = (this.config.events || [])
            .filter((event, index) => {
                const eventId = event.id || event.flag || `event-${index}`;
                const progress = event.progress ?? event.threshold ?? 1;
                return !this.triggeredEvents.has(eventId) && progress > this.progressRatio;
            })
            .sort((first, second) => (
                (first.progress ?? first.threshold ?? 1)
                - (second.progress ?? second.threshold ?? 1)
            ))[0];

        const nextProgress = nextEvent
            ? (nextEvent.progress ?? nextEvent.threshold ?? 1)
            : 1;
        this.levelDistance = Math.min(
            this.levelMaxDistance,
            Math.max(this.levelDistance, this.levelMaxDistance * nextProgress),
        );
        return nextProgress;
    }

    /**
     * Atualiza distancia e retorna a transicao para boss quando aplicavel.
     * `activeEnemyCount` deve incluir inimigos na tela e na fila de ondas.
     */
    update(deltaTime, activeEnemyCount, onEvent = () => {}) {
        const result = {
            bossReady: false,
            warningStarted: false,
        };

        let reachedEndThisFrame = false;

        if (this.state === LEVEL_STATES.LEVEL_PLAYING) {
            this.levelDistance = Math.min(
                this.levelMaxDistance,
                this.levelDistance + (this.config.scrollSpeed * deltaTime),
            );

            (this.config.events || []).forEach((event, index) => {
                const progress = event.progress ?? event.threshold ?? 1;
                const eventId = event.id || event.flag || `event-${index}`;
                if (this.triggeredEvents.has(eventId) || this.progressRatio < progress) return;

                this.triggeredEvents.add(eventId);
                onEvent({ ...event, eventId, progress });
            });

            if (this.levelDistance >= this.levelMaxDistance) {
                this.state = LEVEL_STATES.LEVEL_CLEARING;
                reachedEndThisFrame = true;
            }
        }

        if (this.state === LEVEL_STATES.LEVEL_CLEARING && activeEnemyCount === 0 && !reachedEndThisFrame) {
            this.state = LEVEL_STATES.BOSS_WARNING;
            this.warningTimeRemaining = this.config.warningDuration ?? 2.5;
            result.warningStarted = true;
        } else if (this.state === LEVEL_STATES.BOSS_WARNING) {
            this.warningTimeRemaining = Math.max(
                0,
                this.warningTimeRemaining - deltaTime,
            );

            if (this.warningTimeRemaining === 0) {
                this.state = LEVEL_STATES.BOSS_FIGHT;
                result.bossReady = true;
            }
        }

        return result;
    }

    markStageClear() {
        this.state = LEVEL_STATES.STAGE_CLEAR;
    }
}
