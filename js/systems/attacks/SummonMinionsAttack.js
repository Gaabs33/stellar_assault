/** Solicita uma pequena onda ao Game, que aplica o limite de minions vivos. */
export class SummonMinionsAttack {
    constructor(config = {}) {
        this.config = config;
        this.emitted = false;
    }

    reset() {
        this.emitted = false;
    }

    start() {
        this.emitted = false;
    }

    update() {
        if (this.emitted) return { completed: true, fired: false, summons: [] };
        this.emitted = true;
        return {
            completed: true,
            fired: true,
            summons: (this.config.minions || []).map((minion) => ({ ...minion })),
        };
    }

    cancel() {
        this.reset();
    }
}
