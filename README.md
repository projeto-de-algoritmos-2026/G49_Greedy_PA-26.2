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


## Complexidade


## Como rodar


## Limitações


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