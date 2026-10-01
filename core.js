// core.js - algoritmo do Caminhoneiro (paradas de recarga)
// Rota de tamanho L, posicoes 0 = b0 < b1 < ... < bn = L, autonomia C
// C1 = C * (bateria_inicial - reserva) -> primeiro trecho
// C2 = C * (1 - reserva)               -> demais trechos
// Prova de otimalidade (greedy stays ahead) no README
// Script classico: expoe window.Caminhoneiro

(function () {

  // algoritmo guloso - O(n), j so avanca
  function caminhoneiro(b, c1, c2){
    // tolerancia pra erro de ponto flutuante
    const EPS = 1e-9, n = b.length - 1, paradas = [];
    let i = 0, alcance = c1;
    while (i < n){
      // estacao mais distante alcancavel (<=)
      let j = i;
      while (j < n && b[j+1] - b[i] <= alcance + EPS) j++;

      // nao alcanca nem a proxima: rota inviavel entre b[i] e b[i+1]
      if (j === i) return {viavel:false, paradas, bloqueio:i};

      // depois do primeiro trecho passa a usar C2
      i = j; alcance = c2;
      if (i < n) paradas.push(i);   // destino nao conta como parada
    }
    return {viavel:true, paradas};
  }

  function planejar(rota, autonomia, bateriaIni, reserva){
    // calculo de C1 e C2
    const c1 = Math.max(0, autonomia * (bateriaIni - reserva));
    const c2 = autonomia * (1 - reserva);

    // chamada de PONTOS: tira repetidas e fora da rota, ordena - O(n log n)
    const est = [...new Set(rota.estacoes)].filter(x => x > 0 && x < rota.L).sort((a,b) => a-b);
    const b = [0, ...est, rota.L];
    return {b, c1, c2, ...caminhoneiro(b, c1, c2)};
  }

  window.Caminhoneiro = { caminhoneiro, planejar };
})();
