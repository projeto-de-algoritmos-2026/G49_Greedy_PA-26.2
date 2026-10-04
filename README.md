# Planejador de recargas para veículos elétricos

Trabalho 2 de Projeto de Algoritmos (UnB/FCTE, 2026/2), Grupo 49, Algoritmos Ambiciosos.
O site calcula em quais eletropostos um carro elétrico deve parar para fazer uma viagem com
o menor número possível de recargas. Para isso usa o algoritmo do Caminhoneiro
(*Selecting Breakpoints*).

## Demo

Versão publicada no GitHub Pages (branch `main`, pasta raiz):
**<https://projeto-de-algoritmos-2026.github.io/G49_Greedy_PA-26.2/>**

## O problema real

Um carro elétrico na rodovia tem autonomia limitada, e os eletropostos ficam em pontos fixos
e às vezes distantes entre si. Parar em todos faz perder tempo. Parar de menos deixa o carro
sem bateria no meio do caminho. O objetivo é chegar ao destino com o **menor número de
paradas de recarga**, sem nunca percorrer um trecho maior que a autonomia disponível. O
projeto traz duas rotas de exemplo (`dados.js`): **Brasília → Goiânia** (209 km, 6
eletropostos) e **Brasília → São Paulo** (1015 km, 18 eletropostos), com posições
ilustrativas.

Um algoritmo guloso é adequado porque, em cada ponto, só importa até onde o carro consegue
chegar. Ir até a estação mais distante alcançável nunca deixa o carro em situação pior que
qualquer outra escolha, e por isso basta uma passada pela rota, sem testar combinações de
paradas.

## Modelagem

**Rota.** A rodovia é um segmento de reta de comprimento `L` (km). Cada eletroposto vira uma
posição b_i, em km desde a origem. A origem e o destino entram como extremos:

```
0 = b₀ < b₁ < … < bₙ₋₁ < bₙ = L
```

**Autonomia.** `C` é a autonomia nominal do carro (km com 100% de bateria). A bateria
inicial e a reserva mínima são frações entre 0 e 1 (a interface converte os percentuais
dividindo por 100). O carro nunca pode chegar a um ponto com menos que a reserva:

- primeiro trecho (sai da origem com a bateria inicial): C₁ = C · (bateria_inicial − reserva)
- trechos seguintes (sai de uma recarga com 100%): C₂ = C · (1 − reserva)

Um ponto b_j é alcançável a partir de b_i quando b_j − b_i ≤ alcance, onde o alcance é C₁ no
primeiro trecho e C₂ nos demais. O código usa uma tolerância de 1e-9 para erro de ponto
flutuante.

**Entrada e saída.** O `core.js` expõe `window.Caminhoneiro = { caminhoneiro, planejar }`.

```js
planejar(rota, autonomia, bateriaIni, reserva)
```

- `rota`: objeto de `dados.js` com `L` (km) e `estacoes` (lista de km desde a origem).
- `autonomia`: C, em km.
- `bateriaIni`, `reserva`: frações (ex.: `1.0` e `0.10`).

`planejar` calcula `c1 = max(0, C · (bateriaIni − reserva))` e `c2 = C · (1 − reserva)`.
Depois monta `b`: remove estações repetidas e fora da rota (≤ 0 ou ≥ L), ordena e acrescenta
0 e `L`. Por fim chama:

```js
caminhoneiro(b, c1, c2)
```

Retorno de `planejar`: `{ b, c1, c2, viavel, paradas, bloqueio? }`.

- `paradas`: **índices** em `b` das estações onde o carro recarrega, em ordem. O destino
  não conta como parada.
- Rota viável: `viavel: true`, e `paradas.length` é o número de paradas.
- Rota inviável: `viavel: false` e `bloqueio = i`, indicando que o trecho de `b[i]` a
  `b[i+1]` é maior que o alcance disponível. `paradas` traz as paradas feitas até esse
  ponto.

**Estratégia gulosa.** Na posição atual, ir até a estação mais distante que ainda é
alcançável e recarregar ali. Se nem a próxima estação for alcançável, a rota é inviável.

**Hipóteses.**

- Toda recarga vai até 100%.
- O desvio entre a rodovia e o eletroposto é ignorado (a estação fica sobre a rota).

O detalhamento dessas limitações está em [Limitações](#limitações).

## Exemplo

Resultado das duas rotas de `dados.js` com os valores que a página usa ao abrir: autonomia
igual à `sugestao` da rota, bateria ao sair 100% e reserva 10%. Os números abaixo são os
mesmos que a página mostra na tabela "Trechos da viagem".

Legenda: `■` origem/destino · `●` parada de recarga · `○` estação ignorada.

### Brasília → Goiânia (L = 209 km, C = 150 km)

C₁ = C₂ = 150 · (1 − 0,10) = 135 km.

```
km   0      38     72     95     131    160    186    209
     ■──────○──────○──────○──────●──────○──────○──────■
     Brasília                 parada            Goiânia
     └────────── 131 km ─────────┘└────── 78 km ──────┘
```

- No km 0 o carro alcança até o km 135: estações 38, 72, 95 e 131. O guloso escolhe a mais
  distante, **km 131**.
- No km 131 alcança até o km 266, que passa de 209: segue direto para Goiânia.

**1 parada** (km 131).

| De             | Para           | Distância | Bateria na chegada |
|----------------|----------------|----------:|-------------------:|
| Brasília       | Estação km 131 |    131 km |                13% |
| Estação km 131 | Goiânia        |     78 km |                48% |

### Brasília → São Paulo (L = 1015 km, C = 350 km)

C₁ = C₂ = 350 · (1 − 0,10) = 315 km.

```
Brasília ══285 km══▶ ● km 285 ══275 km══▶ ● km 560 ══270 km══▶ ● km 830 ══185 km══▶ São Paulo
 (km 0)                                                                            (km 1015)

ignoradas:  60 110 170 230 │ 330 390 440 505 │ 610 665 720 770 │ 880 940 985
```

| Posição atual | Alcança até | Mais distante alcançável  | Primeira fora do alcance |
|---------------|-------------|---------------------------|--------------------------|
| km 0          | km 315      | **km 285**                | km 330                   |
| km 285        | km 600      | **km 560**                | km 610                   |
| km 560        | km 875      | **km 830**                | km 880                   |
| km 830        | km 1145     | destino (km 1015)         | —                        |

**3 paradas** (km 285, 560 e 830).

| De             | Para           | Distância | Bateria na chegada |
|----------------|----------------|----------:|-------------------:|
| Brasília       | Estação km 285 |    285 km |                19% |
| Estação km 285 | Estação km 560 |    275 km |                21% |
| Estação km 560 | Estação km 830 |    270 km |                23% |
| Estação km 830 | São Paulo      |    185 km |                47% |

### Rota inviável

Em Brasília → São Paulo com autonomia de 40 km (reserva 10%), C₁ = C₂ = 36 km, mas a
primeira estação fica no km 60. `planejar` devolve `viavel: false` e `bloqueio: 0`, e a
página mostra o trecho km 0 → km 60 em vermelho: "faltam 24 km de autonomia".

## Prova de otimalidade

**Enunciado.** Se a rota é viável, o guloso chega a `L` com o menor número possível de
paradas. Se o guloso declara a rota inviável, então nenhuma solução existe.

**O que é uma solução válida.** Uma lista de paradas o_1 < o_2 < … < o_m, escolhidas entre
os b_i, tal que (com o_0 = 0):

- o primeiro trecho cabe em C₁: o_1 − 0 ≤ C₁ (ou `L` ≤ C₁, se m = 0);
- cada trecho seguinte cabe em C₂: o_{k+1} − o_k ≤ C₂, e também `L` − o_m ≤ C₂.

Como a bateria inicial é no máximo 1, vale C₁ ≤ C₂.

### Corretude da inviabilidade

O guloso para com `bloqueio = i` quando, estando em b_i, nem o ponto seguinte b_{i+1} é
alcançável: b_{i+1} − b_i > alcance, onde o alcance é C₁ se i = 0 (o carro ainda não saiu
da origem) e C₂ se i > 0.

Entre b_i e b_{i+1} não há nenhum eletroposto, porque os pontos estão ordenados e são
consecutivos. Então qualquer solução precisa atravessar esse trecho num único salto: sair de
algum ponto x ≤ b_i e só parar de novo em algum y ≥ b_{i+1}. Esse salto mede
y − x ≥ b_{i+1} − b_i.

- Se i = 0, o salto sai obrigatoriamente da origem, com alcance C₁ < b_1 − b_0.
- Se i > 0, o salto tem alcance no máximo C₂ (ou C₁ ≤ C₂, se sair da origem), e
  b_{i+1} − b_i > C₂.

Nos dois casos o salto é maior que a autonomia disponível, logo nenhuma solução existe. Em
particular, quando a bateria inicial não passa da reserva, C₁ = 0 e a rota é inviável já no
primeiro trecho, o que está certo: o carro não pode sair sem ficar abaixo da reserva.

Consequência usada a seguir: **se a rota é viável, o guloso nunca trava** e sempre chega a
`L`.

### Greedy stays ahead

Suponha a rota viável. Sejam g_1 < g_2 < … < g_p as paradas do guloso e o_1 < … < o_m as de
uma solução ótima qualquer (m mínimo), com g_0 = o_0 = 0.

**Lema.** Para todo k ≤ min(p, m), vale g_k ≥ o_k.

- **Base (k = 1).** A solução ótima sai de 0 e precisa alcançar o_1, então o_1 ≤ C₁. O
  guloso escolhe como g_1 o ponto mais distante dentro de C₁, e o_1 é um desses pontos.
  Logo g_1 ≥ o_1.
- **Passo.** Se g_k ≥ o_k, então o_{k+1} ≤ o_k + C₂ ≤ g_k + C₂. Ou seja, o_{k+1} é
  alcançável a partir de g_k (se o_{k+1} ≤ g_k, a desigualdade vale direto, porque
  g_{k+1} > g_k). Como o guloso escolhe o ponto mais distante alcançável, g_{k+1} ≥ o_{k+1}.

**Conclusão.** Suponha, por absurdo, que o guloso use p > m paradas. Então g_m existe e,
pelo lema, g_m ≥ o_m. A solução ótima termina em `L` a partir de o_m, então
`L` − g_m ≤ `L` − o_m ≤ alcance (C₂, ou C₁ se m = 0). Assim `L` é alcançável a partir de
g_m, e como `L` = b_n é o ponto mais distante da rota, o guloso iria direto para ele sem
fazer outra parada, ou seja, p = m. Contradição. Logo p ≤ m. Como nenhuma solução usa menos
paradas que a ótima, p = m e o guloso é ótimo.

### Onde isso está no código

Tudo fica na função `caminhoneiro` de `core.js`:

- **Escolha gulosa:** o laço interno `while (j < n && b[j+1] - b[i] <= alcance + EPS) j++`
  avança `j` até o ponto mais distante alcançável a partir de `b[i]`. Em seguida `i = j`
  move o carro, e `paradas.push(i)` registra a parada, a não ser que `i` seja o destino
  (`i === n`). A variável `alcance` começa valendo `c1` (C₁) e passa a `c2` (C₂) depois do
  primeiro salto.
- **Detecção de inviabilidade:** `if (j === i) return {viavel:false, paradas, bloqueio:i}`.
  Se `j` não saiu do lugar, nem `b[i+1]` é alcançável, que é exatamente o caso da prova
  acima.
- **Hipótese de ordenação:** o laço pode parar no primeiro ponto inalcançável porque `b`
  está ordenado. Quem garante isso é `planejar`, antes de chamar `caminhoneiro`.
- A tolerância `EPS = 1e-9` só absorve erro de ponto flutuante. A prova supõe aritmética
  exata.

### Quando o guloso deixa de ser ótimo

O argumento depende de duas coisas: o objetivo é só o **número** de paradas, e toda parada
devolve o mesmo alcance C₂. Se o objetivo passar a ser o **menor tempo total** e cada
estação tiver um tempo de recarga diferente (carregador rápido ou lento), a estação mais
distante pode ser a mais lenta, e parar mais vezes em estações rápidas pode sair mais barato.
Se a **recarga parcial** for permitida e o objetivo considerar tempo ou preço da energia, a
decisão passa a incluir quanto carregar em cada estação, e o estado deixa de ser só a
posição. Nesses casos é preciso outro método, como programação dinâmica ou caminho mínimo
num grafo de trechos alcançáveis. Se o objetivo continuar sendo só o número de paradas,
carregar até 100% nunca atrapalha e o guloso continua ótimo.

## Complexidade

Seja n como na Modelagem: `b` tem n + 1 pontos (origem, n − 1 eletropostos e destino), então
n é, na prática, o número de estações.

**Preparação (`planejar`).** As estações **são ordenadas dentro de `planejar`**. Elas não
precisam vir ordenadas em `dados.js`. A função remove repetidas com `new Set` (O(n)), filtra
as que estão fora da rota com `filter` (O(n)) e ordena com `sort((a,b) => a-b)`
(O(n log n)). Já `caminhoneiro` supõe que recebe `b` ordenado e não ordena nada.

**Parte gulosa (`caminhoneiro`): O(n).** O índice `j`, que procura a próxima estação, só
avança e nunca volta: cada iteração do laço externo começa com `j = i`, e `i` é o valor de
`j` da iteração anterior. Assim `j` vai de 0 até no máximo n ao longo de toda a execução.
Cada teste do laço interno ou incrementa `j` (no máximo n vezes no total) ou falha (uma vez
por iteração externa, e há no máximo n iterações, porque `i` sempre aumenta), o que dá no
máximo cerca de 2n comparações.

**Total: O(n log n).** A ordenação domina. Se as estações já chegassem ordenadas, o
algoritmo seria O(n).

**Espaço: O(n).** A lista `paradas` guarda no máximo n − 1 índices. Os vetores auxiliares de
`planejar` (`Set`, `est` e `b`) também ocupam O(n).

| Etapa                         | Onde           | Tempo      |
|-------------------------------|----------------|------------|
| Remover repetidas e filtrar   | `planejar`     | O(n)       |
| Ordenar                       | `planejar`     | O(n log n) |
| Escolha gulosa                | `caminhoneiro` | O(n)       |
| **Total**                     |                | **O(n log n)** |
| Espaço                        |                | O(n)       |


## Como rodar e testar

O projeto é uma página estática (HTML, CSS e JavaScript puros). Não precisa instalar nada, nem ter servidor ou internet.

O jeito mais rápido é abrir a [demo publicada](https://projeto-de-algoritmos-2026.github.io/G49_Greedy_PA-26.2/). Para rodar no seu computador:

### Abrir direto no navegador

1. Clone o repositório:

   ```bash
   git clone https://github.com/projeto-de-algoritmos-2026/G49_Greedy_PA-26.2.git
   cd G49_Greedy_PA-26.2
   ```

2. Abra o arquivo `index.html` no navegador (duplo clique, ou `xdg-open index.html` no Linux, `open index.html` no macOS, `start index.html` no Windows).
3. Escolha a rota e ajuste a autonomia, a bateria ao sair e a reserva de segurança. O resultado é recalculado na hora: número de paradas, diagrama da rota e tabela de trechos.

Para testar uma rota inviável, escolha Brasília → São Paulo e reduza a autonomia até 40 km. A página mostra o trecho em vermelho e quantos km faltam.

Abrir direto (`file://`) funciona porque a página só usa `<script>` comuns, sem módulos ES, sem `fetch` e sem caminhos absolutos.

### Rodar com servidor local

Se preferir abrir por um servidor local, também funciona. Na pasta do projeto:

```bash
python3 -m http.server 8000
```

No Windows o comando costuma ser `python -m http.server 8000`. Com Node instalado, `npx serve` também serve (ele mostra a porta no terminal).

Depois acesse `http://localhost:8000`.

### Testar o núcleo no Node

O algoritmo (`core.js`) não depende da página. Com Node.js instalado, rode na pasta do projeto (sem instalar pacotes):

```bash
node -e "globalThis.window = globalThis; const fs = require('fs'); const ROTAS = eval(fs.readFileSync('dados.js', 'utf8') + ';ROTAS'); eval(fs.readFileSync('core.js', 'utf8')); for (const r of ROTAS) { const p = Caminhoneiro.planejar(r, r.sugestao, 1, 0.1); console.log(r.nome, '| autonomia', r.sugestao, '| viavel:', p.viavel, '| paradas (km):', p.paradas.map(i => p.b[i])); }"
```

Saída esperada (a mesma da seção [Exemplo](#exemplo)):

```
Brasília → Goiânia | autonomia 150 | viavel: true | paradas (km): [ 131 ]
Brasília → São Paulo | autonomia 350 | viavel: true | paradas (km): [ 285, 560, 830 ]
```

O comando funciona no Bash, no Git Bash e no PowerShell. Para testar outro caso, troque os
argumentos de `planejar(rota, autonomia, bateriaIni, reserva)`; bateria e reserva são frações
(`1` = 100%, `0.1` = 10%).

### Checklist de teste manual

| # | O que fazer | O que deve aparecer |
|---|-------------|---------------------|
| 1 | Abrir a página. | Rota Brasília → Goiânia, autonomia 150 km, bateria 100%, reserva 10%. "**1** parada de recarga", "Alcance útil: 135 km no primeiro trecho e 135 km nos demais". No diagrama, só a estação do km 131 em verde. Tabela com 2 trechos: 131 km (13%) e 78 km (48%). |
| 2 | Trocar a rota para Brasília → São Paulo. | A autonomia muda sozinha para 350 km. "**3** paradas de recarga", nos km 285, 560 e 830. Tabela com 4 trechos. |
| 3 | Em São Paulo, subir a autonomia para 600 km. | "**1** parada de recarga", no km 505. |
| 4 | Em São Paulo, descer a autonomia para 40 km. | "Rota inviável", arco vermelho tracejado do km 0 ao km 60 e a mensagem "faltam 24 km de autonomia entre o km 0 e o km 60". Na tabela, o trecho aparece como "sem bateria". |
| 5 | Voltar para Goiânia e subir a autonomia para 235 km. | "**0** paradas de recarga" e "Dá para ir direto, sem recarregar." |
| 6 | Em Goiânia, autonomia 150 km, bateria ao sair 30%. Depois 50%. | Com 30%: inviável, "Alcance útil: 30 km no primeiro trecho e 135 km nos demais", faltam 8 km até o km 38. Com 50%: "**2** paradas", nos km 38 e 160 (C₁ = 60 km, C₂ = 135 km). |
| 7 | Em Goiânia, autonomia 150 km, bateria 100%, reserva 30%. | "**2** paradas", nos km 95 e 186 (alcance útil de 105 km). |
| 8 | Abrir no celular (ou no modo responsivo do navegador, ~375 px de largura). | Controles e resultado em uma coluna, a dica "Arraste o diagrama para os lados" aparece, o diagrama rola na horizontal sem a página inteira rolar para o lado, e a tabela cabe na tela. |

## Limitações

Este é um trabalho acadêmico e faz algumas simplificações:

- **Dados de exemplo.** As estações e as posições em km das duas rotas (Brasília → Goiânia e Brasília → São Paulo) são aproximadas e ilustrativas. Não vêm de uma base real de eletropostos.
- **Rota em linha reta.** A rota é tratada como uma reta de comprimento *L*. O desvio para sair da rodovia até a estação é ignorado.
- **Diagrama esquemático.** A visualização mostra a rota e as paradas em linha. Não é um mapa geográfico.
- **Recarga sempre completa.** Em cada parada o carro carrega até 100%. Não há recarga parcial nem tempo de recarga.
- **Consumo constante.** A autonomia é a mesma em todo o trajeto. Não considera relevo, velocidade, clima ou carga do carro.
- **Só minimiza o número de paradas.** O algoritmo guloso é ótimo para esse objetivo. Se o objetivo fosse o menor tempo total, ele deixaria de ser ótimo (veja a seção *Quando o guloso deixa de ser ótimo*).
- **Sem testes automatizados.** A conferência foi feita manualmente, com casos conhecidos, por exemplo 3 paradas em Brasília → São Paulo com autonomia de 350 km, bateria de 100% e reserva de 10%.


## Estrutura do projeto

| Arquivo      | Conteúdo                                                        |
|--------------|-----------------------------------------------------------------|
| `index.html` | página e controles (rota, autonomia, bateria inicial, reserva)  |
| `style.css`  | estilos                                                         |
| `dados.js`   | rotas de exemplo (`ROTAS`)                                      |
| `core.js`    | algoritmo do Caminhoneiro (`caminhoneiro`, `planejar`)          |
| `app.js`     | interface: lê os controles, chama `planejar`, desenha diagrama e tabela |
| `README.md`  | esta documentação                                               |

O `index.html` carrega os scripts nesta ordem: `dados.js` (define `ROTAS`), `core.js`
(define `window.Caminhoneiro`) e `app.js` (usa os dois). São scripts comuns, sem módulos e
sem dependências externas.

## Autores

Projeto de Algoritmos, UnB/FCTE, semestre 2026/2, Grupo 49.

## Vídeo de apresentação

https://youtu.be/iW7vl0ybRUo



| Integrante                       | GitHub                                         | Contribuição |
| -------------------------------- | ---------------------------------------------- | ------------ |
| Samuel Rodrigues Viana Lobo      | [@Samuelvlobo](https://github.com/Samuelvlobo) | Interface e dados: versão inicial da página, separação em `style.css`, `dados.js` e `app.js`, ajustes para celular e mensagens de rota inviável; seções *Como rodar* e *Limitações* |
| Gabriel Sampaio Fae              | [@Faehzin](https://github.com/Faehzin)         | Algoritmo e teoria: `core.js` (`caminhoneiro` e `planejar`), modelagem, prova de otimalidade e complexidade no README |
