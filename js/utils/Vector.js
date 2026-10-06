/**
 * Calcula o vetor unitário que aponta de uma posição até outra.
 *
 * deltaX e deltaY descrevem a diferença entre destino e origem. Dividir essas
 * diferenças pelo comprimento do vetor é o processo de normalização: o vetor
 * passa a ter comprimento 1 e pode ser multiplicado por qualquer velocidade.
 */
export function getNormalizedDirection(
    fromX,
    fromY,
    toX,
    toY,
    fallbackX = 1,
    fallbackY = 0,
) {
    const deltaX = toX - fromX;
    const deltaY = toY - fromY;
    const distance = Math.hypot(deltaX, deltaY);

    // Origem e destino iguais não formam uma direção. Nesse caso, usa-se a
    // direção alternativa informada pelo chamador.
    if (distance === 0) {
        const fallbackLength = Math.hypot(fallbackX, fallbackY) || 1;
        return {
            x: fallbackX / fallbackLength,
            y: fallbackY / fallbackLength,
        };
    }

    return {
        x: deltaX / distance,
        y: deltaY / distance,
    };
}
