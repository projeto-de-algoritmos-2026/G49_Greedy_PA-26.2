# Planejador de recargas para veículos elétricos

Trabalho 2 de Projeto de Algoritmos (UnB/FCTE, 2026/2), Grupo 49, Algoritmos Ambiciosos.
O site calcula em quais eletropostos um carro elétrico deve parar para fazer uma viagem com
o menor número possível de recargas. Para isso usa o algoritmo do Caminhoneiro
(*Selecting Breakpoints*).

## Demo

<!-- link a preencher -->

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


## Como rodar

O projeto é uma página estática (HTML, CSS e JavaScript puros). Não precisa instalar nada, nem ter servidor ou internet.

1. Clone o repositório:

2. Abra o arquivo `index.html` no navegador (duplo clique, ou `xdg-open index.html` no Linux).
3. Escolha a rota e ajuste a autonomia, a bateria ao sair e a reserva de segurança. O resultado é recalculado na hora: número de paradas, diagrama da rota e tabela de trechos.

Para testar uma rota inviável, escolha Brasília → São Paulo e reduza a autonomia até 40 km. A página mostra o trecho em vermelho e quantos km faltam.

Se preferir abrir por um servidor local, também funciona:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

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

## Autores

| Integrante                       | GitHub                                         | Contribuição |
| -------------------------------- | ---------------------------------------------- | ------------ |
| Samuel Rodrigues Viana Lobo      | [@Samuelvlobo](https://github.com/Samuelvlobo) |         |
| Gabriel Sampaio Fae              | [@Faehzin](https://github.com/Faehzin)         |         |