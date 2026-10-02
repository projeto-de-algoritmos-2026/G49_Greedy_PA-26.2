/* ============ INTERFACE ============ */
const $ = id => document.getElementById(id);
const km = x => Math.round(x) + " km";
const sel = $("rota");
ROTAS.forEach((r,i) => sel.add(new Option(r.nome, i)));

function atualizar(){
  const rota = ROTAS[sel.value];
  const aut = +$("aut").value, ini = +$("ini").value/100, res = +$("res").value/100;
  $("autV").textContent = aut + " km"; $("iniV").textContent = $("ini").value + "%"; $("resV").textContent = $("res").value + "%";

  const r = Caminhoneiro.planejar(rota, aut, ini, res);
  const {b} = r;
  const pontos = r.viavel ? [0, ...r.paradas, b.length-1] : [0, ...r.paradas];
  const nome = k => k === 0 ? rota.origem : (k === b.length-1 ? rota.destino : "Estação km " + Math.round(b[k]));

  // resumo
  const st = $("status");
  if (r.viavel){
    const n = r.paradas.length;
    st.className = "status good";
    st.innerHTML = `<strong>${n}</strong><span>${n === 1 ? "parada de recarga" : "paradas de recarga"}</span>`;
    $("sub").textContent = n === 0 ? "O carro chega ao destino sem recarregar." : "Esse é o menor número possível de paradas para esta rota.";
    $("msg").innerHTML = "";
  } else {
    st.className = "status bad";
    st.innerHTML = `<strong>Rota inviável</strong>`;
    $("sub").textContent = "";
    $("msg").innerHTML = `<div class="msg">Não há estação alcançável entre o km ${Math.round(b[r.bloqueio])} e o km ${Math.round(b[r.bloqueio+1])} (trecho de ${km(b[r.bloqueio+1]-b[r.bloqueio])}). Aumente a autonomia ou a bateria, ou reduza a reserva.</div>`;
  }
  $("sub").textContent += (($("sub").textContent ? " " : "") + `Alcance útil: ${km(r.c1)} no primeiro trecho e ${km(r.c2)} nos demais.`);

  // diagrama
  const X = k => 40 + (b[k] / rota.L) * 920, Y = 210;
  const usadas = new Set(r.paradas);
  let s = `<rect x="30" y="${Y-8}" width="940" height="16" rx="8" fill="var(--road)"/>
           <line x1="40" y1="${Y}" x2="960" y2="${Y}" stroke="#fff" stroke-width="2" stroke-dasharray="10 10" opacity=".7"/>`;
  const trechos = [];
  for (let t = 0; t < pontos.length - 1; t++) trechos.push([pontos[t], pontos[t+1], true]);
  if (!r.viavel) trechos.push([r.bloqueio, r.bloqueio+1, false]);
  trechos.forEach(([a, c, ok]) => {
    const x1 = X(a), x2 = X(c), h = Math.min(120, 26 + (x2-x1)*0.22), top = Y - 14 - h;
    const cor = ok ? "var(--ok)" : "var(--bad)";
    s += `<path d="M${x1} ${Y-12} Q${(x1+x2)/2} ${top} ${x2} ${Y-12}" fill="none" stroke="${cor}" stroke-width="3" ${ok?"":'stroke-dasharray="7 6"'}/>
          <text x="${(x1+x2)/2}" y="${top+h*0.5-6}" text-anchor="middle" font-size="14" font-weight="600" fill="${cor}">${km(b[c]-b[a])}</text>`;
  });
  b.forEach((_, k) => {
    if (k === 0 || k === b.length-1) return;
    const u = usadas.has(k);
    s += `<circle cx="${X(k)}" cy="${Y}" r="${u?10:5}" fill="${u?"var(--ok)":"var(--skip)"}" stroke="#fff" stroke-width="${u?3:2}"><title>Estação km ${Math.round(b[k])}</title></circle>`;
    if (u) s += `<text x="${X(k)}" y="${Y+32}" text-anchor="middle" font-size="13" fill="var(--ink)">km ${Math.round(b[k])}</text>`;
  });
  [0, b.length-1].forEach(k => {
    s += `<rect x="${X(k)-9}" y="${Y-12}" width="18" height="24" rx="4" fill="var(--ink)" stroke="#fff" stroke-width="2"/>
          <text x="${X(k)}" y="${Y+52}" text-anchor="${k?"end":"start"}" font-size="15" font-weight="700" fill="var(--ink)">${k ? rota.destino : rota.origem}</text>`;
  });
  $("svg").innerHTML = s;

  // tabela
  let carga = ini, linhas = "";
  const tr = r.viavel ? trechos : trechos.filter(t => t[2]);
  tr.forEach(([a, c], t) => {
    const d = b[c] - b[a], restante = Math.max(0, carga - d/aut);
    linhas += `<tr><td>${nome(a)}</td><td>${nome(c)}</td><td class="r">${km(d)}</td><td class="r">${Math.round(restante*100)}%</td></tr>`;
    carga = 1;
  });
  if (!r.viavel) linhas += `<tr><td>${nome(r.bloqueio)}</td><td>${nome(r.bloqueio+1)}</td><td class="r">${km(b[r.bloqueio+1]-b[r.bloqueio])}</td><td class="r" style="color:var(--bad)">inalcançável</td></tr>`;
  $("tbody").innerHTML = linhas;
}

sel.addEventListener("change", () => { $("aut").value = ROTAS[sel.value].sugestao; atualizar(); });
["aut","ini","res"].forEach(id => $(id).addEventListener("input", atualizar));
$("aut").value = ROTAS[0].sugestao;
atualizar();
