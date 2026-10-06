/**
 * Expande eventos de onda em uma fila ordenada de spawns.
 * Cada item preserva tipo, intervalo e metadados opcionais de posicionamento.
 */
export class WaveSystem {
    constructor(defaultInterval = 0.35) {
        this.defaultInterval = defaultInterval;
        this.queue = [];
        this.timer = 0;
    }

    get pendingCount() {
        return this.queue.length;
    }

    reset() {
        this.queue.length = 0;
        this.timer = 0;
    }

    queueEvent(event) {
        if (!event || (event.type && event.type !== "wave")) return;

        if (Array.isArray(event.enemies)) {
            event.enemies.forEach((group) => {
                const count = Math.max(0, Math.floor(group.count || 0));
                for (let index = 0; index < count; index += 1) {
                    this.queue.push({
                        type: group.enemyType || group.type,
                        interval: group.interval ?? event.interval ?? this.defaultInterval,
                        y: group.y,
                        position: group.position,
                        pattern: group.pattern,
                    });
                }
            });
        } else {
            // Compatibilidade com eventos da primeira versão do Stage 01.
            this.queueLegacyType(event, "normal", event.normal || 0);
            this.queueLegacyType(event, "strong", event.strong || 0);
        }

        if (this.timer <= 0 && this.queue.length > 0) this.timer = 0.01;
    }

    queueLegacyType(event, type, count) {
        for (let index = 0; index < count; index += 1) {
            this.queue.push({
                type,
                interval: event.interval ?? this.defaultInterval,
            });
        }
    }

    update(deltaTime, onSpawn) {
        if (this.queue.length === 0) return;

        this.timer -= deltaTime;
        while (this.queue.length > 0 && this.timer <= 0) {
            const item = this.queue.shift();
            onSpawn(item);
            this.timer += Math.max(0.01, item.interval ?? this.defaultInterval);
        }
    }
}
