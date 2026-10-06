# Stellar Assault

[English](./README.md) · [Português](./README.pt-BR.md)

**Stellar Assault** is a 2D horizontal shoot 'em up built with native web technologies. It features a complete 10-stage campaign, 10 boss fights, local co-op for two players, procedural 16-bit-style visuals, multiple enemy types, player abilities, and sound effects generated with the Web Audio API.

This project was developed as a hands-on exercise in game logic, modular JavaScript, state management, collision systems, input handling, and browser-based rendering.

## Highlights

- 10 stages with unique progression and boss encounters
- 10 configurable bosses with different attack patterns
- Solo and local 2-player co-op modes
- Independent health, energy, cooldowns, and abilities per player
- Multiple enemy types, including normal, strong, fast, shooter, and kamikaze enemies
- Boss attacks including lasers, burst shots, spread shots, charge attacks, projectile walls, and minion summons
- Responsive HTML5 Canvas rendering
- Procedural pixel-art-inspired ships, enemies, bosses, and backgrounds
- Parallax backgrounds, explosions, impact effects, and light screen shake
- 16-bit-style sound effects generated with the Web Audio API
- Developer Mode for testing and debugging
- Automated browser test suite

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript with ES modules
- Canvas API
- Web Audio API

No framework, game engine, build step, or external runtime dependency is required.

## Controls

| Action | Player 1 | Player 2 |
|---|---|---|
| Move up | `W` | `ArrowUp` |
| Move down | `S` | `ArrowDown` |
| Move left | `A` | `ArrowLeft` |
| Move right | `D` | `ArrowRight` |
| Fire | `Space` | `Right Shift` |
| Activate power | `E` | `Left Shift` |
| Confirm / restart | `Enter` | `Enter` |

## Project structure

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── game.js
│   ├── config/
│   ├── entities/
│   ├── systems/
│   │   └── attacks/
│   └── utils/
├── assets/
├── docs/
│   └── DOCUMENTACAO.md
├── tests/
│   ├── test-runner.html
│   └── tests.js
└── netlify.toml
```

## Running locally

Because the project uses ES modules, serve it through HTTP instead of opening `index.html` directly with `file://`.

For example, with Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Tests

The project includes a browser-based test runner. Start a local server and open:

```text
http://localhost:8000/tests/test-runner.html
```

## Deployment

The project is a static web application and can be deployed directly to services such as Netlify. The included `netlify.toml` already uses the project root as the publish directory.

## Documentation

A more detailed technical description is available in [`docs/DOCUMENTACAO.md`](./docs/DOCUMENTACAO.md).

## Project status

The full 10-stage campaign and all 10 boss encounters are implemented. The current version focuses on gameplay systems, procedural visuals, local co-op, and modular browser-based game architecture.

## Author

Developed by **Gabriel Alves** as a portfolio and learning project.
