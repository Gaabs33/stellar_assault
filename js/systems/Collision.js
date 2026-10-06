/**
 * Detecta a sobreposição entre dois retângulos alinhados aos eixos.
 *
 * Essa técnica é chamada AABB (Axis-Aligned Bounding Box). Qualquer objeto
 * com x, y, width e height pode usar a função, independentemente de sua classe.
 */
export function checkCollision(objectA, objectB) {
    return (
        objectA.x < objectB.x + objectB.width
        && objectA.x + objectA.width > objectB.x
        && objectA.y < objectB.y + objectB.height
        && objectA.y + objectA.height > objectB.y
    );
}
