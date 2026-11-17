/* Vendas no Início (só computador e só para quem vê valores):
   comparação mês a mês e acumulado com o ano anterior, artigos mais vendidos e onde subiu/desceu.
   Junta o faturado no XD (sem IVA) com o dinheiro das máquinas registado no CRM (cofre − troco, sem IVA 23%). */
window.VENDAS_INIT = () => {
  const st = document.createElement('style');
  st.textContent = `
  .vn-top{display:flex;align-items:flex-end;gap:12px;margin:6px 0 10px}.vn-top h2{margin:0}
  .vn-k{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px}
  .vn-g{display:grid;grid-template-columns:1.6fr 1fr;gap:12px;margin-bottom:12px}
  .vn-g2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
  .vn-leg{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--ink-3);margin:0 0 4px}.vn-leg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:-1px}
  .vn-r{display:grid;grid-template-columns:18px minmax(0,1fr) 74px 54px;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--line);font-size:14px}
  .vn-r:first-child{border-top:0}.vn-r .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .vn-bar{display:block;margin-top:5px;height:5px;background:var(--surface-2);border-radius:4px;overflow:hidden}.vn-bar b{display:block;height:100%;background:var(--ink);border-radius:4px}
  .vn-n{text-align:right;font-variant-numeric:tabular-nums}
  .vn-m{display:grid;grid-template-columns:minmax(0,1fr) 96px;gap:8px;align-items:center;padding:8px 0;border-top:1px solid var(--line);font-size:14px}
  .vn-m:first-child{border-top:0}.vn-m small{display:block;color:var(--ink-3);font-size:12px}.vn-m .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .vn-p{display:inline-block;font-size:12px;font-weight:600;padding:1px 7px;border-radius:999px;background:var(--ok-soft);color:var(--ok)}.vn-p.dn{background:var(--bad-soft);color:var(--bad)}
  .vn-s{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;margin:4px 0 2px}`;
  document.head.appendChild(st);

  const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const NAO_ARTIGO = /comiss|carrinha|servi[cç]o comercial/i; /* não são produtos: ficam no total mas fora das listas */
  const GEN = new Set(['0', '271']); /* consumidor final e cliente genérico não contam como clientes */
  const iso = d => d.toISOString().slice(0, 10);
  const menosAno = s => (+s.slice(0, 4) - 1) + s.slice(4);
  const pct = (a, b) => b > 0.5 ? Math.round((a / b - 1) * 100) : null;
  const pill = (d, novo) => d == null ? (novo ? '<span class="vn-p">novo</span>' : '') : `<span class="vn-p ${d < 0 ? 'dn' : ''}">${d > 0 ? '+' : ''}${d}%</span>`;
  const k0 = v => Math.round(v).toLocaleString('pt-PT') + ' €';

  const dados = () => {
    const xv = D('xd_documentos').filter(d => XD_VENDA.includes(d.tipo) && d.data);
    const maq = []; /* {data, v} sem IVA */
    D('maq_fat').forEach(f => f.data && maq.push({ data: f.data, v: (+f.valor || 0) / 1.23 }));
    D('maq_troco').forEach(t => t.data && maq.push({ data: String(t.data).slice(0, 10), v: (t.tipo === 'retirar' ? 1 : -1) * (+t.valor || 0) / 1.23 }));
    return { xv, maq };
  };

  const periodo = k => {
    const hoje = iso(new Date()), y = hoje.slice(0, 4);
    let a;
    if (k === 'mes') a = hoje.slice(0, 8) + '01';
    else if (k === '12m') { const d = new Date(); d.setFullYear(d.getFullYear() - 1); d.setDate(d.getDate() + 1); a = iso(d); }
    else a = y + '-01-01';
    return { a, b: hoje, pa: menosAno(a), pb: menosAno(hoje) };
  };

  const somaArtigos = (xv, a, b) => {
    const m = new Map();
    xv.forEach(d => {
      if (d.data < a || d.data > b) return;
      const s = d.tipo === 'NC' ? -1 : 1;
      (d.linhas || []).forEach(l => {
        if (NAO_ARTIGO.test(l.nome || '')) return;
        const r = String(l.ref || l.nome || '');
        const x = m.get(r) || { nome: l.nome || r, v: 0, q: 0 };
        x.v += s * Math.abs(+l.total || 0); x.q += s * Math.abs(+l.qt || 0); x.nome = l.nome || x.nome;
        m.set(r, x);
      });
    });
    return m;
  };

  /* barras mês a mês: este ano (escuro) vs ano passado (claro), máquinas por cima em dourado */
  const barras = (A, P, MA, MP, mAtual) => {
    const W = 720, H = 250, L = 42, B = 22, T = 8;
    const mx0 = Math.max(1, ...A.map((v, i) => v + MA[i]), ...P.map((v, i) => v + MP[i]));
    const passo = [500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000].find(p => mx0 / p <= 5) || 100000;
    const mx = Math.ceil(mx0 / passo) * passo, g = (W - L) / 12, bw = g * .32, h = v => (H - T - B) * Math.max(0, v) / mx;
    let o = '';
    for (let v = 0; v <= mx; v += passo) { const yy = T + (H - T - B) * (1 - v / mx); o += `<line x1="${L}" x2="${W}" y1="${yy}" y2="${yy}" stroke="var(--line)"/><text x="${L - 6}" y="${yy + 4}" font-size="11" fill="var(--ink-3)" text-anchor="end">${v >= 1000 ? v / 1000 + 'k' : v}</text>`; }
    MES.forEach((t, i) => {
      const x = L + i * g + g * .16, x2 = x + bw + 3, base = H - B;
      const tit = (ano, v, m) => `<title>${t} ${ano}: ${k0(v + m)}${m ? ` (máquinas ${k0(m)})` : ''}</title>`;
      if (P[i] || MP[i]) o += `<g>${tit('ano passado', P[i], MP[i])}<rect x="${x}" y="${base - h(P[i])}" width="${bw}" height="${h(P[i])}" rx="2" fill="#D9D4C7"/>${MP[i] ? `<rect x="${x}" y="${base - h(P[i]) - h(MP[i])}" width="${bw}" height="${h(MP[i])}" rx="2" fill="#E8D9B5"/>` : ''}</g>`;
      if (i <= mAtual) o += `<g ${i === mAtual ? 'opacity=".55"' : ''}>${tit('este ano', A[i], MA[i])}<rect x="${x2}" y="${base - h(A[i])}" width="${bw}" height="${h(A[i])}" rx="2" fill="var(--ink)"/>${MA[i] ? `<rect x="${x2}" y="${base - h(A[i]) - h(MA[i])}" width="${bw}" height="${h(MA[i])}" rx="2" fill="var(--gold)"/>` : ''}</g>`;
      o += `<text x="${L + i * g + g / 2}" y="${H - 5}" font-size="12" fill="var(--ink-3)" text-anchor="middle">${t}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Vendas mês a mês">${o}</svg>`;
  };

  /* acumulado do ano: linha deste ano vs ano passado (tracejado), até ao mês atual */
  const acumulado = (CA, CP, mAtual, yA, yP) => {
    const W = 440, H = 250, L = 42, B = 22, T = 14, n = 12;
    const mx0 = Math.max(1, ...CA.slice(0, mAtual + 1), ...CP);
    const passo = [1000, 2500, 5000, 10000, 25000, 50000].find(p => mx0 / p <= 5) || 100000, mx = Math.ceil(mx0 / passo) * passo;
    const X = i => L + i * (W - L - 12) / (n - 1), Y = v => T + (H - T - B) * (1 - v / mx);
    let o = '';
    for (let v = 0; v <= mx; v += passo) o += `<line x1="${L}" x2="${W}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${L - 6}" y="${Y(v) + 4}" font-size="11" fill="var(--ink-3)" text-anchor="end">${v >= 1000 ? v / 1000 + 'k' : v}</text>`;
    o += `<polyline points="${CP.map((v, i) => `${X(i)},${Y(v)}`).join(' ')}" fill="none" stroke="#B9B2A2" stroke-width="2" stroke-dasharray="5 4"/>`;
    const ca = CA.slice(0, mAtual + 1);
    o += `<polyline points="${ca.map((v, i) => `${X(i)},${Y(v)}`).join(' ')}" fill="none" stroke="var(--ink)" stroke-width="2.5"/>`;
    const ex = X(mAtual), va = ca[mAtual], vp = CP[mAtual];
    o += `<circle cx="${ex}" cy="${Y(va)}" r="4" fill="var(--ink)"/><circle cx="${ex}" cy="${Y(vp)}" r="3.5" fill="#B9B2A2"/>`;
    [0, 2, 4, 6, 8, 10].forEach(i => o += `<text x="${X(i)}" y="${H - 5}" font-size="12" fill="var(--ink-3)" text-anchor="middle">${MES[i]}</text>`);
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Vendas acumuladas no ano">${o}</svg>`;
  };

  window.vendasH = () => {
    if (!window.matchMedia('(min-width:960px)').matches) return '';
    const per = S.f.venper || 'ano', P = periodo(per);
    const { xv, maq } = dados();
    const hoje = iso(new Date()), yA = +hoje.slice(0, 4), yP = yA - 1, mAtual = +hoje.slice(5, 7) - 1;

    /* séries mensais */
    const A = Array(12).fill(0), Pp = Array(12).fill(0), MA = Array(12).fill(0), MP = Array(12).fill(0);
    xv.forEach(d => { const y = +d.data.slice(0, 4), m = +d.data.slice(5, 7) - 1; if (y === yA) A[m] += xdLiq(d); else if (y === yP) Pp[m] += xdLiq(d); });
    maq.forEach(x => { const y = +x.data.slice(0, 4), m = +x.data.slice(5, 7) - 1; if (y === yA) MA[m] += x.v; else if (y === yP) MP[m] += x.v; });
    const cum = (a, b) => { let t = 0; return a.map((v, i) => t += v + b[i]); };
    /* o acumulado do ano passado vai até ao mesmo dia de hoje, não ao fim do mês */
    const CA = cum(A, MA), CPfull = cum(Pp, MP);
    const prevYTD = xv.filter(d => d.data >= yP + '-01-01' && d.data <= menosAno(hoje)).reduce((s, d) => s + xdLiq(d), 0) + maq.filter(x => x.data >= yP + '-01-01' && x.data <= menosAno(hoje)).reduce((s, x) => s + x.v, 0);
    const CP = CPfull.map((v, i) => i === mAtual ? prevYTD : v);

    /* totais do período escolhido */
    const somaX = (a, b) => xv.filter(d => d.data >= a && d.data <= b).reduce((s, d) => s + xdLiq(d), 0);
    const somaM = (a, b) => maq.filter(x => x.data >= a && x.data <= b).reduce((s, x) => s + x.v, 0);
    const cli = (a, b) => new Set(xv.filter(d => d.data >= a && d.data <= b && d.entidade && !GEN.has(String(d.codigo_xd ?? d.codigoXd ?? ''))).map(d => d.entidade)).size;
    const xA = somaX(P.a, P.b), xP = somaX(P.pa, P.pb), mA = somaM(P.a, P.b), mP = somaM(P.pa, P.pb);
    const cA = cli(P.a, P.b), cP = cli(P.pa, P.pb);
    const desde = maq.length ? maq.reduce((m, x) => x.data < m ? x.data : m, '9999') : null;
    const tPer = { mes: 'este mês', ano: 'este ano', '12m': 'nos últimos 12 meses' }[per];
    const kpi = (t, v, s) => `<div class="kpi"><span class="eyebrow">${t}</span><span class="v">${v}</span><span class="s">${s}</span></div>`;
    const comp = (a, b) => { const d = pct(a, b); return d == null ? 'sem dados do ano passado' : `${pill(d)} vs ${k0(b)} no ano passado`; };

    /* artigos */
    const AA = somaArtigos(xv, P.a, P.b), AP = somaArtigos(xv, P.pa, P.pb);
    const top = [...AA.entries()].filter(([, x]) => x.v > 0).sort((a, b) => b[1].v - a[1].v).slice(0, 8);
    const mxTop = top.length ? top[0][1].v : 1;
    const dif = new Map();
    new Set([...AA.keys(), ...AP.keys()]).forEach(r => { const a = AA.get(r), p = AP.get(r); dif.set(r, { nome: (a || p).nome, a: a?.v || 0, p: p?.v || 0, qa: a?.q || 0, qp: p?.q || 0, d: (a?.v || 0) - (p?.v || 0) }); });
    if (mA || mP) dif.set('__maq', { nome: 'Máquinas de vending (cofre)', a: mA, p: mP, d: mA - mP, maq: 1 });
    const L = [...dif.values()];
    const sobe = L.filter(x => x.d > 0.5).sort((a, b) => b.d - a.d).slice(0, 4), desce = L.filter(x => x.d < -0.5).sort((a, b) => a.d - b.d).slice(0, 4);
    const sub = x => x.p < 0.5 ? (x.maq && desde ? `registo no CRM desde ${desde.split('-').reverse().join('/')}` : 'não vendeu no período do ano passado') : `${k0(x.a)} vs ${k0(x.p)}`;
    const mv = (x, up) => `<div class="vn-m"><span class="nm" title="${esc(x.nome)}">${esc(x.nome)}<small>${sub(x)}</small></span><b class="vn-n" style="color:var(--${up ? 'ok' : 'bad'})">${up ? '+' : '−'}${k0(Math.abs(x.d))}</b></div>`;

    return `<div class="vn-top"><div><div class="eyebrow">Faturado no XD + máquinas · sem IVA</div><h2 style="font-family:var(--f-display);font-size:28px;font-weight:600">Como estão as vendas</h2></div><span class="grow" style="flex:1"></span>
      <div class="chips" style="margin:0">${[['mes', 'Este mês'], ['ano', 'Ano até hoje'], ['12m', '12 meses']].map(([k, t]) => `<button class="chipb ${k === per ? 'on' : ''}" data-act="venPer" data-c="${k}">${t}</button>`).join('')}</div></div>
    <div class="vn-k">
      ${kpi(`Vendido ${tPer}`, k0(xA + mA), comp(xA + mA, xP + mP))}
      ${kpi('Faturado no XD', k0(xA), comp(xA, xP))}
      ${kpi('Máquinas (cofre)', k0(mA), mP > 0.5 ? comp(mA, mP) : (desde ? `registo no CRM desde ${desde.split('-').reverse().join('/')}` : 'sem registos de cofre'))}
      ${kpi('Clientes faturados', cA, cP ? `<span class="vn-p ${cA < cP ? 'dn' : ''}">${cA >= cP ? '+' : '−'}${Math.abs(cA - cP)}</span> vs ${cP} no ano passado` : 'sem dados do ano passado')}
    </div>
    <div class="vn-g">
      <div class="panel" style="margin:0"><div class="ph"><h2>Mês a mês</h2></div><div class="pb">
        <div class="vn-leg"><span><i style="background:var(--ink)"></i>${yA} XD</span><span><i style="background:var(--gold)"></i>${yA} máquinas</span><span><i style="background:#D9D4C7"></i>${yP} XD</span>${MP.some(v => v) ? `<span><i style="background:#E8D9B5"></i>${yP} máquinas</span>` : ''}</div>
        ${barras(A, Pp, MA, MP, mAtual)}
        <p class="note" style="margin:6px 0 0">${MES[mAtual]} de ${yA} ainda vai a meio. Passe o rato por cima de uma barra para ver o valor.</p></div></div>
      <div class="panel" style="margin:0"><div class="ph"><h2>Acumulado no ano</h2></div><div class="pb">
        ${acumulado(CA, CP, mAtual, yA, yP)}
        <p class="note" style="margin:6px 0 0"><b style="color:var(--ink)">${yA}: ${k0(CA[mAtual])}</b> · ${yP} até ao mesmo dia: ${k0(CP[mAtual])} ${pill(pct(CA[mAtual], CP[mAtual]))}<br>Tracejado: ${yP}. Mostra se estamos a ganhar ou a perder terreno.</p></div></div>
    </div>
    <div class="vn-g2">
      <div class="panel" style="margin:0"><div class="ph"><h2>Artigos mais vendidos</h2></div><div class="pb">
        <p class="note" style="margin:0 0 6px">${tPer[0].toUpperCase() + tPer.slice(1)} · variação vs mesmo período do ano passado</p>
        ${top.length ? top.map(([r, x], i) => { const p = AP.get(r); return `<div class="vn-r"><span class="note">${i + 1}</span><span style="min-width:0"><span class="nm" style="display:block" title="${esc(x.nome)}">${esc(x.nome)}</span><span class="vn-bar"><b style="width:${Math.max(2, x.v / mxTop * 100)}%"></b></span></span><span class="vn-n">${k0(x.v)}</span><span class="vn-n">${pill(pct(x.v, p?.v || 0), !(p?.v > 0.5))}</span></div>`; }).join('') : '<div class="empty">Sem vendas no período.</div>'}
      </div></div>
      <div class="panel" style="margin:0"><div class="ph"><h2>Onde mais subiu e desceu</h2></div><div class="pb">
        <div class="vn-s" style="color:var(--ok)">Subiu</div>${sobe.map(x => mv(x, 1)).join('') || '<p class="note">Nada subiu.</p>'}
        <div class="vn-s" style="color:var(--bad);margin-top:12px">Desceu</div>${desce.map(x => mv(x, 0)).join('') || '<p class="note">Nada desceu.</p>'}
      </div></div>
    </div>`;
  };

  Object.assign(ACT, { venPer: d => { S.f.venper = d.c; render(); } });
};
