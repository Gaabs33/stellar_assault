/** Efeitos curtos de feedback; não participam de colisões ou gameplay. */
export class EffectsSystem {
    constructor(random = Math.random) {
        this.random = random;
        this.effects = [];
        this.shakeTimeRemaining = 0;
        this.shakeDuration = 0;
        this.shakeIntensity = 0;
    }

    reset() {
        this.effects.length = 0;
        this.shakeTimeRemaining = 0;
        this.shakeDuration = 0;
        this.shakeIntensity = 0;
    }

    addExplosion(x, y, options = {}) {
        const duration = Math.max(0.01, options.duration ?? 0.45);
        const particleCount = options.particleCount ?? 10;
        const palette = options.palette || ["#fff37a", "#ffcf4a", "#ff9f43", "#ff5f7a", "#3a1831"];
        this.effects.push({
            type: "explosion",
            x,
            y,
            timeRemaining: duration,
            duration,
            color: options.color || "#fff37a",
            particles: Array.from({ length: particleCount }, (_, index) => ({
                angle: (Math.PI * 2 * index) / particleCount,
                speed: 35 + (this.random() * 85),
                size: 3 + Math.floor(this.random() * 5),
                color: palette[index % palette.length],
            })),
        });
    }

    triggerShake(intensity = 3, duration = 0.18) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
        this.shakeTimeRemaining = Math.max(this.shakeTimeRemaining, duration);
    }

    update(deltaTime) {
        this.effects.forEach((effect) => {
            effect.timeRemaining -= deltaTime;
        });
        this.effects = this.effects.filter((effect) => effect.timeRemaining > 0);

        this.shakeTimeRemaining = Math.max(0, this.shakeTimeRemaining - deltaTime);
        if (this.shakeTimeRemaining === 0) {
            this.shakeIntensity = 0;
            this.shakeDuration = 0;
        }
    }

    getShakeOffset() {
        if (this.shakeTimeRemaining <= 0) return { x: 0, y: 0 };
        const strength = this.shakeIntensity * (this.shakeTimeRemaining / this.shakeDuration);
        return {
            x: (this.random() * 2 - 1) * strength,
            y: (this.random() * 2 - 1) * strength,
        };
    }

    draw(context) {
        this.effects.forEach((effect) => {
            if (effect.type !== "explosion") return;
            const progress = 1 - (effect.timeRemaining / effect.duration);
            const alpha = Math.max(0, 1 - progress);
            const coreSize = Math.max(2, Math.floor(12 * (1 - progress)));
            const pixel = (value) => Math.round(value);
            context.fillStyle = "#fff37a";
            context.globalAlpha = alpha * 0.8;
            context.fillRect(
                pixel(effect.x - (coreSize / 2)),
                pixel(effect.y - (coreSize / 2)),
                coreSize,
                coreSize,
            );
            effect.particles.forEach((particle) => {
                const distance = particle.speed * progress;
                context.fillStyle = particle.color || effect.color;
                context.globalAlpha = alpha;
                context.fillRect(
                    pixel(effect.x + (Math.cos(particle.angle) * distance)),
                    pixel(effect.y + (Math.sin(particle.angle) * distance)),
                    Math.max(1, pixel(particle.size)),
                    Math.max(1, pixel(particle.size)),
                );
            });
        });
        context.globalAlpha = 1;
    }
}
