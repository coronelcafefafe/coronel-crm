/* Loja online (Shopify) no Início do computador, só para quem vê valores.
   As encomendas pagas no site chegam sozinhas (função shopify-webhook) a loja_encomendas;
   aqui fatura-se com um toque: Fatura-recibo se houver NIF, Fatura Simplificada se não houver, e abre o PDF para imprimir. */
window.LOJA_INIT = () => {
  const L = { enc: null, map: null, t: 0, busy: false };
  async function carregar() {
    if (L.busy || !S.db || !S.verValores) return; L.busy = true;
    try {
      const desde = new Date(Date.now() - 7 * 864e5).toISOString();
      const [a, b] = await Promise.all([
        S.db.from('loja_encomendas').select('*').or(`estado.eq.por faturar,faturada_em.gte.${desde}`).order('data', { ascending: false }).limit(40),
        L.map ? Promise.resolve({ data: null }) : S.db.from('loja_artigos').select('variant_id,ref,fator'),
      ]);
      L.enc = a.data || [];
      if (b.data) L.map = new Map(b.data.map(x => [x.variant_id, x]));
      L.t = Date.now();
    } catch (_) { L.enc = L.enc || []; L.t = Date.now(); /* tenta outra vez daqui a 1 minuto */ }
    L.busy = false;
    if (S.view === 'inicio') render();
  }
  const semArtigo = e => (e.linhas || []).filter(l => !L.map?.get(l.variant_id)?.ref).map(l => l.titulo);
  const nifOk = n => /^\d{9}$/.test(String(n || '').replace(/\D/g, '')) && String(n).replace(/\D/g, '') !== '999999990';
  const linhasTxt = e => (e.linhas || []).map(l => `${l.qt}× ${l.titulo}`).join(' · ') + (+e.portes > 0 ? ` · portes ${eur(e.portes)}` : '');

  window.lojaH = () => {
    if (!S.verValores || innerWidth < 960) return '';
    if (!L.enc || Date.now() - L.t > 60_000) carregar();
    if (!L.enc) return '';
    const por = L.enc.filter(e => e.estado === 'por faturar'), feitas = L.enc.filter(e => e.estado === 'faturada');
    if (!por.length && !feitas.length) return '';
    const cli = e => { const c = e.cliente || {}; return [c.nome, c.empresa].filter(Boolean).join(' · ') || 'Cliente'; };
    const linhaPor = e => {
      const falta = semArtigo(e), nif = e.nif || '';
      return `<div class="row" style="cursor:default;align-items:flex-start;gap:12px">
        <span class="av k">${ic('doc', 16)}</span>
        <span class="rt"><span class="r1">${esc(e.nome || '')} · ${esc(cli(e))}</span>
          <span class="r2">${esc(fD(String(e.data || '').slice(0, 10)))} · ${esc(linhasTxt(e))}</span>
          ${falta.length ? `<span class="r2" style="color:var(--bad)">Sem artigo do XD: ${esc(falta.join(', '))}</span>` : ''}</span>
        <span class="rr" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end">
          <b class="num">${eur(e.total)}</b>
          <input class="inp" style="width:120px" inputmode="numeric" maxlength="9" placeholder="NIF (opcional)" data-lojanif="${e.id}" value="${esc(nif)}" aria-label="NIF">
          <button class="btn sm gold" type="button" data-act="lojaFat" data-id="${e.id}" ${falta.length ? 'disabled' : ''}>Faturar e imprimir</button>
        </span></div>`;
    };
    const linhaFeita = e => `<div class="row" role="button" data-act="lojaPdf" data-id="${e.id}"><span class="av k">${ic('doc', 16)}</span><span class="rt"><span class="r1">${esc(e.nome || '')} · ${esc(cli(e))}</span><span class="r2">${esc(e.fatura || 'Faturada')} · ${eur(e.total)}</span></span><span class="rr">${badge('PDF', 'mute')}</span></div>`;
    return `<div class="panel" style="margin-bottom:14px"><div class="ph"><h2>Loja online</h2><span class="note">${por.length ? `${por.length} por faturar` : 'tudo faturado'}</span><span class="grow"></span><button class="btn sm" type="button" data-act="lojaRec">Atualizar</button></div>
      ${por.map(linhaPor).join('')}
      ${por.length ? `<p class="note" style="margin:4px 16px 10px">Com NIF sai Fatura-recibo; sem NIF, Fatura Simplificada. Já paga (Shopify), com os preços do site. O PDF abre para imprimir e ir com a mercadoria.</p>` : ''}
      ${feitas.length ? `<div class="eyebrow" style="margin:8px 16px 4px">Faturadas nos últimos 7 dias</div>${feitas.map(linhaFeita).join('')}` : ''}</div>`;
  };

  const callSobaL = async body => fetch(CFG.url + '/functions/v1/xd-soba', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ((await S.db.auth.getSession()).data.session?.access_token || ''), apikey: CFG.anonKey }, body: JSON.stringify(body) });
  async function abrirPdf(id, w) {
    try {
      const r = await callSobaL({ acao: 'loja_pdf', id });
      if (!r.ok) { if (w) w.close(); toast('Não foi possível abrir o PDF'); return; }
      const u = URL.createObjectURL(await r.blob());
      if (w) w.location.href = u; else (window.open(u, '_blank') || (location.href = u));
    } catch (_) { if (w) w.close(); toast('Sem ligação'); }
  }
  Object.assign(ACT, {
    lojaRec: () => { L.t = 0; carregar(); },
    lojaPdf: d => abrirPdf(d.id, window.open('', '_blank')),
    lojaFat: async (d, b) => {
      const e = (L.enc || []).find(x => x.id === d.id); if (!e || !canAct()) return;
      const nif = String(document.querySelector(`[data-lojanif="${d.id}"]`)?.value || '').replace(/\D/g, '');
      if (nif && !nifOk(nif)) { toast('NIF inválido: 9 algarismos'); return; }
      if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = nif ? `Confirmar FR · NIF ${nif}` : 'Confirmar FS · sem NIF'; setTimeout(() => { if (b.isConnected && !b.disabled) { delete b.dataset.armed; b.textContent = 'Faturar e imprimir'; } }, 6000); return; }
      const w = window.open('', '_blank');
      b.disabled = true; b.textContent = 'A faturar…';
      try {
        const r = await callSobaL({ acao: 'loja_faturar', id: e.id, nif: nif || null });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) { if (w) w.close(); toast('Não foi faturada: ' + (j.error || 'erro ' + r.status)); b.disabled = false; delete b.dataset.armed; b.textContent = 'Tentar outra vez'; return; }
        toast(`${j.identificador || 'Fatura'} emitida no XD`);
        await abrirPdf(e.id, w);
        L.t = 0; carregar();
      } catch (_) { if (w) w.close(); toast('Sem ligação. Tente outra vez.'); b.disabled = false; delete b.dataset.armed; b.textContent = 'Tentar outra vez'; }
    },
  });
};
