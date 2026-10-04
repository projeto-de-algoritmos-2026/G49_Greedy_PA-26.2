/* ============ INTERFACE ============ */
const $ = id => document.getElementById(id);
const km = x => Math.round(x) + " km";
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const num = (x, d = 2) => x.toLocaleString("pt-BR", {minimumFractionDigits: d, maximumFractionDigits: d});
const brl = x => "R$ " + num(x);
const sel = $("rota");
ROTAS.forEach((r,i) => sel.add(new Option(r.nome, i)));
sel.add(new Option("Rota personalizada (editar)", "custom"));

/* ---- rota personalizada: só em memória ---- */
let custom = null, ultima = 0;
const rotaAtual = () => sel.value === "custom" ? custom : ROTAS[sel.value];

function erro(t){ $("eErr").textContent = t; }

function desenharLista(){
  const lista = [...custom.estacoes].sort((a,b) => a-b), fmt = x => String(+x.toFixed(1)).replace(".", ",");
  $("eLista").innerHTML = lista.map(x => {
    const fora = !(x > 0 && x < custom.L);
    return `<li class="${fora ? "fora" : ""}" title="${fora ? "Fora da rota: será ignorado" : ""}">km ${fmt(x)}<button type="button" data-km="${x}" aria-label="Remover posto do km ${fmt(x)}">×</button></li>`;
  }).join("") || `<li class="vazio">Nenhum posto. Adicione acima ou toque no diagrama.</li>`;
}

function preencherEditor(){
  $("eOrig").value = custom.origem; $("eDest").value = custom.destino; $("eL").value = custom.L;
  erro(""); desenharLista();
}

function addPosto(x){
  if (!Number.isFinite(x)) return erro("Digite a posição do posto em km.");
  x = Math.round(x * 10) / 10;
  if (x <= 0 || x >= custom.L) return erro(`O posto precisa ficar entre o km 0 e o km ${Math.round(custom.L)}.`);
  if (custom.estacoes.includes(x)) return erro(`Já existe um posto no km ${String(x).replace(".", ",")}.`);
  custom.estacoes.push(x); erro(""); desenharLista(); atualizar();
}

$("eAdd").addEventListener("click", () => { addPosto(parseFloat($("eKm").value)); $("eKm").value = ""; $("eKm").focus(); });
$("eKm").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); $("eAdd").click(); } });
$("eLista").addEventListener("click", e => {
  const bt = e.target.closest("button[data-km]");
  if (!bt) return;
  custom.estacoes = custom.estacoes.filter(x => x !== +bt.dataset.km);
  desenharLista(); atualizar();
});
$("eLimpar").addEventListener("click", () => { custom.estacoes = []; erro(""); desenharLista(); atualizar(); });
$("eOrig").addEventListener("input", () => { custom.origem = $("eOrig").value.trim() || "Origem"; atualizar(); });
$("eDest").addEventListener("input", () => { custom.destino = $("eDest").value.trim() || "Destino"; atualizar(); });
$("eL").addEventListener("input", () => {
  const L = parseFloat($("eL").value);
  if (!(L > 0 && L <= 5000)) return erro("A distância total precisa estar entre 1 e 5000 km.");
  custom.L = L; erro(""); desenharLista(); atualizar();
});

// toque no diagrama: posto no km correspondente
$("svg").addEventListener("click", e => {
  if (sel.value !== "custom") return;
  const box = $("svg").getBoundingClientRect();
  const x = (e.clientX - box.left) / box.width * 1000;
  if (x < 40 || x > 960) return;
  addPosto((x - 40) / 920 * custom.L);
});

/* ---- custo ---- */
const TIPOS = {
  gas: {cons: 12,  preco: 6.59, un: "L",   tanque: "tanque", cheio: "tanque cheio",  consL: "Consumo médio (km/L)",   precoL: "Preço médio da gasolina (R$/L)"},
  ele: {cons: 6.5, preco: 2.00, un: "kWh", tanque: "carga",  cheio: "bateria cheia", consL: "Consumo médio (km/kWh)", precoL: "Preço médio da recarga (R$/kWh)"}
};
function tipoCusto(){
  const t = TIPOS[$("cTipo").value];
  $("cConsL").textContent = t.consL; $("cPrecoL").textContent = t.precoL;
  $("cCons").value = t.cons; $("cPreco").value = t.preco;
}

// fração de tanque que se completa em cada parada (volta a 100%) e consumo total da viagem, em tanques
function estimarCusto(r, aut, ini){
  const {b} = r, pontos = [0, ...r.paradas];
  const recargas = r.paradas.map((k, t) => (t === 0 ? 1 - ini : 0) + (b[k] - b[pontos[t]]) / aut);
  return {recargas, consumo: b[b.length-1] / aut};
}

function relatorio(r, rota, aut, ini){
  const t = TIPOS[$("cTipo").value], cons = parseFloat($("cCons").value), preco = parseFloat($("cPreco").value);
  if (!(cons > 0) || !(preco >= 0)) {
    $("relatorio").innerHTML = `<p class="aviso">Informe o consumo médio e o preço para ver a estimativa.</p>`;
    return;
  }
  if (!r.viavel) {
    $("relatorio").innerHTML = `<p class="aviso">Rota inviável: ajuste a rota ou os parâmetros para estimar o custo.</p>`;
    return;
  }
  const cap = aut / cons;   // L ou kWh de um tanque cheio
  const {recargas, consumo} = estimarCusto(r, aut, ini);
  const tq = x => `${num(x)} ${t.tanque}${Math.abs(x - 1) < 0.005 ? "" : "s"}`;
  const totalParadas = recargas.reduce((s, x) => s + x, 0);
  const linhas = r.paradas.map((k, i) =>
    `<tr><td>Estação km ${Math.round(r.b[k])}</td><td class="r">${tq(recargas[i])}</td><td class="r">${num(recargas[i]*cap, 1)} ${t.un}</td><td class="r">${brl(recargas[i]*cap*preco)}</td></tr>`).join("");
  $("relatorio").innerHTML = `
    <div class="kpis">
      <div class="kpi destaque"><span>Gasto médio com o trajeto</span><strong>${brl(consumo*cap*preco)}</strong><small>${tq(consumo)} · ${num(consumo*cap, 1)} ${t.un} para ${km(rota.L)}</small></div>
      <div class="kpi"><span>Pago nas paradas</span><strong>${brl(totalParadas*cap*preco)}</strong><small>${r.paradas.length} ${r.paradas.length === 1 ? "parada" : "paradas"} · ${tq(totalParadas)} no total</small></div>
      <div class="kpi"><span>Custo por km</span><strong>${brl(preco/cons)}</strong><small>${t.cheio}: ${num(cap, 1)} ${t.un}, rende ${km(aut)}</small></div>
    </div>
    ${r.paradas.length ? `<table><thead><tr><th>Parada</th><th class="r">Completar</th><th class="r">Quantidade</th><th class="r">Valor</th></tr></thead><tbody>${linhas}</tbody></table>`
                       : `<p class="sub">Sem paradas: tudo sai do que já estava ${t.un === "L" ? "no tanque" : "na bateria"} na saída.</p>`}`;
}

function atualizar(){
  const rota = rotaAtual();
  const aut = +$("aut").value, ini = +$("ini").value/100, res = +$("res").value/100;
  $("autV").textContent = aut + " km"; $("iniV").textContent = $("ini").value + "%"; $("resV").textContent = $("res").value + "%";

  const r = Caminhoneiro.planejar(rota, aut, ini, res);
  const {b} = r;
  const pontos = r.viavel ? [0, ...r.paradas, b.length-1] : [0, ...r.paradas];
  const origem = esc(rota.origem), destino = esc(rota.destino);
  const nome = k => k === 0 ? origem : (k === b.length-1 ? destino : "Estação km " + Math.round(b[k]));

  // resumo
  const st = $("status");
  if (r.viavel){
    const n = r.paradas.length;
    st.className = "status good";
    st.innerHTML = `<strong>${n}</strong><span>${n === 1 ? "parada de recarga" : "paradas de recarga"}</span>`;
    $("sub").textContent = n === 0 ? "Dá para ir direto, sem recarregar." : "Esse é o menor número possível de paradas para esta rota.";
    $("msg").innerHTML = "";
  } else {
    st.className = "status bad";
    st.innerHTML = `<strong>Rota inviável</strong>`;
    $("sub").textContent = "";
    const alcanceTrecho = r.bloqueio === 0 ? r.c1 : r.c2;
    const faltam = Math.max(1, Math.ceil((b[r.bloqueio+1] - b[r.bloqueio]) - alcanceTrecho - 1e-9));
    $("msg").innerHTML = `<div class="msg">O carro não chega ${r.bloqueio+1 === b.length-1 ? "ao destino" : "à próxima estação"}: faltam ${faltam} km de autonomia entre o km ${Math.round(b[r.bloqueio])} e o km ${Math.round(b[r.bloqueio+1])}. Aumente a autonomia ou a bateria, ou reduza a reserva${sel.value === "custom" ? ", ou adicione um posto nesse trecho" : ""}.</div>`;
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
          <text x="${X(k)}" y="${Y+52}" text-anchor="${k?"end":"start"}" font-size="15" font-weight="700" fill="var(--ink)">${k ? destino : origem}</text>`;
  });
  $("svg").innerHTML = s;
  $("svg").classList.toggle("editavel", sel.value === "custom");

  // tabela
  let carga = ini, linhas = "";
  const tr = r.viavel ? trechos : trechos.filter(t => t[2]);
  tr.forEach(([a, c], t) => {
    const d = b[c] - b[a], restante = Math.max(0, carga - d/aut);
    linhas += `<tr><td>${nome(a)}</td><td>${nome(c)}</td><td class="r">${km(d)}</td><td class="r">${Math.round(restante*100)}%</td></tr>`;
    carga = 1;
  });
  if (!r.viavel) linhas += `<tr><td>${nome(r.bloqueio)}</td><td>${nome(r.bloqueio+1)}</td><td class="r">${km(b[r.bloqueio+1]-b[r.bloqueio])}</td><td class="r" style="color:var(--bad)">sem bateria</td></tr>`;
  $("tbody").innerHTML = linhas;

  relatorio(r, rota, aut, ini);
}

sel.addEventListener("change", () => {
  if (sel.value === "custom") {
    if (!custom) {
      const base = ROTAS[ultima];
      custom = {nome: "Rota personalizada", origem: base.origem, destino: base.destino, L: base.L, sugestao: base.sugestao, estacoes: [...base.estacoes]};
    }
    preencherEditor();
    $("editor").hidden = false;
  } else {
    ultima = +sel.value;
    $("editor").hidden = true;
    $("aut").value = ROTAS[sel.value].sugestao;
  }
  atualizar();
});
["aut","ini","res","cCons","cPreco"].forEach(id => $(id).addEventListener("input", atualizar));
$("cTipo").addEventListener("change", () => { tipoCusto(); atualizar(); });
$("aut").value = ROTAS[0].sugestao;
tipoCusto();
atualizar();
