import { Game } from "./game.js";
import { Input } from "./systems/Input.js";

/** Ponto de entrada: conecta HTML, input e jogo. */
function initializeGame() {
    const canvas = document.querySelector("#gameCanvas");
    const status = document.querySelector("#gameStatus");
    const debugPanel = document.querySelector("#debugPanel");

    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error("Elemento #gameCanvas nao encontrado.");
    }

    const input = new Input(window);
    const game = new Game(canvas, input, undefined, {
        debugPanel,
        statusElement: status,
    });
    game.start();

    status.textContent = "Menu principal - escolha o modo";
    document.body.dataset.gameReady = "true";

    // Libera listeners e animacao se a pagina for fechada/recarregada.
    window.addEventListener("beforeunload", () => {
        game.stop();
        input.destroy();
    }, { once: true });
}

try {
    initializeGame();
} catch (error) {
    const status = document.querySelector("#gameStatus");
    if (status) status.textContent = "Falha ao iniciar o jogo";
    console.error(error);
}
