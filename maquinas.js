/* Coronel CRM · Máquinas (vending e café)
   Abastecimento por QR, assistências com peças e tempo, mudanças de local, faturação e rentabilidade por máquina,
   e stock do armazém. Controlo interno: nada disto vai para o XD. */
window.MAQ_INIT = function () {
  const FREQ = { '3s': '3 vezes por semana', '2s': '2 vezes por semana', '1s': 'Semanal', '15d': 'Quinzenal', '1m': 'Mensal' };
  const FREQ_D = { '3s': 2, '2s': 3, '1s': 7, '15d': 14, '1m': 30 };
  const DIAS = { '1': 'Segunda', '2': 'Terça', '3': 'Quarta', '4': 'Quinta', '5': 'Sexta', '6': 'Sábado' };
  const DIA_C = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const NOVAS = ['maquinas', 'maq_local', 'maq_assist', 'stock_mov', 'maq_fat', 'maq_leituras'];
  NOVAS.forEach(c => { if (!COLS.includes(c)) COLS.push(c); S.data[c] = new Map(); });

  /* ---------- ícones, navegação, estilos ---------- */
  P.maq = 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 6h5v8H8zM15.5 7v1M15.5 10v1M8 17h8';
  P.qr = 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z';
  const iP = NAV.findIndex(n => n[0] === 'pedidos');
  NAV.splice(iP + 1, 0, ['maquinas', 'Máquinas', 'maq'], ['rota', 'Rota de abastecimento', 'pin']);
  const iC = NAV.findIndex(n => n[0] === 'compras');
  NAV.splice(iC + 1, 0, ['stock', 'Stock do armazém', 'box']);
  SO_VALORES.push('stock', 'maqqr');
  Object.assign(TITLES, { maquinas: 'Máquinas', maquina: 'Máquina', stock: 'Stock do armazém', maqqr: 'Etiquetas QR', rota: 'Rota' });
  NOMES.maquinas = ['máquina', 'Nova máquina'];
  F.maquinas = [
    { k: 'numero', l: 'Número da máquina', t: 'text', req: 1, ph: 'Ex.: 15' },
    { k: 'tipo', l: 'Tipo', t: 'sel', o: { vending: 'Vending', cafe: 'Café' }, req: 1, def: 'vending' },
    { k: 'modelo', l: 'Modelo', t: 'text', ph: 'Ex.: Necta Kikko' },
    { k: 'nSerie', l: 'N.º de série', t: 'text' },
    { k: 'estado', l: 'Estado', t: 'sel', o: { armazem: 'No armazém', ativa: 'Ativa (num cliente)', parada: 'Parada', abate: 'Abatida' }, req: 1, def: 'armazem' },
    { k: 'freq', l: 'Abastecimento', t: 'sel', o: FREQ },
    { k: 'ordem', l: 'Ordem na rota (opcional)', t: 'num' },
    { k: 'dias', l: 'Dias de visita (opcional)', t: 'multi', o: DIAS, full: 1 },
    { k: 'notas', l: 'Notas', t: 'area', full: 1 },
  ];
  F.artigos.push(
    { k: 'custo', l: 'Preço de custo s/ IVA (€) · vem do XD', t: 'num' },
    { k: 'precoMaquina', l: 'Preço de venda na máquina (€, por unidade)', t: 'num' },
    { k: 'maquinas', l: 'Aparece no abastecimento das máquinas', t: 'bool' },
    { k: 'peca', l: 'É peça (aparece nas assistências)', t: 'bool' },
    { k: 'vidaServicos', l: 'Duração típica da peça (n.º de serviços, opcional)', t: 'num' },
  );
  const st = document.createElement('style');
  st.textContent = `
.mq-acts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:14px}
@media(min-width:760px){.mq-acts{grid-template-columns:repeat(5,minmax(0,1fr))}}
.mq-acts .btn{justify-content:center;min-height:52px;font-size:15px}
.mq-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
@media(min-width:560px){.mq-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(min-width:900px){.mq-grid{grid-template-columns:repeat(6,minmax(0,1fr))}}
.mq-it{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:12px;overflow:hidden;padding:0;text-align:left;display:flex;flex-direction:column;min-width:0;cursor:pointer}
.mq-it.on{border-color:var(--gold,#C4A052);box-shadow:0 0 0 1px var(--gold,#C4A052)}
.mq-it .ph-img{aspect-ratio:1/1}.mq-it .ph-img img{width:100%;height:100%;object-fit:contain;background:#fff}
.mq-it .nm{font-size:12px;line-height:1.25;padding:6px 8px 8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--ink)}
.mq-q{position:absolute;top:6px;right:6px;min-width:28px;height:28px;border-radius:14px;background:#1D1D1F;color:#fff;font-weight:500;display:grid;place-items:center;padding:0 7px;font-size:14px}
.mq-q.neg{background:#b3261e}
.mq-pm{display:flex;border-top:1px solid var(--line)}.mq-pm button{flex:1;border:0;background:none;padding:8px 0;font-size:18px;cursor:pointer;color:var(--ink)}
.mq-pm button+button{border-left:1px solid var(--line)}
.mq-bar{position:sticky;bottom:0;background:var(--surface);border-top:1px solid var(--line);padding:10px 0 0;margin-top:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.mq-bar .note{flex:1 1 100%}@media(min-width:560px){.mq-bar .note{flex:1 1 auto}}
.mq-sw{display:flex;gap:6px;margin:0 0 10px}.mq-tl .row{cursor:default}
.pg a.btn{text-decoration:none;color:inherit}
.pg button.lnk{background:none;border:0;padding:0;font:inherit;font-size:14px;color:#6E6E73;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.mq-big{font-family:'Cormorant Garamond',serif;font-size:40px;line-height:1}
`;
  document.head.appendChild(st);

  /* ---------- utilitários ---------- */
  const M = id => S.data.maquinas.get(id);
  const mByNum = n => D('maquinas').find(m => String(m.numero).trim().toLowerCase() === String(n).trim().toLowerCase());
  const local = m => m && m.entidade ? entName(m.entidade) : 'Armazém';
  const EST = { ativa: ['Ativa', 'ok'], parada: ['Parada', 'bad'], armazem: ['No armazém', 'mute'], abate: ['Abatida', 'mute'] };
  const estB = m => badge(...(EST[m.estado] || ['—', 'mute']));
  const art = id => S.data.artigos.get(id);
  const custoArt = a => a ? (a.custo != null && a.custo !== '' ? +a.custo : null) : null;
  const movsM = id => D('stock_mov').filter(x => x.maquina === id);
  const desde = per => { const t = TODAY(); return per === 'mes' ? t.slice(0, 8) + '01' : per === '3m' ? addMonths(t, -3) : per === 'ano' ? t.slice(0, 4) + '-01-01' : '0000'; };
  const PER = [['mes', 'Este mês'], ['3m', '3 meses'], ['ano', 'Este ano'], ['tudo', 'Sempre']];
  function rent(id, per) {
    const d0 = desde(per);
    const mv = movsM(id).filter(x => (x.data || '') >= d0);
    let prod = 0, pecas = 0, semCusto = 0, vendaEsp = 0;
    mv.forEach(x => {
      const a = art(x.artigo), c = x.custo != null ? +x.custo : custoArt(a), q = +x.qt || 0;
      if (c == null) semCusto++;
      const v = (c || 0) * q;
      if (x.tipo === 'abastecimento') { prod += v; if (a && a.precoMaquina) vendaEsp += q * +a.precoMaquina; }
      else if (x.tipo === 'retirada') { prod -= v; if (a && a.precoMaquina) vendaEsp -= q * +a.precoMaquina; }
      else if (x.tipo === 'peca') pecas += v;
    });
    const fat = D('maq_fat').filter(f => f.maquina === id && (f.data || '') >= d0).reduce((s, f) => s + (+f.valor || 0), 0);
    const minutos = D('maq_assist').filter(a => a.maquina === id && (a.data || '') >= d0).reduce((s, a) => s + (+a.minutos || 0), 0);
    return { fat, prod, pecas, res: fat - prod - pecas, semCusto, vendaEsp, minutos };
  }

  /* ---------- rotas: próxima visita ---------- */
  const addD = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const difD = (a, b) => Math.round((new Date(a + 'T12:00:00') - new Date(b + 'T12:00:00')) / 864e5);
  const wd = iso => new Date(iso + 'T12:00:00').getDay();
  const ultimoAb = id => { let u = null; D('stock_mov').forEach(x => { if (x.maquina === id && x.tipo === 'abastecimento' && x.data && (!u || x.data > u)) u = x.data; }); return u; };
  function proxima(m) {
    if (!m || !m.freq || !FREQ_D[m.freq] || !m.entidade || m.estado === 'armazem' || m.estado === 'abate') return null;
    const u = ultimoAb(m.id), dias = (m.dias || []).map(String).filter(x => DIAS[x]), int = FREQ_D[m.freq];
    if (!u) return TODAY();
    let d = addD(u, dias.length ? Math.max(1, int - 3) : int);
    if (dias.length) for (let i = 0; i < 7 && !dias.includes(String(wd(d))); i++) d = addD(d, 1);
    return d;
  }
  const fDia = iso => { const n = difD(iso, TODAY()); return n === 0 ? 'hoje' : n === 1 ? 'amanhã' : n === -1 ? 'ontem' : `${DIA_C[wd(iso)]} ${fD(iso)}`; };
  const visitaB = m => { const p = proxima(m); if (!p) return ''; const n = difD(p, TODAY()); return n < 0 ? badge(`Atrasada ${-n} dia${n === -1 ? '' : 's'}`, 'bad') : n === 0 ? badge('Abastecer hoje', 'gold') : ''; };
  const freqTxt = m => m.freq ? FREQ[m.freq] + ((m.dias || []).length ? ' (' + m.dias.map(x => DIA_C[+x]).join(', ') + ')' : '') : '';
  const moradaE = e => e ? [e.morada, [e.cp, e.localidade].filter(Boolean).join(' ')].filter(Boolean).join(', ') : '';
  const mapaU = e => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(moradaE(e) || e?.nome || '');

  /* ---------- contador de serviços e duração das peças ---------- */
  const nF = n => Math.round(+n || 0).toLocaleString('pt-PT');
  function contadorAtual(mid) {
    let best = null;
    const ver = (c, data) => { if (c == null || c === '') return; c = +c; if (!best || c > best.c) best = { c, data }; };
    D('maq_leituras').forEach(l => { if (l.maquina === mid) ver(l.contador, l.data); });
    D('maq_assist').forEach(a => { if (a.maquina === mid) ver(a.contador, a.data); });
    return best;
  }
  // trocas de cada peça com o contador da assistência em que foi posta
  function trocas(mid) {
    const A = new Map(D('maq_assist').map(a => [a.id, a])), by = new Map();
    D('stock_mov').forEach(x => {
      if (x.tipo !== 'peca' || (mid && x.maquina !== mid)) return;
      const a = A.get(x.assist), c = a && a.contador != null && a.contador !== '' ? +a.contador : null;
      const k = x.maquina + '|' + x.artigo; if (!by.has(k)) by.set(k, { maq: x.maquina, artigo: x.artigo, L: [] });
      by.get(k).L.push({ c, data: x.data, prev: !!(a && a.preventiva) });
    });
    by.forEach(g => g.L.sort((a, b) => (a.c ?? -1) - (b.c ?? -1) || String(a.data).localeCompare(String(b.data))));
    return [...by.values()];
  }
  // Duração de referência de uma peça, sempre medida pelo contador DENTRO de cada máquina (troca → troca na mesma máquina).
  // As durações das várias máquinas juntam-se depois numa média: primeiro só as do mesmo modelo (ex.: Brio 250);
  // se esse modelo ainda não tiver avarias, usa todas as máquinas. A duração da ficha do artigo, se existir, manda.
  // Peças que continuam a funcionar (ou foram trocadas por prevenção) acima da média também entram: a média vai subindo.
  const modeloN = mid => String(M(mid)?.modelo || '').trim().toLowerCase().replace(/\s+/g, ' ');
  let vidaCache = null, vidaKey = '';
  function vidaRef(artigo, mid) {
    const a = art(artigo); if (a && +a.vidaServicos > 0) return { v: +a.vidaServicos, fonte: 'ficha' };
    let key = S.data.stock_mov.size + '|' + S.data.maq_assist.size + '|' + S.data.maq_leituras.size + '|' + S.data.maquinas.size; S.data.maq_assist.forEach(x => { key += '|' + (x.contador ?? '') + (x.preventiva ? 'p' : ''); }); S.data.maquinas.forEach(x => { key += '|' + (x.modelo || ''); });
    if (!vidaCache || vidaKey !== key) {
      vidaKey = key; vidaCache = new Map();
      const get = k => { if (!vidaCache.has(k)) vidaCache.set(k, { fails: [], cens: [] }); return vidaCache.get(k); };
      trocas(null).forEach(g => {
        const md = modeloN(g.maq), alvos = [get('*|' + g.artigo)].concat(md ? [get(md + '|' + g.artigo)] : []);
        const add = (t, v) => alvos.forEach(o => o[t].push(v));
        for (let i = 1; i < g.L.length; i++) { const p = g.L[i - 1], q = g.L[i]; if (p.c == null || q.c == null || q.c <= p.c) continue; add(q.prev ? 'cens' : 'fails', q.c - p.c); }
        const ult = [...g.L].reverse().find(x => x.c != null), at = contadorAtual(g.maq);
        if (ult && at && at.c > ult.c) add('cens', at.c - ult.c);
      });
    }
    const md = mid ? modeloN(mid) : '';
    const calc = (o, fonte) => { if (!o || !o.fails.length) return null; const m = o.fails.reduce((s, x) => s + x, 0) / o.fails.length, acima = o.cens.filter(x => x > m), all = o.fails.concat(acima); return { v: Math.round(all.reduce((s, x) => s + x, 0) / all.length), fonte, n: o.fails.length, acima: acima.length, modelo: M(mid)?.modelo || '' }; };
    return (md && calc(vidaCache.get(md + '|' + artigo), 'modelo')) || calc(vidaCache.get('*|' + artigo), 'geral');
  }
  function pecasEstado(mid) {
    const atual = contadorAtual(mid);
    return trocas(mid).map(g => {
      const ult = [...g.L].reverse().find(x => x.c != null), ref = vidaRef(g.artigo, mid);
      const hist = []; for (let i = 1; i < g.L.length; i++) { const p = g.L[i - 1], q = g.L[i]; if (p.c != null && q.c != null && q.c > p.c) hist.push({ de: p.c, a: q.c, d: q.c - p.c, prev: q.prev }); }
      let prox = null, falta = null, est = '';
      if (ult && ref) { prox = ult.c + ref.v; if (atual) { falta = prox - atual.c; est = falta <= 0 ? 'ja' : falta <= Math.max(500, ref.v * 0.1) ? 'breve' : ''; } }
      return { artigo: g.artigo, ult, ref, hist, prox, falta, est, semContador: g.L.some(x => x.c == null) };
    }).sort((a, b) => (a.falta ?? 9e12) - (b.falta ?? 9e12));
  }
  const pecaB = mid => { const L = pecasEstado(mid); return L.some(x => x.est === 'ja') ? badge('Peça a trocar', 'bad') : L.some(x => x.est === 'breve') ? badge('Peça a trocar em breve', 'gold') : ''; };
  function pecasPanel(m) {
    const L = pecasEstado(m.id), atual = contadorAtual(m.id);
    const row = x => { const a = art(x.artigo);
      const sub = [x.ult ? `posta aos ${nF(x.ult.c)} serviços (${fD(x.ult.data)})` : 'troca sem contador registado',
        x.ref ? `dura ~${nF(x.ref.v)}${x.ref.fonte === 'ficha' ? ' (ficha do artigo)' : ` (média ${x.ref.fonte === 'modelo' ? 'nas ' + x.ref.modelo : 'de todas as máquinas'}: ${x.ref.n} avaria${x.ref.n === 1 ? '' : 's'}${x.ref.acima ? `, ${x.ref.acima} peça${x.ref.acima === 1 ? '' : 's'} acima da média` : ''}${x.ref.n < 3 ? '; provisória' : ''})`}` : (x.ult && atual && atual.c > x.ult.c ? `a funcionar há ${nF(atual.c - x.ult.c)} serviços; ainda sem avarias para calcular a duração` : 'duração ainda desconhecida'),
        x.hist.length ? 'histórico: ' + x.hist.map(h => `${nF(h.de)}→${nF(h.a)} = ${nF(h.d)}${h.prev ? ' (preventiva)' : ''}`).join('; ') : ''].filter(Boolean).join(' · ');
      const dir = x.prox == null ? '' : `<span class="num">troca aos ${nF(x.prox)}</span>${x.falta != null ? `<span class="note">${x.falta <= 0 ? `passou ${nF(-x.falta)}` : `faltam ${nF(x.falta)}`}</span>` : ''}`;
      return `<div class="row" style="cursor:default"><span class="rt"><span class="r1">${esc(a?.nome || 'Peça')}</span><span class="r2" style="white-space:normal">${esc(sub)}</span></span><span class="rr">${x.est === 'ja' ? badge('Trocar já', 'bad') : x.est === 'breve' ? badge('Trocar em breve', 'gold') : ''}${dir}</span></div>`; };
    return `<div class="panel" style="margin-top:14px"><div class="ph"><h2>Peças e duração</h2><span class="grow"></span>${S.canWrite ? `<button class="btn sm" data-act="maqContador" data-id="${m.id}">Registar contador</button>` : ''}</div>
      <p class="note" style="margin:0 16px 8px">${atual ? `Contador atual: <b>${nF(atual.c)}</b> serviços (lido ${esc(fD(atual.data))}).` : 'Ainda sem leitura do contador de serviços.'} A duração mede-se pelo contador em cada máquina, de troca a troca, e faz-se a média das máquinas do mesmo modelo (ou de todas, se o modelo ainda não tiver avarias). Peças que continuam a funcionar acima da média puxam-na para cima.</p>
      ${L.length ? L.map(row).join('') : '<div class="empty"><b>Sem peças trocadas</b>As peças das assistências aparecem aqui, com o contador em que foram postas.</div>'}</div>`;
  }

  /* ---------- lista de máquinas ---------- */
  VIEWS.maquinas = () => loadingOr(() => {
    const chips = ['Todas', 'Vending', 'Café', 'Paradas', 'Em atraso', 'Sem rota', 'No armazém'], c = S.f.maquinas ?? chips[0];
    const per = S.f.maqper || 'mes';
    let L = D('maquinas').filter(m => m.estado !== 'abate' || c === 'Todas')
      .filter(m => c === 'Todas' || (c === 'Vending' ? m.tipo === 'vending' : c === 'Café' ? m.tipo === 'cafe' : c === 'Paradas' ? m.estado === 'parada' : c === 'Em atraso' ? (proxima(m) || '9') < TODAY() : c === 'Sem rota' ? (m.entidade && !m.freq) : !m.entidade))
      .filter(m => match('maquinas', { ...m, entidade: m.entidade }, ['numero', 'modelo', 'nSerie', 'entidade']));
    L.sort((a, b) => (parseInt(a.numero) || 9e9) - (parseInt(b.numero) || 9e9) || String(a.numero).localeCompare(String(b.numero)));
    const R = S.verValores ? new Map(L.map(m => [m.id, rent(m.id, per)])) : null;
    const tot = R ? [...R.values()].reduce((s, r) => ({ fat: s.fat + r.fat, res: s.res + r.res }), { fat: 0, res: 0 }) : null;
    const top = `<div class="tb"><div class="tbr"><label class="srch">${ic('search', 18)}<input id="q-maquinas" data-q="maquinas" type="search" placeholder="Número, modelo ou cliente" value="${esc(S.q.maquinas || '')}" autocomplete="off"></label>
      ${S.canWrite && S.db ? `<button class="btn pri" data-act="new" data-col="maquinas">${ic('plus', 18)}<span>Nova máquina</span></button>` : ''}
      ${S.verValores ? `<button class="btn" data-act="go" data-v="maqqr">${ic('qr', 18)}<span>Etiquetas QR</span></button>` : ''}</div>
      <div class="chips">${chips.map(x => `<button class="chipb ${x === c ? 'on' : ''}" data-act="chip" data-v="maquinas" data-c="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      ${S.verValores ? `<div class="chips">${PER.map(([k, t]) => `<button class="chipb ${k === per ? 'on' : ''}" data-act="maqPer" data-c="${k}">${t}</button>`).join('')}</div>` : ''}</div>`;
    const sum = `<p class="note" style="margin:0 0 10px"><b>${L.length}</b> máquina${L.length === 1 ? '' : 's'}${tot ? ` · faturado <b>${eur(tot.fat)}</b> · resultado <b>${eur(tot.res)}</b>` : ''}. Leia o QR colado na máquina para abrir a ficha diretamente.</p>`;
    const row = m => rowH({ act: 'maqOpen', id: m.id, av: m.numero, avk: 1, title: `Máquina ${m.numero}${m.modelo ? ' · ' + m.modelo : ''}`, sub: `${m.tipo === 'cafe' ? 'Café' : 'Vending'} · ${local(m)}${m.freq ? ' · ' + FREQ[m.freq].toLowerCase() : ''}`, right: R ? eur(R.get(m.id).res) : undefined, badges: estB(m) + visitaB(m) + pecaB(m.id) });
    return `<div class="pg">${roBanner()}${top}${sum}${listBlock('maquinas', L, row, '<b>Sem máquinas</b>Registe as máquinas com o número que têm (ou vão ter) na etiqueta QR.')}</div>`;
  });

  /* ---------- ficha da máquina ---------- */
  VIEWS.maquina = () => loadingOr(() => {
    let m = S.params.id ? M(S.params.id) : (S.params.num ? mByNum(S.params.num) : null);
    if (!m) {
      if (!S.ready.maquinas) return `<div class="panel" style="padding:8px 0">${'<div class="skel"></div>'.repeat(4)}</div>`;
      const n = S.params.num || '';
      return `<div class="pg"><div class="panel empty"><b>A máquina ${esc(n)} ainda não está registada.</b>${S.canWrite ? `<div style="margin-top:12px"><button class="btn pri" data-act="maqNova" data-c="${esc(n)}">Registar máquina ${esc(n)}</button></div>` : 'Peça ao administrador para a registar.'}</div></div>`;
    }
    const aberta = D('maq_assist').find(a => a.maquina === m.id && a.estado === 'aberta');
    const per = S.f.maqper || 'mes';
    let h = `<div class="pg">${roBanner()}
    <div class="panel"><div class="pb" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
      <div class="mq-big">${esc(m.numero)}</div>
      <div style="flex:1;min-width:180px"><div class="eyebrow">${m.tipo === 'cafe' ? 'Máquina de café' : 'Máquina de vending'}${m.modelo ? ' · ' + esc(m.modelo) : ''}</div>
      <div style="font-size:17px;margin-top:2px">${esc(local(m))}</div>${m.entidade ? `<button class="lnk" style="padding:0;margin-top:2px" data-act="ficha" data-id="${m.entidade}">Ver ficha do cliente</button>` : ''}
      ${m.nSerie ? `<div class="note">N.º de série ${esc(m.nSerie)}</div>` : ''}
      ${contadorAtual(m.id) ? `<div class="note">Contador: <b>${nF(contadorAtual(m.id).c)}</b> serviços (${esc(fD(contadorAtual(m.id).data))})</div>` : ''}
      ${m.entidade ? `<div class="note">${m.freq ? `Abastecimento ${esc(freqTxt(m).toLowerCase())} · próxima visita <b>${esc(fDia(proxima(m)))}</b>` : 'Sem frequência de abastecimento: defina em Editar para entrar na rota.'}${ultimoAb(m.id) ? ` · último ${esc(fDia(ultimoAb(m.id)))}` : ''}</div>` : ''}</div>
      <div>${estB(m)}</div>
      ${S.canWrite ? `<button class="btn" data-act="edit" data-col="maquinas" data-id="${m.id}">Editar</button>` : ''}</div></div>`;
    if (S.canWrite) h += `<div class="mq-acts" style="margin-top:14px">
      <button class="btn pri" data-act="maqCart" data-c="abastecimento" data-id="${m.id}">${ic('box', 18)}Abastecer</button>
      <button class="btn ${aberta ? 'gold' : ''}" data-act="maqAssist" data-id="${m.id}">${ic('tool', 18)}${aberta ? 'Assistência aberta' : 'Assistência'}</button>
      <button class="btn" data-act="maqMover" data-id="${m.id}">${ic('pin', 18)}Mover</button>
      <button class="btn" data-act="maqParada" data-id="${m.id}">${ic('cal', 18)}Máquina parada</button>
      ${S.verValores ? `<button class="btn" data-act="maqFat" data-id="${m.id}">${ic('euro', 18)}Faturação</button>` : `<button class="btn" data-act="maqCart" data-c="retirada" data-id="${m.id}">Retirar produtos</button>`}</div>`;
    if (aberta) h += assistPanel(aberta);
    if (S.verValores) {
      const r = rent(m.id, per);
      h += `<div class="panel" style="margin-top:14px"><div class="ph"><h2>Rentabilidade</h2></div><div class="pb"><div class="chips" style="margin:0 0 12px">${PER.map(([k, t]) => `<button class="chipb ${k === per ? 'on' : ''}" data-act="maqPer" data-c="${k}">${t}</button>`).join('')}</div>
      <div class="mini"><div><span>Faturado</span><b>${eur(r.fat)}</b></div><div><span>Produtos (custo)</span><b>${eur(r.prod)}</b></div><div><span>Peças (custo)</span><b>${eur(r.pecas)}</b></div><div><span>Resultado</span><b style="color:${r.res < 0 ? 'var(--bad)' : 'inherit'}">${eur(r.res)}</b></div></div>
      <p class="note" style="margin:10px 0 0">${r.fat ? `Margem ${Math.round(r.res / r.fat * 100)}%. ` : ''}${r.vendaEsp ? `Ao preço da máquina, os produtos que entraram valem ${eur(r.vendaEsp)}. ` : ''}${r.minutos ? `Assistências: ${Math.round(r.minutos / 6) / 10} h. ` : ''}${r.semCusto ? `${r.semCusto} movimento${r.semCusto === 1 ? '' : 's'} sem preço de custo no XD.` : ''}</p></div></div>`;
    }
    h += pecasPanel(m) + timeline(m) + `</div>`;
    return h;
  });

  S.asDraft = {};
  const dr = (a, k) => (S.asDraft[a.id] && S.asDraft[a.id][k] !== undefined) ? S.asDraft[a.id][k] : (a[k] || '');
  document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.as) { (S.asDraft[t.dataset.as] = S.asDraft[t.dataset.as] || {})[t.dataset.k] = t.value; } });
  const asVal = t => t.type === 'checkbox' ? t.checked : t.dataset.num ? (t.value === '' ? null : Math.max(0, parseInt(t.value) || 0)) : t.value.trim();
  document.addEventListener('change', e => { const t = e.target; if (t.dataset && t.dataset.as && S.canWrite) patch('maq_assist', t.dataset.as, { [t.dataset.k]: asVal(t) }); });
  function assistPanel(a) {
    const pec = D('stock_mov').filter(x => x.assist === a.id);
    const min = a.inicio ? Math.max(1, Math.round((Date.now() - new Date(a.inicio)) / 60000)) : (a.minutos || 0);
    return `<div class="panel" style="margin-top:14px;border-color:var(--gold,#C4A052)"><div class="ph"><h2>Assistência em curso</h2><span class="note">desde ${a.inicio ? new Date(a.inicio).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : fD(a.data)} · ${min} min</span></div><div class="pb">
      <div class="fg"><div class="fld full"><label for="as-avaria">Avaria</label><input id="as-avaria" data-as="${a.id}" data-k="avaria" class="inp" value="${esc(dr(a, 'avaria'))}" placeholder="O que a máquina tinha (1 linha)"></div>
      <div class="fld full"><label for="as-sol">O que foi feito</label><input id="as-sol" data-as="${a.id}" data-k="solucao" class="inp" value="${esc(dr(a, 'solucao'))}" placeholder="Ex.: troca da bomba, limpeza do misturador"></div>
      <div class="fld"><label for="as-cont">Contador de serviços</label><input id="as-cont" data-as="${a.id}" data-k="contador" data-num="1" type="number" inputmode="numeric" min="0" class="inp" value="${esc(dr(a, 'contador'))}" placeholder="${contadorAtual(a.maquina) ? 'último: ' + nF(contadorAtual(a.maquina).c) : 'Ex.: 14000'}"></div>
      <div class="fld" style="align-self:end"><label class="tog"><input id="as-prev" type="checkbox" data-as="${a.id}" data-k="preventiva" ${a.preventiva ? 'checked' : ''}><span>Troca preventiva (a peça ainda não tinha avariado)</span></label></div></div>
      <div class="eyebrow" style="margin:14px 0 6px">Peças usadas</div>
      ${pec.length ? `<table class="tt"><tbody>${pec.map(x => `<tr><td>${esc(art(x.artigo)?.nome || 'Artigo')}</td><td class="num">${+x.qt}</td>${S.verValores ? `<td class="num">${x.custo != null ? eur(x.custo * x.qt) : '—'}</td>` : ''}</tr>`).join('')}</tbody></table>` : '<p class="note" style="margin:0">Ainda sem peças.</p>'}
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="btn" data-act="maqCart" data-c="peca" data-id="${a.maquina}" data-a="${a.id}">${ic('plus', 16)}Peças</button>
      <span class="grow"></span><button class="btn" data-act="maqAssistGuardar" data-id="${a.id}">Guardar</button><button class="btn gold" data-act="maqAssistFechar" data-id="${a.id}">Fechar assistência</button></div></div></div>`;
  }

  function timeline(m) {
    const ev = [];
    const grp = new Map();
    movsM(m.id).filter(x => x.tipo !== 'peca').forEach(x => {
      const k = x.tipo + '|' + (x.criado || '').slice(0, 16) + '|' + (x.criadoPor || '');
      if (!grp.has(k)) grp.set(k, { quando: x.criado || x.data, data: x.data, tipo: x.tipo, por: x.criadoPor, L: [] });
      grp.get(k).L.push(x);
    });
    grp.forEach(g => {
      const n = g.L.reduce((s, x) => s + (+x.qt || 0), 0);
      const c = g.L.reduce((s, x) => s + (x.custo != null ? +x.custo * +x.qt : 0), 0);
      ev.push({ q: g.quando, t: g.tipo === 'retirada' ? 'Produtos retirados' : 'Abastecimento', s: g.L.map(x => `${+x.qt} ${art(x.artigo)?.nome || 'artigo'}`).join(', '), r: S.verValores && c ? eur(c) : `${n} un.`, por: g.por });
    });
    D('maq_assist').filter(a => a.maquina === m.id && a.estado === 'fechada').forEach(a => {
      const c = D('stock_mov').filter(x => x.assist === a.id).reduce((s, x) => s + (x.custo != null ? +x.custo * +x.qt : 0), 0);
      ev.push({ q: a.fim || a.criado, t: 'Assistência' + (a.minutos ? ` · ${a.minutos} min` : '') + (a.contador != null ? ` · aos ${nF(a.contador)} serviços` : '') + (a.preventiva ? ' · preventiva' : ''), s: [a.avaria, a.solucao].filter(Boolean).join(' → ') || '—', r: S.verValores && c ? eur(c) : '', por: a.criadoPor });
    });
    D('maq_local').filter(l => l.maquina === m.id).forEach(l => ev.push({ q: l.criado, t: 'Mudança de local', s: (l.entidade ? entName(l.entidade) : 'Armazém') + (l.notas ? ' · ' + l.notas : ''), r: '', por: l.criadoPor }));
    if (S.verValores) D('maq_fat').filter(f => f.maquina === m.id).forEach(f => ev.push({ q: f.data + 'T23:59', t: 'Faturação', s: f.notas || (f.entidade ? entName(f.entidade) : ''), r: eur(f.valor), por: f.criadoPor, fat: f.id }));
    ev.sort((a, b) => String(b.q).localeCompare(String(a.q)));
    const lim = S.lim.maqtl || 30;
    return `<div class="panel mq-tl" style="margin-top:14px"><div class="ph"><h2>Histórico</h2></div>${ev.length ? ev.slice(0, lim).map(e => `<div class="row"${e.fat ? ` role="button" data-act="maqFatDel" data-id="${e.fat}" title="Carregue para apagar este registo"` : ''}><span class="rt"><span class="r1">${esc(e.t)}</span><span class="r2">${esc(e.s)}</span></span><span class="rr"><span class="note">${esc(fD(String(e.q).slice(0, 10)))} · ${esc(nameOf(e.por))}</span>${e.r ? `<span class="num">${esc(e.r)}</span>` : ''}</span></div>`).join('') + (ev.length > lim ? `<button class="more" data-act="more" data-v="maqtl">Mostrar mais (${ev.length - lim})</button>` : '') : '<div class="empty"><b>Sem movimentos</b>Os abastecimentos, assistências e mudanças aparecem aqui.</div>'}</div>`;
  }

  /* ---------- carrinho (abastecer, retirar, peças, stock) ---------- */
  const MODOS = {
    abastecimento: ['Abastecer máquina', 'Confirmar abastecimento', 'maquinas'],
    retirada: ['Retirar da máquina', 'Confirmar retirada', 'maquinas'],
    peca: ['Peças da assistência', 'Juntar peças', 'peca'],
    inicial: ['Stock inicial', 'Guardar stock inicial', 'stock'],
    entrada: ['Entrada no armazém', 'Guardar entrada', 'stock'],
    acerto: ['Acerto de stock', 'Guardar acerto', 'stock'],
  };
  function cartItems() {
    const c = S.maqCart, mode = MODOS[c.modo][2];
    let L = D('artigos').filter(a => a.ativo !== false && (mode === 'maquinas' ? a.maquinas : mode === 'peca' ? a.peca : (a.maquinas || a.peca)));
    const q = norm(c.q);
    if (q) L = D('artigos').filter(a => a.ativo !== false && norm([a.nome, a.ref].join(' ')).includes(q));
    const freq = new Map();
    if (c.maq) D('stock_mov').filter(x => x.maquina === c.maq).forEach(x => freq.set(x.artigo, (freq.get(x.artigo) || 0) + 1));
    L.sort((a, b) => ((c.items[b.id] ? 1 : 0) - (c.items[a.id] ? 1 : 0)) || ((freq.get(b.id) || 0) - (freq.get(a.id) || 0)) || ((b.foto ? 1 : 0) - (a.foto ? 1 : 0)) || String(a.nome).localeCompare(String(b.nome)));
    return L.slice(0, q ? 60 : 48);
  }
  function cartBody() {
    const c = S.maqCart, L = cartItems();
    const n = Object.values(c.items).filter(v => v).length, un = Object.values(c.items).reduce((s, v) => s + (+v || 0), 0);
    const cst = Object.entries(c.items).reduce((s, [id, q]) => s + (custoArt(art(id)) || 0) * (+q || 0), 0);
    return `<label class="srch" style="margin-bottom:10px">${ic('search', 18)}<input id="mq-q" data-mqq="1" type="search" placeholder="Procurar produto" value="${esc(c.q)}" autocomplete="off"></label>
    <div class="mq-grid">${L.map(a => { const q = +c.items[a.id] || 0; return `<div class="mq-it ${q ? 'on' : ''}">
      <div data-act="mqAdd" data-id="${a.id}" data-c="1"><div class="ph-img">${a.foto ? `<img src="${esc(fotoUrl(a.foto))}" alt="" loading="lazy">` : esc(initials(a.nome))}</div><div class="nm">${esc(a.nome)}</div></div>
      ${q ? `<span class="mq-q ${q < 0 ? 'neg' : ''}" data-act="mqSet" data-id="${a.id}">${q}</span><div class="mq-pm"><button data-act="mqAdd" data-id="${a.id}" data-c="-1" aria-label="Menos">−</button><button data-act="mqAdd" data-id="${a.id}" data-c="1" aria-label="Mais">+</button></div>` : ''}</div>` }).join('') || '<p class="note">Nenhum produto. Procure pelo nome ou marque os artigos "Aparece no abastecimento" no catálogo.</p>'}</div>
    ${c.maq && (c.modo === 'abastecimento' || c.modo === 'retirada') ? `<div class="fld" style="margin-top:12px;max-width:260px"><label for="mq-cont">Contador de serviços (opcional)</label><input id="mq-cont" type="number" inputmode="numeric" min="0" class="inp" value="${esc(c.cont || '')}" data-mqc="1" placeholder="${contadorAtual(c.maq) ? 'último: ' + nF(contadorAtual(c.maq).c) : 'Ex.: 14000'}"></div>` : ''}
    <div class="mq-bar"><span class="note"><b>${n}</b> produto${n === 1 ? '' : 's'} · <b>${un}</b> un.${S.verValores && cst ? ` · custo ${eur(cst)}` : ''}</span><span class="grow"></span><button class="btn" data-act="close">Cancelar</button><button class="btn pri" data-act="mqOk" ${n ? '' : 'disabled'}>${MODOS[c.modo][1]}</button></div>`;
  }
  function cartOpen(modo, maq, assist) {
    S.maqCart = { modo, maq: maq || null, assist: assist || null, items: {}, q: '' };
    const m = maq ? M(maq) : null;
    openSheet(`<div class="sh"><h2>${MODOS[modo][0]}${m ? ' ' + esc(m.numero) : ''}</h2><button class="ib" data-act="close" aria-label="Fechar">${ic('x')}</button></div><div class="sb"><p class="note" style="margin:0 0 10px">${modo === 'acerto' ? 'Toque para somar e use − para tirar (pode ficar negativo).' : 'Toque no produto para somar uma unidade. Toque no número para escrever a quantidade.'}</p><div id="mq-cart">${cartBody()}</div></div>`);
  }
  const cartRedraw = () => { const el = document.getElementById('mq-cart'); if (!el) return; const f = document.activeElement?.id === 'mq-q'; const pos = f ? document.activeElement.selectionStart : null; el.innerHTML = cartBody(); if (f) { const i = document.getElementById('mq-q'); i.focus(); try { i.setSelectionRange(pos, pos) } catch (_) { } } };
  document.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.mqq && S.maqCart) { S.maqCart.q = e.target.value; cartRedraw(); } if (e.target.dataset && e.target.dataset.mqc && S.maqCart) S.maqCart.cont = e.target.value; });

  async function insertRows(col, rows) {
    if (!canAct() || !rows.length) return null;
    const { data, error } = await S.db.from(col).insert(rows.map(toRow)).select();
    if (error) { dbErr(error); return null; }
    data.forEach(r => putLocal(col, r));
    return data;
  }

  /* ---------- ações ---------- */
  Object.assign(ACT, {
    maqOpen: d => go('maquina', { id: d.id }),
    maqPer: d => { S.f.maqper = d.c; render(); },
    maqNova: d => openForm('maquinas', null, { numero: d.c }),
    maqCart: d => cartOpen(d.c, d.id, d.a),
    mqAdd: d => { const c = S.maqCart; if (!c) return; let v = (+c.items[d.id] || 0) + (+d.c); if (v < 0 && c.modo !== 'acerto') v = 0; if (v) c.items[d.id] = v; else delete c.items[d.id]; cartRedraw(); },
    mqSet: d => { const c = S.maqCart; if (!c) return; const v = prompt('Quantidade', String(c.items[d.id] || '')); if (v === null) return; const n = parseFloat(String(v).replace(',', '.')); if (!isFinite(n) || (!n)) delete c.items[d.id]; else c.items[d.id] = c.modo === 'acerto' ? n : Math.abs(n); cartRedraw(); },
    mqOk: async (d, b) => {
      const c = S.maqCart; if (!c) return;
      const rows = Object.entries(c.items).filter(([, q]) => +q).map(([id, q]) => ({ tipo: c.modo, artigo: id, qt: +q, custo: custoArt(art(id)), maquina: c.maq, assist: c.assist, data: TODAY() }));
      b.disabled = true; const ok = await insertRows('stock_mov', rows); b.disabled = false;
      if (!ok) return;
      const cont = parseInt(c.cont); if (c.maq && isFinite(cont) && cont >= 0) await insertRows('maq_leituras', [{ maquina: c.maq, contador: cont, data: TODAY() }]);
      const n = rows.length; closeSheet(); toast(c.modo === 'abastecimento' ? `Abastecimento registado (${n} produto${n === 1 ? '' : 's'})` : 'Registado');
      S.maqCart = null;
    },
    maqContador: async d => {
      const m = M(d.id); if (!m) return; const ult = contadorAtual(m.id);
      const v = prompt(`Contador de serviços da máquina ${m.numero}${ult ? ` (última leitura ${nF(ult.c)})` : ''}`, ''); if (v === null || v.trim() === '') return;
      const n = parseInt(v); if (!isFinite(n) || n < 0) return toast('Escreva só o número do contador.');
      if (ult && n < ult.c && !confirm(`${nF(n)} é menor do que a última leitura (${nF(ult.c)}). Guardar mesmo assim?`)) return;
      if (await insertRows('maq_leituras', [{ maquina: m.id, contador: n, data: TODAY() }])) toast('Contador registado: ' + nF(n));
    },
    maqAssist: async d => {
      const m = M(d.id); if (!m) return;
      if (D('maq_assist').some(a => a.maquina === m.id && a.estado === 'aberta')) { window.scrollTo({ top: 260, behavior: 'smooth' }); return; }
      const r = await insertRows('maq_assist', [{ maquina: m.id, entidade: m.entidade, inicio: new Date().toISOString(), data: TODAY(), estado: 'aberta' }]);
      if (r) toast('Assistência aberta. O tempo está a contar.');
    },
    maqAssistGuardar: async d => { const c = $('#as-cont'); const ok = await patch('maq_assist', d.id, { avaria: $('#as-avaria')?.value.trim(), solucao: $('#as-sol')?.value.trim(), contador: c ? asVal(c) : undefined, preventiva: !!$('#as-prev')?.checked }); if (ok) toast('Guardado'); },
    maqAssistFechar: async (d, b) => {
      const a = S.data.maq_assist.get(d.id); if (!a) return;
      const fim = new Date(), min = a.inicio ? Math.max(1, Math.round((fim - new Date(a.inicio)) / 60000)) : (a.minutos || null);
      let cont = $('#as-cont') ? asVal($('#as-cont')) : (a.contador ?? null);
      if (cont == null && D('stock_mov').some(x => x.assist === a.id)) {
        const c = prompt('Contador de serviços da máquina (para saber quanto dura cada peça). Deixe vazio se não souber.', '');
        if (c === null) return; cont = c.trim() === '' ? null : Math.max(0, parseInt(c) || 0);
      }
      const ult = contadorAtual(a.maquina);
      if (cont != null && ult && cont < ult.c && !confirm(`O contador (${nF(cont)}) é menor do que a última leitura (${nF(ult.c)}). Guardar mesmo assim?`)) return;
      const v = prompt('Tempo da assistência (minutos)', String(min || '')); if (v === null) return;
      b.disabled = true;
      const ok = await patch('maq_assist', a.id, { avaria: $('#as-avaria')?.value.trim(), solucao: $('#as-sol')?.value.trim(), contador: cont, preventiva: !!$('#as-prev')?.checked, estado: 'fechada', fim: fim.toISOString(), minutos: parseInt(v) || min });
      b.disabled = false; if (!ok) return;
      const m = M(a.maquina);
      if (m && m.estado === 'parada') await patch('maquinas', m.id, { estado: m.entidade ? 'ativa' : 'armazem' });
      for (const t of D('tarefas').filter(t => t.maquina === a.maquina && !t.feito)) await patch('tarefas', t.id, { feito: true });
      toast('Assistência fechada');
    },
    maqMover: d => {
      const m = M(d.id); if (!m) return;
      S.form = { col: 'maq_local', id: null, linhas: [] };
      openSheet(`<div class="sh"><h2>Mover máquina ${esc(m.numero)}</h2><button class="ib" data-act="close" aria-label="Fechar">${ic('x')}</button></div><div class="sb">
        <p class="note" style="margin:0 0 12px">Agora: <b>${esc(local(m))}</b>. A rentabilidade fica sempre com a máquina.</p>
        <div class="fg">${fieldH({ k: 'entidade', l: 'Novo cliente', t: 'ent', full: 1 }, '')}
        <details class="fld full" id="mv-novo"><summary class="lnk" style="cursor:pointer">O cliente ainda não existe (nem no XD)? Criar aqui</summary>
          <div class="fg" style="margin-top:10px">
          <div class="fld full"><label for="mv-nome">Nome do cliente *</label><input id="mv-nome" class="inp" autocomplete="off"></div>
          <div class="fld"><label for="mv-nif">NIF</label><input id="mv-nif" class="inp" inputmode="numeric" autocomplete="off" placeholder="Junta-se sozinho quando for criado no XD"></div>
          <div class="fld"><label for="mv-zona">Zona</label><select id="mv-zona" class="inp"><option value="">—</option>${ZONAS.map(z => `<option>${esc(z)}</option>`).join('')}</select></div>
          <div class="fld full"><label for="mv-mor">Morada</label><input id="mv-mor" class="inp" autocomplete="off"></div>
          <div class="fld"><label for="mv-loc">Localidade</label><input id="mv-loc" class="inp" autocomplete="off"></div>
          <div class="fld"><label for="mv-tel">Telemóvel</label><input id="mv-tel" class="inp" inputmode="tel" autocomplete="off"></div></div></details>
        <div class="fld full"><label><input type="checkbox" id="mv-arm"> Volta para o armazém</label></div>
        ${fieldH({ k: 'freq', l: 'Abastecimento', t: 'sel', o: FREQ }, m.freq || '')}
        <div class="fld"><label for="mv-data">Data</label><input id="mv-data" type="date" class="inp" value="${TODAY()}"></div>
        <div class="fld full"><label for="mv-notas">Notas</label><input id="mv-notas" class="inp" placeholder="Opcional"></div></div></div>
        <div class="sf"><span class="grow"></span><button class="btn" data-act="close">Cancelar</button><button class="btn pri" data-act="maqMoverOk" data-id="${m.id}">Mover</button></div>`);
    },
    maqMoverOk: async (d, b) => {
      const m = M(d.id); const arm = $('#mv-arm')?.checked; let eid = arm ? null : ($('#f-entidade')?.value || null);
      const nome = ($('#mv-nome')?.value || '').trim(), novo = !arm && !eid && $('#mv-novo')?.open && nome;
      if (!arm && !eid && !novo) return toast('Escolha o cliente da lista, crie um cliente novo ou marque "Volta para o armazém".');
      b.disabled = true;
      if (novo) {
        const v = k => ($('#' + k)?.value || '').trim() || null;
        const nif = (v('mv-nif') || '').replace(/\s/g, '') || null;
        if (nif) { const ja = D('entidades').find(e => String(e.nif || '').replace(/\s/g, '').replace(/^PT/i, '') === nif.replace(/^PT/i, '')); if (ja) { b.disabled = false; return toast('Já existe um cliente com este NIF: ' + ja.nome + '. Escolha-o na lista.'); } }
        eid = await save('entidades', null, { nome, nif, morada: v('mv-mor'), localidade: v('mv-loc'), zona: v('mv-zona'), telemovel: v('mv-tel'), estado: 'cliente', origem: 'Máquinas' });
        if (!eid) { b.disabled = false; return; }
      }
      const r = await insertRows('maq_local', [{ maquina: m.id, entidade: eid, data: $('#mv-data')?.value || TODAY(), notas: $('#mv-notas')?.value.trim() || null }]);
      if (r) await patch('maquinas', m.id, { entidade: eid, estado: eid ? (m.estado === 'parada' ? 'parada' : 'ativa') : 'armazem', freq: eid ? ($('#f-freq')?.value || null) : m.freq });
      b.disabled = false; if (r) { closeSheet(); toast('Máquina movida para ' + (eid ? entName(eid) : 'o armazém')); }
    },
    maqParada: d => {
      const m = M(d.id); if (!m) return;
      const ids = teamIds(), pim = ids.find(i => i !== S.uid) || S.uid;
      openSheet(`<div class="sh"><h2>Máquina ${esc(m.numero)} parada</h2><button class="ib" data-act="close" aria-label="Fechar">${ic('x')}</button></div><div class="sb">
        <p class="note" style="margin:0 0 12px">${esc(local(m))}. Cria uma tarefa urgente para hoje.</p>
        <div class="fg"><div class="fld full"><label for="pr-av">Avaria que a máquina indica</label><input id="pr-av" class="inp" placeholder="Ex.: erro E12, sem água, moedeiro bloqueado"></div>
        <div class="fld"><label for="pr-resp">Para quem</label><select id="pr-resp" class="inp">${ids.map(i => `<option value="${i}" ${i === pim ? 'selected' : ''}>${esc(nameOf(i))}</option>`).join('')}</select></div></div></div>
        <div class="sf"><span class="grow"></span><button class="btn" data-act="close">Cancelar</button><button class="btn pri" data-act="maqParadaOk" data-id="${m.id}">Criar tarefa</button></div>`);
      setTimeout(() => $('#pr-av')?.focus(), 50);
    },
    maqParadaOk: async (d, b) => {
      const m = M(d.id), av = ($('#pr-av')?.value || '').trim(); if (!av) return toast('Escreva a avaria numa linha.');
      b.disabled = true;
      const quem = $('#pr-resp')?.value || S.uid;
      const id = await save('tarefas', null, { titulo: `Máquina ${m.numero} parada: ${av}`, data: TODAY(), prioridade: 'alta', resp: quem, entidade: m.entidade || null, maquina: m.id, notas: `${local(m)} · leia o QR da máquina ${m.numero} para abrir a assistência.`, feito: false });
      if (id) await patch('maquinas', m.id, { estado: 'parada' });
      b.disabled = false; if (id) { closeSheet(); toast('Tarefa criada para ' + nameOf(quem)); }
    },
    maqFat: d => {
      const m = M(d.id); if (!m) return;
      openSheet(`<div class="sh"><h2>Faturação da máquina ${esc(m.numero)}</h2><button class="ib" data-act="close" aria-label="Fechar">${ic('x')}</button></div><div class="sb">
        <div class="fg"><div class="fld"><label for="ft-v">Valor contado (€)</label><input id="ft-v" type="number" step="0.01" inputmode="decimal" class="inp"></div>
        <div class="fld"><label for="ft-d">Data</label><input id="ft-d" type="date" class="inp" value="${TODAY()}"></div>
        <div class="fld full"><label for="ft-n">Notas</label><input id="ft-n" class="inp" placeholder="Opcional"></div></div></div>
        <div class="sf"><span class="grow"></span><button class="btn" data-act="close">Cancelar</button><button class="btn pri" data-act="maqFatOk" data-id="${m.id}">Guardar</button></div>`);
      setTimeout(() => $('#ft-v')?.focus(), 50);
    },
    maqFatOk: async (d, b) => {
      const m = M(d.id), v = parseFloat(String($('#ft-v')?.value || '').replace(',', '.')); if (!isFinite(v)) return toast('Escreva o valor.');
      b.disabled = true; const r = await insertRows('maq_fat', [{ maquina: m.id, valor: v, data: $('#ft-d')?.value || TODAY(), entidade: m.entidade, notas: $('#ft-n')?.value.trim() || null }]); b.disabled = false;
      if (r) { closeSheet(); toast(`Faturação de ${eur(v)} registada`); }
    },
    maqFatDel: async (d, b) => { if (!S.verValores) return; if (!confirm('Apagar este registo de faturação?')) return; if (await remove('maq_fat', d.id)) toast('Apagado'); },
    stockCart: d => cartOpen(d.c),
  });

  /* ---------- rota de abastecimento ---------- */
  VIEWS.rota = () => loadingOr(() => {
    const chips = ['Hoje', 'Amanhã', 'Próximos 7 dias'], c = S.f.rota ?? chips[0];
    const ate = c === 'Hoje' ? TODAY() : c === 'Amanhã' ? addD(TODAY(), 1) : addD(TODAY(), 7);
    const ativas = D('maquinas').filter(m => m.entidade && m.estado !== 'armazem' && m.estado !== 'abate');
    const feitas = ativas.filter(m => ultimoAb(m.id) === TODAY());
    let L = ativas.map(m => ({ m, p: proxima(m), e: S.data.entidades.get(m.entidade) }))
      .filter(x => (x.p && x.p <= ate && !(c === 'Hoje' && feitas.includes(x.m))) || (c === 'Hoje' && x.m.estado === 'parada'))
      .filter(x => match('rota', { ...x.m, ...(x.e || {}), numero: x.m.numero }, ['numero', 'nome', 'localidade', 'morada']));
    const zona = x => x.e?.zona || x.e?.localidade || 'Sem zona';
    L.sort((a, b) => zona(a).localeCompare(zona(b), 'pt') || ((a.m.ordem ?? 9e9) - (b.m.ordem ?? 9e9)) || String(a.p || '').localeCompare(String(b.p || '')) || (parseInt(a.m.numero) || 0) - (parseInt(b.m.numero) || 0));
    const grupos = new Map(); L.forEach(x => { const z = zona(x); if (!grupos.has(z)) grupos.set(z, []); grupos.get(z).push(x); });
    const semRota = ativas.filter(m => !m.freq).length;
    const top = `<div class="tb"><div class="tbr"><label class="srch">${ic('search', 18)}<input id="q-rota" data-q="rota" type="search" placeholder="Máquina, cliente ou localidade" value="${esc(S.q.rota || '')}" autocomplete="off"></label></div>
      <div class="chips">${chips.map(x => `<button class="chipb ${x === c ? 'on' : ''}" data-act="chip" data-v="rota" data-c="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`;
    const sum = `<p class="note" style="margin:0 0 10px"><b>${L.length}</b> máquina${L.length === 1 ? '' : 's'} a visitar${c === 'Hoje' ? ` · <b>${feitas.length}</b> já abastecida${feitas.length === 1 ? '' : 's'} hoje` : ''}. Leia o QR e abasteça: a máquina sai da lista.${semRota ? ` ${semRota} máquina${semRota === 1 ? '' : 's'} sem frequência definida não ${semRota === 1 ? 'entra' : 'entram'} na rota.` : ''}</p>`;
    const row = x => { const n = x.p ? difD(x.p, TODAY()) : 0; return `<div class="row" role="button" data-act="maqOpen" data-id="${x.m.id}"><span class="av k">${esc(x.m.numero)}</span><span class="rt"><span class="r1">${esc(x.e?.nome || 'Cliente')}</span><span class="r2">${esc([moradaE(x.e) || x.e?.localidade, x.m.freq ? FREQ[x.m.freq] : ''].filter(Boolean).join(' · '))}</span></span><span class="rr">${pecaB(x.m.id)}${x.m.estado === 'parada' ? badge('Parada', 'bad') : n < 0 ? badge(`Atrasada ${-n} d`, 'bad') : (n > 0 || c !== 'Hoje') ? `<span class="note">${esc(fDia(x.p))}</span>` : ''}<a class="btn sm" href="${esc(mapaU(x.e))}" target="_blank" rel="noopener" data-act="link">Mapa</a></span></div>`; };
    const rotaU = xs => { const pts = xs.map(x => moradaE(x.e) || x.e?.nome).filter(Boolean).slice(0, 10); if (!pts.length) return ''; return 'https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=' + encodeURIComponent(pts[pts.length - 1]) + (pts.length > 1 ? '&waypoints=' + encodeURIComponent(pts.slice(0, -1).join('|')) : ''); };
    const blocos = [...grupos.entries()].map(([z, xs]) => `<div class="panel" style="margin-bottom:14px"><div class="ph"><h2>${esc(z)}</h2><span class="grow"></span>${rotaU(xs) ? `<a class="btn sm" href="${esc(rotaU(xs))}" target="_blank" rel="noopener">${ic('pin', 16)}Rota no mapa</a>` : ''}</div>${xs.map(row).join('')}</div>`).join('');
    return `<div class="pg">${top}${sum}${blocos || `<div class="panel empty"><b>${c === 'Hoje' ? 'Nada para abastecer hoje' : 'Nada previsto'}</b>${D('maquinas').some(m => m.freq) ? 'Veja os próximos dias.' : 'Defina a frequência de abastecimento em cada máquina (Editar ou Mover).'}</div>`}</div>`;
  });

  /* ---------- stock do armazém ---------- */
  function stockMap() {
    const M0 = new Map();
    const g = id => { if (!M0.has(id)) M0.set(id, { ini: 0, ent: 0, ace: 0, maq: 0, ret: 0, pec: 0, xd: 0, d0: null }); return M0.get(id); };
    D('stock_mov').forEach(x => {
      const s = g(x.artigo), q = +x.qt || 0;
      if (x.tipo === 'inicial') { s.ini += q; if (!s.d0 || x.data < s.d0) s.d0 = x.data; }
      else if (x.tipo === 'entrada') s.ent += q; else if (x.tipo === 'acerto') s.ace += q;
      else if (x.tipo === 'abastecimento') s.maq += q; else if (x.tipo === 'retirada') s.ret += q; else if (x.tipo === 'peca') s.pec += q;
    });
    const byRef = new Map(D('artigos').filter(a => a.ref).map(a => [String(a.ref), a.id]));
    xdVendas().forEach(doc => (doc.linhas || []).forEach(l => {
      const id = byRef.get(String(l.ref)); if (!id || !M0.has(id)) return; const s = M0.get(id); if (!s.d0 || doc.data < s.d0) return;
      s.xd += (+l.qt || 0) * (doc.tipo === 'NC' ? -1 : 1);
    }));
    M0.forEach(s => { s.atual = s.ini + s.ent + s.ace + s.ret - s.maq - s.pec - s.xd; });
    return M0;
  }
  VIEWS.stock = () => loadingOr(() => {
    const SM = stockMap(), chips = ['Com stock', 'Todos', 'Em falta'], c = S.f.stock ?? chips[0];
    let L = [...SM.entries()].map(([id, s]) => ({ a: art(id), s })).filter(x => x.a)
      .filter(x => c === 'Todos' || (c === 'Com stock' ? x.s.atual > 0 : x.s.atual <= 0))
      .filter(x => match('stock', x.a, ['nome', 'ref']));
    L.sort((a, b) => String(a.a.nome).localeCompare(String(b.a.nome)));
    const val = [...SM.entries()].reduce((t, [id, s]) => t + Math.max(0, s.atual) * (custoArt(art(id)) || 0), 0);
    const top = `<div class="tb"><div class="tbr"><label class="srch">${ic('search', 18)}<input id="q-stock" data-q="stock" type="search" placeholder="Pesquisar artigo" value="${esc(S.q.stock || '')}" autocomplete="off"></label>
      ${S.canWrite ? `<button class="btn pri" data-act="stockCart" data-c="entrada">${ic('plus', 18)}<span>Entrada</span></button><button class="btn" data-act="stockCart" data-c="inicial">Stock inicial</button><button class="btn" data-act="stockCart" data-c="acerto">Acerto</button>` : ''}</div>
      <div class="chips">${chips.map(x => `<button class="chipb ${x === c ? 'on' : ''}" data-act="chip" data-v="stock" data-c="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`;
    const sum = `<p class="note" style="margin:0 0 10px"><b>${SM.size}</b> artigo${SM.size === 1 ? '' : 's'} com movimentos · valor em stock <b>${eur(val)}</b> (preço de custo). Stock = inicial + entradas ± acertos − abastecimentos e peças das máquinas − vendas faturadas no XD desde o stock inicial.</p>`;
    const row = x => rowH({ act: 'open', col: 'artigos', id: x.a.id, title: x.a.nome, sub: `${x.a.ref ? x.a.ref + ' · ' : ''}inicial ${x.s.ini} · entradas ${x.s.ent + x.s.ace} · máquinas ${x.s.maq - x.s.ret} · peças ${x.s.pec} · vendas XD ${x.s.xd}`, right: String(Math.round(x.s.atual * 100) / 100), badges: x.s.atual < 0 ? badge('Negativo', 'bad') : '' });
    return `<div class="pg">${top}${sum}${listBlock('stock', L, row, SM.size ? '<b>Nenhum artigo neste filtro</b>Veja "Todos".' : '<b>Sem movimentos de stock</b>Comece por "Stock inicial": conte o armazém e registe as quantidades.')}</div>`;
  });

  /* ---------- etiquetas QR ---------- */
  const QR_URL = n => `${location.origin}${location.pathname.replace(/index\.html$/, '')}?maq=${encodeURIComponent(n)}`;
  function loadQR() { return window.qrcode ? Promise.resolve() : new Promise((ok, ko) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'; s.onload = ok; s.onerror = ko; document.head.appendChild(s); }); }
  VIEWS.maqqr = () => `<div class="pg"><div class="panel"><div class="ph"><h2>Etiquetas QR das máquinas</h2></div><div class="pb">
    <p class="note" style="margin-top:0">Cada etiqueta abre a ficha da máquina com esse número. Pode imprimir números que ainda não estão registados: ao ler o QR pela primeira vez, o CRM pergunta se quer registar a máquina.</p>
    <div class="fg"><div class="fld"><label for="qr-de">Do número</label><input id="qr-de" type="number" class="inp" value="1"></div><div class="fld"><label for="qr-ate">Até ao número</label><input id="qr-ate" type="number" class="inp" value="60"></div>
    <div class="fld full"><label for="qr-lista">Ou só estes números (separados por vírgulas)</label><input id="qr-lista" class="inp" placeholder="Ex.: 3, 15, 22"></div></div>
    <div style="margin-top:14px"><button class="btn pri" data-act="qrPrint">${ic('qr', 18)}Criar etiquetas para imprimir</button></div></div></div></div>`;
  ACT.qrPrint = async () => {
    let nums = ($('#qr-lista')?.value || '').split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
    if (!nums.length) { const a = parseInt($('#qr-de')?.value) || 1, b = parseInt($('#qr-ate')?.value) || a; for (let i = a; i <= Math.min(b, a + 199); i++) nums.push(String(i)); }
    const w = window.open('', '_blank'); if (!w) return toast('O navegador bloqueou a janela. Permita janelas para este site.');
    try { await loadQR(); } catch (_) { w.close(); return toast('Sem ligação para gerar os QR.'); }
    const svg = n => { const q = qrcode(0, 'M'); q.addData(QR_URL(n)); q.make(); return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); };
    w.document.write(`<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><title>Etiquetas QR · Coronel Café</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&family=Hanken+Grotesk:wght@400;500&display=swap" rel="stylesheet">
<style>@page{size:A4;margin:10mm}body{margin:0;font-family:'Hanken Grotesk',Arial,sans-serif;color:#1D1D1F}
.g{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm}.e{border:1px solid #E5E5EA;border-radius:3mm;padding:5mm;text-align:center;break-inside:avoid}
.e svg{width:38mm;height:38mm}.n{font-family:'Cormorant Garamond',serif;font-size:30pt;line-height:1;margin:2mm 0 1mm}.b{font-size:8pt;color:#6E6E73;letter-spacing:.08em;text-transform:uppercase}
.r{height:.3mm;background:#C4A052;width:16mm;margin:2mm auto}.t{font-size:8pt;color:#6E6E73}.p{text-align:center;margin:6mm 0;font-size:10pt}@media print{.p{display:none}}</style></head><body>
<div class="p"><button onclick="print()">Imprimir</button></div><div class="g">${nums.map(n => `<div class="e">${svg(n)}<div class="n">${String(n).replace(/[<>&]/g, '')}</div><div class="r"></div><div class="b">Coronel Café</div><div class="t">Leia para abastecer ou pedir assistência</div></div>`).join('')}</div></body></html>`);
    w.document.close();
  };

  /* ---------- abrir pelo QR (?maq=15) ---------- */
  let qp = new URLSearchParams(location.search).get('maq');
  try { if (qp) sessionStorage.setItem('maqPend', qp); else qp = sessionStorage.getItem('maqPend'); } catch (_) { }
  if (qp) {
    if (location.search) history.replaceState(null, '', location.pathname);
    const t = setInterval(() => { if (S.uid && S.ready.maquinas) { clearInterval(t); try { sessionStorage.removeItem('maqPend') } catch (_) { } go('maquina', { num: qp }); } }, 300);
  }
};
