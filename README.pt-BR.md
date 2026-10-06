# STELLAR ASSAULT

Jogo educacional completo: **STELLAR ASSAULT** e um shoot 'em up horizontal 2D cooperativo local
para 2 jogadores**, construido com tecnologias nativas da Web. A etapa atual
combina arte procedural em blocos 16-bit, controles responsivos, combate por
dados e estados independentes.

**Modo atual: campanha completa com 10 fases e 10 bosses funcionais**

Efeitos sonoros 16-bit gerados com Web Audio API.

## Modos disponiveis

- `1 Jogador` - Player 1 sozinho;
- `Cooperativo local para 2 jogadores` - Player 1 e Player 2 no mesmo teclado.

Ao iniciar, o menu permite selecionar o modo com W/S ou as setas e confirmar
com Enter. A opcao `MODO DESENVOLVEDOR` alterna o `Developer Mode`, que fica desligado por
padrao e permanece selecionado ao voltar ao menu. Depois do Game Over, Enter
retorna ao menu; depois de um Stage Clear, Enter ou a contagem automatica carrega
a proxima fase.

## Tecnologias

- HTML5 para a estrutura da pagina;
- CSS3 para apresentacao responsiva e escala pixelada;
- JavaScript puro com modulos ES;
- Canvas API para renderizacao 2D;
- nenhuma engine, framework ou biblioteca externa.

## Controles

| Acao | Player 1 | Player 2 |
|---|---|---|
| Mover para cima | `W` | `ArrowUp` |
| Mover para baixo | `S` | `ArrowDown` |
| Mover para a esquerda | `A` | `ArrowLeft` |
| Mover para a direita | `D` | `ArrowRight` |
| Atirar continuamente | `Space` | `Right Shift` (`ShiftRight`) |
| Ativar poder com energia cheia | `E` | `Left Shift` (`ShiftLeft`) |
| Reiniciar apos Game Over | `Enter` | `Enter` |

Os dois jogadores podem combinar movimento diagonal e manter o tiro pressionado
ao mesmo tempo. O sistema usa `event.code` para diferenciar `ShiftLeft` e
`ShiftRight`. O jogo impede o comportamento padrao do navegador somente para
as teclas utilizadas.

O sistema de mira do mouse foi removido. Os tiros dos jogadores seguem sempre
horizontalmente para a direita, no estilo classico de shoot 'em up. Inimigos
continuam podendo mirar em um jogador vivo no instante do disparo.

Alguns teclados possuem limitacoes fisicas de combinacoes simultaneas
(*keyboard ghosting*). Isso pode impedir o registro de certas combinacoes e nao
representa um bug implementado pelo jogo.

## Executar online

O projeto é uma aplicação web estática e pode ser publicado diretamente em
serviços como o Netlify. A versão publicada deve ser acessada por HTTP/HTTPS;
não é necessário abrir o `index.html` por `file://`.

## Deploy no Netlify

1. Acesse o Netlify e crie um novo site.
2. Faça upload da pasta do projeto ou de um arquivo ZIP, ou conecte o repositório.
3. Use a raiz do projeto como **Publish directory**.
4. Deixe o **Build command** vazio.
5. Abra a URL gerada pelo Netlify.

O arquivo `netlify.toml` já define `publish = "."`. O projeto não requer
backend, Node.js, npm, processo de build ou dependências instaláveis.

## Arquitetura resumida

```text
.
├── index.html
├── css/style.css
├── js/
│   ├── main.js
│   ├── game.js
│   ├── config/         # levels, enemies e bosses
│   ├── entities/      # Player, Enemy e Bullet
│   ├── systems/       # Input, spawn, ondas, efeitos, audio e parallax
│   └── utils/         # Constantes, vetores e mapas pixelados
├── assets/
├── docs/DOCUMENTACAO.md
└── tests/
```

`Game` mantem `players` com duas instancias da mesma classe `Player`. Cada
instancia recebe um preset de controles, cor e posicao inicial, alem de manter
seu proprio HP, energia, invencibilidade, cooldown e poder. O score e comum.

`Bullet` usa `owner` para separar tiro de jogador e tiro inimigo, e grava
`playerId` nos tiros dos jogadores para que a energia da destruicao va para a
nave correta. Jogadores nao colidem entre si nesta etapa. No solo, o Game Over
ocorre com a morte do P1; no cooperativo, somente com a morte dos dois. Enter
retorna ao menu e deixa a partida pronta para uma nova escolha.

`Level` controla a distancia virtual e os marcos de ondas de qualquer fase.
`Boss` encapsula entrada, movimento, rotacao de ataques, lasers, spread, burst,
paredes de projeteis, charge, minions e derrota dos dez bosses; o `Game` apenas
coordena entidades, colisao, HUD e transicoes.

## Estado atual

Implementados canvas responsivo, game loop com delta time, multiplayer local,
movimento independente, tiro horizontal, inimigos normal/forte/fast/shooter/
kamikaze, tiros inimigos
direcionados a jogadores vivos, vida e invencibilidade individuais, energia e
poderes independentes, HUD cooperativo, Game Over, reinicio, colisoes AABB,
pontuacao compartilhada, painel Debug externo, campanha de 10 fases, eventos de
ondas, aviso de boss, dez bosses, ataques variados, minions, parallax,
explosoes, screen shake leve e Developer Mode. Naves,
inimigos, projeteis e bosses usam silhuetas procedurais distintas desenhadas no
Canvas, com parallax tematico e efeitos de impacto.

Cada fase usa aproximadamente 45-51 segundos de trecho normal, tres ondas
personalizadas e um boss reutilizavel configurado por dados. A campanha foi
planejada para ficar abaixo de 15 minutos, normalmente em torno de 12-14
minutos, dependendo da precisao dos disparos e do modo de jogo.
Developer Mode aparece no menu, nao usa localStorage e bloqueia somente a
reducao de HP dos jogadores ativos; ataques e colisoes continuam processados.
Nao ha dependencia de sprites ou arquivos de audio externos: naves, inimigos,
bosses, cenarios e SFX sao gerados proceduralmente. A musica foi removida para
manter a experiencia focada no combate e nos efeitos de arcade.

## Arquitetura preparada para expansao

- Catalogos de fases, bosses e inimigos orientados a dados;
- eventos de onda com tipo, quantidade, ordem, intervalo e metadados de spawn;
- ataques do boss separados em componentes de metralhadora, laser duplo, spread,
  burst, parede, summon e charge;
- fabrica unica para `Normal`, `Strong`, `Fast`, `Shooter` e `Kamikaze`;
- parallax geometrico com tres camadas e temas de cenario;
- renderer `PixelArt` com mapas de pixels para naves e inimigos;
- `EffectsSystem` para dano, explosoes e screen shake;
- `AudioManager` centralizado com um unico `AudioContext` e SFX retro;
- campanha orientada a dados com dez fases, ondas e bosses sem classes duplicadas;
- HUD seguro separado da area de gameplay e painel tecnico HTML responsivo;
- menu principal com tela de controles e estado `CONTROLS_MENU`.

O painel Debug fica desligado por padrao (`DEBUG === false`) e pode ser ativado
no menu. Ele fica fora do Canvas e nao deve ser confundido com Developer Mode,
que continua sendo a invencibilidade.

### Tipos de inimigos

- `NORMAL` - inimigo linear basico;
- `STRONG` - mais HP e recompensa;
- `FAST` - atravessa a tela rapidamente;
- `SHOOTER` - entra, para em uma posicao e dispara;
- `KAMIKAZE` - escolhe um jogador vivo, faz uma unica passagem e escapa sem voltar;

## Testes

Depois do deploy, abra `/tests/test-runner.html` na mesma URL do site para
executar a suíte no navegador.

A suite verifica menu, selecao 1P/2P, Developer Mode, `event.code`,
simultaneidade das teclas, tiros e cooldowns independentes, tiro horizontal,
ausencia de mouse, colisoes, energia por dono, vida, invencibilidade, poderes,
inimigos, fabrica, ondas, alvos vivos, progressao da fase, eventos, boss,
laser simples/duplo, Kamikaze de uma passagem, energia por hit no boss,
minions, rotacao de ataques, parallax, efeitos, AudioManager, safe area, campanha de dez fases,
transicoes, revive cooperativo, tela final, tela de controles, Game Over
solo/cooperativo, retorno ao menu, HUD, spawn e AABB.

## Campanha

| Stage | Nome | Tema | Inimigos principais | Boss |
|---:|---|---|---|---|
| 01 | Outer Space | Espaco aberto | Normal, Strong, Fast | Dreadnought |
| 02 | Asteroid Belt | Asteroides | Fast, Normal, Kamikaze | Asteroid Crusher |
| 03 | Nebula | Nebulosa | Shooter, Normal, Strong | Nebula Wraith |
| 04 | Enemy Fleet | Frota | Normal, Strong, Shooter, Fast | Fleet Commander |
| 05 | Broken Planet | Planeta destruido | Kamikaze, Strong, Fast | Planet Breaker |
| 06 | Debris Field | Destrocos | Shooter, Kamikaze, Fast | Scrap Titan |
| 07 | Ion Storm | Tempestade de ions | Fast, Shooter, Strong | Ion Serpent |
| 08 | Space Station | Estacao inimiga | Shooter, Strong, Kamikaze | Station Guardian |
| 09 | Mothership Approach | Nave-mae | Todos | Mothership Shield |
| 10 | Final Assault | Batalha final | Todos | Overlord Core |

Ao derrotar um boss intermediario, o score continua, jogadores vivos recebem
uma cura configuravel de um coracao e jogadores mortos voltam na proxima fase
com 3 coracoes. A Stage 10 termina em `STELLAR ASSAULT / MISSION ACCOMPLISHED`,
com score, tempo total e as naves sobreviventes.

O Canvas logico e 1440x810, com escala visual responsiva e pixels sem
suavizacao. A faixa superior de 110 px e reservada ao HUD; inimigos surgem
somente a partir da area segura de gameplay, com margem inferior de 28 px.

Com Developer Mode ativo, `PageDown` avanca um checkpoint, acelera o warning ou
derrota o boss atual. Essa tecla e uma ferramenta interna de teste e nao faz
parte dos controles normais.

Kamikazes realizam somente uma passagem de ataque: depois de ultrapassar o
centro X do alvo entram em `ESCAPING` e nao retornam. Hits validos no boss
tambem concedem energia ao jogador responsavel pelo tiro. O valor atual e
`BOSS_HIT_ENERGY_REWARD = NORMAL_ENEMY_ENERGY_REWARD * 0.5`, ou 10 pontos.
Bosses avancados possuem rotacoes diferentes, telegraphs, Double Laser,
Spread/Burst Shot, Projectile Wall, Charge Attack e Summon Minions limitados.

## Documentacao

A explicacao completa da arquitetura, dos sistemas e do multiplayer esta em
[docs/DOCUMENTACAO.md](./docs/DOCUMENTACAO.md).
