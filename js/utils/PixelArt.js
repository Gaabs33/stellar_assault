/**
 * Pequeno renderer de pixel art procedural. Os mapas usam uma grade lógica
 * fixa e são ampliados por escala inteira, mantendo bordas duras e shading em
 * degraus sem depender de imagens externas.
 */
export function drawPixelMap(context, x, y, rows, palette, scale = 2, options = {}) {
    const frame = options.frame ?? 0;
    const animated = options.animated || {};
    const pixelScale = Math.max(1, Math.round(scale));

    rows.forEach((row, rowIndex) => {
        let runToken = null;
        let runStart = 0;
        const flush = (endColumn) => {
            if (!runToken || runToken === "." || runToken === " ") return;
            const mappedToken = animated[runToken]?.[frame % animated[runToken].length] || runToken;
            const color = palette[mappedToken] || palette[runToken];
            if (!color) return;
            context.fillStyle = color;
            context.fillRect(
                Math.round(x + (runStart * pixelScale)),
                Math.round(y + (rowIndex * pixelScale)),
                Math.max(pixelScale, (endColumn - runStart) * pixelScale),
                pixelScale,
            );
        };
        [...row, "."].forEach((token, columnIndex) => {
            if (token === runToken) return;
            flush(columnIndex);
            runToken = token;
            runStart = columnIndex;
        });
    });
}

export function drawPixelFrame(context, x, y, width, height, colors = {}) {
    const outer = colors.outer || "#1b2b5a";
    const edge = colors.edge || "#59f6e8";
    const inner = colors.inner || "#071126";
    context.fillStyle = outer;
    context.fillRect(x + 4, y, width - 8, height);
    context.fillRect(x, y + 4, width, height - 8);
    context.fillStyle = edge;
    context.fillRect(x + 6, y + 2, width - 12, 3);
    context.fillRect(x + 2, y + 6, 3, height - 12);
    context.fillRect(x + width - 5, y + 6, 3, height - 12);
    context.fillStyle = inner;
    context.fillRect(x + 8, y + 8, width - 16, height - 16);
}

export function drawSegmentedBar(context, x, y, width, height, ratio, color, segments = 10) {
    const safeRatio = Math.max(0, Math.min(1, ratio));
    const gap = 3;
    const segmentWidth = Math.max(1, Math.floor((width - ((segments - 1) * gap)) / segments));
    const filled = Math.ceil(safeRatio * segments);
    for (let index = 0; index < segments; index += 1) {
        const segmentX = x + (index * (segmentWidth + gap));
        context.fillStyle = index < filled ? color : "#1b2446";
        context.fillRect(segmentX, y, segmentWidth, height);
        if (index < filled) {
            context.fillStyle = "#f1f3ff";
            context.fillRect(segmentX + 2, y + 2, Math.max(1, segmentWidth - 5), 2);
        }
    }
}

export const PLAYER_PIXEL_ART = Object.freeze({
    player1: Object.freeze([
        "....................",
        ".........HH.........",
        "......PPCCPP........",
        "....PPBBBBCCPP......",
        "..PPBBBBBBBBCCPP....",
        ".PWWBBBBBBBBBBCCP...",
        "PWWWBBBBBBBBBBBBCCP.",
        "PPWWBBCCBBBBBBBBCCPP",
        ".PWWWBBBBBBBBBBCCP..",
        "..PPBBBBBBBBCCPP....",
        "....PPBBCCPP........",
        ".......EE...........",
    ]),
    player2: Object.freeze([
        "....................",
        "...HH......HH.......",
        "..PPPPPPPPPP........",
        ".PWWBBBBBBBBWWPP....",
        "PWWWWBBBBBBBBWWPPCC.",
        "PPWWBCCCCCCBBWWPPCCC",
        ".PWWBBBBBBBBBBWWPP..",
        "..PPPPBBBBPPPP......",
        "...EE......EE.......",
        "..EE........EE......",
    ]),
});

export const ENEMY_PIXEL_ART = Object.freeze({
    normal: Object.freeze([
        "....PPPPPP........",
        "..PPBBBBCCPP......",
        ".PWWBBBBBBCCP.....",
        "PWWWBBHHBBBCCP....",
        "PPWWBBBBBBBBCCPP..",
        "..PPBBCCBBBBBPP...",
        "....PBBBBBBPP.....",
        ".....EE..EE.......",
    ]),
    strong: Object.freeze([
        "..PPPPPPPPPP......",
        ".PSSBBBBCCBBSP....",
        "PSSWBBBBBBBBCCSP..",
        "PSSWBBHHBBBBBSP...",
        "PSSWBBBBBBBBBSP...",
        ".PSSBBBBCCBBSP....",
        "..PPSSBBBBSSPP....",
        "...EE..EE..EE.....",
    ]),
    fast: Object.freeze([
        "..........PP......",
        "......PPPPCCP.....",
        "...PPPPBBBBCCP....",
        ".PWWWWBBBBBBCCP...",
        "PPWWWWBBHHBBCCPP..",
        ".PWWWWBBBBBBCCP...",
        "...PPPPBBBBCCP....",
        "......EE..EE......",
    ]),
    shooter: Object.freeze([
        "..PPPPPPPPPP......",
        ".PSSBBBBCCBSP.....",
        "PSSWBBBBBBBBSP....",
        "PSSWBBHHBBBBSP----",
        "PSSWBBBBBBBBSP----",
        ".PSSBBBBCCBSP.....",
        "..PPSSBBBBPP......",
        "...EE..EE.........",
    ]),
    kamikaze: Object.freeze([
        ".........PP.......",
        "........PBBP......",
        "..PPPPPPBBBBPP....",
        ".PWWBBBBRRBBWWP...",
        "PPWWBBRRRRBBWWPP..",
        ".PWWBBBBRRBBWWP...",
        "..PPPPPPBBBBPP....",
        "........EE........",
    ]),
});
