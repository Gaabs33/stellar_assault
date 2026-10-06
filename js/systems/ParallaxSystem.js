/**
 * Gera e move camadas geometricas reutilizaveis. Nenhuma camada cresce depois
 * da inicializacao: estrelas que saem pela esquerda reaparecem pela direita.
 */
export class ParallaxSystem {
    constructor(width = 1440, height = 810, random = Math.random) {
        this.width = width;
        this.height = height;
        this.random = random;
        this.elapsed = 0;
        this.layers = [
            this.createLayer(48, 0.12, 1, "#6875a8"),
            this.createLayer(34, 0.28, 2, "#9aa8e8"),
            this.createLayer(22, 0.55, 3, "#f1f3ff"),
        ];
    }

    createLayer(count, speedMultiplier, maxSize, color) {
        return {
            speedMultiplier,
            color,
            stars: Array.from({ length: count }, () => ({
                x: Math.floor(this.random() * this.width),
                y: Math.floor(this.random() * this.height),
                size: 1 + Math.floor(this.random() * maxSize),
            })),
        };
    }

    reset() {
        this.elapsed = 0;
        this.layers.forEach((layer) => {
            layer.stars.forEach((star) => {
                star.x = Math.floor(this.random() * this.width);
                star.y = Math.floor(this.random() * this.height);
            });
        });
    }

    update(deltaTime, baseSpeed) {
        this.elapsed += deltaTime;
        this.layers.forEach((layer) => {
            layer.stars.forEach((star) => {
                star.x -= baseSpeed * layer.speedMultiplier * deltaTime;
                if (star.x + star.size < 0) star.x = this.width + star.size;
            });
        });
    }

    draw(context, backgroundType = "space", progressRatio = 0) {
        const backgroundColor = {
            space: "#050512",
            asteroid: "#111322",
            nebula: "#160d2b",
            fleet: "#101a27",
            planet: "#17152a",
            debris: "#19131a",
            electric: "#071c25",
            station: "#141422",
            mothership: "#1d101b",
            ion: "#071c25",
            final: "#240b18",
            finalAssault: "#240b18",
        }[backgroundType] || "#050512";

        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, this.width, this.height);
        this.layers.forEach((layer) => {
            context.fillStyle = layer.color;
            layer.stars.forEach((star) => {
                context.fillRect(star.x, star.y, star.size, star.size);
            });
        });
        this.drawThemeDecorations(context, backgroundType, progressRatio);
    }

    drawMenu(context) {
        const pulse = 0.5 + (Math.sin(this.elapsed * 1.8) * 0.12);
        context.fillStyle = "#07091d";
        context.fillRect(0, 0, this.width, this.height);
        context.fillStyle = "#171a4a";
        context.globalAlpha = pulse;
        context.fillRect(140, 120, 440, 210);
        context.fillRect(860, 430, 420, 190);
        context.fillStyle = "#3a276e";
        context.fillRect(650, 60, 300, 160);
        context.globalAlpha = 1;
        context.globalAlpha = 0.42;
        this.drawPlanet(context, 1020, 128, 230, {
            base: "#31517a",
            highlight: "#59f6e8",
            shadow: "#11142f",
        });
        context.globalAlpha = 1;
        this.layers.forEach((layer, layerIndex) => {
            context.fillStyle = layerIndex === 2 ? "#f1f3ff" : layer.color;
            layer.stars.forEach((star) => {
                const twinkle = layerIndex === 2 && Math.floor(this.elapsed * 5 + star.x) % 3 === 0;
                context.globalAlpha = twinkle ? 0.45 : 1;
                context.fillRect(star.x, star.y, star.size, star.size);
            });
        });
        context.globalAlpha = 0.7;
        context.fillStyle = "#59f6e8";
        context.fillRect(0, 690, this.width, 2);
        context.fillStyle = "#ff5f7a";
        context.fillRect(0, 694, this.width, 1);
        context.globalAlpha = 1;
    }

    drawAsteroid(context, x, y, size, colors = {}) {
        const s = Math.max(12, Math.floor(size));
        const pixel = (value) => Math.round(value);
        const base = colors.base || "#59657e";
        const shade = colors.shade || "#303952";
        const highlight = colors.highlight || "#8b9ab4";
        context.fillStyle = shade;
        context.fillRect(pixel(x + (s * 0.18)), pixel(y), pixel(s * 0.55), pixel(s * 0.16));
        context.fillRect(pixel(x), pixel(y + (s * 0.18)), pixel(s * 0.86), pixel(s * 0.55));
        context.fillRect(pixel(x + (s * 0.18)), pixel(y + (s * 0.7)), pixel(s * 0.58), pixel(s * 0.2));
        context.fillStyle = base;
        context.fillRect(pixel(x + (s * 0.24)), pixel(y + (s * 0.12)), pixel(s * 0.52), pixel(s * 0.58));
        context.fillRect(pixel(x + (s * 0.1)), pixel(y + (s * 0.3)), pixel(s * 0.66), pixel(s * 0.3));
        context.fillStyle = highlight;
        context.fillRect(pixel(x + (s * 0.32)), pixel(y + (s * 0.2)), pixel(s * 0.18), pixel(s * 0.12));
        context.fillRect(pixel(x + (s * 0.58)), pixel(y + (s * 0.42)), pixel(s * 0.12), pixel(s * 0.1));
    }

    drawPlanet(context, x, y, size, colors = {}) {
        const s = Math.max(80, Math.floor(size));
        const pixel = (value) => Math.round(value);
        const shadow = colors.shadow || "#2d1d45";
        const base = colors.base || "#6e4966";
        const highlight = colors.highlight || "#c27a61";
        context.fillStyle = shadow;
        context.fillRect(pixel(x + (s * 0.18)), pixel(y), pixel(s * 0.58), pixel(s * 0.1));
        context.fillRect(pixel(x), pixel(y + (s * 0.1)), pixel(s * 0.86), pixel(s * 0.72));
        context.fillRect(pixel(x + (s * 0.18)), pixel(y + (s * 0.82)), pixel(s * 0.58), pixel(s * 0.1));
        context.fillStyle = base;
        context.fillRect(pixel(x + (s * 0.16)), pixel(y + (s * 0.08)), pixel(s * 0.58), pixel(s * 0.76));
        context.fillRect(pixel(x + (s * 0.08)), pixel(y + (s * 0.25)), pixel(s * 0.7), pixel(s * 0.42));
        context.fillStyle = highlight;
        context.fillRect(pixel(x + (s * 0.22)), pixel(y + (s * 0.2)), pixel(s * 0.5), pixel(s * 0.12));
        context.fillRect(pixel(x + (s * 0.3)), pixel(y + (s * 0.36)), pixel(s * 0.2), pixel(s * 0.08));
        context.fillStyle = shadow;
        context.fillRect(pixel(x + (s * 0.62)), pixel(y + (s * 0.42)), pixel(s * 0.24), pixel(s * 0.22));
    }

    drawThemeDecorations(context, backgroundType, progressRatio = 0) {
        const drift = Math.floor(this.elapsed * 40);
        context.globalAlpha = 0.28;

        if (backgroundType === "asteroid") {
            [0, 1, 2, 3].forEach((index) => {
                const x = ((index * 390) - drift) % (this.width + 160);
                const wrappedX = x < -80 ? x + this.width + 160 : x;
                const y = 150 + ((index * 137) % 460);
                this.drawAsteroid(context, wrappedX, y - 20, 72 + (index * 12), {
                    base: "#59657e",
                    shade: "#303952",
                    highlight: "#8b9ab4",
                });
            });
        } else if (backgroundType === "nebula") {
            context.fillStyle = "#9a4fbb";
            context.fillRect(180, 180, 280, 150);
            context.fillRect(760, 420, 360, 180);
            context.fillStyle = "#3c83b8";
            context.fillRect(520, 130, 190, 120);
        } else if (backgroundType === "fleet") {
            context.fillStyle = "#325272";
            [180, 430, 690].forEach((y, index) => {
                const x = this.width - ((drift * (index + 1)) % (this.width + 420));
                context.fillRect(x, y, 300, 48);
                context.fillRect(x + 70, y - 22, 150, 92);
            });
        } else if (backgroundType === "planet") {
            this.drawPlanet(context, 850, 170, 420, {
                base: "#6e4966",
                highlight: "#c27a61",
                shadow: "#2d1d45",
            });
            context.fillStyle = "#c27a61";
            context.fillRect(780, 360, 520, 18);
        } else if (backgroundType === "debris") {
            context.fillStyle = "#94727a";
            [0, 1, 2, 3, 4].forEach((index) => {
                const x = ((index * 330) - drift * (index + 1)) % (this.width + 100);
                const wrappedX = x < -80 ? x + this.width + 100 : x;
                context.fillRect(wrappedX, 180 + ((index * 91) % 390), 100, 18);
                context.fillRect(wrappedX + 30, 160 + ((index * 91) % 390), 18, 76);
            });
        } else if (backgroundType === "ion") {
            context.fillStyle = "#59f6e8";
            [210, 360, 520, 670].forEach((y, index) => {
                const x = ((drift * (index + 2)) + (index * 240)) % this.width;
                context.fillRect(x, y, 5, 74);
                context.fillRect(x - 18, y + 32, 42, 5);
            });
        } else if (backgroundType === "station") {
            context.fillStyle = "#707895";
            context.fillRect(850, 135, 520, 42);
            context.fillRect(930, 177, 34, 470);
            context.fillRect(1210, 177, 34, 470);
            context.fillStyle = "#e6c86e";
            context.fillRect(1000, 245, 250, 10);
            context.fillRect(1000, 520, 250, 10);
        } else if (backgroundType === "mothership") {
            const approachScale = 0.82 + (progressRatio * 0.18);
            context.fillStyle = "#763a6d";
            context.fillRect(980 - (80 * (1 - approachScale)), 105, 370 * approachScale, 570);
            context.fillStyle = "#bd5c70";
            context.fillRect(900, 230, 480, 48);
            context.fillRect(900, 530, 480, 48);
            context.fillStyle = "#f0c878";
            context.fillRect(1030, 310, 250, 12);
            context.fillRect(1030, 488, 250, 12);
        } else if (backgroundType === "final" || backgroundType === "finalAssault") {
            context.fillStyle = "#742e43";
            context.fillRect(760, 120, 80, 560);
            context.fillRect(1320, 120, 80, 560);
            context.fillStyle = "#d27b5c";
            context.fillRect(840, 150, 480, 28);
            context.fillRect(840, 632, 480, 28);
            context.fillStyle = "#fff37a";
            context.fillRect(1040, 270, 120, 8);
            context.fillRect(1040, 532, 120, 8);
        }

        if (["space", "nebula", "fleet", "planet", "debris", "ion", "station", "mothership", "final", "finalAssault"].includes(backgroundType)) {
            context.globalAlpha = 0.16;
            context.fillStyle = backgroundType === "final" ? "#ff5f7a" : "#59f6e8";
            for (let line = 0; line < 6; line += 1) {
                const x = ((this.elapsed * (70 + (line * 13))) + (line * 260)) % (this.width + 120) - 120;
                context.fillRect(x, 130 + (line * 95), 78, 2);
            }
        }

        context.globalAlpha = 1;
    }
}
