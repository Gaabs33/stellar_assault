# Documentação técnica — STELLAR ASSAULT

**Versão:** 1.0 — campanha completa de dez fases  
**Tipo:** shoot 'em up horizontal 2D  
**Finalidade:** projeto educacional de Desenvolvimento de Sistemas

## 1. Apresentação do projeto

STELLAR ASSAULT é um jogo de nave 2D com deslocamento horizontal, modo solo,
cooperativo local e campanha de dez fases. A implementação usa arte procedural
em blocos 16-bit para manter o foco didático sem depender de assets externos.

Esta versão entrega a campanha jogável completa com naves, inimigos, bosses,
cenários e SFX procedurais. A música é deliberadamente ausente; o foco continua sendo manter os sistemas
essenciais modulares para evoluções futuras sem reescrever o projeto.

## 2. Objetivo

O projeto foi criado como trabalho educacional de um curso de Desenvolvimento de Sistemas. Seus objetivos principais são:

- demonstrar fundamentos de programação orientada a objetos;
- separar responsabilidades em arquivos pequenos e compreensíveis;
- aplicar um game loop baseado em tempo;
- implementar input, entidades, colisão, spawn e pontuação;
- servir como código fácil de estudar e explicar em uma apresentação;
- preparar a inclusão futura de sprites em pixel art 16-bit.

A prioridade adotada é: **clareza e funcionamento antes de quantidade de funcionalidades**.

## 3. Tecnologias utilizadas

### HTML5

O arquivo `index.html` contém a estrutura da página, o elemento `<canvas>`, as instruções de controle e a importação do módulo inicial. Nenhuma regra do jogo fica no HTML.

### CSS3

O CSS centraliza e redimensiona o canvas, estiliza a moldura da página e aplica `image-rendering: pixelated`. A resolução interna não muda quando o tamanho visual se adapta à janela.

### JavaScript puro

Todo o comportamento do jogo foi escrito em JavaScript, organizado em módulos ES com `import` e `export`. Não há TypeScript, framework, engine ou biblioteca externa.

### Canvas API

Na versao atual, o Canvas usa resolucao logica 1440 x 810, com `imageSmoothingEnabled = false`; o painel tecnico fica fora do Canvas.

A Canvas API desenha fundo, estrelas, arte procedural, pontuação e HUD. O jogo trabalha com um contexto 2D e resolução lógica fixa de **1440 × 810 pixels**; o painel técnico fica fora do Canvas.

## 4. Por que JavaScript puro?

Não usar uma engine torna visíveis os conceitos que uma ferramenta pronta normalmente esconderia. O projeto demonstra diretamente:

- como o navegador agenda frames;
- como posição e velocidade se relacionam com o tempo;
- como o teclado mantém estado;
- como objetos são criados, atualizados, desenhados e removidos;
- como uma colisão retangular é calculada;
- como módulos colaboram sem concentrar tudo em um único arquivo.

Essa escolha melhora o valor didático. Para o escopo atual, as APIs nativas atendem a todas as necessidades sem dependências adicionais.

## 5. Estrutura do projeto

```text
stellar-assault/
├── netlify.toml
├── index.html
├── README.md
├── css/
│   └── style.css
├── docs/
│   └── DOCUMENTACAO.md
├── js/
│   ├── main.js
│   ├── game.js
│   ├── config/
│   │   ├── levels.js
│   │   ├── enemies.js
│   │   └── bosses.js
│   ├── entities/
│   │   ├── Player.js
│   │   ├── Enemy.js
│   │   ├── Bullet.js
│   │   └── Boss.js
│   ├── systems/
│   │   ├── Input.js
│   │   ├── Collision.js
│   │   ├── SpawnSystem.js
│   │   ├── EnemyFactory.js
│   │   ├── WaveSystem.js
│   │   ├── Level.js
│   │   ├── ParallaxSystem.js
│   │   ├── EffectsSystem.js
│   │   ├── AudioManager.js
│   │   └── attacks/
│   │       ├── MachineGunAttack.js
│   │       ├── LaserAttack.js
│   │       ├── DoubleLaserAttack.js
│   │       ├── SpreadShotAttack.js
│   │       ├── BurstShotAttack.js
│   │       ├── ProjectileWallAttack.js
│   │       ├── SummonMinionsAttack.js
│   │       └── ChargeAttack.js
│   └── utils/
│       ├── constants.js
│       ├── Vector.js
│       └── PixelArt.js
├── assets/
│   ├── sprites/
│   ├── audio/
│   └── backgrounds/
└── tests/
    ├── test-runner.html
    └── tests.js
```

### Responsabilidade de cada arquivo

| Arquivo | Responsabilidade |
|---|---|
| `netlify.toml` | Configuração mínima do diretório publicado no Netlify. |
| `index.html` | Estrutura da página e criação do canvas. |
| `css/style.css` | Layout, aparência da página e escala visual pixelada. |
| `js/main.js` | Ponto de entrada que conecta canvas, input e jogo. |
| `js/game.js` | Game loop, coordenação do combate, colisões, score, HUD e Game Over. |
| `js/entities/Player.js` | Movimento, vida, energia, poder, cooldown e tiros direcionais. |
| `js/entities/Enemy.js` | Tipos, movimento, vida, dano, recompensas e disparos inimigos. |
| `js/entities/Bullet.js` | Dono, direção fixa, movimento, dano e limites do projétil. |
| `js/entities/Boss.js` | Vida, movimento, visual e coordenação dos ataques configurados. |
| `js/config/` | Catálogos de fases, inimigos e bosses. |
| `js/systems/Input.js` | Estado das teclas usadas pelo jogo. |
| `js/systems/Collision.js` | Função AABB reutilizável. |
| `js/systems/SpawnSystem.js` | Intervalo e delegação para a fábrica de inimigos. |
| `js/systems/EnemyFactory.js` | Criação única dos tipos de inimigo. |
| `js/systems/WaveSystem.js` | Expansão ordenada de eventos em filas de spawn. |
| `js/systems/Level.js` | Distância, eventos e estados da fase. |
| `js/systems/ParallaxSystem.js` | Três camadas geométricas de cenário. |
| `js/systems/EffectsSystem.js` | Flash, explosões e screen shake. |
| `js/systems/AudioManager.js` | SFX 16-bit via Web Audio API e controle de volume. |
| `js/systems/attacks/` | Componentes reutilizaveis de machine gun, lasers, spread, burst, wall, summon e charge. |
| `js/utils/constants.js` | Dimensões, velocidades, cores e intervalos configuráveis. |
| `js/utils/Vector.js` | Cálculo reutilizável de vetores de direção normalizados. |
| `js/utils/PixelArt.js` | Mapas e helpers de renderização pixelada procedural. |
| `tests/tests.js` | Verificações automatizadas dos comportamentos essenciais. |
| `assets/` | Pastas reservadas para recursos visuais e sonoros futuros. |

## 6. Arquitetura do jogo

A arquitetura separa coordenação, entidades e sistemas:

```text
main.js
   ├── cria Input
   └── cria Game
          ├── controla Player
          ├── mantém Enemy[]
          ├── mantém Bullet[]
          ├── consulta Input
          ├── usa SpawnSystem
          └── usa checkCollision()
```

- **Game** orquestra a ordem do processamento e armazena o estado geral.
- **Player**, **Enemy** e **Bullet** armazenam dados e regras próprias de combate.
- **Input** traduz teclado e mouse em um estado simples que pode ser consultado.
- **Collision** não depende de nenhuma entidade específica; compara quaisquer dois retângulos.
- **SpawnSystem** decide quando, onde e qual tipo de inimigo será criado.
- **Vector** evita duplicar a matemática de direção usada por Player e Enemy.

Essa divisão permite evoluir a arte procedural ou substituí-la por sprites sem reescrever movimento, colisão ou pontuação.

## 7. Game loop

Um game loop é uma função executada repetidamente durante a partida. Cada repetição representa um frame e segue este fluxo:

```text
Input já registrado
        ↓
Update das regras e posições
        ↓
Detecção de colisões e limpeza
        ↓
Draw no Canvas
        ↓
requestAnimationFrame solicita o próximo frame
```

O projeto usa `requestAnimationFrame()` porque o navegador pode sincronizar o trabalho com a taxa de atualização da tela e reduzir processamento quando a aba não está visível.

### Diferença entre `update()` e `draw()`

- `update(deltaTime)` modifica o estado: lê input, move objetos, cria inimigos, resolve colisões e remove itens inativos.
- `draw()` representa o estado atual: limpa o canvas e desenha fundo, entidades, score e HUD; dados técnicos vão para o Debug Panel externo.

Separar os dois métodos torna a lógica mais previsível e fácil de testar.

### Delta time

`deltaTime` é o tempo decorrido desde o frame anterior, em segundos. O deslocamento segue esta relação:

```text
deslocamento = velocidade × deltaTime
```

Exemplo: com velocidade de 360 pixels por segundo e `deltaTime` de 0,016 s, o objeto avança aproximadamente 5,76 pixels no frame. Assim, a velocidade não depende diretamente da quantidade de frames por segundo.

O delta é limitado a 0,1 s. Isso evita que entidades atravessem a tela de uma vez quando a aba volta ao foco depois de uma pausa longa.

## 8. Sistema de coordenadas

O Canvas usa o canto superior esquerdo como origem:

```text
(0, 0) ───────────────→ X aumenta
   │
   │
   │
   ↓
Y aumenta
```

- aumentar X move um objeto para a direita;
- diminuir X move para a esquerda;
- aumentar Y move para baixo;
- diminuir Y move para cima.

Todo objeto retangular usa `x` e `y` para o canto superior esquerdo, além de `width` e `height`.

## 9. Player (historico da versao 0.2)

A classe `Player` representa a nave do jogador. Além de posição, dimensões, velocidade e cooldown, ela mantém 5 pontos de vida, invencibilidade temporária, energia de 0 a 100 e a duração do poder especial.

Durante `update()`:

1. consulta o sistema de input;
2. monta uma direção X/Y;
3. normaliza a direção diagonal;
4. aplica velocidade e delta time;
5. limita a posição às bordas do canvas;
6. reduz os timers de cooldown, invencibilidade e poder.

Normalizar significa transformar a diagonal `(1, 1)` em um vetor com comprimento 1. Sem isso, mover em dois eixos seria aproximadamente 41% mais rápido que mover em apenas um.

O método `shoot(targetX, targetY)` calcula o vetor entre a nave e a mira. Ele retorna uma nova `Bullet` quando o cooldown permite ou `null` quando ainda é cedo. `takeDamage()`, `addEnergy()` e `activatePower()` mantêm as demais regras dentro da própria entidade.

## 10. Input (historico da versao 0.2)

`Input` mantém um objeto `keys` para o teclado e um objeto `mouse` para posição, presença no Canvas e estado do botão direito. Códigos como `KeyW`, `ArrowUp`, `Space` e `Enter` usam valores booleanos.

```text
keydown → keys[event.code] = true
keyup   → keys[event.code] = false
```

Os eventos não movem nem disparam diretamente. `Player.update()` consulta `isDown()` e `Game` consulta `isRightMouseDown()` a cada frame. Isso é importante porque:

- permite manter movimento contínuo;
- reconhece combinações como W + D;
- permite segurar o botão direito respeitando o cooldown;
- evita colocar regras de gameplay dentro de callbacks de teclado;
- deixa o código mais simples de testar.

Quando a janela perde o foco, o estado é limpo para evitar controles presos. A conversão das coordenadas do mouse e o evento `contextmenu` são detalhados na seção 22.

## 11. Bullet (historico da versao 0.2)

`Bullet` representa projéteis do jogador e dos inimigos. O array `game.bullets` armazena todos, enquanto `owner` define se o valor é `player` ou `enemy`.

Cada tiro:

- nasce na direção do alvo a partir do centro da entidade;
- armazena `directionX` e `directionY` normalizados;
- avança em dois eixos usando direção × velocidade × delta time;
- possui 1 ponto de dano;
- torna-se inativo após uma colisão;
- é removido ao sair completamente por qualquer borda.

O cooldown do jogador é de **0,25 segundo (250 ms)**. Segurar o botão direito produz aproximadamente quatro tiros por segundo. Durante o poder, o intervalo cai para 0,125 s e a velocidade física do projétil dobra.

## 12. Enemy

`Enemy` é configurável por tipo. Ambos aparecem na direita, movem-se para a esquerda e compartilham a mesma classe:

| Tipo | Vida | Cor provisória | Score | Energia |
|---|---:|---|---:|---:|
| Normal | 1 HP | Rosa | 100 | +20 |
| Forte | 3 HP | Laranja | 300 | +35 |

`takeDamage(amount)` reduz a vida. `shootAt(player)` cria um tiro direcionado e reinicia um cooldown aleatório entre os limites configurados. Inimigos destruídos ou que atravessam a borda esquerda são removidos.

## 13. Colisão

A função `checkCollision(objectA, objectB)` usa AABB, sigla para *Axis-Aligned Bounding Box*. Em termos simples, cada entidade é tratada como um retângulo sem rotação.

Existe colisão quando os retângulos se sobrepõem nos dois eixos ao mesmo tempo:

```text
A começa antes do fim de B em X
E A termina depois do início de B em X
E A começa antes do fim de B em Y
E A termina depois do início de B em Y
```

As colisões atuais são filtradas pelo dono do projétil:

1. `Player Bullet × Enemy`: desativa o tiro e aplica dano ao inimigo;
2. se o inimigo morrer, soma score e entrega sua recompensa de energia;
3. `Enemy Bullet × Player`: desativa o tiro e tenta retirar 1 HP;
4. a invencibilidade pode recusar o dano, mas o projétil ainda é consumido;
5. tiros do jogador ignoram o Player e tiros inimigos ignoram outros inimigos;
6. ao final, `filter()` remove objetos inativos sem modificar arrays dentro dos loops.

AABB é eficiente e suficiente para as hitboxes compactas do arcade. A leitura visual é detalhada separadamente, sem alterar a colisão.

## 14. Spawn

`SpawnSystem.timer` acumula o delta time. Quando alcança 2 segundos, cria um inimigo e subtrai o intervalo. Uma rolagem configurável seleciona **70% normal** e **30% forte**.

A coordenada X começa na borda direita. A coordenada Y é sorteada no intervalo:

```text
0 até (altura do canvas - altura do inimigo)
```

Subtrair a altura garante que o inimigo sempre entre completamente dentro do espaço vertical do canvas.

## 15. Pontuação

O score começa em zero e pertence ao objeto `Game`. O normal vale 100 pontos e o forte vale 300. O HUD usa `String.padStart()` para manter seis dígitos:

```text
SCORE: 000000
SCORE: 000100
SCORE: 001200
```

O texto é desenhado por `context.fillText()` no canto superior esquerdo.

## 16. Pixel art 16-bit

A direção artística escolhida remete a shooters de consoles e arcades dos anos 1980/1990, mas o jogo deverá construir identidade visual própria.

### Escala planejada

Os elementos procedurais usam múltiplos próximos de uma grade pequena. Um
sprite base de nave com 32 × 16 pixels, por exemplo, pode ser exibido a 64 ×
32 pixels — escala inteira de 2×. Inimigos podem usar bases de 16 × 16, 32 ×
16 ou 32 × 32; bosses podem ocupar áreas maiores.

Manter escalas inteiras ajuda a preservar bordas consistentes e evita pixels com tamanhos diferentes.

### Nearest-neighbor e suavização

Imagens comuns podem ser suavizadas por interpolação ao crescer. Para pixel art, essa suavização borra os blocos de cor. O projeto toma duas medidas:

```javascript
context.imageSmoothingEnabled = false;
```

```css
canvas {
    image-rendering: pixelated;
}
```

`imageSmoothingEnabled` controla o desenho de imagens dentro do Canvas. `image-rendering` orienta o navegador quando o próprio canvas é redimensionado pelo CSS.

Os desenhos de nave, tiro, inimigo e boss são arte procedural em blocos. Se sprites bitmap forem adicionados no futuro, os métodos `draw()` poderão chamar `drawImage()` sem alterar a lógica das classes.

## 17. Debug Panel externo

`DEBUG` fica em `js/utils/constants.js` e começa como `false`. O jogador pode
ativá-lo pela opção `DEBUG: ON/OFF` no menu; enquanto ativo,
o `aside#debugPanel` do HTML exibe:

- FPS aproximado;
- coordenadas dos jogadores;
- vida e energia;
- quantidade de tiros por dono;
- quantidade de inimigos;
- boss, HP, ataque atual, estado do ataque e minions vivos;
- score atual.

Esses dados permitem observar o comportamento interno sem ocupar a área de
gameplay. Para uma apresentação mais limpa, basta mudar a constante para
`false`; isso oculta o painel sem alterar Developer Mode.

## 18. Publicação e execução online

O projeto é uma aplicação web estática. O arquivo `index.html` fica na raiz,
os módulos ES usam caminhos relativos e a publicação não exige backend,
Node.js, npm, processo de build ou servidor próprio.

### Deploy no Netlify

1. Crie um novo site no Netlify.
2. Envie a pasta do projeto ou um arquivo ZIP, ou conecte o repositório.
3. Defina a raiz do projeto como **Publish directory**.
4. Deixe o **Build command** vazio.
5. Acesse a URL HTTPS gerada.

O arquivo `netlify.toml` mantém essa configuração registrada com
`publish = "."`. A página oficial deve ser acessada por HTTP/HTTPS; abrir o
arquivo diretamente por `file://` não é um modo de execução suportado para
módulos ES.

### Executar os testes

Após o deploy, abra `/tests/test-runner.html` na mesma URL do site. O runner
usa os módulos relativos publicados junto com o jogo e não requer instalação
de dependências.

A suíte cobre teclado, modos de jogo, campanha, safe area, spawn, tipos e tiros
inimigos, HP, invencibilidade, energia, poder, bosses, transições, tela final,
áudio, Game Over, reinício, AABB e descarte de objetos.

## 19. Estado atual (historico da versao 0.2)

| Funcionalidade | Estado |
|---|---|
| Canvas 1440 × 810 responsivo | Implementado |
| Game loop com `requestAnimationFrame` | Implementado |
| Delta time com limite de segurança | Implementado |
| Movimento X/Y e diagonal | Implementado |
| WASD e setas | Implementado |
| Limites do canvas | Implementado |
| Mira com mouse | Removida na versao cooperativa |
| Botão direito e menu de contexto bloqueado | Implementado |
| Projéteis direcionais não teleguiados | Implementado |
| Normal (1 HP) e forte (3 HP) | Implementado |
| Spawn 70%/30% a cada 2 segundos | Implementado |
| Disparos inimigos com variação | Implementado |
| Vida, corações e invencibilidade | Implementado |
| Energia 0–100 | Implementado |
| Poder especial de 8 segundos | Implementado |
| Game Over e reinício | Implementado |
| Colisões por dono do projétil | Implementado |
| Pontuação | Implementado |
| Debug | Implementado |
| Testes de comportamento | Implementado |
| Arte procedural 16-bit | Implementado |
| Power-ups e upgrades | Planejado |
| Boss e miniboss | Implementado |
| Audio procedural | Implementado |
| Menu simples 1P/2P | Implementado |

## 20. Próximas etapas opcionais

As possibilidades abaixo são extensões opcionais; não são necessárias para a
campanha atual de STELLAR ASSAULT:

1. trocar partes da arte procedural por folhas de sprites bitmap;
2. adicionar variações cosméticas sem alterar hitboxes;
3. criar modos de desafio opcionais;
4. registrar recordes ou ranking local.

Cada expansão deve manter a regra atual: primeiro validar o comportamento, depois documentar e somente então aumentar o escopo.

## 21. Sistema de mira (historico da versao 0.2)

A mira usa a posição do mouse relativa ao Canvas. Como o CSS pode exibir o canvas com tamanho diferente de 1280 × 720, coordenadas diretas da janela não são suficientes. `Input.updateMousePosition()` lê `getBoundingClientRect()` e calcula:

```text
escala X = largura interna / largura exibida
escala Y = altura interna / altura exibida

mouse X = (clientX - margem esquerda) × escala X
mouse Y = (clientY - margem superior) × escala Y
```

Assim, apontar para o centro visual continua produzindo aproximadamente `(640, 360)` em qualquer tamanho de janela.

Para obter a trajetória, `getNormalizedDirection()` calcula `deltaX = destinoX - origemX` e `deltaY = destinoY - origemY`. Esses valores formam um vetor que aponta da nave à mira. Dividir os dois pelo comprimento `Math.hypot(deltaX, deltaY)` produz um vetor de comprimento 1. Depois, a velocidade pode ser aplicada sem depender da distância original até o cursor.

A leitura visual é composta por pequenos `fillRect()` em torno dessas coordenadas e segue a direção de arte 16-bit do projeto.

## 22. Mouse Input (historico da versao 0.2)

O objeto `input.mouse` registra:

```javascript
{
    x,
    y,
    inside,
    rightDown
}
```

`mousedown` com `button === 2` ativa `rightDown`; `mouseup`, `mouseleave` ou perda de foco o desativam. O clique esquerdo não modifica esse estado. O jogo consulta `isRightMouseDown()` em cada update, o que permite segurar o botão e ainda obedecer ao cooldown.

O evento `contextmenu` chama `preventDefault()` somente no Canvas. Isso impede o menu do navegador durante a partida sem desativá-lo no restante da página.

## 23. Projéteis direcionais

Cada `Bullet` recebe `directionX` e `directionY` no construtor. Esses valores são normalizados e armazenados dentro do projétil:

```text
x += directionX × speed × deltaTime
y += directionY × speed × deltaTime
```

Nem a mira nem o alvo são consultados novamente. Essa decisão cria projéteis balísticos: mover o mouse ou o Player depois do disparo não altera tiros que já estão viajando.

A propriedade `owner` vale `player` ou `enemy`. Uma única classe atende aos dois lados, mas configura cores, tamanhos, velocidades e colisões de forma explícita.

## 24. Inimigos e disparo inimigo

Os tipos normal e forte usam a mesma classe `Enemy` e entradas diferentes em `ENEMY_TYPE_CONFIG`. Isso permite acrescentar novas variações por dados, sem duplicar movimento, dano e tiro.

Quando o cooldown chega a zero, `shootAt(player)` calcula a direção `Enemy → Player` com as posições centrais naquele instante. O tiro conserva essa direção mesmo que o jogador desvie depois. Um intervalo aleatório entre 2,2 e 3,6 segundos, além de uma fração aleatória inicial, evita rajadas perfeitamente sincronizadas.

## 25. Sistema de vida e invencibilidade

O Player começa com **5/5 HP**. O HUD representa o estado com corações preenchidos e vazios. Cada tiro inimigo causa 1 ponto de dano.

Depois de um dano válido, `invincibilityRemaining` recebe 1 segundo. Enquanto o timer for maior que zero, `takeDamage()` recusa novos danos. A nave alterna entre visível e invisível para comunicar esse estado sem efeitos complexos.

## 26. Sistema de energia

A energia começa em 0 e nunca ultrapassa 100 porque `addEnergy()` aplica `Math.min(maxEnergy, energy + reward)`. As recompensas atuais são:

```text
Normal destruído → +20
Forte destruído  → +35
```

A barra usa `energia / energia máxima` para calcular sua largura proporcional. Ao atingir 100, muda de cor e exibe `POWER READY! [ESPAÇO]`.

## 27. Poder especial

Espaço tenta chamar `activatePower()`. A ativação só ocorre com energia cheia e sem outro poder ativo. A energia volta imediatamente para zero e o timer recebe `POWER_DURATION = 8`.

Durante o poder:

- **Fire Rate ×2:** o intervalo cai de 250 ms para 125 ms, criando o dobro de oportunidades de disparo por segundo;
- **Projectile Speed ×2:** cada novo tiro viaja a 1560 pixels por segundo em vez de 780.

Fire rate controla **quantos tiros podem nascer por segundo**. Projectile speed controla **quanto espaço cada tiro percorre por segundo**. São multiplicadores independentes. O HUD mostra `POWER ACTIVE` e o tempo restante.

## 28. Game Over e reinicio (historico da versao 0.2)

Quando a vida chega a zero, `isGameOver` interrompe movimento, spawn, tiros e colisões. O Canvas mostra `GAME OVER` e `PRESSIONE ENTER PARA REINICIAR`.

Enter chama `resetGame()`, que restaura:

- vida para 5;
- energia e score para zero;
- posição inicial do Player;
- cooldown, invencibilidade e poder;
- timer do spawn;
- arrays de inimigos e projéteis;
- estado dos controles pressionados.

O mesmo game loop continua ativo; apenas o estado da partida é reinicializado.

# Modos de Jogo

## Solo

O modo `1 Jogador` ativa somente o Player 1. O array `players` contém apenas
essa instância, portanto Player 2 não aparece, não recebe update, colisões,
tiros ou HUD. O Game Over ocorre assim que o Player 1 morre.

Controles do solo: WASD para movimento, Space para atirar e E para ativar o
poder especial.

## Cooperativo Local

O modo `2 Jogadores` ativa Player 1 e Player 2 no mesmo teclado, reutilizando a
mesma classe `Player` e os mesmos sistemas de jogo. O Game Over cooperativo
ocorre somente quando os dois jogadores estão mortos.

| Ação | Player 1 | Player 2 |
|---|---|---|
| Cima | W | ArrowUp |
| Baixo | S | ArrowDown |
| Esquerda | A | ArrowLeft |
| Direita | D | ArrowRight |
| Atirar | Space | Right Shift (`ShiftRight`) |
| Especial | E | Left Shift (`ShiftLeft`) |

## Estados e fluxo

O jogo utiliza estados globais para o menu, a partida, o Game Over, a
transicao de fase e a
conclusão da fase:

```text
MENU
PLAYING
GAME_OVER
STAGE_CLEAR
CAMPAIGN_CLEAR
```

O fluxo é:

```text
Menu
↓
Escolha do modo
↓
Partida / Stage 01 -> Stage 10
↓
Game Over, Stage Clear ou Campaign Clear
↓
Enter retorna ao menu ou confirma a proxima fase
```

No menu, W/S ou as setas alternam a seleção entre `1 JOGADOR`, `2 JOGADORES`,
`CONTROLES` e `MODO DESENVOLVEDOR`; Enter inicia a partida, abre os controles ou
alterna o modo. A seleção de jogadores é armazenada em `selectedPlayerCount`, e `startGame()` monta
`players` com uma ou duas instâncias sem duplicar o jogo.

# Multiplayer Local

**Versao atual:** 1.0 - campanha completa, 10 fases e 10 bosses

## Visao geral da versao atual

O modo atual e cooperativo local para **2 jogadores no mesmo computador**. As
duas naves aparecem juntas no Canvas, com posicoes iniciais separadas, e podem
se mover, atirar, receber dano e usar o poder especial de forma independente.
O score continua compartilhado porque a partida e cooperativa.

| Acao | Player 1 | Player 2 |
|---|---|---|
| Cima | W | ArrowUp |
| Baixo | S | ArrowDown |
| Esquerda | A | ArrowLeft |
| Direita | D | ArrowRight |
| Atirar | Space | ShiftRight (Right Shift) |
| Especial | E | ShiftLeft (Left Shift) |
| Reiniciar apos Game Over | Enter | Enter |

O teclado e lido por `event.code`. Esse campo identifica a tecla fisica e
permite diferenciar `ShiftLeft` de `ShiftRight`, algo que depender somente de
`event.key` nao garante. `Input.keys` armazena cada codigo como booleano:

```javascript
keydown -> keys[event.code] = true
keyup   -> keys[event.code] = false
```

Como cada Player consulta seus proprios codigos no update, combinacoes como
`W + D + Space` e `ArrowDown + ArrowRight + ShiftLeft` funcionam no mesmo
frame. O listener chama `event.preventDefault()` somente para as teclas usadas
pelo jogo, evitando a rolagem causada por Space e pelas setas.

Alguns teclados podem nao registrar certas combinacoes de muitas teclas por
uma limitacao fisica chamada **keyboard ghosting**. Isso depende do hardware e
nao e um bug do jogo; nenhuma solucao especial foi adicionada nesta versao.

## Duas instancias da classe Player

`Game` cria um array `players` com duas instancias da mesma classe:

```javascript
const players = [
    new Player(120, 220, player1Preset),
    new Player(120, 468, player2Preset),
];
```

Os presets fornecem `playerId`, `controls`, `color` e posicao inicial. O
comportamento fica em `Player.js`, sem criar arquivos duplicados como
`Player1.js` e `Player2.js`. Cada instancia guarda seus proprios:

- `health` e `maxHealth`;
- `energy` e `maxEnergy`;
- `invincibilityRemaining`;
- `shotCooldownRemaining`;
- `powerTimeRemaining` e `isPowerActive`.

Player 1 usa azul e Player 2 usa verde como identificacao temporaria dos
arte procedural. Os jogadores nao colidem entre si nesta etapa; podem atravessar
um ao outro para manter o foco nas regras cooperativas.

## Tiro classico e Bullet

O sistema de mira do mouse foi removido. Nao existem mais mouse aim, cursor
personalizado, mira desenhada no Canvas, botao direito ou listeners de mouse.
O jogo voltou ao formato **horizontal shoot 'em up**: todo tiro do jogador
nasce na frente da nave e usa `directionX = 1` e `directionY = 0`.

Cada `Bullet` continua armazenando `owner`. Tiros dos jogadores tambem gravam
`playerId`, permitindo que a energia da destruicao seja entregue ao jogador que
disparou. O cooldown pertence a cada instancia de `Player`, portanto um
disparo nao bloqueia o outro.

## Colisoes e inimigos

`Player Bullet x Enemy` continua usando AABB. Ao destruir o inimigo, o jogo
remove a entidade, soma score e entrega a recompensa de energia ao `playerId`
do ultimo tiro. Inimigos normais continuam com 1 HP e fortes com 3 HP.

`Enemy Bullet x Player` testa os dois jogadores vivos. O primeiro jogador
atingido recebe dano e o projetil e removido, evitando dano duplo. A
invencibilidade e aplicada somente ao jogador que recebeu o dano.

Quando um inimigo dispara, `Game` cria uma lista de jogadores vivos e escolhe
um deles aleatoriamente. Um jogador morto nunca e escolhido; se apenas um
estiver vivo, ele e o unico alvo. A direcao inimiga continua sendo calculada
uma vez no disparo e nao e teleguiada.

## Poder especial e HUD

O poder mantem `Fire Rate x2` e `Projectile Speed x2` durante oito segundos.
E ativado com E para o Player 1 e ShiftLeft para o Player 2. Energia cheia
mostra `P1 POWER READY` ou `P2 POWER READY`; durante a ativacao o HUD mostra o
tempo restante de cada nave. Vida, energia e poderes aparecem em linhas
separadas.

## Game Over cooperativo

Um jogador com `health <= 0` fica morto, desaparece do Canvas, nao se move, nao
atira, nao usa especial e nao recebe mais colisoes. O jogo continua enquanto
o outro estiver vivo. `GAME OVER` so aparece quando os dois jogadores morrem.

Pressionar Enter chama `resetGame()` e restaura as duas naves, posicoes, HP,
energia, timers, cooldowns, arrays de inimigos e tiros, score e estado de
Game Over.

## Testes da etapa

`tests/tests.js` cobre controles com `event.code`, simultaneidade, limites do
Canvas, tiro horizontal, cooldowns independentes, remocao do mouse, inimigos,
colisoes, energia por dono do tiro, vida, invencibilidade, poderes separados,
alvos vivos, progressao da fase, eventos, DREADNOUGHT, laser, Developer Mode,
Game Over, reinicio, HUD, spawn e AABB. Após o deploy, execute em
`/tests/test-runner.html`, na mesma URL pública do site.

As secoes antigas que descreviam mira e disparo pelo mouse pertencem a versao
anterior do prototipo; a implementacao e as regras desta secao representam a
versao cooperativa atual.

# Sistema de fases e campanha - versao 1.0

`Level` controla a progressao por distancia virtual, sem depender da posicao X
de nenhuma nave. As dez configuracoes usam trechos normais de aproximadamente
45-51 s, tres ondas roteirizadas e um boss. O HUD exibe o numero, nome e
porcentagem da fase atual.

Os intervalos e as chances de inimigos sao configurados por `spawnPhases` em
`LEVEL_CONFIG`. Os eventos usam IDs registrados por `Level` para acontecerem
uma unica vez:

| Marco | Onda normal | Onda forte |
|---:|---:|---:|
| 25% | 5 | 0 |
| 50% | 3 | 2 |
| 75% | 5 | 3 |

Ao chegar a 100%, o spawn normal para. A fila de evento e os inimigos que ainda
estao ativos terminam normalmente. Quando a tela fica limpa, o estado muda para
`BOSS_WARNING` por 2,5 s e depois para `BOSS_FIGHT`.

## Estados internos da fase

```text
LEVEL_PLAYING -> LEVEL_CLEARING -> BOSS_WARNING -> BOSS_FIGHT -> STAGE_CLEAR
```

`LEVEL_PLAYING` atualiza distancia, spawn e eventos. `LEVEL_CLEARING` aguarda
inimigos e fila zerarem. `BOSS_WARNING` apenas exibe o aviso. Em
`BOSS_FIGHT`, o progresso deixa de ser a informacao principal do HUD e a barra
de HP do boss assume seu lugar. A fase termina quando o boss conclui sua
animacao de derrota.

# Sistema de Boss

## DREADNOUGHT e catalogo de bosses

O primeiro boss e implementado em `js/entities/Boss.js`, separado de `Game`.
Ele entra pela direita ate `combatX`, oscila verticalmente entre os limites
configurados e possui 80 HP. O dano dos tiros dos jogadores continua usando a
colisao AABB. O HUD mostra `DREADNOUGHT`, HP atual e HP maximo.

Ao zerar o HP, o boss interrompe seus ataques, mostra uma animacao simples de
derrota, soma 5.000 pontos e leva ao `Stage Clear` intermediario. Enter ou a
contagem automatica carrega a fase seguinte.

## Metralhadora

Durante a luta, o DREADNOUGHT faz rajadas de cinco projeteis, com intervalo de
aproximadamente 0,14 s entre tiros. A rajada escolhe um jogador vivo no inicio;
se esse jogador morrer, cada tiro restante procura outro jogador vivo. Cada
projetil causa 1 de dano e usa `BULLET_OWNER.BOSS`.

## Laser

O laser possui aproximadamente 2 s de carga com telemetria amarela, 0,8 s de
ativacao vermelha e cooldown de 8 s. Durante `CHARGING`, o DREADNOUGHT continua
seu movimento vertical e o telegraph acompanha `laserCannonY`. Quando a carga
termina, a transicao para `FIRING` ocorre na posicao atual: o boss congela, o
laser permanece conectado ao canhao e a metralhadora fica bloqueada. Ao entrar
em `COOLDOWN`, o boss retoma o movimento. O retangulo horizontal pode atravessar
ambos os jogadores no cooperativo, mas cada jogador recebe no maximo um acerto
por ativacao. O dano configurado e 3.

# Developer Mode

O menu possui a opcao `MODO DESENVOLVEDOR: ON/OFF`, desligada por padrao. Ela
nao usa `localStorage`: o valor permanece enquanto a instancia de `Game` fica
aberta e continua disponivel ao retornar ao menu.

Quando ativo, o HUD mostra `DEV MODE - INVINCIBLE`. O modo bloqueia somente a
reducao de HP dos jogadores ativos. Tiros continuam sendo criados, inimigos e
boss continuam atacando, colisao continua sendo testada e os projeteis sao
consumidos; assim ele serve para testar a fase sem remover as interacoes.

# Arquitetura de expansao - versao 1.0

## Catalogos de configuracao

As configuracoes foram separadas em `js/config/levels.js`,
`js/config/bosses.js` e `js/config/enemies.js`. `constants.js` reexporta os
nomes usados pela versao anterior para manter imports estaveis.

Uma fase possui, no minimo:

| Propriedade | Funcao |
|---|---|
| `id` / `name` | identificacao da fase |
| `maxDistance` / `scrollSpeed` | progressao virtual |
| `enemySpawnRate` | fallback de inimigos por segundo |
| `backgroundType` | tema consumido pelo parallax |
| `bossId` | chave do catalogo de bosses |
| `events` | eventos ordenados por progresso |
| `difficultyMultiplier` | escala de dificuldade dos inimigos |

`Game` nao decide comportamento por numero da fase. Ele le a configuracao
ativa, consulta `bossId` no catalogo e entrega os dados ao `Level`.

## Eventos e ondas

Cada evento possui um `id`, `progress`, `type` e dados proprios. Eventos de tipo
`wave` usam grupos com `enemyType`, `count`, `interval`, `y` e `pattern`
opcionais. `Level` registra IDs disparados em um `Set`, evitando flags
especificas como `wave25Triggered` para cada fase.

`WaveSystem` transforma os grupos em uma fila ordenada. Cada item conserva seu
tipo e intervalo, e `SpawnSystem` delega a criacao para `EnemyFactory`. Assim
uma fase pode misturar normal, strong, fast, shooter e kamikaze sem escrever
um novo bloco de spawn.

## Configuracao e ataques de bosses

`js/config/bosses.js` exporta `BOSSES`, um catalogo indexado por ID. Cada boss
pode descrever nome, tamanho, HP, movimento, recompensa e a lista de ataques.
O DREADNOUGHT continua com os mesmos valores e usa dois componentes pequenos:

- `MachineGunAttack.js` controla alvo, rajada, intervalo e cooldown;
- `SpreadShotAttack.js` cria aberturas de projeteis com angulos configuraveis;
- `BurstShotAttack.js` dispara rajadas curtas com alvo travado;
- `DoubleLaserAttack.js` controla dois feixes, telegraphs e um Set por feixe;
- `ProjectileWallAttack.js` cria paredes parciais com abertura segura;
- `SummonMinionsAttack.js` solicita ondas limitadas de inimigos auxiliares;
- `ChargeAttack.js` trava um alvo durante uma carga telegraphed;
- `LaserAttack.js` controla carga, telegraph, eixo Y, ativacao e Set de
  jogadores atingidos. Seus estados explicitos sao `IDLE`, `CHARGING`,
  `FIRING` e `COOLDOWN`: o eixo acompanha o canhao na carga e fica estavel
  somente enquanto o disparo esta ativo. O `Boss` percorre `attackSequence`
  com uma pausa configuravel e evita repetir o mesmo ataque imediatamente.

`Boss.js` continua sendo a entidade visual e de vida. O Game nao possui
condicionais espalhadas por tipo de boss.

## Novos tipos de inimigos e fabrica

`Enemy` interpreta `ENEMY_TYPE_CONFIG` e compartilha dano, flash, renderizacao
e disparo. Os tipos atuais sao:

| Tipo | Comportamento | HP | Observacao |
|---|---|---:|---|
| `NORMAL` | linear | 1 | base |
| `STRONG` | linear | 3 | maior recompensa |
| `FAST` | linear rapido | 1 | nao dispara |
| `SHOOTER` | para em `stopX` | 2 | dispara durante a parada |
| `KAMIKAZE` | persegue alvo vivo | 1 | dano de contato 1 |

`EnemyFactory` e o unico ponto que converte tipo e opcoes de spawn em entidade.
`KAMIKAZE` escolhe um alvo, faz uma unica passagem de ataque e entra em
`ESCAPING` quando seu centro ultrapassa o centro X do alvo. Ele pode trocar de
alvo somente na aproximacao inicial se o alvo morrer; depois da passagem nao
recalcula a rota nem retorna para a direita. A colisao de contato e resolvida
pelo Game, respeitando Developer Mode e invencibilidade.

## Cenario, parallax e pixel art

`ParallaxSystem` cria tres camadas fixas de estrelas geometricas: distante,
media e proxima. Cada camada possui multiplicador de velocidade, reutiliza
estrelas que saem pela esquerda e nao aumenta arrays durante a partida.
`backgroundType` aceita os dez temas `space`, `asteroid`, `nebula`, `fleet`,
`planet`, `debris`, `ion`, `station`, `mothership` e `final`. Cada tema possui
paleta e decoracao procedural propria. O Canvas continua com
`imageSmoothingEnabled = false`.

## Efeitos visuais

`EffectsSystem` e deliberadamente pequeno e separado de colisao:

- inimigos piscam brevemente ao receber dano;
- explosoes usam retangulos coloridos e duracao curta;
- boss derrotado gera explosao maior;
- screen shake leve ocorre na ativacao do laser e na explosao do boss;
- todos os efeitos sao removidos por tempo e nao acumulam indefinidamente.

O shake e aplicado somente durante a renderizacao do Canvas, com HUD e DOM
fora do deslocamento. Se o contexto de teste nao possuir `save/translate`, a
renderizacao segue sem shake em vez de gerar erro.

# Sistema de Audio

## AudioManager

`js/systems/AudioManager.js` concentra todos os efeitos e cria no maximo um
`AudioContext` por instancia. O contexto e criado sob demanda e `unlock()` e
chamado por interacoes de teclado antes dos sons do menu e da partida, cobrindo
a politica de autoplay dos navegadores. Se a Web Audio API nao estiver
disponivel, o jogo continua funcionando sem audio.

Os sons retro 16-bit sao sintetizados sem arquivos externos:

| Evento | Sintese usada |
|---|---|
| Tiro do jogador | onda quadrada com queda de frequencia |
| Tiro inimigo | onda dente-de-serra descendente |
| Rajada do boss | pulsos curtos por projetil |
| Acerto/explosao | tom curto, ruido filtrado e queda de frequencia |
| Dano do jogador | tom quadrado grave |
| Poder especial | dois tons ascendentes |
| Warning do boss | tres pulsos agudos espacados |
| Acerto no boss | tom triangular grave |
| Carga/disparo do laser | varredura crescente, ruido e tons graves |
| Double Laser | carga e disparo com timbre proprio, reutilizando a familia do laser |
| Spread/Burst Shot | tons curtos distintos por padrao de projetil |
| Summon/Projectile Wall/Charge | tons retro de invocacao, parede e carga |
| Explosao do boss | ruido filtrado e camadas descendentes |
| Menu/stage clear | tons curtos de confirmacao e sequencia ascendente |

O gerenciador usa osciladores, `GainNode`, ruido em `AudioBuffer` e filtro
quando necessario. `masterVolume` e `sfxVolume` sao independentes, e limites
curtos evitam criar uma camada excessiva de sons em rajadas. A musica foi
removida nesta etapa; o `AudioManager` permanece dedicado somente a SFX.

O som de dano do jogador so e disparado quando `Player.takeDamage()` retorna
verdadeiro. Portanto Developer Mode pode continuar processando colisao e
consumindo projeteis sem produzir um falso feedback de perda de HP.

O fluxo visual e logico do laser ficou explicito:

```text
NORMAL
  ↓
LASER_CHARGING  -> boss ainda se move e a linha acompanha o canhao
  ↓
LASER_FIRING    -> boss parado e laser conectado ao canhao
  ↓
LASER_COOLDOWN  -> ataques podem voltar e o boss retoma o movimento
  ↓
NORMAL
```

## Estados do menu

O fluxo global agora distingue `MAIN_MENU` (alias mantido como `MENU`),
`CONTROLS_MENU`, `PLAYING`, `GAME_OVER`, `STAGE_CLEAR` e `CAMPAIGN_CLEAR`. O
menu apresenta:

```text
1 JOGADOR
2 JOGADORES
CONTROLES
MODO DESENVOLVEDOR: ON/OFF
DEBUG: ON/OFF
```

`Enter` confirma a opcao, `W/S` e setas navegam e `Escape` retorna da tela de
controles. O Stage Clear intermediario mostra a proxima fase e avanca com
Enter ou apos tres segundos. A tela final mostra score, tempo da campanha e
retorna ao menu com Enter. Nao foram adicionados remapeamento, saves ou menu
de volume.

## Roteiro das dez fases

Todas as dez fases sao jogaveis pelo mesmo fluxo de `Level`, `WaveSystem`,
`EnemyFactory` e `Boss`. A duracao planejada do trecho normal fica entre 45 e
51 segundos; com warnings, entradas e bosses, a campanha tende a ficar em
12-14 minutos e deve permanecer abaixo de 15 minutos em uma partida normal.

| Stage | Nome | Tema | Inimigos principais | Boss |
|---:|---|---|---|---|
| 01 | Outer Space | Espaco aberto | Normal, Strong, Fast | dreadnought |
| 02 | Asteroid Belt | Asteroides | Fast, Normal, Kamikaze | asteroidCrusher |
| 03 | Nebula | Nebulosa | Shooter, Normal, Strong | nebulaWraith |
| 04 | Enemy Fleet | Frota | Normal, Strong, Shooter, Fast | fleetCommander |
| 05 | Broken Planet | Planeta destruido | Kamikaze, Strong, Fast | planetBreaker |
| 06 | Debris Field | Destrocos | Shooter, Kamikaze, Fast | scrapTitan |
| 07 | Ion Storm | Tempestade de ions | Fast, Shooter, Strong | ionSerpent |
| 08 | Space Station | Estacao inimiga | Shooter, Strong, Kamikaze | stationGuardian |
| 09 | Mothership Approach | Nave-mae | Todos | mothershipShield |
| 10 | Final Assault | Batalha final | Todos | overlordCore |

Cada fase tem tres eventos de onda em marcos de progresso, pesos de spawn
proprios e um `backgroundType` diferente. O aumento de dificuldade prioriza
composicao, ritmo e frequencia, sem aplicar multiplicador automatico de 2x no
cooperativo.

| Boss | HP | Ataques principais |
|---|---:|---|
| Dreadnought | 80 | Machine Gun + Laser |
| Asteroid Crusher | 90 | Machine Gun + Spread Shot |
| Nebula Wraith | 100 | Spread Shot + Laser |
| Fleet Commander | 110 | Machine Gun + Spread Shot |
| Planet Breaker | 120 | Machine Gun + Laser |
| Scrap Titan | 130 | Spread Shot + Laser |
| Ion Serpent | 140 | Machine Gun + Spread Shot |
| Station Guardian | 150 | Machine Gun + Laser |
| Mothership Shield | 165 | Machine Gun + Spread Shot + Laser |
| Overlord Core | 180 | Machine Gun + Spread Shot + Laser |

## Safe Area e resolucao

O Canvas logico usa 1440x810 e continua responsivo pelo CSS. A constante
`HUD_SAFE_ZONE_HEIGHT` reserva os primeiros 110 px para score, vidas, energia,
fase e boss health. A area de gameplay comeca em `PLAY_AREA_TOP = 120` e termina
28 px antes da borda inferior.

`EnemyFactory` aplica o clamp da safe area tanto ao spawn aleatorio quanto a
posicoes explicitas de ondas. Assim Normal, Strong, Fast, Shooter e Kamikaze
nao surgem sob o HUD nem parcialmente fora da tela. Kamikaze pode perseguir
normalmente depois de aparecer. Players e limites verticais do boss tambem
respeitam a faixa jogavel.

## Debug Panel externo

O painel tecnico foi removido do Canvas e vive no `aside#debugPanel` do HTML.
Ele aparece somente quando `DEBUG === true` ou quando o toggle do menu o ativa,
fica ao lado do Canvas em telas
largas e abaixo dele em telas menores. Mostra FPS, fase, estado, tempos,
quantidades de tiros/inimigos, boss e posicoes dos jogadores.

`Developer Mode` e uma regra de gameplay: torna os jogadores invenciveis.
`DEBUG` e uma configuracao de observabilidade: apenas exibe informacoes
tecnicas e nao altera colisao, dano ou dificuldade.

## Progressao entre fases

Ao concluir um boss intermediario, o jogo preserva o score e a energia. Cada
Player vivo recebe +1 HP sem ultrapassar 5; um Player morto e revivido com 3 HP
na proxima fase. A fase seguinte limpa bullets, inimigos, ondas, boss, efeitos,
timers e eventos, mas nao zera a campanha.

O tempo total da campanha continua durante trechos normais, warnings, lutas e
transicoes automaticas de Stage Clear; o tempo parado no menu nao e incluido.
Cada tempo de fase fica em `stageTimes` para consulta e balanceamento. Depois do boss
da Stage 10, `CAMPAIGN_CLEAR` exibe `MISSION ACCOMPLISHED`, `GALAXY SECURED`,
score final e `CAMPAIGN TIME`.

## Developer Skip

Com Developer Mode ativo, `PageDown` funciona como atalho exclusivo de teste:

- em trecho normal, avanca ao proximo checkpoint de onda;
- durante o warning, libera imediatamente a entrada do boss;
- durante o boss, conclui a luta rapidamente.

A tecla nao aparece nos controles normais e nao produz efeito quando Developer
Mode esta desligado.

A campanha atual possui um boss funcional por fase, totalizando dez bosses.
O DREADNOUGHT foi preservado na Stage 01 e os demais usam componentes
reutilizaveis de metralhadora, lasers, spread, burst, wall, summon e charge.

## Kamikaze Attack Run

O fluxo do Kamikaze e deliberadamente finito:

```text
TARGET
  ↓
ATTACK RUN
  ↓
HIT ou MISS
  ↓
ESCAPING
```

Ao surgir, ele escolhe um jogador vivo e corrige a rota enquanto se aproxima.
Se o alvo morrer durante a aproximacao inicial, uma nova escolha pode ser feita
somente enquanto ainda existe distancia suficiente para iniciar a passagem.
Quando o centro do Kamikaze ultrapassa o centro X do alvo, a tentativa termina:
o estado vira `ESCAPING`, a velocidade horizontal continua apontando para a
esquerda e nenhum novo alvo e procurado. Isso impede a curva de 180 graus e o
retorno para a direita, inclusive no multiplayer.

## Energia contra Bosses

Um projetil de jogador que realmente reduz o HP de um boss concede energia ao
jogador identificado em `Bullet.playerId`:

```text
Boss Hit Reward = Normal Enemy Energy Reward × 0.5
```

Com `NORMAL_ENEMY_ENERGY_REWARD = 20`, o valor atual de
`BOSS_HIT_ENERGY_REWARD` e `10`. O jogador que acertou recebe a energia, o
outro jogador nao, e `Player.addEnergy()` continua limitando o total a
`maxEnergy`. Tiros que erram, projeteis consumidos por outra colisao ou hits
depois da morte do boss nao geram recompensa.

## Boss Attack System

Cada boss possui uma `attackSequence` orientada a dados. O diretor percorre a
sequencia, aplica cooldown entre ataques e evita repetir imediatamente o mesmo
ataque quando ha outras opcoes. Ataques de maior risco possuem telegraph e
janela de leitura:

- **Machine Gun:** rajada curta direcionada;
- **Single Laser:** um feixe com carga, disparo e Set de jogadores atingidos;
- **Double Laser:** dois feixes em alturas diferentes, cada um com sua colisao;
- **Spread Shot:** cinco projeteis em leque;
- **Burst Shot:** tres tiros em rajada com alvo travado;
- **Projectile Wall:** parede parcial com abertura configuravel;
- **Summon Minions:** onda pequena respeitando limite de quatro minions vivos;
- **Charge Attack:** carga telegraphed que libera um projetil pesado.

| Stage | Boss | Ataques principais |
|---:|---|---|
| 01 | Dreadnought | Machine Gun, Laser |
| 02 | Asteroid Crusher | Burst, Charge |
| 03 | Nebula Wraith | Spread, Laser |
| 04 | Fleet Commander | Machine Gun, Spread, Minions |
| 05 | Planet Breaker | Double Laser, Burst |
| 06 | Scrap Titan | Projectile Wall, Machine Gun, Minions |
| 07 | Ion Serpent | Spread, Double Laser, Charge |
| 08 | Station Guardian | Machine Gun, Wall, Minions, Laser |
| 09 | Mothership Shield | Double Laser, Spread, Wall, Minions |
| 10 | Overlord Core | Machine Gun, Double Laser, Spread, Burst, Wall, Minions |

Durante o Double Laser, o boss continua se movendo na carga e para apenas no
disparo. Cada feixe causa 2 HP por disparo e registra os jogadores atingidos
separadamente. Minions nascem pelo `EnemyFactory`, respeitam a Safe Area,
concedem score/energia normalmente e sao removidos sem recompensa extra quando
o boss termina a luta.

## 29. Identidade de STELLAR ASSAULT

O nome oficial do projeto é **STELLAR ASSAULT**. A direção visual combina
ficção científica militar, contraste neon e leitura imediata de arcade. Ciano
identifica tecnologia aliada, verde a segunda nave, amarelo energia,
vermelho/rosa perigo e roxo o espaço profundo. O Canvas permanece sem
suavização para preservar os blocos de pixel.

## 30. Direção de arte procedural

Os visuais são construídos pelo renderer `js/utils/PixelArt.js`, usando mapas
de pixels, retângulos em coordenadas inteiras, camadas de parallax, paletas por
tema e ciclos curtos de animação. P1 é um interceptor azul fino; P2 é uma
nave verde pesada com duas asas; o modo Power adiciona halo e chama pulsante.
Normal, Strong, Fast, Shooter e Kamikaze têm silhuetas próprias. Cada boss
preserva identidade de catálogo com núcleo, blindagem, canhões e telegraphs.
As fases usam os dez temas de cenário, incluindo asteroides, nebulosa, frota,
planeta, destroços, tempestade iônica, estação, nave-mãe e corredor final.

## 31. Sistema de áudio sem música

`AudioManager` concentra somente SFX retro. Não existem músicas de menu, fase
ou boss, loops, timers musicais ou transições. O desbloqueio do `AudioContext`
continua dependendo de interação do teclado antes de efeitos como tiro, menu,
warning e explosões.

## 32. Progressão de dificuldade

Stages 01–05 preservam o ritmo principal. A partir da Stage 06, bosses usam
rajadas com intervalo aproximado de 130–150 ms, sem aumentar o dano. A partir
da Stage 08, além do `Summon Minions`, há uma ou duas naves `Normal`, `Fast` ou
`Shooter` a cada 12 s, com limite de 3–4 minions vivos. Os telegraphs mantêm
aberturas de leitura; o objetivo não é criar bullet hell. A campanha continua
com duração estimada de 12–14 minutos e limite planejado abaixo de 15 minutos.

## 33. Debug e Developer Mode

`Developer Mode` e `Debug` são controles distintos. Developer Mode torna as
naves invencíveis e mantém colisões; Debug apenas expõe telemetria fora do
Canvas. `DEBUG` começa como `false` e o menu oferece `DEBUG: ON/OFF`. Desligado,
o painel externo fica oculto sem reservar espaço. Ligado, informa FPS, fase,
estado, timers, projéteis, ataque atual, minions e posição dos players.

## 34. Validação do polimento

As verificações cobrem renderização das naves e cinco inimigos, ausência de
música, Debug desligado, intro e Stage Clear,
reforços Stage 08+, cadência de bosses, limite de minions, Safe Area, energia,
Kamikaze de uma passagem, vida máxima 5, poder, modos solo/2P e conclusão das
dez fases. O runner continua em `tests/test-runner.html`; sem navegador, a
validação estática de imports, delimitadores e configuração é determinística.

## 35. Visual Quality Review

O redesign usa mapas de pixels para jogadores/inimigos e perfis modulares de
boss em `Boss.drawBossArt()`. A silhueta é formada antes dos highlights, com
placas, sombra, núcleo, armas e motores em camadas discretas.

| Boss | Silhueta e elementos principais | Armas visíveis | Inspiração e diferença |
|---|---|---|---|
| Dreadnought | Capital ship largo, ponte central, casco em degraus e quatro motores | Canhão frontal e torres superiores/inferiores | Nave militar/capital; é o único perfil de casco de ponte pesada |
| Asteroid Crusher | Máquina industrial com broca frontal, anéis de núcleo e tubos | Broca, canhões laterais e emissores | Triturador/minerador; não compartilha a leitura de nave militar |
| Nebula Wraith | Interceptor alienígena fino, asas curvas e cauda energética | Emissor central e pontos de energia | Wraith biomecânico; foco em curva, vazio interno e ciano |
| Fleet Commander | Carrier com pods laterais, hangar central e ponte iluminada | Torres nos pods e canhões de comando | Porta-naves; módulos independentes justificam os minions |
| Planet Breaker | Warship alongado com duas foices laterais e núcleo vertical | Dois emissores integrados de Double Laser | Nave vermelha de foices; as armas fazem parte das asas |
| Scrap Titan | Titã assimétrico com placas reaproveitadas, tubos e sucata | Canhões em lados diferentes | Fortaleza industrial recuperada; assimetria deliberada |
| Ion Serpent | Corpo segmentado, aletas e linhas de energia como criatura | Emissor frontal e condutores segmentados | Nave biomecânica; transmite velocidade e movimento ondulante |
| Station Guardian | Plataforma horizontal com torres, radar e módulos de hangar | Torres repetidas, radar e emissores | Plataforma defensiva; menos nave, mais instalação móvel |
| Mothership Shield | Fortaleza escura, módulos laterais e projetor vertical | Canhões modulares e emissor de escudo | Catedral espacial; alta densidade e barreira antes do final |
| Overlord Core | Núcleo alienígena vertical, lâminas laterais e componentes simétricos | Quatro canhões, emissores e motores inferiores | Máquina alienígena superior; é a única silhueta de coração vertical e lâminas |

O gate de silhueta deve continuar válido em uma cor única: Player 1 e Player 2
usam mapas diferentes, os cinco inimigos possuem mapas próprios e os dez
bosses usam construções distintas por ID, não apenas troca de cor.

## 36. Constantes importantes de balanceamento

| Constante | Valor atual |
|---|---:|
| `PLAYER_MAX_HEALTH` | 5 |
| `PLAYER_MAX_ENERGY` | 100 |
| `PLAYER_INVINCIBILITY_DURATION` | 1 s |
| `PLAYER_SHOOT_COOLDOWN` | 0,25 s |
| `PLAYER_BULLET_SPEED` | 780 px/s |
| `NORMAL_ENEMY_HEALTH` | 1 |
| `STRONG_ENEMY_HEALTH` | 3 |
| `NORMAL_ENEMY_SPAWN_CHANCE` | 70% |
| `NORMAL_ENEMY_ENERGY_REWARD` | 20 |
| `BOSS_HIT_ENERGY_REWARD` | 10 (50% do Normal) |
| `STRONG_ENEMY_ENERGY_REWARD` | 35 |
| `POWER_DURATION` | 8 s |
| `POWER_FIRE_RATE_MULTIPLIER` | 2× |
| `POWER_PROJECTILE_SPEED_MULTIPLIER` | 2× |
