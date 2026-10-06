/**
 * Mantém o estado das teclas usadas pelo jogo.
 *
 * Os eventos apenas atualizam `keys`; o game loop consulta esse estado a cada
 * frame. Assim várias teclas podem permanecer pressionadas ao mesmo tempo,
 * permitindo que os dois jogadores se movimentem e atirem simultaneamente.
 * `event.code` representa a tecla física (por exemplo, ShiftLeft e
 * ShiftRight), por isso é adequado para diferenciar os comandos do Player 2.
 */
export class Input {
    constructor(eventTarget = window) {
        this.eventTarget = eventTarget;
        this.keys = Object.create(null);

        this.gameKeys = new Set([
            "KeyW",
            "KeyA",
            "KeyS",
            "KeyD",
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "Space",
            "KeyE",
            "ShiftLeft",
            "ShiftRight",
            "Enter",
            "Escape",
            "PageDown",
        ]);

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.clear = this.clear.bind(this);

        this.eventTarget.addEventListener("keydown", this.handleKeyDown);
        this.eventTarget.addEventListener("keyup", this.handleKeyUp);
        this.eventTarget.addEventListener("blur", this.clear);
    }

    handleKeyDown(event) {
        // Somente teclas do jogo têm o comportamento padrão bloqueado.
        if (this.gameKeys.has(event.code)) event.preventDefault();
        this.keys[event.code] = true;
    }

    handleKeyUp(event) {
        if (this.gameKeys.has(event.code)) event.preventDefault();
        this.keys[event.code] = false;
    }

    isDown(...codes) {
        return codes.some((code) => this.keys[code] === true);
    }

    clear() {
        this.keys = Object.create(null);
    }

    destroy() {
        this.eventTarget.removeEventListener("keydown", this.handleKeyDown);
        this.eventTarget.removeEventListener("keyup", this.handleKeyUp);
        this.eventTarget.removeEventListener("blur", this.clear);
        this.clear();
    }
}
