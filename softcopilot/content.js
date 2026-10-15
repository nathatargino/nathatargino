(function () {
    const isHub = window.location.hostname.includes('hub.softcomtecnologia.com');
    const isHelpTools = window.location.hostname.includes('softcomsistemas.com.br');

    // =========================================================
    // 1. EXECUÇÃO DENTRO DO HUB SOFTCOM (AUTO-ABERTURA E PREENCHIMENTO)
    // =========================================================
    if (isHub) {
        executarAutomacaoHub();
        return;
    }

    // =========================================================
    // 2. EXECUÇÃO NO PORTAL DO CONHECIMENTO SOFTCOM (HELPTOOLS)
    // =========================================================
    if (isHelpTools) {
        executarModuloHelpTools();
        return;
    }

    // =========================================================
    // 3. EXECUÇÃO NO PAINEL DE ATENDIMENTO (HOSTSOFTCOM / CHAT)
    // =========================================================
    executarPainelAtendimento();

    // ---------------------------------------------------------
    // LÓGICA DO HUB SOFTCOM
    // ---------------------------------------------------------
    function executarAutomacaoHub() {
        const urlParams = new URLSearchParams(window.location.search);
        const autoOc = urlParams.get('autoOc');
        const ticketParam = urlParams.get('ticket');
        const telParam = urlParams.get('tel');
        const nomeParam = urlParams.get('nome');
        const cnpjParam = urlParams.get('cnpj');
        const qParam = urlParams.get('q') || urlParams.get('search');

        if (!autoOc && !ticketParam && !telParam && !nomeParam && !cnpjParam && !qParam) return;

        console.log('[Extensão Softcom] Inicializando automação/abertura no Hub:', { autoOc, ticketParam, telParam, nomeParam, cnpjParam, qParam });

        let hasClickedNewOc = false;
        let filledTicket = false;
        let filledTel = false;
        let filledNome = false;
        let fallbackBuscaTentada = false;

        // Dispara eventos compatíveis com React Hook Form e inputs controlados
        function setReactInputValue(input, value) {
            if (!input || value === undefined || value === null || value === '') return;
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (setter) {
                setter.call(input, value);
            } else {
                input.value = value;
            }
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
        }

        function tentarPreencher() {
            // 1. Clicar no botão "Nova ocorrência" SOMENTE se autoOc foi explicitamente solicitado
            if (!hasClickedNewOc && (autoOc === 'true' || autoOc === '1')) {
                const btnNovaOc = document.querySelector('.cd-new-occurrence, .oc-action-occurrence, button[title*="nova ocorrência" i]') ||
                    Array.from(document.querySelectorAll('button:not([disabled])')).find(b => b.innerText.trim().toLowerCase() === 'nova ocorrência');

                if (btnNovaOc && !btnNovaOc.disabled) {
                    console.log('[Extensão Softcom] Ficha do cliente carregada. Clicando em Nova ocorrência...');
                    btnNovaOc.click();
                    hasClickedNewOc = true;
                }
            }

            // 2. Preencher o campo Solicitante (Nome de quem solicitou) no modal de ocorrência (se existir)
            if (nomeParam && !filledNome) {
                const nomeInput = document.querySelector('#pitstop-solicitado-por, input[name="solicitadoPor"], input[placeholder*="solicitou" i], input[placeholder*="Solicitante" i]');
                if (nomeInput) {
                    if (!nomeInput.value || nomeInput.value.trim() === '') {
                        console.log('[Extensão Softcom] Preenchendo campo Solicitante com:', nomeParam);
                        setReactInputValue(nomeInput, nomeParam);
                    }
                    filledNome = true;
                }
            }

            // 3. Preencher o campo de Ticket do Chat no modal de ocorrência
            if (ticketParam && !filledTicket) {
                const ticketInput = document.querySelector('input.oc-chat-ticket-input, input[placeholder*="ticket" i], input[aria-label*="ticket" i], input[name="chatTicket"]');
                if (ticketInput) {
                    console.log('[Extensão Softcom] Preenchendo campo do Ticket com:', ticketParam);
                    setReactInputValue(ticketInput, ticketParam);
                    filledTicket = true;
                }
            }

            // 4. Preencher o campo de Telefone no modal de ocorrência
            if (telParam && !filledTel) {
                const telInput = document.querySelector('#pitstop-cliente-numero, input[name="clienteNumero"], input[placeholder*="chamada" i]');
                if (telInput) {
                    if (!telInput.value || telInput.value.replace(/\D/g, '') === '') {
                        console.log('[Extensão Softcom] Preenchendo campo de Telefone com:', telParam);
                        setReactInputValue(telInput, telParam);
                    }
                    filledTel = true;
                }
            }

            // 5. Fallback para abertura direta do cliente caso o Hub não tenha aberto via ?cnpj= nativo
            if (!fallbackBuscaTentada && (cnpjParam || qParam || nomeParam)) {
                const temModalAberto = document.querySelector('.cd-new-occurrence, .oc-action-occurrence, button[title*="nova ocorrência" i]') ||
                    Array.from(document.querySelectorAll('button')).some(b => b.innerText.trim().toLowerCase() === 'nova ocorrência');

                if (!temModalAberto) {
                    const searchInput = document.querySelector('input[placeholder*="Buscar por nome" i]');
                    if (searchInput && (!searchInput.value || searchInput.value.trim() === '')) {
                        const termo = (cnpjParam || qParam || nomeParam || '').trim();
                        if (termo) {
                            console.log('[Extensão Softcom] Injetando termo no campo de busca do Hub:', termo);
                            setReactInputValue(searchInput, termo);
                            fallbackBuscaTentada = true;

                            setTimeout(() => {
                                const firstRow = document.querySelector('.cl-row');
                                if (firstRow) {
                                    console.log('[Extensão Softcom] Clicando no cliente encontrado na listagem...');
                                    firstRow.click();
                                }
                            }, 900);
                        }
                    }
                }
            }

            // Se for fluxo de autoOc e todas as tarefas estiverem concluídas
            if (autoOc === 'true' || autoOc === '1') {
                const ticketDone = !ticketParam || filledTicket;
                const telDone = !telParam || filledTel;
                const nomeDone = !nomeParam || filledNome;

                if (ticketDone && telDone && nomeDone && hasClickedNewOc) {
                    console.log('[Extensão Softcom] Automação de ocorrência concluída com sucesso!');
                    encerrarAutomacao();
                }
            }
        }

        const observer = new MutationObserver(() => {
            tentarPreencher();
        });

        observer.observe(document.body, { childList: true, subtree: true });

        function encerrarAutomacao() {
            observer.disconnect();
            try {
                const cleanUrl = new URL(window.location.href);
                cleanUrl.searchParams.delete('autoOc');
                cleanUrl.searchParams.delete('ticket');
                cleanUrl.searchParams.delete('tel');
                cleanUrl.searchParams.delete('nome');
                window.history.replaceState({}, document.title, cleanUrl.toString());
            } catch (e) { }
        }

        // Timeout de segurança de 25 segundos
        setTimeout(() => {
            observer.disconnect();
        }, 25000);

        tentarPreencher();
    }

    // ---------------------------------------------------------
    // LÓGICA DO PORTAL DO CONHECIMENTO SOFTCOM (HELPTOOLS)
    // ---------------------------------------------------------
    function executarModuloHelpTools() {
        console.log('%c[Extensão Softcom] Ativada no Portal do Conhecimento HelpTools!', 'color: #E3B400; font-weight: bold; font-size: 14px;');

        function criarBotaoFlutuante() {
            // Botão "Extrair Manuais para IA" removido a pedido
            const el = document.getElementById('softcom-extrator-flutuante');
            if (el) el.remove();
        }

        async function iniciarExtracaoManuaisHelpTools() {
            let modal = document.getElementById('modal-progresso-extrator');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'modal-progresso-extrator';
                modal.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 420px;
                    background: #18222a;
                    color: #fff;
                    border: 2px solid #E3B400;
                    border-radius: 14px;
                    box-shadow: 0 16px 45px rgba(0,0,0,0.7);
                    padding: 22px;
                    z-index: 999999999;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                `;
                document.body.appendChild(modal);
            }

            modal.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div style="font-weight:700; color:#E3B400; font-size:16px; display:flex; align-items:center; gap:8px;">
                        <span>⚡</span> Extrator Completo de Manuais & FAQs
                    </div>
                    <button id="fechar-modal-extrator" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✖</button>
                </div>
                <div id="extrator-status" style="font-size:13px; color:#cbd5e1; margin-bottom:10px; font-weight:500;">
                    Iniciando varredura profunda no portal...
                </div>
                <div style="background:#2d3c48; border-radius:6px; height:10px; overflow:hidden; margin-bottom:12px;">
                    <div id="extrator-barra" style="background:#E3B400; width:5%; height:100%; transition:width 0.25s ease;"></div>
                </div>
                <div id="extrator-detalhes" style="font-size:12px; color:#94a3b8; max-height:160px; overflow-y:auto; line-height:1.45; background:#121a20; padding:10px; border-radius:8px; border:1px solid #283745;">
                    <div>• Conectando ao Portal do Conhecimento...</div>
                </div>
            `;

            modal.querySelector('#fechar-modal-extrator').onclick = () => modal.remove();

            const statusEl = modal.querySelector('#extrator-status');
            const barraEl = modal.querySelector('#extrator-barra');
            const detalhesEl = modal.querySelector('#extrator-detalhes');

            function atualizarLog(msg, progressoPercent) {
                if (statusEl) statusEl.textContent = msg;
                if (barraEl && progressoPercent !== undefined) barraEl.style.width = `${progressoPercent}%`;
                if (detalhesEl) {
                    detalhesEl.innerHTML += `<div>• ${msg}</div>`;
                    detalhesEl.scrollTop = detalhesEl.scrollHeight;
                }
            }

            function limparHtml(html) {
                if (!html) return '';
                const tmp = document.createElement('div');
                tmp.innerHTML = html;
                tmp.querySelectorAll('script, style, noscript, svg, nav, header, footer').forEach(el => el.remove());
                return (tmp.innerText || tmp.textContent || '').replace(/\s+/g, ' ').trim();
            }

            function ehUrlGenerica(href) {
                if (!href) return true;
                const h = href.toLowerCase();
                return (h.includes('conhecimento/ajuda') && !h.includes('id=') && !h.includes('/id/')) ||
                    (h.includes('stream/painel') && !h.includes('id=') && !h.includes('/id/')) ||
                    h.includes('autenticacao') || h.includes('logout') || h.includes('login') ||
                    h.startsWith('javascript:') || h === '#' || h === '/';
            }

            const manuaisEncontrados = [];
            const idsRegistrados = new Set();

            // -------------------------------------------------------------
            // ETAPA 1: MAPEIA TODAS AS CATEGORIAS DO PORTAL
            // -------------------------------------------------------------
            atualizarLog('Mapeando todas as categorias do portal...', 8);
            const categoriasParaVarrer = [];
            const categoriasIdsSet = new Set();

            // 1.1 Do DOM local da página aberta
            document.querySelectorAll('.categoria-link, [data-categoriaid]').forEach(el => {
                const catId = (el.getAttribute('data-categoriaid') || el.dataset?.categoriaid || '').trim();
                const catNome = (el.innerText || el.getAttribute('title') || '').trim();
                if (catId && !categoriasIdsSet.has(catId)) {
                    categoriasIdsSet.add(catId);
                    categoriasParaVarrer.push({ id: catId, nome: catNome || `Categoria #${catId}` });
                }
            });

            // 1.2 Da página mestra /stream/painel (onde residem todas as 48+ categorias)
            try {
                atualizarLog('Buscando catálogo de categorias em /stream/painel...', 12);
                const resStream = await fetch(window.location.origin + '/stream/painel');
                if (resStream.ok) {
                    const htmlStream = await resStream.text();
                    const docStream = new DOMParser().parseFromString(htmlStream, 'text/html');
                    docStream.querySelectorAll('.categoria-link, [data-categoriaid]').forEach(el => {
                        const catId = (el.getAttribute('data-categoriaid') || el.dataset?.categoriaid || '').trim();
                        const catNome = (el.innerText || el.getAttribute('title') || '').trim();
                        if (catId && !categoriasIdsSet.has(catId)) {
                            categoriasIdsSet.add(catId);
                            categoriasParaVarrer.push({ id: catId, nome: catNome || `Categoria #${catId}` });
                        }
                    });
                }
            } catch (err) {
                console.warn('[Extrator Softcom] Erro ao carregar /stream/painel:', err);
            }

            // Fallback: se porventura o DOM for fechado, adiciona range de categorias para varrer via API
            if (categoriasParaVarrer.length === 0) {
                for (let i = 1; i <= 50; i++) {
                    categoriasParaVarrer.push({ id: String(i), nome: `Categoria #${i}` });
                }
            }

            atualizarLog(`${categoriasParaVarrer.length} categorias encontradas no portal!`, 18);

            // -------------------------------------------------------------
            // ETAPA 2: EXTRAI ARTIGOS DA PÁGINA ATUAL (MAIS UTILIZADOS / CONHECIMENTO)
            // -------------------------------------------------------------
            atualizarLog('Catalogando artigos "Mais Utilizados" da tela atual...', 22);
            const elementosDom = Array.from(document.querySelectorAll('a, .link, [data-id], .list-group-item, li, tr, p'));
            elementosDom.forEach(el => {
                const txt = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
                const href = el.getAttribute('href') || el.dataset?.href || '';
                const matchNum = txt.match(/^(\d{3,5})\s+[-–:]?\s*(.+)$/i) || txt.match(/\b(\d{3,5})\b\s+([A-Za-zÀ-ÿ].{4,120})/);

                if (matchNum) {
                    const idArtigo = matchNum[1];
                    const tituloArtigo = (matchNum[1] + ' ' + matchNum[2]).trim();
                    if (!idsRegistrados.has(idArtigo) && tituloArtigo.length > 5) {
                        idsRegistrados.add(idArtigo);
                        const urlArtigo = (href && !ehUrlGenerica(href))
                            ? (href.startsWith('http') ? href : window.location.origin + '/' + href.replace(/^\//, ''))
                            : '';
                        manuaisEncontrados.push({
                            id: idArtigo,
                            categoria: 'Mais Utilizados (Conhecimento)',
                            titulo: tituloArtigo,
                            url: urlArtigo,
                            procedimento: ''
                        });
                    }
                }
            });

            // -------------------------------------------------------------
            // ETAPA 3: CONSULTA EM LOTE TODAS AS CATEGORIAS VIA AJAX
            // -------------------------------------------------------------
            atualizarLog(`Consultando catálogo de todas as ${categoriasParaVarrer.length} categorias via API...`, 28);
            for (let i = 0; i < categoriasParaVarrer.length; i++) {
                const cat = categoriasParaVarrer[i];
                const perc = 28 + Math.round((i / categoriasParaVarrer.length) * 22); // 28% a 50%
                atualizarLog(`Lendo [${i + 1}/${categoriasParaVarrer.length}]: ${cat.nome.slice(0, 30)}...`, perc);

                try {
                    const formData = new URLSearchParams();
                    formData.append('categoria_id', cat.id);
                    formData.append('assunto', '');

                    const res = await fetch(window.location.origin + '/core/stream-ajax/carregar-streams', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                        body: formData.toString()
                    });

                    if (res.ok) {
                        const html = await res.text();
                        if (html && html.length > 25) {
                            const tmp = document.createElement('div');
                            tmp.innerHTML = html;

                            const itensCat = Array.from(tmp.querySelectorAll('.link, a, tr, .treinamento-list'));
                            itensCat.forEach(itemEl => {
                                const a = itemEl.tagName === 'A' ? itemEl : itemEl.querySelector('a');
                                const aHref = a?.getAttribute('href') || itemEl.getAttribute('href') || '';
                                const aTxt = (a?.innerText || a?.getAttribute('title') || itemEl.innerText || '').replace(/\s+/g, ' ').trim();
                                const aId = a?.getAttribute('data-id') || itemEl.getAttribute('data-id') || aHref;
                                const ehYoutube = (a?.dataset?.youtube === '1') || (aHref && (aHref.includes('youtube.com') || aHref.includes('youtu.be')));

                                if (aTxt && aTxt.length > 4 && !ehUrlGenerica(aHref)) {
                                    const chave = aId || aHref || aTxt;
                                    if (!idsRegistrados.has(chave)) {
                                        idsRegistrados.add(chave);
                                        const urlCompleta = aHref.startsWith('http') ? aHref : (aHref ? window.location.origin + '/' + aHref.replace(/^\//, '') : '');
                                        manuaisEncontrados.push({
                                            id: aId || chave,
                                            categoria: cat.nome || 'Geral',
                                            titulo: aTxt,
                                            url: urlCompleta,
                                            ehVideo: !!ehYoutube,
                                            procedimento: ehYoutube ? `Vídeo tutorial de treinamento oficial Softcom: ${aTxt}. Link: ${urlCompleta}` : ''
                                        });
                                    }
                                }
                            });
                        }
                    }
                } catch (err) {
                    console.warn(`[Extrator Softcom] Falha na categoria ${cat.id}:`, err);
                }
                await new Promise(r => setTimeout(r, 35));
            }

            atualizarLog(`Total de ${manuaisEncontrados.length} manuais e FAQs catalogados! Extraindo conteúdo...`, 50);

            // -------------------------------------------------------------
            // ETAPA 4: EXTRAÇÃO DE CONTEÚDO DOS ARTIGOS DETALHADOS (CHUNKS CONCORRENTES)
            // -------------------------------------------------------------
            const artigosParaBaixar = manuaisEncontrados.filter(m => !m.procedimento && m.url && m.url.startsWith('http'));
            let processados = 0;
            const LOTE_SIZE = 5;

            for (let i = 0; i < artigosParaBaixar.length; i += LOTE_SIZE) {
                const lote = artigosParaBaixar.slice(i, i + LOTE_SIZE);
                await Promise.all(lote.map(async (item) => {
                    try {
                        const resArtigo = await fetch(item.url);
                        if (resArtigo.ok) {
                            const htmlArtigo = await resArtigo.text();
                            const docArtigo = new DOMParser().parseFromString(htmlArtigo, 'text/html');
                            const areaConteudo = docArtigo.querySelector('.conteudo, #conteudo, .panel-body, .artigo, article, main, .note-editable, .summernote, .treinamento-list') || docArtigo.body;
                            item.procedimento = limparHtml(areaConteudo.innerHTML);
                        }
                    } catch (_) {
                        item.procedimento = item.titulo;
                    }
                }));

                processados += lote.length;
                const perc = 50 + Math.round((processados / (artigosParaBaixar.length || 1)) * 45); // 50% a 95%
                atualizarLog(`Extraindo conteúdo (${processados}/${artigosParaBaixar.length}): ${lote[0]?.titulo.slice(0, 30)}...`, perc);
                await new Promise(r => setTimeout(r, 50));
            }

            // Normaliza itens sem procedimento extenso
            manuaisEncontrados.forEach(m => {
                if (!m.procedimento || m.procedimento.length < 10) {
                    m.procedimento = `Procedimento oficial Softcom sobre: ${m.titulo} (Categoria: ${m.categoria}).`;
                }
            });

            // -------------------------------------------------------------
            // ETAPA 5: SALVAMENTO NO STORAGE E DOWNLOAD AUTOMÁTICO DO JSON
            // -------------------------------------------------------------
            atualizarLog('Salvando base completa no armazenamento da extensão...', 96);
            try {
                chrome.storage.local.set({ 'softcom_knowledge_base': manuaisEncontrados }, () => {
                    console.log('[Extensão Softcom] Base completa salva no storage:', manuaisEncontrados.length);
                });
            } catch (e) { }

            try {
                const blob = new Blob([JSON.stringify(manuaisEncontrados, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'todos_faqs_softcom.json';
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            } catch (e) { }

            barraEl.style.width = '100%';
            barraEl.style.background = '#22c55e';
            statusEl.innerHTML = `<span style="color:#4ade80; font-weight:bold;">✅ ${manuaisEncontrados.length} FAQs e Manuais Extraídos com Sucesso!</span>`;
            atualizarLog(`Download de "todos_faqs_softcom.json" iniciado! A IA Gemini no seu chat já está equipada com toda a base de procedimentos Softcom.`, 100);
        }

        window.iniciarExtracaoManuaisHelpTools = iniciarExtracaoManuaisHelpTools;
        criarBotaoFlutuante();
    }

    // ---------------------------------------------------------
    // LÓGICA DO PAINEL DE ATENDIMENTO
    // ---------------------------------------------------------
    function executarPainelAtendimento() {
        // =========================================================================
        // MÓDULO DE IDENTIDADE DINÂMICA DO TÉCNICO / ATENDENTE (MULTI-USUÁRIO)
        // =========================================================================
        const STORAGE_KEY_NOME_TECNICO = 'softcom_nome_tecnico';
        const STORAGE_KEY_SUFIXO_EMPRESA = 'softcom_empresa_sufixo';
        const STORAGE_KEY_CONFIGURADO = 'softcom_onboarding_completo_v2';
        const STORAGE_KEY_SAUDACAO_AUTO = 'softcom_saudacao_automatica_habilitada';
        const STORAGE_KEY_GEMINI_KEY = 'softcom_gemini_api_key';
        const STORAGE_KEY_GROQ_KEY = 'softcom_groq_api_key';
        const STORAGE_KEY_TEMPO_SAUDACAO = 'softcom_tempo_saudacao'; // Segundos float (ex: 2.5)
        const STORAGE_KEY_IA_TOM = 'softcom_ia_tom'; // 'direto' | 'empatico' | 'tecnico'
        const STORAGE_KEY_IA_TAMANHO = 'softcom_ia_tamanho'; // 'curto' | 'medio' | 'detalhado'
        const STORAGE_KEY_IA_TEMPERATURA = 'softcom_ia_temperatura'; // '0.3' | '0.6' | '0.8'
        const STORAGE_KEY_IA_BORDOES = 'softcom_ia_bordoes'; // 'estrito' | 'moderado' | 'livre'
        const STORAGE_KEY_IA_APRENDIZADO = 'softcom_ia_aprendizado'; // 'true' | 'false'
        const STORAGE_KEY_IA_PREGERACAO = 'softcom_ia_pregeracao'; // 'true' | 'false'
        const DEFAULT_NOME_TECNICO = 'Nathã';
        const DEFAULT_SUFIXO_EMPRESA = 'Softcom';
        const DEFAULT_SAUDACAO_AUTO = false; // Desabilitado por padrão
        const DEFAULT_TEMPO_SAUDACAO = 2.5; // Padrão 2.5 segundos
        const DEFAULT_GEMINI_KEY = '';
        const DEFAULT_GROQ_KEY = '';

        // Sincronização bidirecional resiliente entre localStorage e chrome.storage.local
        try {
            // Limpa chaves padrão salvas no localStorage de versões anteriores para não mascarar a falta de chaves próprias
            if (localStorage.getItem(STORAGE_KEY_GEMINI_KEY) === DEFAULT_GEMINI_KEY) {
                localStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
            }
            if (localStorage.getItem(STORAGE_KEY_GROQ_KEY) === DEFAULT_GROQ_KEY) {
                localStorage.removeItem(STORAGE_KEY_GROQ_KEY);
            }

            chrome.storage.local.get([
                STORAGE_KEY_NOME_TECNICO,
                STORAGE_KEY_SUFIXO_EMPRESA,
                STORAGE_KEY_CONFIGURADO,
                STORAGE_KEY_SAUDACAO_AUTO,
                STORAGE_KEY_GEMINI_KEY,
                STORAGE_KEY_GROQ_KEY,
                STORAGE_KEY_TEMPO_SAUDACAO,
                STORAGE_KEY_IA_TOM,
                STORAGE_KEY_IA_TAMANHO,
                STORAGE_KEY_IA_TEMPERATURA,
                STORAGE_KEY_IA_BORDOES,
                STORAGE_KEY_IA_APRENDIZADO,
                STORAGE_KEY_IA_PREGERACAO
            ], (res) => {
                if (res && res[STORAGE_KEY_CONFIGURADO] === 'true') {
                    localStorage.setItem(STORAGE_KEY_CONFIGURADO, 'true');
                }
                if (res && res[STORAGE_KEY_NOME_TECNICO]) {
                    localStorage.setItem(STORAGE_KEY_NOME_TECNICO, res[STORAGE_KEY_NOME_TECNICO]);
                } else if (localStorage.getItem(STORAGE_KEY_NOME_TECNICO)) {
                    chrome.storage.local.set({ [STORAGE_KEY_NOME_TECNICO]: localStorage.getItem(STORAGE_KEY_NOME_TECNICO) });
                }
                if (res && res[STORAGE_KEY_SUFIXO_EMPRESA]) {
                    localStorage.setItem(STORAGE_KEY_SUFIXO_EMPRESA, res[STORAGE_KEY_SUFIXO_EMPRESA]);
                } else if (localStorage.getItem(STORAGE_KEY_SUFIXO_EMPRESA)) {
                    chrome.storage.local.set({ [STORAGE_KEY_SUFIXO_EMPRESA]: localStorage.getItem(STORAGE_KEY_SUFIXO_EMPRESA) });
                }
                if (res && res[STORAGE_KEY_SAUDACAO_AUTO] !== undefined) {
                    localStorage.setItem(STORAGE_KEY_SAUDACAO_AUTO, String(res[STORAGE_KEY_SAUDACAO_AUTO]));
                } else if (localStorage.getItem(STORAGE_KEY_SAUDACAO_AUTO) !== null) {
                    chrome.storage.local.set({ [STORAGE_KEY_SAUDACAO_AUTO]: localStorage.getItem(STORAGE_KEY_SAUDACAO_AUTO) });
                }

                if (res && res[STORAGE_KEY_TEMPO_SAUDACAO] !== undefined) {
                    localStorage.setItem(STORAGE_KEY_TEMPO_SAUDACAO, String(res[STORAGE_KEY_TEMPO_SAUDACAO]));
                }
                if (res && res[STORAGE_KEY_IA_TOM]) {
                    localStorage.setItem(STORAGE_KEY_IA_TOM, res[STORAGE_KEY_IA_TOM]);
                }
                if (res && res[STORAGE_KEY_IA_TAMANHO]) {
                    localStorage.setItem(STORAGE_KEY_IA_TAMANHO, res[STORAGE_KEY_IA_TAMANHO]);
                }
                if (res && res[STORAGE_KEY_IA_TEMPERATURA]) {
                    localStorage.setItem(STORAGE_KEY_IA_TEMPERATURA, String(res[STORAGE_KEY_IA_TEMPERATURA]));
                }
                if (res && res[STORAGE_KEY_IA_BORDOES]) {
                    localStorage.setItem(STORAGE_KEY_IA_BORDOES, res[STORAGE_KEY_IA_BORDOES]);
                }
                if (res && res[STORAGE_KEY_IA_APRENDIZADO] !== undefined) {
                    localStorage.setItem(STORAGE_KEY_IA_APRENDIZADO, String(res[STORAGE_KEY_IA_APRENDIZADO]));
                }
                if (res && res[STORAGE_KEY_IA_PREGERACAO] !== undefined) {
                    localStorage.setItem(STORAGE_KEY_IA_PREGERACAO, String(res[STORAGE_KEY_IA_PREGERACAO]));
                }

                if (res && res[STORAGE_KEY_GEMINI_KEY] && res[STORAGE_KEY_GEMINI_KEY] !== DEFAULT_GEMINI_KEY) {
                    localStorage.setItem(STORAGE_KEY_GEMINI_KEY, res[STORAGE_KEY_GEMINI_KEY]);
                }
                if (res && res[STORAGE_KEY_GROQ_KEY] && res[STORAGE_KEY_GROQ_KEY] !== DEFAULT_GROQ_KEY) {
                    localStorage.setItem(STORAGE_KEY_GROQ_KEY, res[STORAGE_KEY_GROQ_KEY]);
                }

                atualizarBadgeTecnicoUI();

                // Verifica se é o primeiro login/acesso para abrir automaticamente o modal de Saudação e Chaves de API
                verificarAberturaModalPrimeiroAcesso();
            });
        } catch (_) { }

        // Fallback imediato caso o storage assíncrono demore a responder
        verificarAberturaModalPrimeiroAcesso();

        function verificarAberturaModalPrimeiroAcesso() {
            try {
                if (localStorage.getItem(STORAGE_KEY_CONFIGURADO) === 'true') return;

                let tentativas = 0;
                const checarEAbrir = () => {
                    if (localStorage.getItem(STORAGE_KEY_CONFIGURADO) === 'true') return;
                    try {
                        chrome.storage.local.get([STORAGE_KEY_CONFIGURADO], (res) => {
                            if (res && res[STORAGE_KEY_CONFIGURADO] === 'true') {
                                localStorage.setItem(STORAGE_KEY_CONFIGURADO, 'true');
                                return;
                            }
                            const jaConfigurado = localStorage.getItem(STORAGE_KEY_CONFIGURADO) === 'true';
                            const overlayAberto = document.getElementById('modal-config-tecnico-overlay');
                            if (!jaConfigurado && !overlayAberto) {
                                if (document.body) {
                                    console.log('[Extensão Softcom] Primeiro uso detectado: abrindo popup de configuração de Saudação e Chaves de API.');
                                    abrirModalConfigTecnico(true);
                                } else if (tentativas < 12) {
                                    tentativas++;
                                    setTimeout(checarEAbrir, 400);
                                }
                            }
                        });
                    } catch (_) {
                        const jaConfigurado = localStorage.getItem(STORAGE_KEY_CONFIGURADO) === 'true';
                        const overlayAberto = document.getElementById('modal-config-tecnico-overlay');
                        if (!jaConfigurado && !overlayAberto && document.body) {
                            abrirModalConfigTecnico(true);
                        }
                    }
                };

                setTimeout(checarEAbrir, 800);
            } catch (_) { }
        }

        function obterNomeTecnico() {
            let nome = localStorage.getItem(STORAGE_KEY_NOME_TECNICO);
            if (nome && nome.trim()) return nome.trim();
            const detectado = detectarNomeTecnicoAutomatico();
            if (detectado) {
                // Salva em cache de visualização mas NÃO marca como configurado definitivamente
                definirNomeTecnico(detectado, obterSufixoEmpresa(), false, false);
                return detectado;
            }
            return DEFAULT_NOME_TECNICO;
        }

        function obterSufixoEmpresa() {
            const sufixo = localStorage.getItem(STORAGE_KEY_SUFIXO_EMPRESA);
            if (sufixo !== null && sufixo !== undefined && sufixo.trim().length > 0) {
                return sufixo.trim();
            }
            return DEFAULT_SUFIXO_EMPRESA;
        }

        function obterNomeTecnicoCompleto() {
            const nome = obterNomeTecnico();
            const sufixo = obterSufixoEmpresa();
            return `${nome} ${sufixo}`.trim() || DEFAULT_NOME_TECNICO;
        }

        function obterSaudacaoAutomaticaHabilitada() {
            const val = localStorage.getItem(STORAGE_KEY_SAUDACAO_AUTO);
            if (val === null || val === undefined) return DEFAULT_SAUDACAO_AUTO;
            return val === 'true';
        }

        function definirSaudacaoAutomaticaHabilitada(habilitada) {
            const strVal = habilitada ? 'true' : 'false';
            try {
                localStorage.setItem(STORAGE_KEY_SAUDACAO_AUTO, strVal);
                chrome.storage.local.set({ [STORAGE_KEY_SAUDACAO_AUTO]: strVal });
            } catch (_) { }
        }

        function obterTempoSaudacaoSegundos() {
            const val = localStorage.getItem(STORAGE_KEY_TEMPO_SAUDACAO);
            if (val !== null && val !== undefined && val !== '') {
                const num = parseFloat(val);
                if (!isNaN(num) && num >= 0) return num;
            }
            return DEFAULT_TEMPO_SAUDACAO;
        }

        function definirTempoSaudacaoSegundos(segundos) {
            const num = Math.max(0, parseFloat(segundos) || 0);
            const formatado = (Math.round(num * 10) / 10).toString();
            try {
                localStorage.setItem(STORAGE_KEY_TEMPO_SAUDACAO, formatado);
                chrome.storage.local.set({ [STORAGE_KEY_TEMPO_SAUDACAO]: formatado });
            } catch (_) { }
        }

        function obterIATom() {
            return localStorage.getItem(STORAGE_KEY_IA_TOM) || 'direto';
        }
        function definirIATom(tom) {
            try {
                localStorage.setItem(STORAGE_KEY_IA_TOM, tom);
                chrome.storage.local.set({ [STORAGE_KEY_IA_TOM]: tom });
            } catch (_) { }
        }

        function obterIATamanho() {
            return localStorage.getItem(STORAGE_KEY_IA_TAMANHO) || 'medio';
        }
        function definirIATamanho(tamanho) {
            try {
                localStorage.setItem(STORAGE_KEY_IA_TAMANHO, tamanho);
                chrome.storage.local.set({ [STORAGE_KEY_IA_TAMANHO]: tamanho });
            } catch (_) { }
        }

        function obterIATemperatura() {
            const val = localStorage.getItem(STORAGE_KEY_IA_TEMPERATURA);
            if (val !== null && val !== undefined && val !== '') {
                const num = parseFloat(val);
                if (!isNaN(num) && num >= 0.1 && num <= 1.0) return num;
            }
            return 0.6;
        }
        function definirIATemperatura(temp) {
            const num = parseFloat(temp) || 0.6;
            try {
                localStorage.setItem(STORAGE_KEY_IA_TEMPERATURA, num.toString());
                chrome.storage.local.set({ [STORAGE_KEY_IA_TEMPERATURA]: num.toString() });
            } catch (_) { }
        }

        function obterIABordoes() {
            return localStorage.getItem(STORAGE_KEY_IA_BORDOES) || 'estrito';
        }
        function definirIABordoes(bordoes) {
            try {
                localStorage.setItem(STORAGE_KEY_IA_BORDOES, bordoes);
                chrome.storage.local.set({ [STORAGE_KEY_IA_BORDOES]: bordoes });
            } catch (_) { }
        }

        function obterAprendizadoCorrecoesHabilitado() {
            const val = localStorage.getItem(STORAGE_KEY_IA_APRENDIZADO);
            if (val === null || val === undefined) return true;
            return val === 'true';
        }
        function definirAprendizadoCorrecoesHabilitado(habilitado) {
            const strVal = habilitado ? 'true' : 'false';
            try {
                localStorage.setItem(STORAGE_KEY_IA_APRENDIZADO, strVal);
                chrome.storage.local.set({ [STORAGE_KEY_IA_APRENDIZADO]: strVal });
            } catch (_) { }
        }

        function obterPregeracaoHabilitada() {
            const val = localStorage.getItem(STORAGE_KEY_IA_PREGERACAO);
            if (val === null || val === undefined) return true;
            return val === 'true';
        }
        function definirPregeracaoHabilitada(habilitada) {
            const strVal = habilitada ? 'true' : 'false';
            try {
                localStorage.setItem(STORAGE_KEY_IA_PREGERACAO, strVal);
                chrome.storage.local.set({ [STORAGE_KEY_IA_PREGERACAO]: strVal });
            } catch (_) { }
        }

        function ehVersaoMaisRecente(vNova, vAtual) {
            if (!vNova || !vAtual) return false;
            const partesNova = String(vNova).split('.').map(n => parseInt(n, 10) || 0);
            const partesAtual = String(vAtual).split('.').map(n => parseInt(n, 10) || 0);
            const maxLen = Math.max(partesNova.length, partesAtual.length);
            for (let i = 0; i < maxLen; i++) {
                const n = partesNova[i] || 0;
                const a = partesAtual[i] || 0;
                if (n > a) return true;
                if (n < a) return false;
            }
            return false;
        }

        let versaoMaisRecenteDetectada = null;
        function verificarAtualizacoesAuto() {
            try {
                chrome.runtime.sendMessage({ action: 'CHECK_FOR_UPDATE' }, (res) => {
                    if (chrome.runtime.lastError || !res || !res.success || !res.latestVersion) return;
                    const versaoAtual = chrome.runtime.getManifest()?.version || '2.59';
                    if (ehVersaoMaisRecente(res.latestVersion, versaoAtual)) {
                        versaoMaisRecenteDetectada = res.latestVersion;
                        atualizarBadgeUpdateUI();
                        exibirNotificacaoAtualizacaoDisponivel(res.latestVersion);
                    }
                });
            } catch (_) { }
        }

        function atualizarBadgeUpdateUI() {
            const badge = document.getElementById('badge-update-disponivel');
            const label = document.getElementById('label-update-versao');
            if (badge && versaoMaisRecenteDetectada) {
                if (label) label.textContent = `v${versaoMaisRecenteDetectada}`;
                badge.style.display = 'inline-flex';
            }
        }

        // =========================================================
        // POPUP "NOVIDADES POR AQUI" (exibido uma única vez por versão, sobre a engrenagem)
        // Para anunciar novidades numa próxima versão, basta alterar ID_NOVIDADES_CONFIG e o texto abaixo.
        // =========================================================
        const ID_NOVIDADES_CONFIG = '2.60';
        const STORAGE_KEY_NOVIDADES_VISTA = 'softcom_novidades_config_visto';
        let intervaloPopupNovidades = null;

        function fecharPopupNovidadesConfig() {
            const popup = document.getElementById('softcom-popup-novidades-config');
            if (intervaloPopupNovidades) {
                clearInterval(intervaloPopupNovidades);
                intervaloPopupNovidades = null;
            }
            window.removeEventListener('resize', posicionarPopupNovidadesConfig);
            const gear = document.getElementById('btn-config-tecnico');
            if (gear) gear.classList.remove('softcom-gear-pulse');
            if (!popup) return false;
            popup.style.opacity = '0';
            popup.style.transform = 'translateY(6px) scale(0.97)';
            setTimeout(() => popup.remove(), 220);
            return true;
        }

        function posicionarPopupNovidadesConfig() {
            const popup = document.getElementById('softcom-popup-novidades-config');
            const gear = document.getElementById('btn-config-tecnico');
            if (!popup) return;
            if (!gear || !gear.isConnected) {
                popup.style.visibility = 'hidden';
                return;
            }
            const r = gear.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) {
                popup.style.visibility = 'hidden';
                return;
            }
            const larguraPopup = popup.offsetWidth || 270;
            const alturaPopup = popup.offsetHeight || 150;
            const centroGear = r.left + r.width / 2;
            const left = Math.max(8, Math.min(window.innerWidth - larguraPopup - 8, centroGear - larguraPopup + 34));
            const abaixo = r.top < alturaPopup + 24;

            popup.style.left = `${left}px`;
            if (abaixo) {
                popup.style.bottom = 'auto';
                popup.style.top = `${r.bottom + 12}px`;
            } else {
                popup.style.top = 'auto';
                popup.style.bottom = `${window.innerHeight - r.top + 12}px`;
            }

            const seta = popup.querySelector('#softcom-popup-novidades-seta');
            if (seta) {
                seta.style.left = `${Math.max(14, Math.min(larguraPopup - 26, centroGear - left - 6))}px`;
                if (abaixo) {
                    seta.style.bottom = 'auto';
                    seta.style.top = '-7px';
                    seta.style.borderWidth = '1px 0 0 1px';
                } else {
                    seta.style.top = 'auto';
                    seta.style.bottom = '-7px';
                    seta.style.borderWidth = '0 1px 1px 0';
                }
            }
            popup.style.visibility = 'visible';
        }

        function mostrarPopupNovidadesConfig() {
            if (document.getElementById('softcom-popup-novidades-config')) return;

            if (!document.getElementById('softcom-novidades-style')) {
                const st = document.createElement('style');
                st.id = 'softcom-novidades-style';
                st.textContent = `
                    @keyframes softcomNovidadesEntrada {
                        from { opacity: 0; transform: translateY(10px) scale(0.96); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @keyframes softcomGearPulse {
                        0%, 100% { box-shadow: 0 0 0 0 rgba(227, 180, 0, 0.55); }
                        50% { box-shadow: 0 0 0 7px rgba(227, 180, 0, 0); }
                    }
                    .softcom-gear-pulse {
                        color: #E3B400 !important;
                        background: rgba(227, 180, 0, 0.18) !important;
                        animation: softcomGearPulse 1.6s ease-out infinite;
                    }
                `;
                document.head.appendChild(st);
            }

            const popup = document.createElement('div');
            popup.id = 'softcom-popup-novidades-config';
            popup.style.cssText = `
                position: fixed;
                left: 0;
                bottom: 0;
                z-index: 2147483000;
                width: 270px;
                box-sizing: border-box;
                background: linear-gradient(145deg, #162227, #1e293b);
                border: 1px solid #E3B400;
                border-radius: 12px;
                padding: 12px 14px 12px;
                color: #ffffff;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                box-shadow: 0 14px 40px rgba(0, 0, 0, 0.65), 0 0 22px rgba(227, 180, 0, 0.28);
                visibility: hidden;
                transition: opacity 0.2s ease, transform 0.2s ease;
                animation: softcomNovidadesEntrada 0.35s cubic-bezier(0.22, 1, 0.36, 1);
            `;
            popup.innerHTML = `
                <div id="softcom-popup-novidades-seta" style="
                    position: absolute; width: 12px; height: 12px; background: #1a252d;
                    border-style: solid; border-color: #E3B400; transform: rotate(45deg);
                "></div>
                <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 7px;">
                        <span style="font-size: 17px; line-height: 1;">🚀</span>
                        <span style="font-size: 13.5px; font-weight: 800; color: #E3B400; letter-spacing: 0.2px;">Novidades por aqui!</span>
                    </div>
                    <button id="btn-softcom-novidades-fechar" type="button" title="Fechar" style="
                        background: transparent; border: none; color: #94a3b8; font-size: 14px; cursor: pointer; padding: 0 2px; line-height: 1;
                    ">✕</button>
                </div>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #cbd5e1; line-height: 1.45;">
                    Agora você pode <b style="color:#fce79a;">ajustar a IA do seu jeito</b>: tempo da saudação, tom de voz, tamanho das respostas, aprendizado com suas correções e muito mais.
                    Clique na engrenagem <span style="color:#E3B400;">⚙️</span> para conferir!
                </p>
                <div style="display: flex; justify-content: flex-end; gap: 6px;">
                    <button id="btn-softcom-novidades-depois" type="button" style="
                        background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.14); color: #94a3b8;
                        padding: 5px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 600; cursor: pointer;
                    ">Depois</button>
                    <button id="btn-softcom-novidades-ver" type="button" style="
                        background: linear-gradient(135deg, #E3B400, #f59e0b); border: none; color: #162227;
                        padding: 5px 12px; border-radius: 6px; font-size: 11.5px; font-weight: 800; cursor: pointer;
                        box-shadow: 0 2px 10px rgba(227, 180, 0, 0.4);
                    ">Ver novidades</button>
                </div>
            `;
            document.body.appendChild(popup);

            const gear = document.getElementById('btn-config-tecnico');
            if (gear) gear.classList.add('softcom-gear-pulse');

            posicionarPopupNovidadesConfig();
            window.addEventListener('resize', posicionarPopupNovidadesConfig);
            // Acompanha o ícone caso o painel seja reposicionado/reinjetado pelo Workdesk
            intervaloPopupNovidades = setInterval(() => {
                const g = document.getElementById('btn-config-tecnico');
                if (g && !g.classList.contains('softcom-gear-pulse')) g.classList.add('softcom-gear-pulse');
                posicionarPopupNovidadesConfig();
            }, 400);

            const btnFechar = popup.querySelector('#btn-softcom-novidades-fechar');
            const btnDepois = popup.querySelector('#btn-softcom-novidades-depois');
            const btnVer = popup.querySelector('#btn-softcom-novidades-ver');
            if (btnFechar) btnFechar.onclick = () => fecharPopupNovidadesConfig();
            if (btnDepois) btnDepois.onclick = () => fecharPopupNovidadesConfig();
            if (btnVer) {
                btnVer.onclick = () => {
                    fecharPopupNovidadesConfig();
                    abrirModalConfigTecnico(false, 'ia');
                };
            }
        }

        function exibirPopupNovidadesConfigSePrimeiraVez() {
            try {
                chrome.storage.local.get([STORAGE_KEY_NOVIDADES_VISTA], (res) => {
                    if (chrome.runtime.lastError) return;
                    if (res && res[STORAGE_KEY_NOVIDADES_VISTA] === ID_NOVIDADES_CONFIG) return;

                    let tentativas = 0;
                    const tentar = () => {
                        // Não sobrepõe o modal de primeiro acesso / configurações
                        const gear = document.getElementById('btn-config-tecnico');
                        const modalAberto = document.getElementById('modal-config-tecnico-overlay');
                        const gearVisivel = gear && gear.isConnected && gear.getBoundingClientRect().width > 0;
                        if (!gearVisivel || modalAberto) {
                            if (++tentativas < 60) setTimeout(tentar, 1000);
                            return;
                        }
                        // Marca como visto no momento em que é exibido (aparece apenas na primeira vez)
                        chrome.storage.local.set({ [STORAGE_KEY_NOVIDADES_VISTA]: ID_NOVIDADES_CONFIG });
                        mostrarPopupNovidadesConfig();
                    };
                    setTimeout(tentar, 2500);
                });
            } catch (_) { }
        }

        const URL_BAT_ATUALIZADOR_REMOTO = 'https://raw.githubusercontent.com/nathatargino/nathatargino/main/softcopilot/Atualizar_SoftCopilot.bat';

        function baixarScriptAtualizador() {
            try {
                const urlBatLocal = chrome.runtime.getURL('Atualizar_SoftCopilot.bat');

                // Prioriza o atualizador mais recente publicado (corrige instalações com .bat antigo); cai para o arquivo local
                const obterConteudoBat = () =>
                    fetch(`${URL_BAT_ATUALIZADOR_REMOTO}?t=${Date.now()}`, { cache: 'no-store' })
                        .then(res => {
                            if (!res.ok) throw new Error('Atualizador remoto indisponível');
                            return res.text();
                        })
                        .then(txt => {
                            if (!txt || !/@echo\s+off/i.test(txt)) throw new Error('Atualizador remoto inválido');
                            return txt;
                        })
                        .catch(() =>
                            fetch(urlBatLocal).then(res => {
                                if (!res.ok) throw new Error('Falha ao ler arquivo local');
                                return res.text();
                            })
                        );

                obterConteudoBat()
                    .then(conteudo => {
                        const conteudoNormalizado = (conteudo || '').replace(/\r?\n/g, '\r\n');
                        const blob = new Blob([conteudoNormalizado], { type: 'application/x-bat;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'Atualizar_SoftCopilot.bat';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        setTimeout(() => URL.revokeObjectURL(url), 2000);
                        mostrarNotificacao('⬇️ Download do Atualizar_SoftCopilot.bat iniciado!', '#2ecc71');
                    })
                    .catch(() => {
                        const a = document.createElement('a');
                        a.href = urlBatLocal;
                        a.download = 'Atualizar_SoftCopilot.bat';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        mostrarNotificacao('⬇️ Download do Atualizar_SoftCopilot.bat iniciado!', '#2ecc71');
                    });
            } catch (e) {
                console.error('[Extensão Softcom] Erro ao baixar script atualizador:', e);
                mostrarNotificacao('⚠️ Falha ao baixar atualizador.', '#ef4444');
            }
        }

        function exibirNotificacaoAtualizacaoDisponivel(versao, forcar = false) {
            try {
                if (!forcar) {
                    const dispensadoAte = sessionStorage.getItem('softcom_update_dismissed_until');
                    if (dispensadoAte && Date.now() < Number(dispensadoAte)) {
                        return;
                    }
                }

                let modal = document.getElementById('softcom-modal-update-notification');
                if (modal) {
                    modal.remove();
                }

                modal = document.createElement('div');
                modal.id = 'softcom-modal-update-notification';
                modal.style.cssText = `
                    position: fixed;
                    top: 24px;
                    right: 24px;
                    z-index: 999999999;
                    background: linear-gradient(135deg, #162227, #1e293b);
                    border: 2px solid #E3B400;
                    border-radius: 14px;
                    padding: 16px 20px;
                    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75), 0 0 24px rgba(227, 180, 0, 0.3);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    color: #ffffff;
                    max-width: 420px;
                    width: calc(100vw - 48px);
                    box-sizing: border-box;
                    animation: fadeInModal 0.25s ease-out;
                `;

                modal.innerHTML = `
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 20px; line-height: 1;">🚀</span>
                            <span style="font-size: 14px; font-weight: 700; color: #E3B400;">Atualização Disponível!</span>
                            <span style="background: rgba(227, 180, 0, 0.2); border: 1px solid rgba(227, 180, 0, 0.4); color: #E3B400; padding: 1px 7px; border-radius: 10px; font-size: 11px; font-weight: 700;">v${versao}</span>
                        </div>
                        <button id="btn-softcom-update-close" type="button" title="Fechar" style="
                            background: transparent;
                            border: none;
                            color: #94a3b8;
                            font-size: 16px;
                            cursor: pointer;
                            padding: 2px;
                            line-height: 1;
                        ">✖</button>
                    </div>

                    <div id="softcom-update-modal-body">
                        <p style="margin: 0 0 14px 0; font-size: 12.5px; color: #cbd5e1; line-height: 1.45;">
                            Uma nova versão do <b>SoftCopilot</b> está disponível. Deseja baixar o atualizador automático (.bat)?
                        </p>

                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                            <button id="btn-softcom-update-later" type="button" style="
                                background: rgba(255, 255, 255, 0.08);
                                border: 1px solid rgba(255, 255, 255, 0.15);
                                color: #94a3b8;
                                padding: 8px 14px;
                                border-radius: 6px;
                                font-size: 12px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s;
                            ">Mais tarde</button>

                            <button id="btn-softcom-update-download" type="button" style="
                                background: linear-gradient(135deg, #E3B400, #f59e0b);
                                border: none;
                                color: #162227;
                                padding: 8px 16px;
                                border-radius: 6px;
                                font-size: 12.5px;
                                font-weight: 700;
                                cursor: pointer;
                                display: inline-flex;
                                align-items: center;
                                gap: 6px;
                                box-shadow: 0 2px 10px rgba(227, 180, 0, 0.4);
                                transition: all 0.2s;
                            ">
                                <span>⬇️</span> Baixar .BAT
                            </button>
                        </div>
                    </div>
                `;

                document.body.appendChild(modal);

                const btnClose = modal.querySelector('#btn-softcom-update-close');
                const btnLater = modal.querySelector('#btn-softcom-update-later');
                const btnDownload = modal.querySelector('#btn-softcom-update-download');

                const fecharModal = () => {
                    if (modal && modal.parentElement) {
                        modal.style.opacity = '0';
                        modal.style.transform = 'translateY(-10px)';
                        modal.style.transition = 'all 0.2s ease';
                        setTimeout(() => modal.remove(), 200);
                    }
                };

                if (btnClose) btnClose.onclick = fecharModal;
                if (btnLater) {
                    btnLater.onclick = () => {
                        sessionStorage.setItem('softcom_update_dismissed_until', String(Date.now() + 2 * 60 * 60 * 1000));
                        fecharModal();
                    };
                }

                if (btnDownload) {
                    btnDownload.onclick = () => {
                        baixarScriptAtualizador();
                        const body = modal.querySelector('#softcom-update-modal-body');
                        if (body) {
                            body.innerHTML = `
                                <div style="display: flex; flex-direction: column; gap: 8px; animation: fadeInModal 0.2s ease-out;">
                                    <div style="display: flex; align-items: center; gap: 6px; color: #4ade80; font-size: 13px; font-weight: 700;">
                                        <span>✅</span> Download iniciado: Atualizar_SoftCopilot.bat
                                    </div>
                                    <div style="font-size: 12px; color: #cbd5e1; line-height: 1.45; background: rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px; padding: 10px 12px;">
                                        <b>Próximos passos:</b><br/>
                                        1. Dê um duplo clique no arquivo <b>Atualizar_SoftCopilot.bat</b> baixado.<br/>
                                        2. Em seguida, acesse <code>chrome://extensions</code> e clique no botão de recarregar (🔄).
                                    </div>
                                    <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
                                        <button id="btn-softcom-update-ok" type="button" style="
                                            background: #E3B400;
                                            border: none;
                                            color: #162227;
                                            padding: 6px 16px;
                                            border-radius: 6px;
                                            font-size: 12px;
                                            font-weight: 700;
                                            cursor: pointer;
                                        ">OK, Entendido</button>
                                    </div>
                                </div>
                            `;
                            const btnOk = modal.querySelector('#btn-softcom-update-ok');
                            if (btnOk) btnOk.onclick = fecharModal;
                        }
                    };
                }
            } catch (e) {
                console.error('[Extensão Softcom] Falha ao exibir notificação de update:', e);
            }
        }

        function atualizarBadgeTecnicoUI() {
            const el = document.getElementById('label-nome-tecnico');
            if (el) {
                el.textContent = obterNomeTecnicoCompleto();
            }
            atualizarBadgeUpdateUI();
        }

        function definirNomeTecnico(nome, sufixo = 'Softcom', notificar = false, marcarConfigurado = true) {
            const nomeLimpo = (nome || '').trim() || DEFAULT_NOME_TECNICO;
            const sufixoLimpo = (sufixo !== undefined && sufixo !== null) ? sufixo.trim() : DEFAULT_SUFIXO_EMPRESA;
            try {
                localStorage.setItem(STORAGE_KEY_NOME_TECNICO, nomeLimpo);
                localStorage.setItem(STORAGE_KEY_SUFIXO_EMPRESA, sufixoLimpo);
                const payload = {
                    [STORAGE_KEY_NOME_TECNICO]: nomeLimpo,
                    [STORAGE_KEY_SUFIXO_EMPRESA]: sufixoLimpo
                };
                if (marcarConfigurado) {
                    localStorage.setItem(STORAGE_KEY_CONFIGURADO, 'true');
                    payload[STORAGE_KEY_CONFIGURADO] = 'true';
                }
                chrome.storage.local.set(payload);
            } catch (_) { }
            atualizarBadgeTecnicoUI();
            if (notificar) {
                mostrarNotificacao(`Nome Softcom salvo permanentemente: ${obterNomeTecnicoCompleto()}`, '#2ecc71');
            }
        }

        function obterChaveGeminiUsuario() {
            const k = (localStorage.getItem(STORAGE_KEY_GEMINI_KEY) || '').trim();
            return (k && k !== DEFAULT_GEMINI_KEY) ? k : '';
        }

        function obterChaveGroqUsuario() {
            const k = (localStorage.getItem(STORAGE_KEY_GROQ_KEY) || '').trim();
            return (k && k !== DEFAULT_GROQ_KEY) ? k : '';
        }

        function usuarioPossuiChavePropria() {
            return Boolean(obterChaveGeminiUsuario() || obterChaveGroqUsuario());
        }

        function definirChaveGeminiUsuario(key) {
            const limpa = (key || '').trim();
            if (limpa && limpa !== DEFAULT_GEMINI_KEY) {
                localStorage.setItem(STORAGE_KEY_GEMINI_KEY, limpa);
                try { chrome.storage.local.set({ [STORAGE_KEY_GEMINI_KEY]: limpa }); } catch (_) { }
            } else {
                localStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
                try { chrome.storage.local.remove([STORAGE_KEY_GEMINI_KEY]); } catch (_) { }
            }
        }

        function definirChaveGroqUsuario(key) {
            const limpa = (key || '').trim();
            if (limpa && limpa !== DEFAULT_GROQ_KEY) {
                localStorage.setItem(STORAGE_KEY_GROQ_KEY, limpa);
                try { chrome.storage.local.set({ [STORAGE_KEY_GROQ_KEY]: limpa }); } catch (_) { }
            } else {
                localStorage.removeItem(STORAGE_KEY_GROQ_KEY);
                try { chrome.storage.local.remove([STORAGE_KEY_GROQ_KEY]); } catch (_) { }
            }
        }

        function obterChaveGeminiParaEnvio() {
            const k = obterChaveGeminiUsuario();
            return k || DEFAULT_GEMINI_KEY;
        }

        function obterChaveGroqParaEnvio() {
            const k = obterChaveGroqUsuario();
            return k || DEFAULT_GROQ_KEY;
        }

        let timerPopupAvisoApiKey = null;
        function mostrarPopupAvisoApiKey() {
            try {
                let popup = document.getElementById('softcom-popup-aviso-api-key');
                if (popup) {
                    if (timerPopupAvisoApiKey) clearTimeout(timerPopupAvisoApiKey);
                    timerPopupAvisoApiKey = setTimeout(() => {
                        if (popup && popup.parentElement) popup.remove();
                    }, 8000);
                    return;
                }

                popup = document.createElement('div');
                popup.id = 'softcom-popup-aviso-api-key';
                popup.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #162227;
                    border: 1.5px solid #E3B400;
                    border-radius: 12px;
                    padding: 12px 18px;
                    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.8), 0 0 18px rgba(227, 180, 0, 0.28);
                    z-index: 99999999;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    color: #ffffff;
                    max-width: 92vw;
                    box-sizing: border-box;
                    animation: fadeInModal 0.25s ease-out;
                `;

                popup.innerHTML = `
                    <div style="font-size: 22px; flex-shrink: 0; line-height: 1;">⚡</div>
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <div style="font-size: 13px; font-weight: 700; color: #E3B400;">
                            Suas respostas podem estar demorando mais que o normal!
                        </div>
                        <div style="font-size: 12px; color: #cbd5e1; line-height: 1.35;">
                            Configure suas <b>API KEYS próprias</b> gratuitas para ter máxima velocidade e respostas instantâneas sem fila.
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-left: 6px; flex-shrink: 0;">
                        <button id="btn-popup-configurar-chave" type="button" style="
                            background: #E3B400;
                            color: #162227;
                            border: none;
                            border-radius: 6px;
                            padding: 7px 14px;
                            font-size: 12px;
                            font-weight: 700;
                            cursor: pointer;
                            display: inline-flex;
                            align-items: center;
                            gap: 5px;
                            transition: all 0.2s;
                            box-shadow: 0 2px 8px rgba(227, 180, 0, 0.3);
                        ">
                            <span>⚙️</span> Configurar API Key
                        </button>
                        <button id="btn-popup-fechar-chave" type="button" title="Fechar aviso" style="
                            background: transparent;
                            border: none;
                            color: #94a3b8;
                            font-size: 16px;
                            cursor: pointer;
                            padding: 4px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: color 0.2s;
                        ">✖</button>
                    </div>
                `;

                document.body.appendChild(popup);

                const btnConfig = popup.querySelector('#btn-popup-configurar-chave');
                const btnFechar = popup.querySelector('#btn-popup-fechar-chave');

                const fecharPopup = () => {
                    if (popup && popup.parentElement) {
                        popup.style.opacity = '0';
                        popup.style.transform = 'translate(-50%, -10px)';
                        popup.style.transition = 'all 0.25s ease';
                        setTimeout(() => {
                            if (popup && popup.parentElement) popup.remove();
                        }, 250);
                    }
                };

                if (btnConfig) {
                    btnConfig.onclick = () => {
                        fecharPopup();
                        abrirModalConfigTecnico(false);
                    };
                }
                if (btnFechar) btnFechar.onclick = fecharPopup;

                if (timerPopupAvisoApiKey) clearTimeout(timerPopupAvisoApiKey);
                timerPopupAvisoApiKey = setTimeout(() => {
                    fecharPopup();
                }, 8000);
            } catch (_) { }
        }

        function detectarNomeTecnicoAutomatico() {
            // 1. Inspeciona localStorage e sessionStorage por objetos de usuário/sessão
            const buscarEmStorage = (st) => {
                if (!st) return null;
                try {
                    for (let i = 0; i < st.length; i++) {
                        const k = st.key(i);
                        if (!k) continue;
                        const kLow = k.toLowerCase();
                        if (kLow.includes('user') || kLow.includes('usuario') || kLow.includes('profile') || kLow.includes('auth') || kLow.includes('operador') || kLow.includes('agent')) {
                            const val = st.getItem(k);
                            if (!val) continue;
                            try {
                                const obj = JSON.parse(val);
                                const possiveis = [
                                    obj.name, obj.nome, obj.displayName, obj.first_name, obj.primeiro_nome,
                                    obj.user?.name, obj.user?.nome, obj.usuario?.name, obj.usuario?.nome,
                                    obj.profile?.name, obj.profile?.nome
                                ];
                                for (const p of possiveis) {
                                    if (typeof p === 'string' && p.trim().length >= 2) {
                                        const primeiro = p.trim().split(' ')[0];
                                        if (primeiro && !primeiro.toLowerCase().includes('softcom') && !primeiro.toLowerCase().includes('workdesk') && !primeiro.toLowerCase().includes('admin')) {
                                            return primeiro;
                                        }
                                    }
                                }
                            } catch (_) {
                                if (typeof val === 'string' && val.length >= 2 && val.length < 30 && !val.includes('{') && !val.includes('token') && !val.includes('bearer')) {
                                    const p = val.trim().split(' ')[0];
                                    if (p && !p.toLowerCase().includes('softcom') && !p.toLowerCase().includes('workdesk')) {
                                        return p;
                                    }
                                }
                            }
                        }
                    }
                } catch (_) { }
                return null;
            };

            const doLocal = buscarEmStorage(localStorage);
            if (doLocal) return doLocal;
            const doSession = buscarEmStorage(sessionStorage);
            if (doSession) return doSession;

            // 2. Elementos de perfil no DOM
            const seletoresPerfil = [
                '[class*="user-name" i]',
                '[class*="userName" i]',
                '[class*="profile-name" i]',
                '[class*="operator-name" i]',
                '[class*="agent-name" i]',
                '[data-user-name]',
                '.user-profile .name',
                '.operator-info .name'
            ];
            for (const sel of seletoresPerfil) {
                const el = document.querySelector(sel);
                if (el && el.innerText) {
                    const txt = el.innerText.trim();
                    if (txt.length >= 2 && !txt.toLowerCase().includes('softcom') && !txt.toLowerCase().includes('workdesk')) {
                        return txt.split(' ')[0];
                    }
                }
            }

            // 3. Prefixos de mensagens enviadas no histórico do chat (ex: *Nome Softcom:* ou *Nome:*)
            try {
                const area = (typeof obterAreaConversa === 'function') ? obterAreaConversa() : null;
                if (area) {
                    const blocos = Array.from(area.querySelectorAll('[class*="message" i], [class*="bubble" i]'));
                    for (const b of blocos) {
                        const txt = b.innerText || "";
                        const m = txt.match(/\*([A-Za-zÀ-ÿ0-9_.\s]+)(?:\s+Softcom)?:\*/);
                        if (m && m[1]) {
                            const n = m[1].trim().split(' ')[0];
                            if (n && n.length >= 2 && !n.toLowerCase().includes('atendimento') && !n.toLowerCase().includes('softcom')) {
                                return n;
                            }
                        }
                    }
                }
            } catch (_) { }

            return null;
        }

        function abrirModalConfigTecnico(ehPrimeiroAcesso = false, abaInicial = 'geral') {
            let overlay = document.getElementById('modal-config-tecnico-overlay');
            if (overlay) overlay.remove();

            fecharPopupNovidadesConfig();
            overlay = document.createElement('div');
            overlay.id = 'modal-config-tecnico-overlay';
            overlay.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.78);
                backdrop-filter: blur(6px);
                z-index: 999999999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
                box-sizing: border-box;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                animation: fadeInModal 0.2s ease-out;
            `;

            const nomeAtual = obterNomeTecnico();
            const sufixoAtual = obterSufixoEmpresa();
            const saudacaoAtiva = obterSaudacaoAutomaticaHabilitada();
            const geminiKeyAtual = obterChaveGeminiUsuario();
            const groqKeyAtual = obterChaveGroqUsuario();

            // Configurações da IA (Aba 2)
            const tempoAtual = obterTempoSaudacaoSegundos();
            const tomAtual = obterIATom();
            const tamanhoAtual = obterIATamanho();
            const tempAtual = obterIATemperatura();
            const bordoesAtual = obterIABordoes();
            const aprendizadoAtivo = obterAprendizadoCorrecoesHabilitado();
            const pregeracaoAtiva = obterPregeracaoHabilitada();

            overlay.innerHTML = `
                <div id="modal-config-tecnico-card" style="
                    background: #162227;
                    border: 2px solid #E3B400;
                    border-radius: 14px;
                    width: 560px;
                    max-width: 100%;
                    max-height: 92vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.85), 0 0 20px rgba(227, 180, 0, 0.28);
                    padding: 22px;
                    color: #ffffff;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                ">
                    <!-- Topo: Título e Botão Fechar -->
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 20px;">${ehPrimeiroAcesso ? '👋' : '⚙️'}</span>
                            <span style="font-size: 16px; font-weight: 700; color: #E3B400; letter-spacing: 0.3px;">
                                ${ehPrimeiroAcesso ? 'Boas-vindas ao SoftCopilot!' : 'Configurações do SoftCopilot'}
                            </span>
                        </div>
                        <button id="btn-fechar-modal-tecnico" type="button" title="Fechar" style="
                            background: transparent;
                            border: none;
                            color: #94a3b8;
                            font-size: 16px;
                            cursor: pointer;
                            padding: 4px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: color 0.2s;
                        ">✖</button>
                    </div>

                    <!-- Navegação com 2 Abas -->
                    <div style="display: flex; gap: 6px; background: rgba(0,0,0,0.25); padding: 4px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
                        <button type="button" id="tab-btn-geral" style="
                            flex: 1;
                            background: ${abaInicial === 'geral' ? '#E3B400' : 'transparent'};
                            color: ${abaInicial === 'geral' ? '#162227' : '#94a3b8'};
                            font-weight: ${abaInicial === 'geral' ? '700' : '600'};
                            border: none;
                            border-radius: 8px;
                            padding: 8px 12px;
                            font-size: 12.5px;
                            cursor: pointer;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            box-shadow: ${abaInicial === 'geral' ? '0 2px 8px rgba(227, 180, 0, 0.25)' : 'none'};
                            transition: all 0.2s;
                        ">
                            <span>⚙️</span> Configuração Inicial
                        </button>
                        <button type="button" id="tab-btn-ia" style="
                            flex: 1;
                            background: ${abaInicial === 'ia' ? '#E3B400' : 'transparent'};
                            color: ${abaInicial === 'ia' ? '#162227' : '#94a3b8'};
                            font-weight: ${abaInicial === 'ia' ? '700' : '600'};
                            border: none;
                            border-radius: 8px;
                            padding: 8px 12px;
                            font-size: 12.5px;
                            cursor: pointer;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            box-shadow: ${abaInicial === 'ia' ? '0 2px 8px rgba(227, 180, 0, 0.25)' : 'none'};
                            transition: all 0.2s;
                        ">
                            <span>🤖</span> Configurações da IA
                        </button>
                    </div>

                    <!-- ========================================================= -->
                    <!-- ABA 1: CONFIGURAÇÃO INICIAL (IDENTIFICAÇÃO & CHAVES)      -->
                    <!-- ========================================================= -->
                    <div id="tab-panel-geral" style="display: ${abaInicial === 'geral' ? 'flex' : 'none'}; flex-direction: column; gap: 14px;">
                        <p style="margin: 0; font-size: 12.5px; color: #cbd5e1; line-height: 1.45;">
                            ${ehPrimeiroAcesso
                        ? 'Informe seu <b>Nome Softcom</b> e configure suas <b>Chaves de API</b> para iniciar. Seus dados serão <b>salvos permanentemente</b> e personalizarão automaticamente suas saudações e sugestões com IA.'
                        : 'Gerencie suas credenciais de identificação, envio de saudação e chaves de API da IA.'}
                        </p>

                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div>
                                <label style="display: block; font-size: 12px; font-weight: 600; color: #e2e8f0; margin-bottom: 6px;">
                                    Nome do Atendente / Técnico: <span style="color: #ef4444;">*</span>
                                </label>
                                <input id="input-cfg-nome-tecnico" type="text" value="${nomeAtual}" placeholder="Ex: Carlos, Juliana, Nathã" style="
                                    width: 100%;
                                    box-sizing: border-box;
                                    background: #27272a;
                                    border: 1px solid #3f3f46;
                                    border-radius: 8px;
                                    color: #ffffff;
                                    padding: 9px 12px;
                                    font-size: 13px;
                                    outline: none;
                                    transition: border-color 0.2s, box-shadow 0.2s;
                                " />
                            </div>

                            <div>
                                <label style="display: block; font-size: 12px; font-weight: 600; color: #e2e8f0; margin-bottom: 6px;">
                                    Sufixo da Empresa:
                                </label>
                                <input id="input-cfg-sufixo-empresa" type="text" value="${sufixoAtual}" placeholder="Ex: Softcom" style="
                                    width: 100%;
                                    box-sizing: border-box;
                                    background: #27272a;
                                    border: 1px solid #3f3f46;
                                    border-radius: 8px;
                                    color: #ffffff;
                                    padding: 9px 12px;
                                    font-size: 13px;
                                    outline: none;
                                    transition: border-color 0.2s, box-shadow 0.2s;
                                " />
                            </div>
                        </div>

                        <!-- Flag para habilitar ou desabilitar o envio de saudação automática -->
                        <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                <span style="font-size: 13px; font-weight: 600; color: #f1f5f9; display: flex; align-items: center; gap: 6px;">
                                    <span>⚡</span> Envio de Saudação Automática
                                </span>
                                <span style="font-size: 11.5px; color: #94a3b8;">
                                    Enviar automaticamente "Bom dia / Boa tarde..." ao abrir um novo chat.
                                </span>
                            </div>
                            <label style="position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer; flex-shrink: 0; margin: 0;">
                                <input id="chk-cfg-saudacao-auto" type="checkbox" ${saudacaoAtiva ? 'checked' : ''} style="opacity: 0; width: 0; height: 0; position: absolute;" />
                                <span id="slider-cfg-saudacao-auto" style="
                                    position: absolute; cursor: pointer; inset: 0;
                                    background-color: ${saudacaoAtiva ? '#E3B400' : '#3f3f46'};
                                    transition: all .25s ease; border-radius: 24px;
                                ">
                                    <span id="dot-cfg-saudacao-auto" style="
                                        position: absolute; content: ''; height: 18px; width: 18px; left: ${saudacaoAtiva ? '23px' : '3px'}; bottom: 3px;
                                        background-color: #162227; transition: all .25s ease; border-radius: 50%;
                                        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
                                    "></span>
                                </span>
                            </label>
                        </div>

                        <div style="background: rgba(227, 180, 0, 0.08); border: 1px dashed rgba(227, 180, 0, 0.4); border-radius: 8px; padding: 12px;">
                            <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #E3B400; margin-bottom: 4px;">
                                💬 Prévia da Saudação Automática:
                            </div>
                            <div id="preview-saudacao-tecnico" style="font-size: 12.5px; color: #f1f5f9; font-style: italic; line-height: 1.4;">
                                ${saudacaoAtiva
                        ? `"Bom dia, Cliente. Me chamo ${nomeAtual} ${sufixoAtual}, e irei iniciar seu atendimento."`
                        : `⚠️ Saudação automática desativada (nenhuma mensagem será enviada automaticamente ao entrar em novos chats).`}
                            </div>
                        </div>

                        <!-- Bloco de Chaves de API de IA (Gemini e Groq) -->
                        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(227, 180, 0, 0.3); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 13px; font-weight: 700; color: #E3B400; display: flex; align-items: center; gap: 6px;">
                                    <span>🔑</span> Chaves de API de IA (Google Gemini & Groq)
                                </span>
                                <span style="font-size: 10.5px; background: rgba(227, 180, 0, 0.15); border: 1px solid rgba(227, 180, 0, 0.4); color: #fce79a; padding: 2px 8px; border-radius: 12px; font-weight: 600;">
                                    Alta Velocidade
                                </span>
                            </div>
                            <p style="margin: 0; font-size: 11.5px; color: #cbd5e1; line-height: 1.4;">
                                Forneça suas chaves gratuitas para garantir sugestões instantâneas, sem fila e alta estabilidade.
                            </p>

                            <!-- Chave Google Gemini -->
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                    <label style="font-size: 12px; font-weight: 600; color: #e2e8f0;">
                                        Google Gemini API Key:
                                    </label>
                                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style="font-size: 11px; color: #E3B400; text-decoration: underline; display: inline-flex; align-items: center; gap: 3px;" title="Abrir Google AI Studio para gerar sua chave">
                                        Obter chave Gemini grátis ↗
                                    </a>
                                </div>
                                <div style="position: relative; display: flex; align-items: center;">
                                    <input id="input-cfg-gemini-key" type="password" value="${geminiKeyAtual}" placeholder="Ex: AIzaSy... (Cole sua chave do Gemini)" style="
                                        width: 100%; box-sizing: border-box; background: #27272a; border: 1px solid #3f3f46; border-radius: 8px;
                                        color: #ffffff; padding: 9px 38px 9px 12px; font-size: 12.5px; font-family: monospace; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
                                    " />
                                    <button type="button" id="btn-toggle-ver-gemini" title="Mostrar / Ocultar chave" style="
                                        position: absolute; right: 8px; background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; padding: 4px; display: flex; align-items: center; justify-content: center;
                                    ">👁️</button>
                                </div>
                            </div>

                            <!-- Chave Groq -->
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                    <label style="font-size: 12px; font-weight: 600; color: #e2e8f0;">
                                        Groq API Key (Retaguarda ultra-rápida):
                                    </label>
                                    <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style="font-size: 11px; color: #E3B400; text-decoration: underline; display: inline-flex; align-items: center; gap: 3px;" title="Abrir Groq Console para gerar sua chave">
                                        Obter chave Groq grátis ↗
                                    </a>
                                </div>
                                <div style="position: relative; display: flex; align-items: center;">
                                    <input id="input-cfg-groq-key" type="password" value="${groqKeyAtual}" placeholder="Ex: gsk_... (Cole sua chave da Groq)" style="
                                        width: 100%; box-sizing: border-box; background: #27272a; border: 1px solid #3f3f46; border-radius: 8px;
                                        color: #ffffff; padding: 9px 38px 9px 12px; font-size: 12.5px; font-family: monospace; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
                                    " />
                                    <button type="button" id="btn-toggle-ver-groq" title="Mostrar / Ocultar chave" style="
                                        position: absolute; right: 8px; background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; padding: 4px; display: flex; align-items: center; justify-content: center;
                                    ">👁️</button>
                                </div>
                            </div>
                        </div>

                        ${ehPrimeiroAcesso ? `
                        <div style="font-size: 11.5px; color: #94a3b8; display: flex; align-items: center; gap: 6px;">
                            <span>🔒</span>
                            <span>Salvo de forma permanente. Este modal não abrirá nas próximas vezes.</span>
                        </div>
                        ` : ''}
                    </div>

                    <!-- ========================================================= -->
                    <!-- ABA 2: CONFIGURAÇÕES DA IA (PERSONALIZAÇÃO & APRENDIZADO) -->
                    <!-- ========================================================= -->
                    <div id="tab-panel-ia" style="display: ${abaInicial === 'ia' ? 'flex' : 'none'}; flex-direction: column; gap: 14px;">
                        <p style="margin: 0; font-size: 12.5px; color: #cbd5e1; line-height: 1.45;">
                            Personalize o comportamento, o tom de voz e o tempo de resposta da IA para se adequar perfeitamente ao seu ritmo de atendimento.
                        </p>

                        <!-- Ponto 3: Tempo de espera da saudação automática com suporte a segundos quebrados -->
                        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(227, 180, 0, 0.35); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 13px; font-weight: 700; color: #E3B400; display: flex; align-items: center; gap: 6px;">
                                    <span>⏱️</span> Tempo de Espera da Saudação Inicial
                                </span>
                                <span style="font-size: 10.5px; background: rgba(227, 180, 0, 0.15); color: #fce79a; padding: 2px 8px; border-radius: 10px; font-weight: 600;">
                                    Segundos Quebrados (ex: 2.5)
                                </span>
                            </div>
                            <p style="margin: 0; font-size: 11.5px; color: #cbd5e1; line-height: 1.4;">
                                Tempo em segundos que a extensão aguarda antes de enviar a saudação ao abrir um chat. Permite carregar o cliente e evita interromper caso você comece a digitar antes.
                            </p>
                            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                                <div style="position: relative; display: flex; align-items: center; width: 140px;">
                                    <input id="input-cfg-tempo-saudacao" type="number" step="0.5" min="0" max="30" value="${tempoAtual}" style="
                                        width: 100%; box-sizing: border-box; background: #27272a; border: 1px solid #3f3f46; border-radius: 8px;
                                        color: #ffffff; padding: 8px 38px 8px 12px; font-size: 13px; font-weight: 600; outline: none; transition: border-color 0.2s;
                                    " />
                                    <span style="position: absolute; right: 10px; font-size: 12px; color: #94a3b8; font-weight: 600;">seg</span>
                                </div>
                                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                    <button type="button" class="btn-preset-delay" data-valor="1.0" style="background: #27272a; border: 1px solid #3f3f46; color: #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 11.5px; cursor: pointer; transition: all 0.2s ease;">1.0s</button>
                                    <button type="button" class="btn-preset-delay" data-valor="2.5" style="background: #27272a; border: 1px solid #3f3f46; color: #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 11.5px; cursor: pointer; transition: all 0.2s ease;">2.5s (Padrão)</button>
                                    <button type="button" class="btn-preset-delay" data-valor="4.0" style="background: #27272a; border: 1px solid #3f3f46; color: #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 11.5px; cursor: pointer; transition: all 0.2s ease;">4.0s</button>
                                    <button type="button" class="btn-preset-delay" data-valor="5.0" style="background: #27272a; border: 1px solid #3f3f46; color: #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 11.5px; cursor: pointer; transition: all 0.2s ease;">5.0s</button>
                                </div>
                            </div>
                        </div>

                        <!-- Estilo e Comprimento das Respostas -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <label style="display: block; font-size: 12px; font-weight: 600; color: #e2e8f0; margin-bottom: 5px;">
                                    🎭 Tom de Voz da IA:
                                </label>
                                <select id="select-cfg-ia-tom" style="
                                    width: 100%; box-sizing: border-box; background: #27272a; border: 1px solid #3f3f46; border-radius: 8px;
                                    color: #ffffff; padding: 9px 10px; font-size: 12.5px; outline: none; cursor: pointer;
                                ">
                                    <option value="direto" ${tomAtual === 'direto' ? 'selected' : ''}>🎯 Direto & Resolutivo (Padrão)</option>
                                    <option value="empatico" ${tomAtual === 'empatico' ? 'selected' : ''}>🤗 Acolhedor & Empático</option>
                                    <option value="tecnico" ${tomAtual === 'tecnico' ? 'selected' : ''}>🛠️ Técnico & Detalhado</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 12px; font-weight: 600; color: #e2e8f0; margin-bottom: 5px;">
                                    📏 Tamanho das Respostas:
                                </label>
                                <select id="select-cfg-ia-tamanho" style="
                                    width: 100%; box-sizing: border-box; background: #27272a; border: 1px solid #3f3f46; border-radius: 8px;
                                    color: #ffffff; padding: 9px 10px; font-size: 12.5px; outline: none; cursor: pointer;
                                ">
                                    <option value="curto" ${tamanhoAtual === 'curto' ? 'selected' : ''}>⚡ Curto (1 a 2 frases)</option>
                                    <option value="medio" ${tamanhoAtual === 'medio' ? 'selected' : ''}>⚖️ Equilibrado (2 a 3 frases)</option>
                                    <option value="detalhado" ${tamanhoAtual === 'detalhado' ? 'selected' : ''}>📋 Completo / Passo a passo</option>
                                </select>
                            </div>
                        </div>

                        <!-- Criatividade e Redução de Bordões (Ponto 1) -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <label style="display: block; font-size: 12px; font-weight: 600; color: #e2e8f0; margin-bottom: 5px;">
                                    🎛️ Nível de Criatividade:
                                </label>
                                <select id="select-cfg-ia-temperatura" style="
                                    width: 100%; box-sizing: border-box; background: #27272a; border: 1px solid #3f3f46; border-radius: 8px;
                                    color: #ffffff; padding: 9px 10px; font-size: 12.5px; outline: none; cursor: pointer;
                                ">
                                    <option value="0.3" ${tempAtual === 0.3 ? 'selected' : ''}>🎯 Focado e Preciso (0.3)</option>
                                    <option value="0.6" ${tempAtual === 0.6 ? 'selected' : ''}>⚖️ Equilibrado (0.6 - Padrão)</option>
                                    <option value="0.8" ${tempAtual === 0.8 ? 'selected' : ''}>💡 Criativo & Variado (0.8)</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 12px; font-weight: 600; color: #e2e8f0; margin-bottom: 5px;">
                                    🚫 Redução de "Perfeito/Entendi":
                                </label>
                                <select id="select-cfg-ia-bordoes" style="
                                    width: 100%; box-sizing: border-box; background: #27272a; border: 1px solid #3f3f46; border-radius: 8px;
                                    color: #ffffff; padding: 9px 10px; font-size: 12.5px; outline: none; cursor: pointer;
                                ">
                                    <option value="estrito" ${bordoesAtual === 'estrito' ? 'selected' : ''}>🛡️ Alta Redução (Ir direto ao ponto)</option>
                                    <option value="moderado" ${bordoesAtual === 'moderado' ? 'selected' : ''}>🌿 Moderado (Apenas quando necessário)</option>
                                    <option value="livre" ${bordoesAtual === 'livre' ? 'selected' : ''}>🗣️ Livre (Sem restrições)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Ponto 2: Aprendizado Adaptativo com Correções -->
                        <div style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                                <div style="display: flex; flex-direction: column; gap: 2px;">
                                    <span style="font-size: 13px; font-weight: 700; color: #c4b5fd; display: flex; align-items: center; gap: 6px;">
                                        <span>🧠</span> Aprender com Minhas Correções de Texto
                                    </span>
                                    <span style="font-size: 11.5px; color: #cbd5e1; line-height: 1.4;">
                                        Quando você corrigir uma sugestão da IA e enviar, ela aprenderá com seu texto e se inspirará no seu modo de falar em atendimentos futuros similares.
                                    </span>
                                </div>
                                <label style="position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer; flex-shrink: 0; margin: 0;">
                                    <input id="chk-cfg-ia-aprendizado" type="checkbox" ${aprendizadoAtivo ? 'checked' : ''} style="opacity: 0; width: 0; height: 0; position: absolute;" />
                                    <span id="slider-cfg-ia-aprendizado" style="
                                        position: absolute; cursor: pointer; inset: 0;
                                        background-color: ${aprendizadoAtivo ? '#8b5cf6' : '#3f3f46'};
                                        transition: all .25s ease; border-radius: 24px;
                                    ">
                                        <span id="dot-cfg-ia-aprendizado" style="
                                            position: absolute; content: ''; height: 18px; width: 18px; left: ${aprendizadoAtivo ? '23px' : '3px'}; bottom: 3px;
                                            background-color: #ffffff; transition: all .25s ease; border-radius: 50%;
                                            box-shadow: 0 1px 3px rgba(0,0,0,0.4);
                                        "></span>
                                    </span>
                                </label>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed rgba(139, 92, 246, 0.25); padding-top: 8px; margin-top: 2px;">
                                <span id="badge-contador-correcoes" style="font-size: 11.5px; color: #ddd6fe; font-weight: 500;">
                                    🧠 Carregando correções aprendidas...
                                </span>
                                <button id="btn-limpar-correcoes" type="button" style="
                                    background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); color: #fca5a5;
                                    border-radius: 6px; padding: 4px 10px; font-size: 11px; cursor: pointer; transition: all 0.2s;
                                ">
                                    🗑️ Limpar Aprendizado
                                </button>
                            </div>
                        </div>

                        <!-- Pré-geração em segundo plano -->
                        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                <span style="font-size: 13px; font-weight: 600; color: #f1f5f9; display: flex; align-items: center; gap: 6px;">
                                    <span>⚡</span> Pré-geração Automática em Segundo Plano
                                </span>
                                <span style="font-size: 11.5px; color: #94a3b8;">
                                    Ao abrir um chat, pré-carrega uma resposta em segundo plano para envio instantâneo sem fila.
                                </span>
                            </div>
                            <label style="position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer; flex-shrink: 0; margin: 0;">
                                <input id="chk-cfg-ia-pregeracao" type="checkbox" ${pregeracaoAtiva ? 'checked' : ''} style="opacity: 0; width: 0; height: 0; position: absolute;" />
                                <span id="slider-cfg-ia-pregeracao" style="
                                    position: absolute; cursor: pointer; inset: 0;
                                    background-color: ${pregeracaoAtiva ? '#E3B400' : '#3f3f46'};
                                    transition: all .25s ease; border-radius: 24px;
                                ">
                                    <span id="dot-cfg-ia-pregeracao" style="
                                        position: absolute; content: ''; height: 18px; width: 18px; left: ${pregeracaoAtiva ? '23px' : '3px'}; bottom: 3px;
                                        background-color: #162227; transition: all .25s ease; border-radius: 50%;
                                        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
                                    "></span>
                                </span>
                            </label>
                        </div>
                    </div>

                    <!-- ========================================================= -->
                    <!-- FOOTER COM BOTÕES DE AÇÃO (SALVAR / CANCELAR)             -->
                    <!-- ========================================================= -->
                    <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 4px; gap: 8px; flex-wrap: wrap; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;">
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
                            <button id="btn-modal-baixar-atualizador" type="button" title="Verifica se há uma nova versão e baixa o Atualizar_SoftCopilot.bat automaticamente" style="
                                background: rgba(227, 180, 0, 0.12);
                                border: 1px solid rgba(227, 180, 0, 0.35);
                                color: #E3B400;
                                border-radius: 6px;
                                padding: 6px 11px;
                                font-size: 11.5px;
                                font-weight: 600;
                                cursor: pointer;
                                display: inline-flex;
                                align-items: center;
                                gap: 5px;
                                transition: all 0.2s;
                            ">
                                <span id="icone-verificar-atualizacao">🔄</span> <span id="texto-verificar-atualizacao">Verificar atualizações</span>
                            </button>
                            <button id="btn-cancelar-modal-tecnico" type="button" style="
                                background: #27272a;
                                border: 1px solid #3f3f46;
                                color: #cbd5e1;
                                border-radius: 6px;
                                padding: 6px 13px;
                                font-size: 12px;
                                font-weight: 500;
                                cursor: pointer;
                                transition: all 0.2s;
                            ">Cancelar</button>
                            <button id="btn-salvar-modal-tecnico" type="button" style="
                                background: #E3B400;
                                border: none;
                                color: #162227;
                                border-radius: 6px;
                                padding: 7px 16px;
                                font-size: 12px;
                                font-weight: 700;
                                cursor: pointer;
                                display: inline-flex;
                                align-items: center;
                                gap: 5px;
                                transition: all 0.2s;
                                box-shadow: 0 3px 10px rgba(227, 180, 0, 0.25);
                            ">
                                <span>${ehPrimeiroAcesso ? '🚀' : '💾'}</span>
                                <span>${ehPrimeiroAcesso ? 'Salvar e Iniciar' : 'Salvar Configurações'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Elementos de controle de abas
            const tabBtnGeral = overlay.querySelector('#tab-btn-geral');
            const tabBtnIA = overlay.querySelector('#tab-btn-ia');
            const panelGeral = overlay.querySelector('#tab-panel-geral');
            const panelIA = overlay.querySelector('#tab-panel-ia');

            const ativarAba = (aba) => {
                if (aba === 'ia') {
                    panelGeral.style.display = 'none';
                    panelIA.style.display = 'flex';
                    tabBtnIA.style.background = '#E3B400';
                    tabBtnIA.style.color = '#162227';
                    tabBtnIA.style.fontWeight = '700';
                    tabBtnIA.style.boxShadow = '0 2px 8px rgba(227, 180, 0, 0.25)';

                    tabBtnGeral.style.background = 'transparent';
                    tabBtnGeral.style.color = '#94a3b8';
                    tabBtnGeral.style.fontWeight = '600';
                    tabBtnGeral.style.boxShadow = 'none';
                } else {
                    panelGeral.style.display = 'flex';
                    panelIA.style.display = 'none';
                    tabBtnGeral.style.background = '#E3B400';
                    tabBtnGeral.style.color = '#162227';
                    tabBtnGeral.style.fontWeight = '700';
                    tabBtnGeral.style.boxShadow = '0 2px 8px rgba(227, 180, 0, 0.25)';

                    tabBtnIA.style.background = 'transparent';
                    tabBtnIA.style.color = '#94a3b8';
                    tabBtnIA.style.fontWeight = '600';
                    tabBtnIA.style.boxShadow = 'none';
                }
            };

            if (tabBtnGeral) tabBtnGeral.onclick = () => ativarAba('geral');
            if (tabBtnIA) tabBtnIA.onclick = () => ativarAba('ia');

            // Botões de delay preset (destaque dinâmico sincronizado com o valor do campo)
            const inputDelayCampo = overlay.querySelector('#input-cfg-tempo-saudacao');
            const botoesPresetDelay = Array.from(overlay.querySelectorAll('.btn-preset-delay'));

            const atualizarDestaquePresets = () => {
                const atual = parseFloat(String(inputDelayCampo ? inputDelayCampo.value : '').replace(',', '.'));
                botoesPresetDelay.forEach(b => {
                    const ativo = !isNaN(atual) && Math.abs(parseFloat(b.getAttribute('data-valor')) - atual) < 0.001;
                    if (ativo) {
                        b.style.background = 'rgba(227, 180, 0, 0.18)';
                        b.style.borderColor = '#E3B400';
                        b.style.color = '#E3B400';
                        b.style.fontWeight = '700';
                        b.style.transform = 'scale(1.08)';
                        b.style.boxShadow = '0 0 10px rgba(227, 180, 0, 0.35)';
                    } else {
                        b.style.background = '#27272a';
                        b.style.borderColor = '#3f3f46';
                        b.style.color = '#cbd5e1';
                        b.style.fontWeight = '400';
                        b.style.transform = 'scale(1)';
                        b.style.boxShadow = 'none';
                    }
                });
            };

            botoesPresetDelay.forEach(btn => {
                btn.onclick = () => {
                    const val = btn.getAttribute('data-valor');
                    if (inputDelayCampo) {
                        inputDelayCampo.value = val;
                        atualizarDestaquePresets();
                    }
                };
            });
            if (inputDelayCampo) {
                inputDelayCampo.addEventListener('input', atualizarDestaquePresets);
                inputDelayCampo.addEventListener('change', atualizarDestaquePresets);
            }
            atualizarDestaquePresets();

            const inputNome = overlay.querySelector('#input-cfg-nome-tecnico');
            const inputSufixo = overlay.querySelector('#input-cfg-sufixo-empresa');
            const chkSaudacao = overlay.querySelector('#chk-cfg-saudacao-auto');
            const sliderSaudacao = overlay.querySelector('#slider-cfg-saudacao-auto');
            const dotSaudacao = overlay.querySelector('#dot-cfg-saudacao-auto');
            const previewEl = overlay.querySelector('#preview-saudacao-tecnico');
            const inputGemini = overlay.querySelector('#input-cfg-gemini-key');
            const inputGroq = overlay.querySelector('#input-cfg-groq-key');
            const btnToggleGemini = overlay.querySelector('#btn-toggle-ver-gemini');
            const btnToggleGroq = overlay.querySelector('#btn-toggle-ver-groq');
            const btnFechar = overlay.querySelector('#btn-fechar-modal-tecnico');
            const btnCancelar = overlay.querySelector('#btn-cancelar-modal-tecnico');
            const btnSalvar = overlay.querySelector('#btn-salvar-modal-tecnico');

            // Switches da Aba IA
            const chkAprendizado = overlay.querySelector('#chk-cfg-ia-aprendizado');
            const sliderAprendizado = overlay.querySelector('#slider-cfg-ia-aprendizado');
            const dotAprendizado = overlay.querySelector('#dot-cfg-ia-aprendizado');
            if (chkAprendizado) {
                chkAprendizado.onchange = () => {
                    sliderAprendizado.style.backgroundColor = chkAprendizado.checked ? '#8b5cf6' : '#3f3f46';
                    dotAprendizado.style.left = chkAprendizado.checked ? '23px' : '3px';
                };
            }

            const chkPregeracao = overlay.querySelector('#chk-cfg-ia-pregeracao');
            const sliderPregeracao = overlay.querySelector('#slider-cfg-ia-pregeracao');
            const dotPregeracao = overlay.querySelector('#dot-cfg-ia-pregeracao');
            if (chkPregeracao) {
                chkPregeracao.onchange = () => {
                    sliderPregeracao.style.backgroundColor = chkPregeracao.checked ? '#E3B400' : '#3f3f46';
                    dotPregeracao.style.left = chkPregeracao.checked ? '23px' : '3px';
                };
            }

            // Contador de correções aprendidas
            chrome.storage.local.get(['softcom_correcoes_ia'], (res) => {
                const total = Array.isArray(res?.softcom_correcoes_ia) ? res.softcom_correcoes_ia.length : 0;
                const badge = overlay.querySelector('#badge-contador-correcoes');
                if (badge) {
                    badge.textContent = `🧠 ${total} ${total === 1 ? 'correção aprendida no seu perfil' : 'correções aprendidas no seu perfil'}`;
                }
            });

            // Botão de limpar histórico de aprendizado
            const btnLimparCorrecoes = overlay.querySelector('#btn-limpar-correcoes');
            if (btnLimparCorrecoes) {
                btnLimparCorrecoes.onclick = () => {
                    if (confirm('Deseja realmente apagar todas as correções aprendidas pela IA? O estilo retornará às diretrizes padrão.')) {
                        chrome.storage.local.set({ 'softcom_correcoes_ia': [] }, () => {
                            cacheCorrecoesAprendidas = [];
                            const badge = overlay.querySelector('#badge-contador-correcoes');
                            if (badge) badge.textContent = '🧠 0 correções aprendidas no seu perfil';
                            mostrarNotificacao('🗑️ Memória de correções da IA limpa com sucesso!', '#2ecc71');
                        });
                    }
                };
            }

            if (btnToggleGemini && inputGemini) {
                btnToggleGemini.onclick = () => {
                    inputGemini.type = inputGemini.type === 'password' ? 'text' : 'password';
                    btnToggleGemini.textContent = inputGemini.type === 'password' ? '👁️' : '🙈';
                };
            }
            if (btnToggleGroq && inputGroq) {
                btnToggleGroq.onclick = () => {
                    inputGroq.type = inputGroq.type === 'password' ? 'text' : 'password';
                    btnToggleGroq.textContent = inputGroq.type === 'password' ? '👁️' : '🙈';
                };
            }

            function atualizarPreview() {
                const n = (inputNome.value || '').trim() || 'Técnico';
                const s = (inputSufixo.value || '').trim();
                const completo = `${n} ${s}`.trim();
                const habilitada = chkSaudacao ? chkSaudacao.checked : false;

                if (sliderSaudacao && dotSaudacao) {
                    sliderSaudacao.style.backgroundColor = habilitada ? '#E3B400' : '#3f3f46';
                    dotSaudacao.style.left = habilitada ? '23px' : '3px';
                }

                if (previewEl) {
                    if (habilitada) {
                        previewEl.style.opacity = '1';
                        previewEl.style.color = '#f1f5f9';
                        previewEl.textContent = `"Bom dia, Cliente. Me chamo ${completo}, e irei iniciar seu atendimento."`;
                    } else {
                        previewEl.style.opacity = '0.75';
                        previewEl.style.color = '#cbd5e1';
                        previewEl.textContent = `⚠️ Saudação automática desativada (nenhuma mensagem será enviada automaticamente ao entrar em novos chats).`;
                    }
                }
            }

            inputNome.addEventListener('input', atualizarPreview);
            inputSufixo.addEventListener('input', atualizarPreview);
            if (chkSaudacao) {
                chkSaudacao.addEventListener('change', atualizarPreview);
            }
            atualizarPreview();

            inputNome.addEventListener('focus', () => {
                inputNome.style.borderColor = '#E3B400';
                inputNome.style.boxShadow = '0 0 0 2px rgba(227, 180, 0, 0.2)';
            });
            inputNome.addEventListener('blur', () => {
                inputNome.style.borderColor = '#3f3f46';
                inputNome.style.boxShadow = 'none';
            });
            inputSufixo.addEventListener('focus', () => {
                inputSufixo.style.borderColor = '#E3B400';
                inputSufixo.style.boxShadow = '0 0 0 2px rgba(227, 180, 0, 0.2)';
            });
            inputSufixo.addEventListener('blur', () => {
                inputSufixo.style.borderColor = '#3f3f46';
                inputSufixo.style.boxShadow = 'none';
            });

            if (inputGemini) {
                inputGemini.addEventListener('focus', () => {
                    inputGemini.style.borderColor = '#E3B400';
                    inputGemini.style.boxShadow = '0 0 0 2px rgba(227, 180, 0, 0.2)';
                });
                inputGemini.addEventListener('blur', () => {
                    inputGemini.style.borderColor = '#3f3f46';
                    inputGemini.style.boxShadow = 'none';
                });
            }
            if (inputGroq) {
                inputGroq.addEventListener('focus', () => {
                    inputGroq.style.borderColor = '#E3B400';
                    inputGroq.style.boxShadow = '0 0 0 2px rgba(227, 180, 0, 0.2)';
                });
                inputGroq.addEventListener('blur', () => {
                    inputGroq.style.borderColor = '#3f3f46';
                    inputGroq.style.boxShadow = 'none';
                });
            }

            const fechar = () => overlay.remove();

            if (btnFechar) btnFechar.onclick = fechar;
            if (btnCancelar) btnCancelar.onclick = fechar;

            overlay.onclick = (e) => {
                if (e.target === overlay && !ehPrimeiroAcesso) fechar();
            };

            const btnBaixarBat = overlay.querySelector('#btn-modal-baixar-atualizador');
            if (btnBaixarBat) {
                btnBaixarBat.onclick = () => {
                    const icone = overlay.querySelector('#icone-verificar-atualizacao');
                    const texto = overlay.querySelector('#texto-verificar-atualizacao');
                    const restaurar = () => {
                        btnBaixarBat.disabled = false;
                        btnBaixarBat.style.opacity = '1';
                        if (icone) icone.textContent = '🔄';
                        if (texto) texto.textContent = 'Verificar atualizações';
                    };
                    btnBaixarBat.disabled = true;
                    btnBaixarBat.style.opacity = '0.7';
                    if (icone) icone.textContent = '⏳';
                    if (texto) texto.textContent = 'Verificando...';

                    try {
                        chrome.runtime.sendMessage({ action: 'CHECK_FOR_UPDATE' }, (res) => {
                            if (chrome.runtime.lastError || !res || !res.success || !res.latestVersion) {
                                mostrarNotificacao('⚠️ Não foi possível verificar atualizações. Tente novamente.', '#f59e0b');
                                restaurar();
                                return;
                            }
                            const versaoAtual = chrome.runtime.getManifest()?.version || '0';
                            if (ehVersaoMaisRecente(res.latestVersion, versaoAtual)) {
                                versaoMaisRecenteDetectada = res.latestVersion;
                                atualizarBadgeUpdateUI();
                                mostrarNotificacao(`🚀 Nova versão v${res.latestVersion} encontrada! Baixando atualizador...`, '#E3B400');
                                baixarScriptAtualizador();
                            } else {
                                mostrarNotificacao(`✅ Você já está na versão mais recente (v${versaoAtual}).`, '#2ecc71');
                            }
                            restaurar();
                        });
                    } catch (_) {
                        mostrarNotificacao('⚠️ Falha ao verificar atualizações.', '#ef4444');
                        restaurar();
                    }
                };
            }

            const salvar = () => {
                const novoNome = inputNome.value.trim();
                const novoSufixo = inputSufixo.value.trim();
                if (!novoNome || novoNome.length < 2) {
                    ativarAba('geral');
                    mostrarNotificacao('Por favor, informe seu nome de atendente (pelo menos 2 letras).', '#ef4444');
                    inputNome.focus();
                    return;
                }
                const saudacaoHabilitada = chkSaudacao ? chkSaudacao.checked : false;
                definirNomeTecnico(novoNome, novoSufixo, false, true);
                definirSaudacaoAutomaticaHabilitada(saudacaoHabilitada);

                const novaGeminiKey = inputGemini ? inputGemini.value.trim() : '';
                const novaGroqKey = inputGroq ? inputGroq.value.trim() : '';
                definirChaveGeminiUsuario(novaGeminiKey);
                definirChaveGroqUsuario(novaGroqKey);

                // Salva configurações da IA (Aba 2)
                const inputDelay = overlay.querySelector('#input-cfg-tempo-saudacao');
                if (inputDelay) {
                    definirTempoSaudacaoSegundos(inputDelay.value);
                }
                const selTom = overlay.querySelector('#select-cfg-ia-tom');
                if (selTom) definirIATom(selTom.value);
                const selTamanho = overlay.querySelector('#select-cfg-ia-tamanho');
                if (selTamanho) definirIATamanho(selTamanho.value);
                const selTemp = overlay.querySelector('#select-cfg-ia-temperatura');
                if (selTemp) definirIATemperatura(selTemp.value);
                const selBordoes = overlay.querySelector('#select-cfg-ia-bordoes');
                if (selBordoes) definirIABordoes(selBordoes.value);

                const chkApr = overlay.querySelector('#chk-cfg-ia-aprendizado');
                if (chkApr) definirAprendizadoCorrecoesHabilitado(chkApr.checked);
                const chkPreg = overlay.querySelector('#chk-cfg-ia-pregeracao');
                if (chkPreg) definirPregeracaoHabilitada(chkPreg.checked);

                localStorage.setItem(STORAGE_KEY_CONFIGURADO, 'true');
                chrome.storage.local.set({ [STORAGE_KEY_CONFIGURADO]: 'true' });

                fechar();
                const delaySalvo = obterTempoSaudacaoSegundos();
                mostrarNotificacao(`✅ Configurações salvas: ${obterNomeTecnicoCompleto()} · Saudação: ${saudacaoHabilitada ? `Ativada (${delaySalvo}s)` : 'Desativada'} · IA Personalizada`, '#2ecc71');
                if (ehPrimeiroAcesso) {
                    mostrarNotificacao(`🎉 Bem-vindo, ${novoNome}! Seu perfil foi configurado permanentemente.`, '#2ecc71');
                }
            };

            btnSalvar.onclick = salvar;

            inputNome.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    salvar();
                }
            });

            inputSufixo.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    salvar();
                }
            });

            inputNome.focus();
            inputNome.select();
        }

        // Validador estrito para evitar que rótulos, nomes de sistema ou cabeçalhos de seção sejam capturados como nome
        function isTextoInvalidoParaNome(txt) {
            if (!txt || typeof txt !== 'string') return true;
            const limpo = txt.trim().toLowerCase();
            if (limpo.length < 2) return true;

            // Palavras de sistema, plataforma, empresa, atendente ou botões
            if (limpo.includes('workdesk')) return true;
            if (limpo.includes('softcom')) return true;
            const nomeTec = (obterNomeTecnico() || '').toLowerCase();
            if (nomeTec && limpo.includes(nomeTec)) return true;
            if (limpo.includes('natha')) return true;
            if (limpo.includes('chamar gestor')) return true;
            if (limpo.includes('chama gestor')) return true;
            if (limpo.includes('gestor')) return true;
            if (limpo.includes('chat interno')) return true;
            if (limpo.includes('supervisor')) return true;
            if (limpo.includes('equipe')) return true;
            if (limpo.includes('encerrar')) return true;
            if (limpo.includes('atendimento')) return true;
            if (limpo.includes('aguardando')) return true;
            if (limpo.includes('•') || limpo.includes('#')) return true; // ex: "Ouro Preto- Workdesk • #208366"
            if (/^\+?[\d\s().-]{3,}$/.test(limpo)) return true; // Somente números ou formato de telefone
            if (/^#\d+/.test(limpo)) return true; // Ticket (ex: #208366)

            const invalidos = [
                'dados do contato',
                'dados do cliente',
                'dados',
                'contato',
                'cliente',
                'informações',
                'informações do contato',
                'informações do cliente',
                'detalhes',
                'observações',
                'endereço',
                'localização',
                'telefone',
                'celular',
                'fone',
                'whatsapp',
                'cnpj',
                'cpf',
                'documento',
                'nome',
                'status',
                'novo',
                'em atendimento',
                'atendendo',
                'ocupado',
                'fila',
                'departamento',
                'setor',
                'suporte',
                'ouro preto',
                'ouro preto-'
            ];
            if (invalidos.includes(limpo)) return true;
            if (/^(dados|informações|detalhes)(\s+do)?/i.test(limpo)) return true;
            return false;
        }

        // Função que lê os dados do cliente no momento do clique e abre o cadastro
        function abrirCadastroCliente() {
            let cnpj = "";
            let telefone = "";
            let ticket = "";
            let nome = "";

            // 1. Captura via [data-ui="customer-info"] ou classes de informação do contato
            const elementsInfo = document.querySelectorAll('[data-ui="customer-info"], [class*="customer-info"], [class*="customerInfo"]');
            elementsInfo.forEach(info => {
                const text = info.innerText || "";
                if (text.includes("CNPJ") || text.includes("CPF") || text.includes("documento") || text.includes("Documento")) {
                    const strong = info.querySelector('strong') || info.querySelector('span') || info;
                    const matchCnpj = strong.innerText.replace(/\D/g, '');
                    if (matchCnpj && matchCnpj.length >= 11) {
                        cnpj = matchCnpj;
                    }
                }
                if (text.includes("Telefone") || text.includes("Celular") || text.includes("Fone") || text.includes("WhatsApp")) {
                    const strong = info.querySelector('strong') || info.querySelector('span') || info;
                    let telRaw = strong.innerText.replace(/\D/g, '');
                    if (telRaw.startsWith('55') && telRaw.length > 11) {
                        telRaw = telRaw.substring(2);
                    }
                    if (telRaw && telRaw.length >= 8) {
                        telefone = telRaw;
                    }
                }
                // Extração específica do bloco de Nome
                if (!nome && /\bnome\b/i.test(text) && !text.includes("Telefone") && !text.includes("CNPJ")) {
                    const strong = info.querySelector('strong') || info.querySelector('[class*="value"]') || info.querySelector('span:last-child');
                    if (strong && !isTextoInvalidoParaNome(strong.innerText)) {
                        nome = strong.innerText.trim();
                    } else {
                        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                        const found = lines.find(l => !/^nome:?$/i.test(l) && !isTextoInvalidoParaNome(l));
                        if (found) nome = found;
                    }
                }
            });

            const panel = document.querySelector('[role="tabpanel"][aria-label="Cliente"], [class*="inspectorTabPanel"]');

            // 2. Fallback de Nome: busca direta por nós com texto "Nome" no painel
            if (!nome) {
                const searchArea = panel || document.body;
                const allLabels = Array.from(searchArea.querySelectorAll('span, label, div, p, dt, small, [class*="label"]'));
                for (const lbl of allLabels) {
                    if (/^nome:?$/i.test(lbl.innerText.trim())) {
                        let next = lbl.nextElementSibling;
                        if (next && next.innerText && !isTextoInvalidoParaNome(next.innerText)) {
                            nome = next.innerText.trim();
                            break;
                        }
                        if (lbl.parentElement) {
                            const strong = lbl.parentElement.querySelector('strong, b, [class*="value"], p');
                            if (strong && strong !== lbl && !isTextoInvalidoParaNome(strong.innerText)) {
                                nome = strong.innerText.trim();
                                break;
                            }
                            const pLines = lbl.parentElement.innerText.split('\n').map(l => l.trim()).filter(Boolean);
                            const found = pLines.find(l => !/^nome:?$/i.test(l) && !isTextoInvalidoParaNome(l));
                            if (found) {
                                nome = found;
                                break;
                            }
                        }
                    }
                }
            }

            // 3. Fallback de Nome: busca a partir do bloco "DADOS DO CONTATO" (conforme a interface)
            if (!nome) {
                const headers = Array.from(document.querySelectorAll('*')).filter(el =>
                    el.children.length === 0 && /dados\s+do\s+contato/i.test((el.innerText || "").trim())
                );
                for (const h of headers) {
                    const container = h.closest('div, section, aside') || h.parentElement;
                    if (container) {
                        const lines = container.innerText.split('\n').map(l => l.trim()).filter(Boolean);
                        const idx = lines.findIndex(l => /^nome:?$/i.test(l));
                        if (idx !== -1 && lines[idx + 1] && !isTextoInvalidoParaNome(lines[idx + 1])) {
                            nome = lines[idx + 1];
                            break;
                        }
                    }
                }
            }

            // 4. Fallback de Nome: cabeçalho da conversa/chat ativa
            if (!nome) {
                const chatHeader = document.querySelector('[class*="chatHeader" i], [class*="conversationHeader" i], [class*="headerContent" i], header');
                if (chatHeader) {
                    const headerNameEl = chatHeader.querySelector('h1, h2, h3, h4, [class*="name" i], [class*="title" i], strong');
                    if (headerNameEl) {
                        const txt = headerNameEl.innerText.trim();
                        if (!isTextoInvalidoParaNome(txt)) {
                            nome = txt.split('\n')[0].trim();
                        }
                    }
                }
            }

            // Fallback para CNPJ e Telefone no painel
            if (panel) {
                const panelText = panel.innerText || "";
                if (!cnpj) {
                    const cnpjRegex = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b|\b\d{14}\b/;
                    const match = panelText.match(cnpjRegex);
                    if (match) cnpj = match[0].replace(/\D/g, '');
                }
                if (!cnpj) {
                    const cpfRegex = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b/;
                    const match = panelText.match(cpfRegex);
                    if (match) cnpj = match[0].replace(/\D/g, '');
                }
                if (!telefone) {
                    const telRegex = /(?:\+?55\s*)?(?:\(?([1-9]{2})\)?\s*)?(?:9\d{4}|\d{4})[-.\s]?\d{4}/;
                    const match = panelText.match(telRegex);
                    if (match) {
                        let telRaw = match[0].replace(/\D/g, '');
                        if (telRaw.startsWith('55') && telRaw.length > 11) {
                            telRaw = telRaw.substring(2);
                        }
                        telefone = telRaw;
                    }
                }
            }

            // 5. Captura número do Ticket
            const occurrenceSmall = document.querySelector('[data-ui="automatic-occurrence"] small, [class*="automatic-occurrence"] small');
            if (occurrenceSmall) {
                ticket = occurrenceSmall.innerText.replace(/\D/g, '');
            }

            if (!ticket) {
                const ticketFacts = document.querySelectorAll('[class*="ticketFacts"] dd, [class*="facts"] dd');
                ticketFacts.forEach(dd => {
                    if (dd.innerText.includes('#')) {
                        const found = dd.innerText.replace(/\D/g, '');
                        if (found) ticket = found;
                    }
                });
            }

            if (!ticket) {
                const ticketMatch = document.body.innerText.match(/#(\d{4,8})\b/);
                if (ticketMatch) {
                    ticket = ticketMatch[1];
                }
            }

            if (nome) {
                nome = nome.split('\n')[0].trim().replace(/\s+/g, ' ');
            }

            const cnpjLimpo = (cnpj || '').replace(/\D/g, '');
            console.log('[Extensão Softcom] Abrindo cadastro do cliente com dados capturados:', { cnpj: cnpjLimpo, telefone, ticket, nome });

            if (!cnpjLimpo && !telefone) {
                alert(`Aviso de Dados Incompletos:\nNão foi identificado CNPJ/CPF nem telefone na conversa ativa.\nA tela de clientes do Hub será aberta para consulta.`);
            }

            // ROTA CORRETA: https://hub.softcomtecnologia.com/clientes
            // O Hub processa ?cnpj= e abre diretamente a ficha de cadastro do cliente com a aba Dados Gerais.
            // NÃO envia autoOc=true para manter a tela do cadastro aberta conforme solicitado.
            const params = new URLSearchParams();
            if (cnpjLimpo) params.set('cnpj', cnpjLimpo);
            if (ticket) params.set('ticket', ticket);
            if (telefone) params.set('tel', telefone);
            if (nome) params.set('nome', nome.slice(0, 100));

            const queryString = params.toString();
            const url = queryString
                ? `https://hub.softcomtecnologia.com/clientes?${queryString}`
                : `https://hub.softcomtecnologia.com/clientes`;

            window.open(url, '_blank');
        }

        // Cria e injeta o botão na aba do cliente
        function injetarBotao() {
            const targetContainer = document.querySelector('[role="tabpanel"][aria-label="Cliente"]') ||
                document.querySelector('[class*="inspectorTabPanel"]') ||
                document.querySelector('[role="tabpanel"][aria-label*="Client"]');

            if (!targetContainer) return;

            let btn = targetContainer.querySelector('#btn-cadastro-cliente, #btn-ocorrencia-rapida');
            if (btn) {
                // Atualiza caso ainda tenha o label antigo de ocorrência
                if (btn.innerText.includes('Ocorrência') || btn.innerText.includes('Ocorrencia')) {
                    btn.id = 'btn-cadastro-cliente';
                    btn.innerHTML = '<span style="font-size: 14px;">👤</span> Abrir Cadastro do Cliente';
                    btn.onclick = abrirCadastroCliente;
                }
                return;
            }

            btn = document.createElement('button');
            btn.id = 'btn-cadastro-cliente';
            btn.type = 'button';
            btn.innerHTML = '<span style="font-size: 14px;">👤</span> Abrir Cadastro do Cliente';

            btn.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: calc(100% - 24px);
                margin: 12px auto;
                padding: 11px 16px;
                background-color: #E3B400;
                color: #0D0D0E;
                font-family: inherit;
                font-weight: 700;
                font-size: 13px;
                letter-spacing: 0.2px;
                border: 1px solid rgba(227, 180, 0, 0.5);
                border-radius: 8px;
                cursor: pointer;
                text-align: center;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
            `;

            btn.onmouseover = () => {
                btn.style.backgroundColor = '#c79c00';
                btn.style.transform = 'translateY(-1px)';
                btn.style.boxShadow = '0 4px 12px rgba(227, 180, 0, 0.35)';
            };
            btn.onmouseout = () => {
                btn.style.backgroundColor = '#E3B400';
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            };
            btn.onmousedown = () => {
                btn.style.transform = 'translateY(1px)';
            };
            btn.onclick = abrirCadastroCliente;

            targetContainer.appendChild(btn);
        }

        // Injeta regras CSS de flexbox com ordenação estática
        const style = document.createElement('style');
        style.id = 'fix-chat-order-css';
        style.innerHTML = `
            [class*="chatList"], [class*="ticketsList"], [class*="sidebar"] {
                display: flex !important;
                flex-direction: column !important;
            }
        `;
        if (!document.getElementById('fix-chat-order-css')) {
            document.head.appendChild(style);
        }

        // Atribui uma ordem visual fixa a cada item da lista
        function fixarOrdemChats() {
            const chatCards = document.querySelectorAll('[class*="chatCard"], [class*="ticketCard"], [class*="item"]');
            chatCards.forEach((card, index) => {
                if (!card.dataset.fixedOrder) {
                    card.dataset.fixedOrder = index;
                    card.style.order = index;
                }
            });
        }

        // =========================================================
        // SISTEMA DE AUTO-SAUDAÇÃO INTELIGENTE (/bt) PARA NOVOS CHATS (V2)
        // =========================================================
        const STORAGE_SAUDADOS_KEY = 'softcom_workdesk_saudados_v2';
        const ticketsProcessadosNaSessao = new Set();
        const ticketsIniciaisAoAbrir = new Set();
        let emProcessamentoSaudacao = false;

        // Notificação flutuante discreta para confirmação visual
        function mostrarNotificacao(texto, cor = '#E3B400') {
            try {
                let toast = document.getElementById('softcom-ext-toast');
                if (!toast) {
                    toast = document.createElement('div');
                    toast.id = 'softcom-ext-toast';
                    toast.style.cssText = `
                        position: fixed;
                        bottom: 24px;
                        right: 24px;
                        background: #162227;
                        color: #ffffff;
                        padding: 12px 18px;
                        border-radius: 8px;
                        font-size: 13px;
                        font-family: inherit;
                        font-weight: 600;
                        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                        z-index: 999999;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        border-left: 4px solid ${cor};
                        transition: all 0.3s ease;
                        opacity: 0;
                        transform: translateY(10px);
                        pointer-events: none;
                    `;
                    document.body.appendChild(toast);
                }
                toast.innerText = texto;
                toast.style.borderLeftColor = cor;
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
                setTimeout(() => {
                    if (toast) {
                        toast.style.opacity = '0';
                        toast.style.transform = 'translateY(10px)';
                    }
                }, 3500);
            } catch (e) { }
        }

        // Recupera histórico de tickets já saudados do localStorage
        function getChatsSaudados() {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_SAUDADOS_KEY) || '{}');
            } catch (e) {
                return {};
            }
        }

        // Salva ticket como saudado de forma atômica e persistente
        function marcarComoSaudado(ticketId, motivo = 'concluido') {
            if (!ticketId) return;
            ticketsProcessadosNaSessao.add(String(ticketId));
            try {
                const chats = getChatsSaudados();
                chats[String(ticketId)] = {
                    data: new Date().toISOString(),
                    status: motivo
                };
                const keys = Object.keys(chats);
                if (keys.length > 500) {
                    delete chats[keys[0]];
                }
                localStorage.setItem(STORAGE_SAUDADOS_KEY, JSON.stringify(chats));
            } catch (e) { }
        }

        // Verifica se o ticket já recebeu saudação ou se já foi tratado
        function jaFoiSaudado(ticketId) {
            if (!ticketId) return true;
            if (ticketsProcessadosNaSessao.has(String(ticketId))) return true;
            if (ticketsIniciaisAoAbrir.has(String(ticketId))) return true;
            const chats = getChatsSaudados();
            return !!chats[String(ticketId)];
        }

        // =========================================================================
        // IDENTIFICAÇÃO DO CHAT ATIVO E DO TICKET DO ATENDIMENTO
        // =========================================================================

        // Detecta com máxima precisão o ID do Ticket do chat ativo no momento (NUNCA busca na página inteira)
        function obterTicketChatAtivo() {
            // 1. Prioridade Máxima: Cabeçalho central da conversa ativa (área superior da conversa aberta)
            // Esse cabeçalho pertence EXCLUSIVAMENTE ao chat aberto e exibe "NumeroOficial - 936180520 • #211373"
            const botoesTopo = Array.from(document.querySelectorAll('button, a, [role="button"]'));
            const btnTopo = botoesTopo.find(b => {
                if (b.closest && b.closest('#gemini-docked-panel')) return false;
                const txt = (b.textContent || b.title || b.getAttribute('aria-label') || '').toLowerCase();
                return txt.includes('encerrar') || txt.includes('chamar gestor') || txt.includes('transferir');
            });

            if (btnTopo) {
                let ancestral = btnTopo.parentElement;
                let profundidade = 0;
                while (ancestral && ancestral !== document.body && profundidade < 6) {
                    const txt = ancestral.innerText || ancestral.textContent || '';
                    const m = txt.match(/#(\d{4,8})\b/);
                    if (m) return m[1];
                    if (ancestral.tagName === 'HEADER' || (ancestral.className && /header/i.test(String(ancestral.className)))) {
                        break;
                    }
                    ancestral = ancestral.parentElement;
                    profundidade++;
                }
            }

            // 2. Busca direta em containers com classes de cabeçalho da conversa
            const headers = document.querySelectorAll(
                '[class*="chatHeader" i], [class*="conversationHeader" i], [class*="chat-header" i], [class*="headerContent" i], header'
            );
            for (const h of headers) {
                if (h.closest && h.closest('#gemini-docked-panel')) continue;
                const txt = h.innerText || h.textContent || '';
                const m = txt.match(/#(\d{4,8})\b/);
                if (m) return m[1];
            }

            // 3. Procura no painel lateral direito de dados do cliente/atendimento ativo
            const painelDetalhes = document.querySelector(
                '[role="tabpanel"][aria-label="Cliente"], [class*="inspectorTabPanel"], [class*="clientPanel"], aside, [class*="sidePanel" i]'
            );
            if (painelDetalhes) {
                const mStatus = (painelDetalhes.innerText || '').match(/(?:Status|Ocorrência aberta|Atendimento atual):?\s*#?(\d{4,8})\b/i);
                if (mStatus) return mStatus[1];
                const mQualquer = (painelDetalhes.innerText || '').match(/#(\d{4,8})\b/);
                if (mQualquer) return mQualquer[1];
            }

            // 4. Elemento de ocorrência automática
            const elOcorrencia = document.querySelector('[data-ui="automatic-occurrence"], [class*="automatic-occurrence"]');
            if (elOcorrencia) {
                const m = (elOcorrencia.innerText || '').match(/#?(\d{4,8})\b/);
                if (m) return m[1];
            }

            // 5. Card ativo/selecionado na lista de conversas à esquerda (somente se tiver marcação de ativo)
            const cardAtivo = document.querySelector(
                '[class*="chatCard"][class*="active"], ' +
                '[class*="ticketCard"][class*="active"], ' +
                '[class*="item"][class*="active"], ' +
                '[class*="item"][class*="selected"], ' +
                '[class*="card"][class*="active"], ' +
                '[class*="card"][class*="selected"], ' +
                '[aria-selected="true"]'
            );
            if (cardAtivo && !cardAtivo.closest('#gemini-docked-panel')) {
                const m = (cardAtivo.innerText || '').match(/#(\d{4,8})\b/);
                if (m) return m[1];
            }

            // 6. URL da página (se contiver número de ticket)
            const mUrl = window.location.href.match(/[#&?\/](?:ticket|chat|conversa|id)[=\/]?(\d{4,8})\b/i);
            if (mUrl) return mUrl[1];

            return null;
        }

        // =========================================================================
        // MÓDULO DE PERSISTÊNCIA DE RASCUNHO POR ATENDIMENTO (DRAFT STATE)
        // =========================================================================
        const STORAGE_KEY_RASCUNHOS = 'softcom_drafts_tickets';
        const mapaRascunhosPorChat = new Map();
        let ultimoTicketPainel = null;
        let envioMensagemEmAndamento = false;
        let ultimoTextoEnviadoRecente = { texto: '', timestamp: 0 };

        // Carrega rascunhos salvos da sessão ativa
        function carregarRascunhosSessao() {
            try {
                const dados = sessionStorage.getItem(STORAGE_KEY_RASCUNHOS);
                if (dados) {
                    const parsed = JSON.parse(dados);
                    Object.keys(parsed).forEach(k => {
                        if (parsed[k] && typeof parsed[k] === 'string') {
                            mapaRascunhosPorChat.set(String(k), parsed[k]);
                        }
                    });
                }
            } catch (_) { }
        }
        carregarRascunhosSessao();

        // Persiste rascunhos na sessionStorage para sobreviver a trocas de aba e F5
        function persistirRascunhosSessao() {
            try {
                const obj = {};
                mapaRascunhosPorChat.forEach((v, k) => {
                    if (v && v.trim().length > 0) {
                        obj[k] = v;
                    }
                });
                sessionStorage.setItem(STORAGE_KEY_RASCUNHOS, JSON.stringify(obj));
            } catch (_) { }
        }

        // Identifica com máxima precisão o ID ou chave única da conversa/ticket ativo
        function obterChaveIdentificadoraChatAtivo() {
            // 1. Tenta número do ticket no chat ativo (ex: ticket_211373)
            const ticket = obterTicketChatAtivo();
            if (ticket) return 'ticket_' + String(ticket);

            // 2. Tenta pelo nome do cliente presente no cabeçalho da conversa aberta
            const nome = obterNomeClienteParaSaudacao();
            if (nome && nome.length >= 2) {
                const slug = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_');
                return 'cliente_' + slug;
            }

            // 3. Fallback: card ativo na listagem
            const cardAtivo = document.querySelector(
                '[class*="chatCard"][class*="active"], ' +
                '[class*="ticketCard"][class*="active"], ' +
                '[class*="item"][class*="active"], ' +
                '[aria-selected="true"]'
            );
            if (cardAtivo && !cardAtivo.closest('#gemini-docked-panel')) {
                const txt = (cardAtivo.innerText || '').trim();
                const m = txt.match(/#(\d{4,8})\b/);
                if (m) return 'ticket_' + m[1];
                const nomeCli = txt.split('\n')[0].trim();
                if (nomeCli) {
                    const slug = nomeCli.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_');
                    return 'card_' + slug;
                }
            }

            return null;
        }

        function salvarRascunhoChat(chave, texto) {
            if (envioMensagemEmAndamento) return;
            if (!chave) return;
            const strTexto = typeof texto === 'string' ? texto : '';
            const tLimpo = strTexto.trim();
            if (tLimpo.length > 0) {
                // Se esse texto for idêntico à mensagem enviada recentemente (nos últimos 10s), NUNCA salva como rascunho
                if (ultimoTextoEnviadoRecente.texto && tLimpo === ultimoTextoEnviadoRecente.texto && (Date.now() - ultimoTextoEnviadoRecente.timestamp < 10000)) {
                    return;
                }
                mapaRascunhosPorChat.set(String(chave), strTexto);
                const ticket = (typeof obterTicketChatAtivo === 'function') ? obterTicketChatAtivo() : null;
                if (ticket) {
                    mapaRascunhosPorChat.set('ticket_' + String(ticket), strTexto);
                }
            } else {
                mapaRascunhosPorChat.delete(String(chave));
                const ticket = (typeof obterTicketChatAtivo === 'function') ? obterTicketChatAtivo() : null;
                if (ticket) {
                    mapaRascunhosPorChat.delete('ticket_' + String(ticket));
                }
            }
            persistirRascunhosSessao();
        }

        function obterRascunhoChat(chave) {
            if (!chave) return '';
            let direto = mapaRascunhosPorChat.get(String(chave));
            if (!direto) {
                const nome = (typeof obterNomeClienteParaSaudacao === 'function') ? obterNomeClienteParaSaudacao() : null;
                if (nome && nome.length >= 2) {
                    const slug = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_');
                    direto = mapaRascunhosPorChat.get('cliente_' + slug) || mapaRascunhosPorChat.get('card_' + slug);
                }
            }
            if (!direto) {
                const ticket = (typeof obterTicketChatAtivo === 'function') ? obterTicketChatAtivo() : null;
                if (ticket) {
                    direto = mapaRascunhosPorChat.get('ticket_' + String(ticket)) || mapaRascunhosPorChat.get(String(ticket));
                }
            }
            if (direto) {
                // Se o rascunho for idêntico à mensagem recém-enviada, purga imediatamente e não restaura
                if (ultimoTextoEnviadoRecente.texto && direto.trim() === ultimoTextoEnviadoRecente.texto && (Date.now() - ultimoTextoEnviadoRecente.timestamp < 10000)) {
                    if (typeof limparTodosRascunhosDoChatAtual === 'function') {
                        limparTodosRascunhosDoChatAtual(direto);
                    }
                    return '';
                }
                return direto;
            }
            return '';
        }

        function limparRascunhoChat(chave) {
            if (!chave) return;
            mapaRascunhosPorChat.delete(String(chave));
            persistirRascunhosSessao();
        }

        // =========================================================================
        // VALIDAÇÃO E FILTRAGEM DO CHAT DO CLIENTE VS CHAT INTERNO (CHAMA GESTOR)
        // =========================================================================

        // Verifica com máxima precisão se o contexto atual é o chat interno ("Chama Gestor" / conversa com supervisor/equipe)
        function ehChatInternoOuGestor(campo) {
            // 1. Verifica se o campo ou seus ancestrais pertencem ao container do gestor
            const elAlvo = campo || (document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT') ? document.activeElement : null);
            if (elAlvo && elAlvo.id !== 'gemini-suggestion-text') {
                const ph = (elAlvo.placeholder || elAlvo.getAttribute('data-placeholder') || elAlvo.getAttribute('aria-label') || '').toLowerCase();
                if (ph.includes('gestor') || ph.includes('interno') || ph.includes('supervisor')) {
                    return true;
                }

                // Verifica ancestrais próximos do campo
                let cur = elAlvo.parentElement;
                let profundidade = 0;
                while (cur && cur !== document.body && profundidade < 8) {
                    const idCls = ((cur.id || '') + ' ' + (typeof cur.className === 'string' ? cur.className : '') + ' ' + (cur.getAttribute('data-ui') || '')).toLowerCase();
                    if (idCls.includes('gestor') || idCls.includes('internal-chat') || idCls.includes('chat-interno')) {
                        return true;
                    }
                    const titulo = (cur.querySelector('h1, h2, h3, h4, header, [class*="title" i]')?.textContent || '').toLowerCase();
                    if (titulo.includes('chamar gestor') || titulo.includes('chama gestor') || titulo.includes('chat com gestor') || titulo.includes('chat interno')) {
                        return true;
                    }
                    cur = cur.parentElement;
                    profundidade++;
                }
            }

            // 2. Verifica pelo nome identificado do contato
            const nomeCli = (obterNomeClienteParaSaudacao() || '').toLowerCase().trim();
            if (nomeCli.includes('chamar gestor') || nomeCli.includes('chama gestor') || nomeCli.includes('gestor') ||
                nomeCli.includes('chat interno') || nomeCli.includes('suporte interno') || nomeCli.includes('supervisor')) {
                return true;
            }

            // 3. Verifica se há aba ou item de "Chamar gestor" ativo/selecionado
            const abasAtivas = Array.from(document.querySelectorAll('[role="tab"][aria-selected="true"], [class*="tab"][class*="active"], [class*="item"][class*="active"]'));
            for (const aba of abasAtivas) {
                const txt = (aba.textContent || '').toLowerCase().trim();
                if (txt.includes('chamar gestor') || txt.includes('chama gestor') || txt === 'gestor' || txt.includes('chat interno')) {
                    return true;
                }
            }

            // 4. Verifica se o botão "Chamar gestor" está em estado ativo/expandido (drawer/modal de gestor aberto)
            const botoesTopo = Array.from(document.querySelectorAll('button, [role="button"]'));
            const btnGestorAberto = botoesTopo.find(b => {
                const t = (b.textContent || b.title || b.getAttribute('aria-label') || '').toLowerCase();
                const isGestorBtn = t.includes('chamar gestor') || t.includes('chama gestor');
                if (!isGestorBtn) return false;
                const ariaExpanded = b.getAttribute('aria-expanded');
                const ariaPressed = b.getAttribute('aria-pressed');
                const cls = (typeof b.className === 'string' ? b.className : '').toLowerCase();
                return ariaExpanded === 'true' || ariaPressed === 'true' || cls.includes('active') || cls.includes('selected') || cls.includes('open');
            });
            if (btnGestorAberto) {
                return true;
            }

            return false;
        }

        // Determina se a tela atual possui um CHAT DE CLIENTE legítimo e aberto
        // Garante que o SoftCopilot funcione EXCLUSIVAMENTE dentro do chat do cliente
        function ehChatDoClienteLegitimo() {
            // Se for comprovadamente o Chama Gestor / chat interno, NÃO é chat de cliente
            if (ehChatInternoOuGestor()) {
                return false;
            }

            // 1. Procura por botões obrigatórios do cabeçalho de atendimento de cliente ("Encerrar", "Encerrar chat", "Transferir")
            const botoesHeader = Array.from(document.querySelectorAll('button, a, [role="button"]'));
            const temBotaoAtendimento = botoesHeader.some(b => {
                if (b.closest && b.closest('#gemini-docked-panel')) return false;
                const txt = (b.textContent || b.title || b.getAttribute('aria-label') || '').toLowerCase();
                return txt.includes('encerrar chat') || txt.includes('encerrar atendimento') || txt === 'encerrar' ||
                    txt.includes('transferir') || txt.includes('chamar gestor') || txt.includes('chama gestor');
            });

            // 2. Verifica se há um ticket de cliente ativo identificado (#123456)
            const ticket = obterTicketChatAtivo();

            // 3. Verifica se há um card ativo na lista de conversas de chamados
            const cardAtivo = document.querySelector(
                '[class*="chatCard"][class*="active"], ' +
                '[class*="ticketCard"][class*="active"], ' +
                '[class*="item"][class*="active"], ' +
                '[class*="item"][class*="selected"], ' +
                '[class*="card"][class*="active"], ' +
                '[class*="card"][class*="selected"], ' +
                '[aria-selected="true"]'
            );

            // 4. Verifica se há cabeçalho de conversa no DOM
            const chatHeader = document.querySelector(
                '[class*="chatHeader" i], [class*="conversationHeader" i], [class*="chat-header" i]'
            );

            // Para ser um chat de cliente legítimo:
            // Precisa de pelo menos um ticket OU botão de atendimento no cabeçalho OU (chatHeader E cardAtivo)
            if (ticket || temBotaoAtendimento || (chatHeader && cardAtivo)) {
                return true;
            }

            return false;
        }

        // Localiza o campo de digitação de resposta EXCLUSIVAMENTE dentro do chat do cliente
        function obterCampoMensagem() {
            // SE NÃO HOUVER CHAT DE CLIENTE ABERTO, RETORNA NULL IMEDIATAMENTE!
            // Evita capturar inputs de texto em formulários, modais, filtros ou telas vazias
            if (!ehChatDoClienteLegitimo()) {
                return null;
            }

            // Se já encontramos e marcamos o campo nativo legítimo, valida se ele ainda pertence ao chat do cliente
            const marcado = document.querySelector('[data-native-chat-input="true"]');
            if (marcado && document.body.contains(marcado) && marcado.id !== 'gemini-suggestion-text') {
                if (!ehChatInternoOuGestor(marcado)) {
                    return marcado;
                }
            }

            const candidatos = Array.from(document.querySelectorAll(
                'textarea, ' +
                'input[type="text"], ' +
                'input:not([type]), ' +
                '[contenteditable="true"]'
            ));

            const campoValido = candidatos.find(el => {
                if (el.id === 'gemini-suggestion-text') return false; // NUNCA a nossa textarea
                if (el.disabled || el.readOnly) return false;

                // NUNCA selecionar inputs dentro de modais, diálogos ou popups de formulário
                if (el.closest && el.closest('[role="dialog"], [class*="modal" i]:not([class*="chat" i]), [class*="popover" i]')) {
                    return false;
                }

                // NUNCA selecionar inputs do Chama Gestor / chat interno
                if (ehChatInternoOuGestor(el)) {
                    return false;
                }

                const ph = (el.placeholder || el.getAttribute('data-placeholder') || el.getAttribute('aria-label') || '').toLowerCase();
                const name = (el.getAttribute('name') || '').toLowerCase();

                // Ignora explicitamente campos de pesquisa, filtros, formulários comuns
                if (ph.includes('buscar') || ph.includes('pesquisar') || ph.includes('filtro') || ph.includes('pesquisa')) return false;
                if (name.includes('search') || name.includes('filter') || name.includes('busca')) return false;

                // O campo legítimo do chat tem placeholders característicos de mensagens:
                if (ph.includes('resposta') || ph.includes('atalho') || ph.includes('mensagem') || ph.includes('digite') || ph.includes('escreva')) {
                    return true;
                }

                // Ou tem dica "Enter envia" em um container ancestral próximo
                let cur = el.parentElement;
                let temDicaEnter = false;
                for (let i = 0; i < 4 && cur && cur !== document.body; i++) {
                    if (cur.textContent && cur.textContent.includes('Enter envia')) {
                        temDicaEnter = true;
                        break;
                    }
                    cur = cur.parentElement;
                }
                if (temDicaEnter) {
                    return true;
                }

                // Ou está dentro do footer/composer de chat do cliente (área inferior da tela)
                const rect = el.getBoundingClientRect();
                const estaNoFundoDaTela = rect.bottom >= window.innerHeight - 250;
                const estaNaColunaCentral = rect.left >= 150 && rect.right <= window.innerWidth - 100;
                const alturaValida = rect.height >= 25 && rect.height <= 200;
                const larguraValida = rect.width >= 180;

                return estaNoFundoDaTela && estaNaColunaCentral && alturaValida && larguraValida;
            });

            if (campoValido) {
                campoValido.dataset.nativeChatInput = 'true';
            }

            return campoValido || null;
        }

        // Localiza a área central de mensagens da conversa
        function obterAreaConversa() {
            const campo = obterCampoMensagem();
            if (campo) {
                return campo.closest('main, [class*="chat" i], [class*="conversation" i], [class*="panel" i]') ||
                    campo.parentElement?.parentElement?.parentElement;
            }
            // Se campo não estiver presente (ex: durante gravação/escuta de áudio), busca pelos balões de mensagens
            const msgEl = document.querySelector('[class*="message" i], [class*="bubble" i], [class*="chat-item" i]');
            if (msgEl) {
                return msgEl.closest('main, [class*="chat" i], [class*="conversation" i], [class*="panel" i]') ||
                    msgEl.parentElement?.parentElement;
            }
            return document.querySelector('main') || null;
        }

        // Verifica se a conversa aberta JÁ POSSUI mensagens do atendente (chat em andamento ou histórico)
        function conversaJaPossuiMensagensDoAtendente() {
            const area = obterAreaConversa();
            if (!area) return false;

            const texto = area.innerText || "";

            // 1. Mensagens com prefixo do atendente (ex: *Nome Softcom:*, *Nome:* ou genérico *...:*)
            const nomeTec = (obterNomeTecnico() || '').trim();
            const regexPrefixoGenerico = /\*[A-Za-zÀ-ÿ0-9_.\s]+:\*/;
            if (regexPrefixoGenerico.test(texto) || (nomeTec && new RegExp(`\\*${nomeTec}`, 'i').test(texto)) || /\*Natha(?: Softcom)?:\*/i.test(texto)) {
                return true;
            }

            // 2. Indicadores de confirmação de leitura do atendente (✓✓ Lida)
            const linhas = texto.split('\n').map(l => l.trim());
            const temStatusEnvio = linhas.some(l =>
                regexPrefixoGenerico.test(l) ||
                (nomeTec && l.toLowerCase().startsWith(`*${nomeTec.toLowerCase()}`)) ||
                l.startsWith('*Natha') ||
                (l.includes('✓✓') && l.includes('Lida')) ||
                l === '✓✓ Lida'
            );
            if (temStatusEnvio) return true;

            // 3. Balões de mensagem especificamente marcados como enviados/outgoing
            const baloes = area.querySelectorAll('[class*="message-outgoing" i], [class*="message--out" i], [class*="bubble-right" i]');
            if (baloes.length > 0) return true;

            return false;
        }

        // Determina se o horário de João Pessoa, PB é manhã (até 11:59) ou tarde (a partir de 12:00)
        function obterSaudacaoPorHorario() {
            let hora = 12;
            try {
                const formato = new Intl.DateTimeFormat('pt-BR', {
                    timeZone: 'America/Fortaleza', // UTC-3 (Horário de João Pessoa, PB)
                    hour: 'numeric',
                    hour12: false
                });
                const partes = formato.formatToParts(new Date());
                const horaPart = partes.find(p => p.type === 'hour')?.value;
                if (horaPart !== undefined) {
                    hora = parseInt(horaPart, 10);
                } else {
                    hora = new Date().getHours();
                }
            } catch (e) {
                hora = new Date().getHours();
            }

            const ehManha = hora < 12; // até 11:59 é Bom dia; a partir de 12:00 é Boa tarde
            return {
                tipo: ehManha ? 'manha' : 'tarde',
                atalho: ehManha ? '/bd' : '/bt',
                textoPrefix: ehManha ? 'Bom dia' : 'Boa tarde'
            };
        }

        // Obtém o nome do cliente no chat ativo para usar na saudação (retorna null se não houver nome legítimo)
        function obterNomeClienteParaSaudacao() {
            // 1. Tenta cabeçalho específico da conversa aberta
            // Usamos os botões característicos da barra da conversa ("Encerrar chat", "Chamar gestor") como âncora
            const btnHeaderConversa = Array.from(document.querySelectorAll('button')).find(b => {
                const t = (b.textContent || '').toLowerCase();
                return t.includes('encerrar') || t.includes('chamar gestor');
            });
            const convHeader = btnHeaderConversa ? btnHeaderConversa.closest('header, [class*="header" i], div[style*="flex"], div') : null;
            const chatHeader = convHeader || document.querySelector('[class*="chatHeader" i], [class*="conversationHeader" i], [class*="chat-header" i]');

            if (chatHeader) {
                // Busca elementos textuais no cabeçalho ignorando qualquer elemento dentro de botões
                const elementosTexto = Array.from(chatHeader.querySelectorAll('h1, h2, h3, h4, [class*="name" i], [class*="title" i], strong, b, div, span'));
                for (const el of elementosTexto) {
                    if (el.closest('button')) continue;
                    if (el.children.length > 2) continue;
                    const txt = (el.innerText || el.textContent || '').trim().split('\n')[0].trim();
                    if (txt && !isTextoInvalidoParaNome(txt) && txt.length >= 2) {
                        return txt;
                    }
                }
            }

            // 2. Tenta ficha do cliente (painel lateral de detalhes)
            try {
                const dados = obterDadosCliente();
                if (dados && dados.nome && !isTextoInvalidoParaNome(dados.nome)) {
                    return dados.nome.trim();
                }
            } catch (e) { }

            // 3. Tenta card ativo na listagem lateral esquerda
            const cardAtivo = document.querySelector(
                '[class*="chatCard"][class*="active"], ' +
                '[class*="ticketCard"][class*="active"], ' +
                '[class*="item"][class*="active"], ' +
                '[aria-selected="true"]'
            );
            if (cardAtivo) {
                const candidatosCard = Array.from(cardAtivo.querySelectorAll('[class*="name" i], strong, h3, h4, b'));
                for (const el of candidatosCard) {
                    const txt = (el.innerText || el.textContent || '').trim().split('\n')[0].trim();
                    if (txt && !isTextoInvalidoParaNome(txt) && txt.length >= 2) {
                        return txt;
                    }
                }
            }

            return null;
        }

        // Executa o envio automático da saudação (Bom dia até 11:59 / Boa tarde a partir das 12:00)
        // EXCLUSIVO para chats legítimos de clientes - NUNCA envia para o Chama Gestor / chat interno
        async function verificarEEnviarSaudacao() {
            if (emProcessamentoSaudacao) return;

            // Se o usuário desabilitou a saudação automática nas configurações
            if (!obterSaudacaoAutomaticaHabilitada()) {
                return;
            }

            // CRÍTICO: Saudação é estritamente para chat do cliente!
            // Se NÃO houver chat de cliente legítimo ou for o Chama Gestor / chat interno, aborta imediatamente
            if (!ehChatDoClienteLegitimo() || ehChatInternoOuGestor()) {
                return;
            }

            const ticketId = obterTicketChatAtivo();
            if (!ticketId) return;

            // Se o contato identificado for Gestor ou interno, aborta
            const nomeClientePrevia = obterNomeClienteParaSaudacao();
            if (nomeClientePrevia) {
                const nomeLower = nomeClientePrevia.toLowerCase().trim();
                if (nomeLower.includes('gestor') || nomeLower.includes('interno') || nomeLower.includes('supervisor') || nomeLower.includes('equipe')) {
                    console.log(`[Extensão Softcom] Contato é "${nomeClientePrevia}" (interno/gestor). Abortando saudação.`);
                    return;
                }
            }

            // Se o chat já estava aberto quando a página carregou (F5), não faz nada
            if (ticketsIniciaisAoAbrir.has(String(ticketId))) {
                return;
            }

            // Se este ticket já foi saudado anteriormente
            if (jaFoiSaudado(ticketId)) {
                return;
            }

            const campo = obterCampoMensagem();
            if (!campo || ehChatInternoOuGestor(campo)) return;

            const { tipo, atalho, textoPrefix } = obterSaudacaoPorHorario();

            // Se o atendente já estiver digitando manualmente, não substitui
            const valorAtual = (campo.value !== undefined ? campo.value : campo.innerText) || "";
            if (valorAtual.trim().length > 0 && !valorAtual.includes('/bt') && !valorAtual.includes('/bd')) {
                return;
            }

            // Se a conversa já possui mensagens anteriores do atendente
            if (conversaJaPossuiMensagensDoAtendente()) {
                console.log(`[Extensão Softcom] Chat #${ticketId} já possui mensagens anteriores do atendente. Marcando como tratado.`);
                marcarComoSaudado(ticketId, 'ja_existente');
                return;
            }

            // BLOQUEIO ATÔMICO IMEDIATO: Impede que qualquer outro ciclo ou observer tente reenviar
            emProcessamentoSaudacao = true;
            marcarComoSaudado(ticketId, 'concluido');

            const tempoEsperaSeg = obterTempoSaudacaoSegundos();
            const delayMs = Math.max(0, Math.round(tempoEsperaSeg * 1000));
            console.log(`[Extensão Softcom] Novo chat (#${ticketId}) detectado! Aguardando ${tempoEsperaSeg}s antes de enviar saudação...`);

            try {
                if (delayMs > 0) {
                    await new Promise(r => setTimeout(r, delayMs));
                }

                // Validações pós-delay para garantir que o contexto ainda é válido e o atendente não interagiu:
                if (String(obterTicketChatAtivo()) !== String(ticketId)) {
                    console.log(`[Extensão Softcom] Chat mudou durante o delay de ${tempoEsperaSeg}s. Cancelando saudação para #${ticketId}.`);
                    return;
                }

                const campoAtual = obterCampoMensagem();
                const valAtual = (campoAtual ? (campoAtual.value !== undefined ? campoAtual.value : campoAtual.innerText) : '') || '';
                const textareaSugestao = document.getElementById('gemini-suggestion-text');
                const valSugestao = (textareaSugestao ? textareaSugestao.value : '').trim();
                if ((valAtual.trim().length > 0 && !valAtual.includes('/bt') && !valAtual.includes('/bd')) || valSugestao.length > 0) {
                    console.log(`[Extensão Softcom] Atendente iniciou digitação durante o delay de ${tempoEsperaSeg}s. Mantendo rascunho.`);
                    return;
                }

                if (conversaJaPossuiMensagensDoAtendente()) {
                    console.log(`[Extensão Softcom] Atendente já enviou mensagens durante o delay no chat #${ticketId}. Cancelando.`);
                    return;
                }

                mostrarNotificacao(`⚡ Novo chat detectado (#${ticketId})! Enviando ${textoPrefix}...`);

                // Obtém o nome do cliente e monta o texto da saudação
                const nomeCliente = obterNomeClienteParaSaudacao();
                const nomeAtendente = obterNomeTecnicoCompleto();
                let mensagemTexto = '';
                if (nomeCliente) {
                    mensagemTexto = `${textoPrefix}, ${nomeCliente}. Me chamo ${nomeAtendente}, e irei iniciar seu atendimento.`;
                } else {
                    mensagemTexto = `${textoPrefix}. Me chamo ${nomeAtendente}, e irei iniciar seu atendimento. Com quem eu falo?`;
                }

                // Insere diretamente o texto completo e exato no campo nativo mantendo foco
                colocarTextoNoCampo(mensagemTexto, true);

                // Aguarda 150ms para o React registrar o valor no estado interno
                await new Promise(r => setTimeout(r, 150));

                // Dispara o envio UMA ÚNICA VEZ
                enviarMensagemDoCampo();

                // Limpa resíduos de input nativo para não virar rascunho
                setTimeout(() => {
                    try { limparCampoNativo(); } catch (_) { }
                }, 300);

                console.log(`[Extensão Softcom] Saudação (${textoPrefix}) enviada com sucesso para o chat #${ticketId}!`);
                mostrarNotificacao(`⚡ Saudação (${textoPrefix}) enviada ao chat #${ticketId}!`, '#2ecc71');
            } catch (err) {
                console.error('[Extensão Softcom] Erro ao enviar saudação automática:', err);
            } finally {
                // Mantém o bloqueio ativo por 1.2s para garantir que não haja chamadas em rajada
                setTimeout(() => {
                    emProcessamentoSaudacao = false;
                }, 1200);
            }
        }

        // =========================================================
        // ASSISTENTE DE RESPOSTAS INTELIGENTES COM GOOGLE GEMINI & GROQ AI
        // =========================================================
        let gerandoSugestaoGemini = false;
        let enviandoMensagemNativaAgora = false;

        // Coloca o texto no campo de resposta nativo do Workdesk (execCommand + React Value Tracker + setter nativo)
        function colocarTextoNoCampo(texto, manterFocoNoCampo = false) {
            const campo = obterCampoMensagem();
            if (!campo) return;

            const textareaAtiva = document.getElementById('gemini-suggestion-text');
            const estavaFocadoNaNossaTextarea = (document.activeElement === textareaAtiva);

            // 1. Se for para manter foco no campo nativo e a nossa textarea estava focada, desfoca ela
            if (manterFocoNoCampo && estavaFocadoNaNossaTextarea && textareaAtiva) {
                try { textareaAtiva.blur(); } catch (_) { }
            }

            // 2. Garante foco e seleção no campo nativo apenas se solicitado
            if (manterFocoNoCampo) {
                try {
                    campo.focus();
                    if (campo.select) campo.select();
                } catch (_) { }
            }

            // 3. Execução de execCommand SOMENTE se o campo nativo estiver REALMENTE com foco ativo!
            // CRÍTICO: NUNCA executa execCommand se document.activeElement for a nossa textarea ou body!
            if (document.activeElement === campo) {
                try {
                    document.execCommand('selectAll', false, null);
                    document.execCommand('insertText', false, texto);
                } catch (_) { }
            }

            // 4. Setter nativo do protótipo com bypass do _valueTracker do React (garante inserção 100% confiável)
            try {
                if (campo.value !== undefined) {
                    const prototype = Object.getPrototypeOf(campo);
                    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value') ||
                        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value') ||
                        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
                    const setter = descriptor ? descriptor.set : null;
                    if (setter) {
                        setter.call(campo, texto);
                    } else {
                        campo.value = texto;
                    }

                    // Força o tracker do React a registrar diferença de valor para disparar onChange
                    const tracker = campo._valueTracker;
                    if (tracker) {
                        tracker.setValue(texto === '' ? '__softcom_force_reset__' : '');
                    }
                } else {
                    campo.innerText = texto;
                }
            } catch (_) {
                try { campo.value = texto; } catch (__) { }
            }

            // 5. Dispara todos os eventos de entrada para o React
            try {
                campo.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                campo.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                campo.dispatchEvent(new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    data: texto,
                    inputType: texto ? 'insertText' : 'deleteContentBackward'
                }));
            } catch (_) { }

            // 6. Se não for para manter o foco no campo nativo (ex: digitação do usuário ou template), devolve à textarea
            if (!manterFocoNoCampo && estavaFocadoNaNossaTextarea && textareaAtiva) {
                try { textareaAtiva.focus(); } catch (_) { }
            }
        }

        // Garante que o campo nativo contenha EXATAMENTE o texto desejado antes do envio.
        // Limpa o texto antigo (ex: sugestão anterior da IA que já estava no campo nativo), insere o novo e
        // confere o valor lido de volta, repetindo se o React/Workdesk ainda mantiver o conteúdo antigo.
        async function colocarTextoNoCampoConfirmado(texto) {
            const normalizar = (s) => (s || '').replace(/\r\n/g, '\n').trim();
            const lerCampo = () => {
                const c = obterCampoMensagem();
                if (!c) return null;
                return c.value !== undefined ? c.value : (c.innerText || c.textContent || '');
            };

            for (let tentativa = 0; tentativa < 4; tentativa++) {
                // 1. Remove completamente qualquer conteúdo antigo (sugestão anterior da IA) do campo e do estado do React
                try { limparCampoNativo(); } catch (_) { }
                await new Promise(r => setTimeout(r, 60));

                // 2. Insere o texto atual do atendente
                colocarTextoNoCampo(texto, true);
                await new Promise(r => setTimeout(r, 100));

                // 3. Confere se o campo realmente contém o texto digitado pelo atendente
                const atual = lerCampo();
                if (atual === null || normalizar(atual) === normalizar(texto)) return true;
            }
            console.warn('[Extensão Softcom] Não foi possível confirmar o texto no campo nativo antes do envio.');
            return false;
        }

        // Envia a mensagem que está atualmente no campo (botão de envio OU Enter nativo)
        function enviarMensagemDoCampo() {
            if (enviandoMensagemNativaAgora) return;

            const campo = obterCampoMensagem();
            if (!campo) return;

            enviandoMensagemNativaAgora = true;
            setTimeout(() => { enviandoMensagemNativaAgora = false; }, 600);

            // 1. Garante foco ativo no campo nativo
            try { campo.focus(); } catch (_) { }

            // 2. Procura um botão de envio legítimo prioritariamente dentro do container do footer/composer
            const footerInfo = (typeof localizarElementosFooter === 'function') ? localizarElementosFooter() : null;
            const containerComposer = (footerInfo && (footerInfo.footerRow || footerInfo.nativeBox)) || campo.closest('form') || campo.parentElement;

            let btnEnviar = null;
            if (containerComposer) {
                btnEnviar = Array.from(containerComposer.querySelectorAll(
                    'button[aria-label*="enviar" i], ' +
                    'button[title*="enviar" i], ' +
                    '[data-ui="send-button"], ' +
                    'button[class*="send" i]'
                )).find(b => {
                    if (b.closest('#gemini-docked-panel')) return false;
                    if (b.disabled) return false;
                    const t = ((b.textContent || '') + ' ' + (b.getAttribute('aria-label') || '') + ' ' + (b.getAttribute('title') || '')).toLowerCase();
                    if (t.includes('áudio') || t.includes('audio') || t.includes('anexar') || t.includes('descartar')) return false;
                    return true;
                });
            }

            if (btnEnviar) {
                try {
                    btnEnviar.click();
                    return;
                } catch (_) { }
            }

            // 3. Fallback: dispara teclado Enter nativo no campo focado apenas se nao houver botao de envio
            const enterOpts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
            campo.dispatchEvent(new KeyboardEvent('keydown', enterOpts));
            try {
                campo.dispatchEvent(new KeyboardEvent('keypress', enterOpts));
            } catch (_) { }
            campo.dispatchEvent(new KeyboardEvent('keyup', enterOpts));
        }

        function calcularMinutosDesdeHorario(horaStr) {
            if (!horaStr) return null;
            const m = horaStr.match(/\b(\d{1,2}):(\d{2})\b/);
            if (!m) return null;
            const h = parseInt(m[1], 10);
            const min = parseInt(m[2], 10);
            const agora = new Date();
            const hAgora = agora.getHours();
            const minAgora = agora.getMinutes();
            let diff = (hAgora * 60 + minAgora) - (h * 60 + min);
            if (diff < 0) diff += 24 * 60;
            return diff;
        }

        // Identifica se uma mensagem ou balão provém do Bot automático ou sistema do Workdesk
        function ehMensagemBotOuSistema(b, txt) {
            if (!txt && !b) return false;
            const t = (txt || '').toLowerCase().trim();

            // 1. Prefixos de remetente típicos de Bot / Sistema / URA / Atendente Virtual
            if (/\*(?:atendente\s*bot|bot|rob[oô]|assistente(?: virtual)?|atendente virtual|sistema|ura|triagem|auto|chatbot|softbot|softcom(?:\s*bot)?):\*/i.test(txt || '')) {
                return true;
            }
            if (/^(?:atendente\s*bot|bot|rob[oô]|assistente(?: virtual)?|atendente virtual|sistema|ura|triagem|auto|chatbot|softbot):\s*/i.test(t)) {
                return true;
            }

            // 2. Frases clássicas disparadas pelo bot de atendimento ou eventos do Workdesk
            const frasesBot = [
                'atendente bot',
                'assistente virtual',
                'mensagem automática',
                'mensagem automatica',
                'atendimento automatizado',
                'atendimento foi transferido',
                'transferindo seu atendimento',
                'transferido para a fila',
                'transferido para o setor',
                'em instantes um atendente irá',
                'em instantes um atendente ira',
                'em instantes voce sera atendido',
                'em instantes você será atendido',
                'aguarde um momento',
                'aguarde enquanto localizamos',
                'aguarde enquanto transferimos',
                'protocolo de atendimento:',
                'protocolo de atendimento',
                'seu protocolo é:',
                'seu protocolo e:',
                'para agilizar o atendimento, informe',
                'para agilizar seu atendimento',
                'selecione uma das opções',
                'selecione uma das opcoes',
                'selecione uma opção',
                'selecione uma opcao',
                'escolha uma das opções',
                'escolha uma das opcoes',
                'digite o número da opção',
                'digite o numero da opcao',
                'digite o número correspondente',
                'digite o numero correspondente',
                'você ainda precisa de ajuda?',
                'voce ainda precisa de ajuda?',
                'ainda precisa de atendimento?',
                'ainda precisa de ajuda?',
                'deseja continuar o atendimento?',
                'ainda está por aí?',
                'ainda esta por ai?',
                'permanecemos à disposição',
                'permanecemos a disposicao',
                'devido ao tempo sem resposta',
                'devido à inatividade',
                'devido a inatividade',
                'por falta de interação',
                'por falta de interacao',
                'nosso horário de atendimento é',
                'nosso horario de atendimento e',
                'fora do horário de atendimento',
                'pesquisa de satisfação',
                'avalie nosso atendimento'
            ];
            for (const frase of frasesBot) {
                if (t.includes(frase)) {
                    return true;
                }
            }

            // 3. Estrutura DOM (classes, atributos e selos de bot)
            if (b && b.nodeType === Node.ELEMENT_NODE) {
                const cls = (b.className || '').toLowerCase();
                if (/\b(bot|system|notification|automated|chat-event|system-message|message-system|ura|robot)\b/i.test(cls)) {
                    return true;
                }
                const sender = (b.getAttribute('data-sender') || b.getAttribute('data-author') || b.getAttribute('data-user-type') || '').toLowerCase();
                if (sender.includes('bot') || sender.includes('system') || sender.includes('auto')) {
                    return true;
                }
                if (b.getAttribute('data-system') === 'true' || b.getAttribute('data-bot') === 'true') {
                    return true;
                }
                const badge = b.querySelector('[class*="bot" i], [class*="badge" i], [class*="system" i]');
                if (badge) {
                    const badgeTxt = (badge.textContent || '').toLowerCase().trim();
                    if (badgeTxt === 'bot' || badgeTxt === 'robô' || badgeTxt === 'robo' || badgeTxt === 'sistema' || badgeTxt === 'auto' || badgeTxt.includes('bot')) {
                        return true;
                    }
                }
                const imgBot = b.querySelector('img[src*="bot" i], img[alt*="bot" i], [class*="avatar-bot" i]');
                if (imgBot) {
                    return true;
                }
            }

            return false;
        }

        // Extrai o histórico completo e mensagens do cliente para a IA
        function extrairHistoricoConversaParaIA() {
            const area = obterAreaConversa();
            let historico = "";
            let ultimaMensagemCliente = "";
            let primeiraMensagemCliente = "";
            let ultimaMensagemAtendente = "";
            let todasMensagensCliente = [];
            let mensagensDetalhadas = [];
            let nomeCliente = obterNomeClienteParaSaudacao() || "Cliente";
            const nomeTecnicoAtual = obterNomeTecnico();
            const nomeTecnicoCompletoAtual = obterNomeTecnicoCompleto();
            const regexPrefixoAtendente = /\*[A-Za-zÀ-ÿ0-9_.\s]+:\*/;

            if (area) {
                const blocos = Array.from(area.querySelectorAll('[class*="message" i], [class*="bubble" i], [class*="chat-item" i]'));
                const linhasHistorico = [];

                if (blocos.length > 0) {
                    blocos.forEach(b => {
                        const txt = (b.innerText || "").trim();
                        if (txt.length > 0 && !txt.includes('Digite uma resposta') && !txt.includes('Shift+Enter quebra linha')) {
                            const ehBot = ehMensagemBotOuSistema(b, txt);
                            const ehAtendente = !ehBot && (
                                (nomeTecnicoAtual && txt.toLowerCase().includes(nomeTecnicoAtual.toLowerCase())) ||
                                txt.includes('*Natha') ||
                                txt.includes('Natha Softcom') ||
                                regexPrefixoAtendente.test(txt) ||
                                txt.includes('✓✓') ||
                                b.className.includes('outgoing') ||
                                b.className.includes('right')
                            );

                            let papel = nomeCliente;
                            if (ehBot) {
                                papel = '[Sistema/Bot]';
                            } else if (ehAtendente) {
                                papel = nomeTecnicoCompletoAtual;
                            }

                            const matchHora = txt.match(/\b(\d{1,2}:\d{2})(?::\d{2})?\b/);
                            const horaStr = matchHora ? matchHora[1] : null;
                            const minutosAtras = calcularMinutosDesdeHorario(horaStr);
                            const textoLimpo = txt.replace(/^(Atendimento|\*[A-Za-zÀ-ÿ0-9_.\s]+:\*|\d{1,2}:\d{2}|✓✓|Lida)+/gm, '').trim();
                            if (textoLimpo) {
                                linhasHistorico.push(`${papel}: ${textoLimpo}`);
                                mensagensDetalhadas.push({
                                    ehAtendente,
                                    ehBot,
                                    papel,
                                    texto: textoLimpo,
                                    horaStr,
                                    minutosAtras
                                });
                                // APENAS mensagens reais do cliente humano entram na lista de mensagens do cliente
                                if (!ehAtendente && !ehBot) {
                                    todasMensagensCliente.push(textoLimpo);
                                }
                            }
                        }
                    });
                }

                if (linhasHistorico.length === 0) {
                    const linhasBrutas = (area.innerText || "").split('\n').map(l => l.trim()).filter(Boolean);
                    linhasBrutas.forEach(l => {
                        if (l.length > 2 && !l.includes('Digite uma resposta') && !l.includes('Shift+Enter') && !l.includes('Puxar próximo')) {
                            const ehBot = ehMensagemBotOuSistema(null, l);
                            if (ehBot) {
                                linhasHistorico.push(`[Sistema/Bot]: ${l}`);
                            } else {
                                linhasHistorico.push(l);
                            }
                        }
                    });
                }

                // Captura até 25 mensagens para entender o contexto histórico completo
                const ultimas = linhasHistorico.slice(-25);
                historico = ultimas.join('\n');

                if (todasMensagensCliente.length > 0) {
                    primeiraMensagemCliente = todasMensagensCliente[0];
                    ultimaMensagemCliente = todasMensagensCliente[todasMensagensCliente.length - 1];
                } else {
                    for (let i = ultimas.length - 1; i >= 0; i--) {
                        const linha = ultimas[i];
                        const ehLinhaAtendente = linha.startsWith(nomeTecnicoCompletoAtual) ||
                            (nomeTecnicoAtual && linha.startsWith(nomeTecnicoAtual)) ||
                            linha.startsWith('Natha Softcom');
                        const ehLinhaBot = linha.startsWith('[Sistema/Bot]') || linha.startsWith('Sistema:') || linha.startsWith('Bot:');
                        if (!ehLinhaAtendente && !ehLinhaBot) {
                            ultimaMensagemCliente = linha.replace(/^([^:]+:\s*)?/, '').trim();
                            break;
                        }
                    }
                }

                ultimaMensagemAtendente = "";
                for (let i = mensagensDetalhadas.length - 1; i >= 0; i--) {
                    if (mensagensDetalhadas[i].ehAtendente) {
                        ultimaMensagemAtendente = mensagensDetalhadas[i].texto;
                        break;
                    }
                }
                if (!ultimaMensagemAtendente) {
                    for (let i = ultimas.length - 1; i >= 0; i--) {
                        const ehLinhaAtendente = ultimas[i].startsWith(`${nomeTecnicoCompletoAtual}: `) ||
                            (nomeTecnicoAtual && ultimas[i].startsWith(`${nomeTecnicoAtual}: `)) ||
                            ultimas[i].startsWith('Natha Softcom: ');
                        if (ehLinhaAtendente) {
                            ultimaMensagemAtendente = ultimas[i].replace(/^[^:]+:\s*/, '').trim();
                            break;
                        }
                    }
                }

                // Captura automaticamente mensagens enviadas pelo atendente no histórico para aprendizado de estilo
                for (let i = 0; i < linhasHistorico.length; i++) {
                    const linha = linhasHistorico[i];
                    const ehLinhaAtendente = linha.startsWith(`${nomeTecnicoCompletoAtual}: `) ||
                        (nomeTecnicoAtual && linha.startsWith(`${nomeTecnicoAtual}: `)) ||
                        linha.startsWith('Natha Softcom: ');
                    if (ehLinhaAtendente) {
                        const respAtendente = linha.replace(/^[^:]+:\s*/, '').trim();
                        let ctxCliente = '';
                        if (i > 0) {
                            const linhaAnt = linhasHistorico[i - 1];
                            const ehAntAtendente = linhaAnt.startsWith(`${nomeTecnicoCompletoAtual}: `) ||
                                (nomeTecnicoAtual && linhaAnt.startsWith(`${nomeTecnicoAtual}: `)) ||
                                linhaAnt.startsWith('Natha Softcom: ');
                            const ehAntBot = linhaAnt.startsWith('[Sistema/Bot]');
                            if (!ehAntAtendente && !ehAntBot) {
                                ctxCliente = linhaAnt.replace(/^[^:]+:\s*/, '').trim();
                            }
                        }
                        if (respAtendente.length >= 10 && !respAtendente.includes('irei iniciar seu atendimento') && !respAtendente.includes('Me chamo') && !respAtendente.includes('me chamo')) {
                            salvarMensagemParaAprendizado(respAtendente, ctxCliente);
                        }
                    }
                }
            }

            return { historico, ultimaMensagemCliente, primeiraMensagemCliente, ultimaMensagemAtendente, nomeCliente, mensagensDetalhadas };
        }

        // =========================================================
        // FUNÇÕES AUXILIARES DE REGRAS, ANYDESK E FINALIZAÇÃO
        // =========================================================
        function ehMensagemComAnydesk(txt) {
            if (!txt) return false;
            const t = txt.toLowerCase().trim();
            // 1. Menção direta a AnyDesk ou acesso remoto
            if (/\b(anydesk|any desk|any|rustdesk|rust desk|teamviewer|team viewer|id de acesso|id do acesso|id do anydesk|id da m[aá]quina|id da maquina|segue o id|segue o anydesk|segue o any|meu anydesk|o anydesk [eé]|id anydesk|c[oó]digo de acesso|codigo de acesso|acesso remoto|j[aá] liberei|autorizado|autorizei|pode conectar|pode entrar|pode puxar|t[aá] na tela|ta na tela|t[aá] aberto|ta aberto|j[aá] abri|conex[aã]o remota|senha do anydesk|senha do acesso|print do any|foto do any|print do anydesk|mandei o id)\b/i.test(t)) {
                return true;
            }
            // 2. Padrão "id: 123 456 789" ou "id 987654321" ou "any: 123456789"
            if (/\b(id|any|acesso|c[oó]digo|codigo|maquina|m[aá]quina)\s*[:=-]?\s*(?:\d{1,2}[\s.-]?)?\d{3}[\s.-]?\d{3}[\s.-]?\d{3}\b/i.test(t)) {
                return true;
            }
            // 3. Sequência numérica clássica de 9 ou 10 dígitos (com ou sem espaços/pontos/hífens)
            const matchCodigos = t.match(/\b(?:\d{1,2}[\s.-]?)?\d{3}[\s.-]?\d{3}[\s.-]?\d{3}\b/);
            if (matchCodigos) {
                const apenasDigitos = matchCodigos[0].replace(/\D/g, '');
                // Não confunde com celular nacional DDD + 9 dígitos (11 dígitos)
                const ehTelefoneComDDD = /^\(?\d{2}\)?\s*9\d{4}[-\s]?\d{4}$/.test(t.replace(/\s+/g, ' '));
                if (!ehTelefoneComDDD && (apenasDigitos.length === 9 || apenasDigitos.length === 10)) {
                    return true;
                }
            }
            // 4. Sequência pura de 9 ou 10 dígitos em qualquer parte do texto
            const matchDigitos = t.match(/\b\d{9,10}\b/);
            if (matchDigitos) {
                const apenasDigitos = matchDigitos[0];
                const ehTelefone = /^\(?\d{2}\)?\s*9\d{8}$/.test(apenasDigitos);
                if (!ehTelefone && (apenasDigitos.length === 9 || apenasDigitos.length === 10)) {
                    return true;
                }
            }
            return false;
        }

        function clienteJaEnviouAnydeskNoHistorico(mensagensDetalhadas, historico) {
            if (mensagensDetalhadas && mensagensDetalhadas.length > 0) {
                for (const m of mensagensDetalhadas) {
                    if (ehMensagemComAnydesk(m.texto)) {
                        return true;
                    }
                }
            }
            if (historico) {
                const linhas = historico.split('\n');
                for (const l of linhas) {
                    if (ehMensagemComAnydesk(l)) {
                        return true;
                    }
                }
            }
            const area = obterAreaConversa();
            if (area) {
                const txtCompleto = (area.innerText || '');
                if (ehMensagemComAnydesk(txtCompleto)) {
                    return true;
                }
                const txtLower = txtCompleto.toLowerCase();
                if (/\b(anydesk|rustdesk|id de acesso|id da maquina|id da máquina|segue o id|pode conectar|pode entrar|já liberei|ja liberei|liberado|autorizado)\b/i.test(txtLower)) {
                    return true;
                }
            }
            return false;
        }

        function ehDuvidaFinal(txt) {
            if (!txt) return false;
            return /restou alguma d[uú]vida|posso (te |lhe )?(ajudar|auxiliar) (com|em) algo mais|ajudo (com|em) algo mais|precisa de mais alguma ajuda|algo mais em que posso (ajudar|auxiliar)|mais alguma d[uú]vida|poderia te auxiliar com algo mais/i.test(txt);
        }

        function atendenteJaFezDuvidaFinal(mensagensDetalhadas, historico) {
            if (mensagensDetalhadas && mensagensDetalhadas.length > 0) {
                for (const m of mensagensDetalhadas) {
                    if (m.ehAtendente && ehDuvidaFinal(m.texto)) {
                        return true;
                    }
                }
            }
            if (historico) {
                const linhas = historico.split('\n');
                for (const l of linhas) {
                    if (l.includes('Softcom') && ehDuvidaFinal(l)) {
                        return true;
                    }
                }
            }
            return false;
        }

        function ehAviso6Min(txt) {
            if (!txt) return false;
            return /aguardando seu retorno|atendimento ser[aá] encerrado automaticamente|resposta em at[eé] 6 minutos/i.test(txt);
        }

        function ehPedidoDeAguardoOuVerificacao(txt) {
            if (!txt) return false;
            const t = txt.toLowerCase().trim();
            return /\b(s[oó] um momento|s[oó] um minuto|aguarde|aguarda|aguardo|um momento|um instante|estou verificando|estou analisando|vou verificar|vou checar|estou checando|estou olhando|estou vendo|estou consultando|verificando internamente|junto com|juntamente com|com a gest[aã]o|com a equipe|com o suporte|com o financeiro|estou alinhando|estou validando|estou ajustando|j[aá] te retorno|j[aá] te respondo|j[aá] te aviso|verificando seu caso)\b/i.test(t);
        }

        function ehPerguntaOuSolicitacaoAoCliente(txt) {
            if (!txt) return false;
            const t = txt.toLowerCase().trim();
            // Se for mensagem de aguardo ou verificação interna, NÃO é pergunta ao cliente
            if (ehPedidoDeAguardoOuVerificacao(t)) return false;
            if (ehDuvidaFinal(t) || ehAviso6Min(t)) return false;
            if (t.includes('irei iniciar seu atendimento') || t.includes('me chamo')) return false;
            // Se contiver ponto de interrogação '?'
            if (txt.includes('?')) return true;
            // Se for pedido direto ao cliente de dados, print, anydesk ou ação
            return /\b(me informe|me envie|me passe|me manda|por favor me|qual o|qual a|quais|qual seu|qual sua|seu anydesk|o anydesk|o id|um print|uma foto|confirma|consegue|voc[eê] pode|teste a[ií]|testar|verifique se|me avise|me confirma|me diz|sabe me dizer|tem como|por gentileza me)\b/i.test(t);
        }

        function ehNaoDuvidas(txt) {
            if (!txt) return false;
            const t = txt.toLowerCase().trim();
            if (/\b(sim|tenho|outra|mais uma|mais um|como faz|onde|qual|ajuda|preciso|aconteceu|erro|problema|olha|veja)\b/i.test(t)) {
                return false;
            }
            return /\b(n[aã]o|s[oó] isso|apenas isso|nenhuma|sem d[uú]vidas?|tudo certo|tudo ok|tudo tranquilo|pode finalizar|pode encerrar|pode fechar|nada mais|nada n[aã]o|t[aá] resolvido|valeu|obrigad[oa]|por enquanto s[oó]|era s[oó] isso)\b/i.test(t);
        }

        function ehTemDuvidas(txt) {
            if (!txt) return false;
            return /^(sim|tenho|tenho sim|mais uma|outra d[uú]vida|uma d[uú]vida|tenho outra|preciso de mais|ainda tenho)\b/i.test(txt.trim());
        }

        function ehResolvido(txt) {
            if (!txt) return false;
            const t = txt.toLowerCase().trim();
            return /\b(deu certo|funcionou|resolveu|resolvido|t[aá] resolvido|ficou bom|consegui|imprimiu|saiu a impress[aã]o|deu tudo certo|era s[oó] isso|agora deu|agora foi|agora funcionou|perfeito obrigado|show obrigado|valeu obrigado|muito obrigad[oa])\b/i.test(t);
        }

        function ehResolvidoOuAgradecimento(txt) {
            if (!txt) return false;
            const t = txt.toLowerCase().trim();
            if (/\b(mas|por[eé]m|ainda|n[aã]o|erro|problema|falha|travou|rejei[cç]|como|onde|qual|ajuda|socorro|n[aã]o deu|n[aã]o foi|n[aã]o funcionou)\b/i.test(t)) {
                return false;
            }
            return /\b(deu certo|funcionou|resolveu|resolvido|t[aá] resolvido|ficou bom|consegui|imprimiu|saiu|deu tudo certo|era s[oó] isso|agora deu|agora foi|agora funcionou|obrigad[oa]|muito obrigad[oa]|valeu|valeu amigo|valeu parceiro|perfeito|show|show de bola|tudo certo|tudo ok|tudo tranquilo|tudo resolvido|ok obrigado|ok obrigada|pronto obrigado|beleza obrigado|obrigado pela ajuda|ajudou muito|era isso|era s[oó] essa a d[uú]vida)\b/i.test(t);
        }

        // =========================================================
        // REGRAS DE SETOR: FINALIZAÇÃO, DÚVIDA FINAL E INATIVIDADE
        // =========================================================
        async function detectarSugestaoRegrasSetor(historicoInfo) {
            if (!historicoInfo) return null;
            const { ultimaMensagemCliente, nomeCliente, mensagensDetalhadas } = historicoInfo;
            const ticketId = obterTicketChatAtivo();

            let minutosStorage = null;
            let textoStorage = '';
            if (ticketId) {
                try {
                    const res = await new Promise(r => chrome.storage.local.get(['softcom_ultimo_envio_' + ticketId], r));
                    const info = res?.['softcom_ultimo_envio_' + ticketId];
                    if (info && info.timestamp) {
                        minutosStorage = Math.floor((Date.now() - info.timestamp) / 60000);
                        textoStorage = info.texto || '';
                    }
                } catch (_) { }
            }

            let ultimaMsgGeral = null;
            let ultimaMsgAtendente = null;

            if (mensagensDetalhadas && mensagensDetalhadas.length > 0) {
                ultimaMsgGeral = mensagensDetalhadas[mensagensDetalhadas.length - 1];
                for (let i = mensagensDetalhadas.length - 1; i >= 0; i--) {
                    if (mensagensDetalhadas[i].ehAtendente) {
                        ultimaMsgAtendente = mensagensDetalhadas[i];
                        break;
                    }
                }
            }

            const minutosDOM = (ultimaMsgAtendente && ultimaMsgAtendente.minutosAtras !== null) ? ultimaMsgAtendente.minutosAtras : null;

            let minutosAtendente = null;
            if (minutosStorage !== null && minutosDOM !== null) {
                minutosAtendente = Math.min(minutosStorage, minutosDOM);
            } else if (minutosStorage !== null) {
                minutosAtendente = minutosStorage;
            } else if (minutosDOM !== null) {
                minutosAtendente = minutosDOM;
            }

            let textoUltimoEnvioAtendente = (ultimaMsgAtendente && ultimaMsgAtendente.texto) || textoStorage || '';

            const tUltimaCliente = (ultimaMensagemCliente || '').toLowerCase().trim();
            const tUltimaAtendente = (textoUltimoEnvioAtendente || '').toLowerCase().trim();
            const ultimaFoiDoAtendente = ultimaMsgGeral ? ultimaMsgGeral.ehAtendente : false;

            // REGRA 1 & 2: FLUXO DE ENCERRAMENTO E DÚVIDA FINAL
            if (ultimaFoiDoAtendente) {
                // Se a última mensagem foi o atendente perguntando de dúvida final e passaram 5 minutos sem resposta:
                if (ehDuvidaFinal(tUltimaAtendente)) {
                    if (minutosAtendente !== null && minutosAtendente >= 5) {
                        return {
                            texto: "Como não restaram mais dúvidas, estarei finalizando este atendimento. Foi um prazer lhe atender! Tenha um excelente dia!",
                            motivo: "⏱️ Cliente não respondeu em 5 min após dúvida final -> Encerramento"
                        };
                    }
                    // Enquanto aguarda os 5 min, NÃO bloqueia o envio de mensagens nem sugestões da IA
                }

                // REGRA 3: INATIVIDADE (6 MIN E 12 MIN)
                // Se já enviou o aviso de 6 min e passaram mais 6 min (total 12 min):
                if (ehAviso6Min(tUltimaAtendente)) {
                    if (minutosAtendente !== null && minutosAtendente >= 6) {
                        return {
                            texto: "Prezado(a) cliente, devido à falta de interação, este atendimento foi encerrado. Permanecemos à disposição para atendê-lo(a).",
                            motivo: "⏱️ Inatividade de 12 minutos no total -> Encerramento por falta de interação"
                        };
                    }
                    // Enquanto aguarda os 6 min (total 12 min), NÃO bloqueia o envio de mensagens nem sugestões da IA
                }

                // O SEM CONTATO SÓ É SUGERIDO SE A ÚLTIMA MENSAGEM DO ATENDENTE FOI UMA PERGUNTA OU SOLICITAÇÃO AO CLIENTE:
                if (ehPerguntaOuSolicitacaoAoCliente(tUltimaAtendente)) {
                    if (minutosAtendente !== null && minutosAtendente >= 6) {
                        return {
                            texto: "Olá, já estamos aguardando seu retorno há alguns minutos para dar continuidade ao atendimento. Se não houver resposta em até 6 minutos, este atendimento será encerrado automaticamente.",
                            motivo: "⏱️ 6 minutos sem resposta do cliente a uma pergunta -> Aviso de encerramento em 6 min"
                        };
                    }
                    // Enquanto aguarda os 6 min, NÃO bloqueia o envio de mensagens nem sugestões da IA
                }

                // Se foi pedido de aguardo ou verificação interna ("só um momento, estou verificando..."),
                // NUNCA sugere sem contato! Retorna null para a IA ler todo o contexto do chamado e sugerir pedir mais um momento / atualização
                if (ehPedidoDeAguardoOuVerificacao(tUltimaAtendente)) {
                    return null;
                }

                // Qualquer outra mensagem que não seja pergunta: não gera sem contato
                return null;
            } else {
                // Última mensagem foi do cliente!

                // CASO A: O CLIENTE INFORMOU O ANYDESK NA ÚLTIMA MENSAGEM
                if (ehMensagemComAnydesk(tUltimaCliente, tUltimaAtendente)) {
                    const saudacaoNome = nomeCliente ? `, ${nomeCliente}` : '';
                    return {
                        texto: `Certo${saudacaoNome}! Já estou me conectando ao seu AnyDesk. Por favor, autorize a solicitação de acesso que aparecerá na sua tela.`,
                        motivo: "🖥️ Cliente informou o AnyDesk -> Confirmar conexão e solicitar autorização na tela"
                    };
                }

                const jaFezDuvidaFinal = atendenteJaFezDuvidaFinal(mensagensDetalhadas, historicoInfo?.historico) || ehDuvidaFinal(tUltimaAtendente);

                // CASO B: O ATENDENTE JÁ FEZ A PERGUNTA DE DÚVIDA FINAL ANTERIORMENTE
                if (jaFezDuvidaFinal) {
                    if (ehNaoDuvidas(tUltimaCliente) || ehResolvidoOuAgradecimento(tUltimaCliente)) {
                        return {
                            texto: "Como não restaram mais dúvidas, estarei finalizando este atendimento. Foi um prazer lhe atender! Tenha um excelente dia!",
                            motivo: "✅ Dúvida final já realizada e cliente sem dúvidas -> Encerramento"
                        };
                    }
                    if (ehTemDuvidas(tUltimaCliente)) {
                        return {
                            texto: "Pode falar, como posso te ajudar?",
                            motivo: "💬 Cliente possui mais dúvidas -> Perguntar como pode ajudar"
                        };
                    }
                    // Se o cliente detalhou a dúvida diretamente, prossegue para o Gemini responder
                }

                // CASO C: O ATENDENTE AINDA NÃO FEZ A PERGUNTA DE DÚVIDA FINAL!
                // Se o cliente confirmou resolução ("deu certo", "obrigado", "valeu", "tudo certo", etc.):
                if (!jaFezDuvidaFinal && (ehResolvidoOuAgradecimento(tUltimaCliente) || ehResolvido(tUltimaCliente) || ehNaoDuvidas(tUltimaCliente))) {
                    const saudacaoNome = nomeCliente ? `, ${nomeCliente}` : '';
                    return {
                        texto: `Restou alguma dúvida em relação ao seu atendimento${saudacaoNome}? Posso te auxiliar com algo mais?`,
                        motivo: "✅ Problema resolvido/agradecimento -> Dúvida final obrigatória antes do encerramento"
                    };
                }
            }

            return null; // Prossegue normalmente para o Gemini
        }

        // =========================================================
        // APRENDIZADO CONTÍNUO DO ESTILO DE ATENDIMENTO
        // =========================================================
        const EXEMPLOS_PADRAO_ATENDIMENTO = [
            {
                cliente: "Como faço para emitir uma nota fiscal eletrônica (NF-e) no sistema?",
                resposta: "Para emitir a NF-e, basta ir no menu Vendas > Emissão de Nota Fiscal (ou Faturamento), selecionar o cliente e os itens da venda, conferir os valores e clicar em Transmitir/Emitir. Se precisar de ajuda em alguma etapa, vou te orientando por aqui!"
            },
            {
                cliente: "Como dou entrada em uma nota fiscal pelo XML?",
                resposta: "Para dar entrada na nota, acesse o menu Compras / Estoque > Entrada de Notas, clique no botão Importar XML, selecione o arquivo da nota e confirme o vínculo dos produtos. É bem rápido e prático!"
            },
            {
                cliente: "Meu AnyDesk é 123 456 789",
                resposta: "Já estou me conectando ao seu AnyDesk. Por favor, autorize a solicitação de acesso que aparecerá na sua tela."
            },
            {
                cliente: "Deu certo aqui, muito obrigado!",
                resposta: "Que ótimo que deu tudo certo! Restou alguma dúvida em relação ao seu atendimento? Posso te auxiliar com algo mais?"
            },
            {
                cliente: "Não tenho mais dúvidas, obrigado!",
                resposta: "Como não restaram mais dúvidas, estarei finalizando este atendimento. Foi um prazer lhe atender! Tenha um excelente dia!"
            },
            {
                cliente: "A impressora térmica continua cortando os cupons longos no meio ou falhando na guilhotina.",
                resposta: "Verifiquei essa questão com a nossa gestão e, como se trata de uma falha física no corte da impressora térmica, vai ser necessário que busque um técnico de T.I de sua preferência para que ele corrija esses erros no equipamento."
            },
            {
                cliente: "Como faço para cadastrar um produto novo no sistema?",
                resposta: "Para cadastrar, basta acessar o menu Cadastros > Produtos > Novo produto, preencher a descrição e o código de barras, e clicar em Gravar."
            },
            {
                cliente: "Apareceu erro na emissão da nota fiscal, rejeição 539 duplicidade.",
                resposta: "Essa rejeição indica que essa nota já foi autorizada na SEFAZ. Me envie um print da tela com o número da nota, ou se preferir me passe o AnyDesk para eu consultar diretamente no sistema."
            },
            {
                cliente: "A impressora travou e não sai nada.",
                resposta: "Verifique se a luz da impressora está verde e se o cabo está conectado. Se estiver normal, me informe o seu AnyDesk para eu testar a comunicação."
            }
        ];

        let cacheExemplosAprendidos = null;
        async function obterExemplosAprendidos() {
            if (cacheExemplosAprendidos && cacheExemplosAprendidos.length > 0) {
                return cacheExemplosAprendidos;
            }
            return new Promise((resolve) => {
                chrome.storage.local.get(['softcom_mensagens_aprendidas'], (result) => {
                    let lista = result?.softcom_mensagens_aprendidas;
                    if (!lista || !Array.isArray(lista) || lista.length === 0) {
                        lista = [...EXEMPLOS_PADRAO_ATENDIMENTO];
                        chrome.storage.local.set({ 'softcom_mensagens_aprendidas': lista });
                    }
                    cacheExemplosAprendidos = lista;
                    resolve(lista);
                });
            });
        }

        function salvarMensagemParaAprendizado(respostaAtendente, contextoCliente = '') {
            const respLimpa = (respostaAtendente || '').trim();
            if (respLimpa.length < 10) return;
            if (respLimpa.includes('irei iniciar seu atendimento') || respLimpa.includes('Me chamo') || respLimpa.includes('me chamo')) return;

            chrome.storage.local.get(['softcom_mensagens_aprendidas'], (result) => {
                let lista = result?.softcom_mensagens_aprendidas || [...EXEMPLOS_PADRAO_ATENDIMENTO];
                // Se já existir exatamente a mesma resposta, não duplica
                if (lista.some(x => x.resposta === respLimpa)) return;

                lista.push({
                    cliente: (contextoCliente || '').slice(0, 180).trim(),
                    resposta: respLimpa,
                    timestamp: Date.now()
                });

                // Mantém os 35 exemplos mais recentes
                if (lista.length > 35) {
                    lista = lista.slice(-35);
                }

                cacheExemplosAprendidos = lista;
                chrome.storage.local.set({ 'softcom_mensagens_aprendidas': lista }, () => {
                    console.log('[Extensão Softcom] Aprendizado registrado do estilo do atendente:', respLimpa.slice(0, 50));
                });
            });
        }

        // =========================================================
        // MOTOR DE APRENDIZADO ADAPTATIVO POR CORREÇÃO DE SUGESTÕES
        // =========================================================
        let cacheCorrecoesAprendidas = null;
        const sugestoesIAPorChat = new Map();

        async function obterCorrecoesAprendidas() {
            if (cacheCorrecoesAprendidas && Array.isArray(cacheCorrecoesAprendidas)) {
                return cacheCorrecoesAprendidas;
            }
            return new Promise((resolve) => {
                chrome.storage.local.get(['softcom_correcoes_ia'], (result) => {
                    const lista = result?.softcom_correcoes_ia;
                    if (Array.isArray(lista)) {
                        cacheCorrecoesAprendidas = lista;
                        resolve(lista);
                    } else {
                        cacheCorrecoesAprendidas = [];
                        resolve([]);
                    }
                });
            });
        }

        function salvarCorrecaoDeSugestaoIA(sugestaoOriginal, textoCorrigido, contextoCliente = '') {
            const origLimpa = (sugestaoOriginal || '').trim();
            const corrLimpa = (textoCorrigido || '').trim();
            const ctxLimpo = (contextoCliente || '').trim();

            if (!corrLimpa || corrLimpa.length < 5 || !origLimpa || origLimpa.length < 5) return;
            if (corrLimpa.toLowerCase() === origLimpa.toLowerCase()) return; // Idênticos sem alteração real

            chrome.storage.local.get(['softcom_correcoes_ia'], (result) => {
                let lista = result?.softcom_correcoes_ia;
                if (!Array.isArray(lista)) lista = [];

                // Evita duplicar se exatamente a mesma correção já foi gravada
                if (lista.some(c => c.correcao === corrLimpa && c.sugestaoOriginal === origLimpa)) {
                    return;
                }

                lista.push({
                    id: 'corr_' + Date.now(),
                    contextoCliente: ctxLimpo.slice(0, 200),
                    sugestaoOriginal: origLimpa.slice(0, 300),
                    correcao: corrLimpa.slice(0, 300),
                    timestamp: Date.now()
                });

                // Mantém até 40 correções mais recentes
                if (lista.length > 40) {
                    lista = lista.slice(-40);
                }

                cacheCorrecoesAprendidas = lista;
                chrome.storage.local.set({ 'softcom_correcoes_ia': lista }, () => {
                    console.log('[Extensão Softcom] 🧠 Correção aprendida do atendente:', corrLimpa.slice(0, 50));
                    mostrarNotificacao('🧠 Estilo aprendido! A IA usará sua correção como referência.', '#8b5cf6');
                });
            });
        }

        async function obterCorrecoesRelevantes(contextoTexto = '', limite = 3) {
            const todas = await obterCorrecoesAprendidas();
            if (!todas || todas.length === 0) return [];

            const textoBusca = (contextoTexto || '').toLowerCase();
            const palavrasBusca = textoBusca
                .replace(/[^\w\sáéíóúãõâêîôûç]/g, ' ')
                .split(/\s+/)
                .filter(p => p.length >= 4);

            const pontuadas = todas.map(item => {
                let score = 0;
                const textoItem = ((item.contextoCliente || '') + ' ' + (item.sugestaoOriginal || '') + ' ' + (item.correcao || '')).toLowerCase();
                palavrasBusca.forEach(p => {
                    if (textoItem.includes(p)) score += 2;
                });
                return { item, score, timestamp: item.timestamp || 0 };
            });

            pontuadas.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return b.timestamp - a.timestamp;
            });

            return pontuadas.slice(0, limite).map(p => p.item);
        }

        // =========================================================
        // BANCO DE TEMPLATES E ATALHOS RÁPIDOS (/ e #)
        // =========================================================
        const TEMPLATES_PADRAO = [
            {
                "atalho": "/aceitaconexao",
                "aliases": [
                    "/aceita",
                    "/aceitar",
                    "/aceitarconexao",
                    "/aceitarconexão",
                    "/conexaoaceita",
                    "/solicitacao"
                ],
                "titulo": "Aceitar a Conexão",
                "conteudo": "Chegou alguma solicitação de acesso? Se sim, aceita por favor.",
                "status": "Aprovado"
            },
            {
                "atalho": "/Erro337",
                "aliases": [
                    "/337",
                    "/pendencia",
                    "/bloqueado"
                ],
                "titulo": "337 - Pendência Financeira",
                "conteudo": "Verifiquei em seu cadastro que consta uma pendência financeira da sua empresa, o que causou um bloqueio automático em seu sistema. Estamos à disposição para auxiliar na regularização.",
                "status": "Aprovado"
            },
            {
                "atalho": "/anydeskinacessivel",
                "aliases": [
                    "/anyinacessivel",
                    "/anydeskindisponivel",
                    "/anydesklink",
                    "/anydeskinacessível",
                    "/anyinacessível"
                ],
                "titulo": "Anydesk Inacessível",
                "conteudo": "O seu AnyDesk está constando como inacessível no momento. Você conseguiria baixar a versão mais atualizada pelo link abaixo para prosseguirmos com o acesso? https://anydesk.com/en/downloads/thank-you?dv=win_exe",
                "status": "Aprovado"
            },
            {
                "atalho": "/anydesk",
                "aliases": [
                    "/any",
                    "/solicitaanydesk",
                    "/anyacesso"
                ],
                "titulo": "Solicitar AnyDesk",
                "conteudo": "Para que eu possa verificar diretamente no seu sistema, você poderia me informar o seu ID do AnyDesk e aceitar a solicitação de acesso, por favor?",
                "status": "Aprovado"
            },
            {
                "atalho": "/cont",
                "aliases": [
                    "#cont",
                    "/anyrapido",
                    "#anyrapido"
                ],
                "titulo": "Informar AnyDesk",
                "conteudo": "Me informa seu Anydesk, por gentileza.",
                "status": "Aprovado"
            },
            {
                "atalho": "/print",
                "aliases": [
                    "#print",
                    "/foto",
                    "#foto",
                    "/msgtela",
                    "#msgtela"
                ],
                "titulo": "Mensagem na Tela (Print/Foto)",
                "conteudo": "Está aparecendo alguma mensagem na tela? Se sim, me informe a mensagem ou mande uma foto por favor.",
                "status": "Aprovado"
            },
            {
                "atalho": "/conexao",
                "aliases": [
                    "/acesso",
                    "/acessoremoto",
                    "/remoto"
                ],
                "titulo": "Solicitar Conexão Remota",
                "conteudo": "Poderia por gentileza me fornecer o código de acesso remoto (AnyDesk ou RustDesk) para que eu possa analisar o ocorrido diretamente no seu computador?",
                "status": "Aprovado"
            },
            {
                "atalho": "/ocaberta",
                "aliases": [
                    "/ocorrencia",
                    "/oc",
                    "/ocorrenciaaberta",
                    "/oc_aberta",
                    "/oc-aberta",
                    "/ocorrência",
                    "/ocorrênciaaberta"
                ],
                "titulo": "Ocorrência Aberta",
                "conteudo": "Prontinho. A ocorrência de nº {protocolo} foi aberta e um(a) colaborador(a) entrará em contato para atender sua solicitação, está bem?\nO tempo médio de retorno para esse chamado é de 0 à XX horas.",
                "status": "Aprovado"
            },
            {
                "atalho": "/areacontador",
                "aliases": [
                    "/contador",
                    "/cadastracontador"
                ],
                "titulo": "Área do Contador",
                "conteudo": "Para realizar o cadastro do(a) contador(a) na Área Contador Softcom preciso das seguintes informações para abertura da ocorrência:\n- Nome completo:\n- E-mail:\n- Telefone/WhatsApp:",
                "status": "Aprovado"
            },
            {
                "atalho": "/atendimento",
                "aliases": [
                    "/inicio",
                    "/ajuda"
                ],
                "titulo": "Atendimento Inicial",
                "conteudo": "Olá, como posso ajudar você hoje no suporte da Softcom?",
                "status": "Aprovado"
            },
            {
                "atalho": "/bd",
                "aliases": [
                    "/bomdia"
                ],
                "titulo": "Bom dia",
                "conteudo": "Bom dia, {cliente}. Me chamo {atendente}, e irei iniciar seu atendimento.",
                "status": "Aprovado"
            },
            {
                "atalho": "/bomdia",
                "aliases": [],
                "titulo": "Bom dia",
                "conteudo": "Bom dia, {cliente}. Me chamo {atendente}, e irei iniciar seu atendimento.",
                "status": "Aprovado"
            },
            {
                "atalho": "/bt",
                "aliases": [
                    "/boatarde"
                ],
                "titulo": "Boa tarde",
                "conteudo": "Boa tarde, {cliente}. Me chamo {atendente}, e irei iniciar seu atendimento.",
                "status": "Aprovado"
            },
            {
                "atalho": "/boatarde",
                "aliases": [],
                "titulo": "Boa tarde",
                "conteudo": "Boa tarde, {cliente}. Me chamo {atendente}, e irei iniciar seu atendimento.",
                "status": "Aprovado"
            },
            {
                "atalho": "/bn",
                "aliases": [
                    "/boanoite"
                ],
                "titulo": "Boa noite",
                "conteudo": "Boa noite, {cliente}. Me chamo {atendente}, e irei iniciar seu atendimento.",
                "status": "Aprovado"
            },
            {
                "atalho": "/boanoite",
                "aliases": [],
                "titulo": "Boa noite",
                "conteudo": "Boa noite, {cliente}. Me chamo {atendente}, e irei iniciar seu atendimento.",
                "status": "Aprovado"
            },
            {
                "atalho": "/pix",
                "aliases": [
                    "/chavepix",
                    "/pagamentopix"
                ],
                "titulo": "Chave Pix Softcom",
                "conteudo": "Segue a nossa chave Pix para pagamento: financeiro@softcomtecnologia.com.br. Após efetuar o pagamento, por favor nos envie o comprovante por aqui.",
                "status": "Aprovado"
            },
            {
                "atalho": "/financeiro",
                "aliases": [
                    "/transffinanceiro",
                    "/setorfinanceiro"
                ],
                "titulo": "Transferência para o Financeiro",
                "conteudo": "Estou transferindo seu atendimento para o nosso setor Financeiro. Por favor, aguarde um instante enquanto o próximo atendente assume.",
                "status": "Aprovado"
            },
            {
                "atalho": "/transferencia",
                "aliases": [
                    "/transf",
                    "/transferir",
                    "/transfsetor"
                ],
                "titulo": "Transferência de Atendimento",
                "conteudo": "Estou transferindo o seu atendimento para o NOMEDOTÉCNICO que dará continuidade ao seu caso. Por favor, aguarde um momento enquanto o técnico assume.",
                "status": "Aprovado"
            },
            {
                "atalho": "/aguarde",
                "aliases": [
                    "/momento",
                    "/verificando"
                ],
                "titulo": "Aguarde um Momento",
                "conteudo": "Só mais um momento, por gentileza. Caso precise de algo, estou à disposição por aqui!",
                "status": "Aprovado"
            },
            {
                "atalho": "/instante",
                "aliases": [
                    "/insta",
                    "/aguarde"
                ],
                "titulo": "Aguarde um Instante",
                "conteudo": "Só mais um instante, por gentileza. Estou verificando, quualquer coisa estou à disposição por aqui!",
                "status": "Aprovado"
            },
            {
                "atalho": "/aguardemais",
                "aliases": [
                    "/aguardemaisummomento",
                    "/esperemais"
                ],
                "titulo": "Aguarde Mais um Momento",
                "conteudo": "Ainda estou verificando seu caso aqui internamente. Agradeço pela paciência e peço só mais alguns instantes, por favor!",
                "status": "Aprovado"
            },
            {
                "atalho": "/retorno",
                "aliases": [
                    "/aguardandoretorno",
                    "/aguardaretorno"
                ],
                "titulo": "Aguardando Retorno do Cliente",
                "conteudo": "Estamos no aguardo do seu retorno com as informações solicitadas para prosseguirmos com a sua tratativa. Ficamos à disposição!",
                "status": "Aprovado"
            },
            {
                "atalho": "/impressora",
                "aliases": [
                    "/spooler",
                    "/impressao",
                    "/naoimprime"
                ],
                "titulo": "Problema com Impressora / Spooler",
                "conteudo": "Poderia verificar se a impressora está ligada, conectada ao cabo e com papel? Caso esteja tudo certo, vamos reiniciar o serviço de impressão da máquina.",
                "status": "Aprovado"
            },
            {
                "atalho": "/certificado",
                "aliases": [
                    "/certificadovencido",
                    "/certificadodigital",
                    "/cert"
                ],
                "titulo": "Certificado Digital",
                "conteudo": "Identifiquei que pode haver uma inconformidade com o seu Certificado Digital (vencido ou não encontrado). Poderia verificar se o certificado modelo A1/A3 está ativo e válido na sua máquina?",
                "status": "Aprovado"
            },
            {
                "atalho": "/sefaz",
                "aliases": [
                    "/sefazfora",
                    "/instabilidadesefaz",
                    "/rejeicaosefaz"
                ],
                "titulo": "Instabilidade na SEFAZ",
                "conteudo": "Informamos que os servidores da SEFAZ (Secretaria da Fazenda) estão enfrentando uma instabilidade momentânea no momento, o que pode causar lentidão ou rejeição na emissão de notas. Recomendamos aguardar alguns instantes e tentar novamente.",
                "status": "Aprovado"
            },
            {
                "atalho": "/reiniciar",
                "aliases": [
                    "/reiniciarsistema",
                    "/reiniciapc",
                    "/fechasistema"
                ],
                "titulo": "Reiniciar Sistema / Computador",
                "conteudo": "Por favor, feche todos os módulos do sistema Softcom e reabra-os. Caso o comportamento persista, reinicie o computador para restabelecer a conexão com o banco de dados.",
                "status": "Aprovado"
            },
            {
                "atalho": "/cancelamento",
                "aliases": [
                    "/cancelanfe",
                    "/cancela",
                    "/cancelarnota"
                ],
                "titulo": "Cancelamento de Nota Fiscal",
                "conteudo": "Lembramos que o cancelamento de NF-e/NFC-e junto à SEFAZ deve respeitar o prazo legal do seu estado (normalmente 24h para NF-e ou 30 min para NFC-e), desde que a mercadoria não tenha circulado.",
                "status": "Aprovado"
            },
            {
                "atalho": "/inutilizacao",
                "aliases": [
                    "/inutilizar",
                    "/inutilizanfe",
                    "/quebrasequencia",
                    "/inutilização"
                ],
                "titulo": "Inutilização de Numeração",
                "conteudo": "A inutilização de numeração é necessária para justificar quebras de sequência que não foram utilizadas em notas fiscais autorizadas ou canceladas perante a SEFAZ.",
                "status": "Aprovado"
            },
            {
                "atalho": "/xml",
                "aliases": [
                    "/exportaxml",
                    "/enviarxml",
                    "/consultaxml"
                ],
                "titulo": "Envio / Consulta de XML",
                "conteudo": "Para localizar ou exportar os arquivos XML das notas fiscais emitidas no período, acesse o menu Fiscal > Exportação de XML ou na pasta padrão do sistema (C:\\Softcom\\XML).",
                "status": "Aprovado"
            },
            {
                "atalho": "/backup",
                "aliases": [
                    "/copiadeseguranca",
                    "/fazbackup",
                    "/copiadesegurança"
                ],
                "titulo": "Backup do Sistema",
                "conteudo": "Recomendamos que realize o backup diário do banco de dados do sistema no fechamento do expediente para garantir a segurança das informações da sua empresa.",
                "status": "Aprovado"
            },
            {
                "atalho": "/fechamento",
                "aliases": [
                    "/caixa",
                    "/fechamentocaixa",
                    "/fecharcaixa"
                ],
                "titulo": "Fechamento de Caixa",
                "conteudo": "Para realizar o fechamento do caixa, certifique-se de que todas as vendas e sangrias do dia foram lançadas. Em seguida, acesse Caixa > Fechamento de Caixa e confira os totais antes de finalizar.",
                "status": "Aprovado"
            },
            {
                "atalho": "/tef",
                "aliases": [
                    "/cartao",
                    "/maquininha",
                    "/falhatef",
                    "/cartão"
                ],
                "titulo": "Instabilidade no TEF",
                "conteudo": "Em caso de falha de comunicação com o TEF, verifique se o gerenciador padrão (PayGo, SiTef ou D-TEF) está aberto e ativo na barra de tarefas do Windows.",
                "status": "Aprovado"
            },
            {
                "atalho": "/recadastro",
                "aliases": [
                    "/atualizacadastro",
                    "/dadoscadastro"
                ],
                "titulo": "Atualização Cadastral",
                "conteudo": "Para podermos atualizar os dados cadastrais da sua empresa em nossa base, necessitamos do seu CNPJ, Razão Social, e-mail atualizado e telefone de contato com WhatsApp.",
                "status": "Aprovado"
            },
            {
                "atalho": "/duvfinal",
                "aliases": [
                    "/duvidafinal",
                    "/algo_mais",
                    "/dúvidafinal"
                ],
                "titulo": "Dúvida Final",
                "conteudo": "Além disso, poderia lhe ajudar com algo mais?",
                "status": "Aprovado"
            },
            {
                "atalho": "/semduvfinal",
                "aliases": [
                    "/finalizacao",
                    "/fimsemduvida",
                    "/finalização"
                ],
                "titulo": "Sem Dúvidas - Finalização",
                "conteudo": "Como não restaram mais dúvidas, estarei finalizando este atendimento. Foi um prazer lhe atender! Tenha um excelente dia!",
                "status": "Aprovado"
            },
            {
                "atalho": "/semcontato1",
                "aliases": [
                    "/aviso6min",
                    "/contato1"
                ],
                "titulo": "Sem Contato 1 (Aviso 6 min)",
                "conteudo": "Olá, já estamos aguardando seu retorno há alguns minutos para dar continuidade ao atendimento. Se não houver resposta em até 6 minutos, este atendimento será encerrado automaticamente.",
                "status": "Aprovado"
            },
            {
                "atalho": "/semcontato2",
                "aliases": [
                    "/encerramento12min",
                    "/contato2"
                ],
                "titulo": "Sem Contato 2 (Encerramento 12 min)",
                "conteudo": "Prezado(a) cliente, devido à falta de interação, este atendimento foi encerrado. Permanecemos à disposição para atendê-lo(a).",
                "status": "Aprovado"
            },
            {
                "atalho": "/semcontato",
                "aliases": [
                    "/falhacontato"
                ],
                "titulo": "Sem Contato",
                "conteudo": "Olá, já estamos aguardando seu retorno há alguns minutos para dar continuidade ao atendimento. Se não houver resposta em até 6 minutos, este atendimento será encerrado automaticamente.",
                "status": "Aprovado"
            },
            {
                "atalho": "/duvida",
                "aliases": [
                    "/duvidas",
                    "/dúvida",
                    "/dúvidas"
                ],
                "titulo": "Dúvidas",
                "conteudo": "Restou alguma dúvida referente a este atendimento, {cliente}?",
                "status": "Aprovado"
            },
            {
                "atalho": "/encerrar",
                "aliases": [
                    "/fim",
                    "/tchau",
                    "/encerramento"
                ],
                "titulo": "Encerramento de Atendimento",
                "conteudo": "Foi um prazer lhe atender! Se precisar de algo mais, estamos à disposição. Tenha um excelente dia!",
                "status": "Aprovado"
            },
            {
                "atalho": "/sped",
                "aliases": [
                    "/gerasped",
                    "/spedfiscal",
                    "/gerarsped"
                ],
                "titulo": "Geração do SPED Fiscal",
                "conteudo": "Já comecei a gerar o seu SPED Fiscal referente a MM/2026. A geração leva alguns minutinhos e, assim que o arquivo estiver pronto, ele será enviado para os e-mails informados. Depois, é só verificar a sua caixa de entrada.",
                "status": "Aprovado"
            },
            {
                "atalho": "/spedfinalizado",
                "aliases": [
                    "/spedpronto",
                    "/fimsped",
                    "/spedconcluido",
                    "/spedconcluído"
                ],
                "titulo": "SPED Finalizado - Playlist Tutorial",
                "conteudo": "O arquivo SPED foi deixado na Área de Trabalho. Finalizamos o atendimento referente ao SPED e, para facilitar uma futura geração dos arquivos, segue uma playlist com vídeos tutoriais rápidos que explicam de forma simples e prática como realizar todo o processo: Assista aqui: https://youtube.com/playlist?list=PLyLKY3WulhwM-zAm3A1LTXITEP6BtBVIl Até mais!",
                "status": "Aprovado"
            },
            {
                "atalho": "/mudança",
                "aliases": [
                    "/mudanca",
                    "/solicitacaomudanca",
                    "/solicitaçãomudança",
                    "/areacliente"
                ],
                "titulo": "Solicitação de Mudança no Sistema",
                "conteudo": "Olá, {cliente}. Para realizar essa alteração, é necessário abrir uma solicitação de mudança na área do cliente http://softcom.areaclientes.com.br/login, acessando com o registro XXXX e a senha é o numero do seu CNPJ. Após o login, acesse a aba \"Solicitações\" e descreva a sua solicitação de mudança no sistema. O nosso time de desenvolvimento vai avaliar, e se a alteração for possível, eles fazem em seu sistema.",
                "status": "Aprovado"
            },
            {
                "atalho": "/cnpj",
                "aliases": [
                    "/solicitacnpj",
                    "/informecnpj",
                    "/pedircnpj"
                ],
                "titulo": "Solicitar Número do CNPJ",
                "conteudo": "Para darmos continuídade com o suporte, me informa por gentileza o numero de seu CNPJ.",
                "status": "Aprovado"
            },
            {
                "atalho": "/servicos",
                "aliases": [
                    "/serviços",
                    "/servico",
                    "/serviço",
                    "/serv",
                    "/softcomshopoff",
                    "/instabilidade",
                    "/instabilidadesoftcomshop",
                    "/softcomshop",
                    "#servicos",
                    "#serviços",
                    "#servico",
                    "#serviço"
                ],
                "titulo": "Instabilidade nos Serviços do Softcomshop",
                "conteudo": "Gostaríamos de informar que, temporariamente, alguns dos serviços do Softcomshop estão passando por instabilidades técnicas. Nossa equipe técnica já está ciente da situação e trabalha com prioridade para que tudo volte à normalidade o mais breve possível.\n\nPedimos desculpas por qualquer inconveniente causado e reforçamos nosso compromisso em minimizar ao máximo qualquer impacto na sua experiência de compra.\n\nAgradecemos pela sua compreensão e paciência enquanto solucionamos esta questão.",
                "status": "Aprovado"
            }
        ];

        // Helpers para normalização de acentos e correspondência de atalhos e aliases
        function normalizarTermoBusca(str) {
            return (str || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/^[/|#]/, '')
                .trim();
        }

        function templateCorrespondeAtalho(t, q) {
            if (!t || !q) return false;
            const qNorm = normalizarTermoBusca(q);
            if (!qNorm) return false;
            const atalhoNorm = normalizarTermoBusca(t.atalho);
            if (atalhoNorm === qNorm) return true;
            if (Array.isArray(t.aliases)) {
                return t.aliases.some(a => normalizarTermoBusca(a) === qNorm);
            }
            return false;
        }

        function templateTemPrefixo(t, q) {
            if (!t || !q) return false;
            const qNorm = normalizarTermoBusca(q);
            if (!qNorm) return false;
            const atalhoNorm = normalizarTermoBusca(t.atalho);
            if (atalhoNorm.startsWith(qNorm)) return true;
            if (Array.isArray(t.aliases)) {
                return t.aliases.some(a => normalizarTermoBusca(a).startsWith(qNorm));
            }
            return false;
        }

        function templateContemTermo(t, q) {
            if (!q) return true;
            const qNorm = normalizarTermoBusca(q);
            if (!qNorm) return true;
            const atalhoNorm = normalizarTermoBusca(t.atalho);
            if (atalhoNorm.includes(qNorm)) return true;
            if (Array.isArray(t.aliases) && t.aliases.some(a => normalizarTermoBusca(a).includes(qNorm))) return true;
            const tit = normalizarTermoBusca(t.titulo);
            if (tit.includes(qNorm)) return true;
            const cont = normalizarTermoBusca(t.conteudo);
            return cont.includes(qNorm);
        }

        const VERSAO_TEMPLATES = '2.48';

        // Varre localStorage e sessionStorage do Workdesk para capturar dinamicamente quaisquer templates configurados na plataforma
        function extrairTemplatesNativosWorkdesk() {
            const extraidos = [];
            const storages = [localStorage, sessionStorage];
            storages.forEach(store => {
                try {
                    for (let i = 0; i < store.length; i++) {
                        const key = store.key(i);
                        if (!key || key.startsWith('softcom_')) continue;
                        const val = store.getItem(key);
                        if (!val || val.length < 15) continue;
                        if (!val.includes('{') && !val.includes('[')) continue;
                        try {
                            const parsed = JSON.parse(val);
                            buscarTemplatesEmObjeto(parsed, extraidos);
                        } catch (_) { }
                    }
                } catch (_) { }
            });
            return extraidos;
        }

        function buscarTemplatesEmObjeto(obj, lista, profundidade = 0) {
            if (!obj || profundidade > 4) return;
            if (Array.isArray(obj)) {
                obj.forEach(item => {
                    if (item && typeof item === 'object') {
                        const atalho = item.shortcut || item.command || item.trigger || item.atalho || item.alias || item.code || item.slug || (typeof item.name === 'string' && (item.name.startsWith('/') || item.name.startsWith('#')) ? item.name : null);
                        const conteudo = item.content || item.text || item.message || item.conteudo || item.body || item.resposta || item.template || item.description || item.value;
                        const titulo = item.title || item.name || item.titulo || item.nome || atalho;
                        if (atalho && conteudo && typeof atalho === 'string' && typeof conteudo === 'string') {
                            const atalhoNorm = atalho.startsWith('/') || atalho.startsWith('#') ? atalho : '/' + atalho;
                            if (!lista.some(x => normalizarTermoBusca(x.atalho) === normalizarTermoBusca(atalhoNorm))) {
                                lista.push({
                                    atalho: atalhoNorm,
                                    aliases: [],
                                    titulo: String(titulo || atalhoNorm),
                                    conteudo: String(conteudo),
                                    status: item.status || 'Aprovado'
                                });
                            }
                        } else {
                            buscarTemplatesEmObjeto(item, lista, profundidade + 1);
                        }
                    }
                });
            } else if (typeof obj === 'object') {
                Object.keys(obj).forEach(k => {
                    const kl = k.toLowerCase();
                    if (kl.includes('template') || kl.includes('quick') || kl.includes('canned') || kl.includes('resposta') || kl.includes('message') || kl.includes('shortcut') || kl.includes('macro') || kl.includes('alias') || profundidade < 2) {
                        buscarTemplatesEmObjeto(obj[k], lista, profundidade + 1);
                    }
                });
            }
        }

        function obterListaTemplates() {
            let lista = [...TEMPLATES_PADRAO];

            // 1. Templates personalizados salvos pelo usuário na extensão
            try {
                const versaoSalva = localStorage.getItem('softcom_templates_versao');
                if (versaoSalva !== VERSAO_TEMPLATES) {
                    localStorage.setItem('softcom_templates_versao', VERSAO_TEMPLATES);
                }

                const custom = localStorage.getItem('softcom_custom_templates');
                if (custom) {
                    const parsed = JSON.parse(custom);
                    if (Array.isArray(parsed)) {
                        parsed.forEach(p => {
                            if (!p || !p.atalho) return;
                            const idx = lista.findIndex(t => normalizarTermoBusca(t.atalho) === normalizarTermoBusca(p.atalho));
                            if (idx >= 0) {
                                lista[idx] = {
                                    ...lista[idx],
                                    ...p,
                                    aliases: Array.from(new Set([...(lista[idx].aliases || []), ...(p.aliases || [])]))
                                };
                            } else {
                                lista.push(p);
                            }
                        });
                    }
                }
            } catch (e) { }

            // 2. Templates nativos descobertos no Workdesk (localStorage / sessionStorage)
            try {
                const nativos = extrairTemplatesNativosWorkdesk();
                nativos.forEach(p => {
                    if (!p || !p.atalho) return;
                    const idx = lista.findIndex(t => normalizarTermoBusca(t.atalho) === normalizarTermoBusca(p.atalho));
                    if (idx < 0) {
                        lista.push(p);
                    }
                });
            } catch (e) { }

            return lista;
        }

        function salvarNovoTemplate(atalho, titulo, conteudo, status = 'Aprovado') {
            if (!atalho || !conteudo) return;
            try {
                const atalhoNorm = atalho.startsWith('/') ? atalho : '/' + atalho;
                const lista = obterListaTemplates();
                const idx = lista.findIndex(t => normalizarTermoBusca(t.atalho) === normalizarTermoBusca(atalhoNorm));
                if (idx >= 0) {
                    lista[idx].titulo = titulo || lista[idx].titulo;
                    lista[idx].conteudo = conteudo;
                    lista[idx].status = status || lista[idx].status;
                } else {
                    lista.push({ atalho: atalhoNorm, aliases: [], titulo: titulo || atalhoNorm, conteudo, status });
                }
                localStorage.setItem('softcom_custom_templates', JSON.stringify(lista));
            } catch (e) { }
        }


        // =========================================================
        // PAINEL DE SUGESTÃO GEMINI AI E INPUT UNIFICADO
        // =========================================================

        let imagemPendente = null;
        let imagemPreviewUrl = null;

        function definirImagemPendente(file) {
            if (!file) return;
            imagemPendente = file;

            if (imagemPreviewUrl) {
                try { URL.revokeObjectURL(imagemPreviewUrl); } catch (e) { }
            }
            imagemPreviewUrl = URL.createObjectURL(file);

            const card = document.getElementById('gemini-docked-panel');
            if (card) {
                const container = card.querySelector('#gemini-image-preview-container');
                const thumb = card.querySelector('#gemini-image-preview-thumb');
                const nameEl = card.querySelector('#gemini-image-preview-name');
                const sizeEl = card.querySelector('#gemini-image-preview-size');

                if (container && thumb && nameEl && sizeEl) {
                    thumb.src = imagemPreviewUrl;
                    nameEl.textContent = file.name || 'imagem_anexada.png';
                    const kb = (file.size / 1024).toFixed(0);
                    sizeEl.textContent = `${kb} KB · Imagem anexada (pronta para envio)`;
                    container.style.display = 'flex';
                }
            }

            atualizarEstadoCard();
            mostrarNotificacao('📷 Imagem anexada! Clique em "Enviar" ou pressione Enter para enviar ao cliente.', '#3b82f6');
        }

        function removerImagemPendente() {
            imagemPendente = null;
            if (imagemPreviewUrl) {
                try { URL.revokeObjectURL(imagemPreviewUrl); } catch (e) { }
                imagemPreviewUrl = null;
            }

            const card = document.getElementById('gemini-docked-panel');
            if (card) {
                const container = card.querySelector('#gemini-image-preview-container');
                const thumb = card.querySelector('#gemini-image-preview-thumb');
                if (container) container.style.display = 'none';
                if (thumb) thumb.src = '';
                const fileInput = card.querySelector('#gemini-file-input');
                if (fileInput) fileInput.value = '';
            }

            atualizarEstadoCard();
        }

        let origemTextoAtual = 'nenhum'; // 'nenhum' | 'usuario' | 'ia'
        let ultimoTextoGeradoPorIA = '';
        const origensTextoPorChat = new Map();

        // Limpa todos os possíveis aliases de chave do chat ativo em mapaRascunhos, origens e sugestões
        function limparTodosRascunhosDoChatAtual(textoEnviado = '') {
            const chaves = new Set();
            const chaveAtual = (typeof obterChaveIdentificadoraChatAtivo === 'function') ? obterChaveIdentificadoraChatAtivo() : null;
            if (chaveAtual) chaves.add(String(chaveAtual));
            if (ultimoTicketPainel) chaves.add(String(ultimoTicketPainel));

            const ticket = (typeof obterTicketChatAtivo === 'function') ? obterTicketChatAtivo() : null;
            if (ticket) {
                chaves.add('ticket_' + String(ticket));
                chaves.add(String(ticket));
            }

            const nome = (typeof obterNomeClienteParaSaudacao === 'function') ? obterNomeClienteParaSaudacao() : null;
            if (nome && nome.length >= 2) {
                const slug = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_');
                chaves.add('cliente_' + slug);
                chaves.add('card_' + slug);
            }

            chaves.forEach(k => {
                mapaRascunhosPorChat.delete(String(k));
                origensTextoPorChat.delete(String(k));
                if (typeof sugestoesIAPorChat !== 'undefined' && sugestoesIAPorChat.delete) {
                    sugestoesIAPorChat.delete(String(k));
                }
            });

            // Varre para remover qualquer chave remanescente que mencione o número do ticket ativo
            if (ticket) {
                const ticketStr = String(ticket);
                for (const k of Array.from(mapaRascunhosPorChat.keys())) {
                    if (k.includes(ticketStr)) {
                        mapaRascunhosPorChat.delete(k);
                        origensTextoPorChat.delete(k);
                        if (typeof sugestoesIAPorChat !== 'undefined' && sugestoesIAPorChat.delete) {
                            sugestoesIAPorChat.delete(k);
                        }
                    }
                }
                for (const k of Array.from(origensTextoPorChat.keys())) {
                    if (k.includes(ticketStr)) {
                        origensTextoPorChat.delete(k);
                    }
                }
                if (typeof sugestoesIAPorChat !== 'undefined') {
                    for (const k of Array.from(sugestoesIAPorChat.keys())) {
                        if (k.includes(ticketStr)) {
                            sugestoesIAPorChat.delete(k);
                        }
                    }
                }
            }

            // Se recebemos o texto que acabou de ser enviado, varre todos os mapas para eliminar QUALQUER rascunho
            // que tenha esse mesmo conteúdo exato (evita rascunhos zumbis sob aliases antigos)
            if (textoEnviado && typeof textoEnviado === 'string') {
                const tLimpo = textoEnviado.trim();
                if (tLimpo.length > 0) {
                    for (const [k, v] of Array.from(mapaRascunhosPorChat.entries())) {
                        if (v && v.trim() === tLimpo) {
                            mapaRascunhosPorChat.delete(k);
                            origensTextoPorChat.delete(k);
                            if (typeof sugestoesIAPorChat !== 'undefined' && sugestoesIAPorChat.delete) {
                                sugestoesIAPorChat.delete(k);
                            }
                        }
                    }
                    if (typeof sugestoesIAPorChat !== 'undefined') {
                        for (const [k, v] of Array.from(sugestoesIAPorChat.entries())) {
                            if (v && v.trim() === tLimpo) {
                                sugestoesIAPorChat.delete(k);
                                origensTextoPorChat.delete(k);
                            }
                        }
                    }
                }
            }

            persistirRascunhosSessao();
        }

        // Força a limpeza segura e total do campo de digitação nativo do Workdesk (execCommand + setter nativo + React tracker)
        function limparCampoNativo() {
            const campo = obterCampoMensagem();
            if (!campo) return;
            try {
                // ExecCommand SOMENTE se o campo nativo estiver com o foco ativo!
                if (document.activeElement === campo) {
                    try {
                        document.execCommand('selectAll', false, null);
                        document.execCommand('delete', false, null);
                    } catch (_) { }
                }

                if (campo.value !== undefined) {
                    const prototype = Object.getPrototypeOf(campo);
                    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value') ||
                        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value') ||
                        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
                    const setter = descriptor ? descriptor.set : null;
                    if (setter) setter.call(campo, '');
                    else campo.value = '';

                    const tracker = campo._valueTracker;
                    if (tracker) {
                        tracker.setValue('__softcom_clear__');
                    }
                } else {
                    campo.innerText = '';
                }

                campo.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                campo.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            } catch (_) { }
        }

        // Limpa integralmente o campo de digitação do SoftCopilot e reseta seus estados visuais
        function limparTextareaSoftCopilot(forcar = true, textoEnviado = '') {
            const textarea = document.getElementById('gemini-suggestion-text');
            if (textarea) {
                // Se não for forçado, não limpa se o usuário já tiver começado a digitar algo novo
                if (!forcar && textoEnviado && textarea.value && textarea.value.trim() !== textoEnviado.trim()) {
                    return;
                }
                textarea.value = '';
                textarea.style.height = '38px';
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
            }
            removerImagemPendente();
            origemTextoAtual = 'nenhum';
            ultimoTextoDigitadoPeloUsuario = '';
            ultimoTextoGeradoPorIA = '';
            atualizarEstadoCard(false);
            atualizarEstadoBotaoIA();
        }

        function atualizarEstadoBotaoIA() {
            const btnIA = document.getElementById('btn-sugerir-ia');
            if (!btnIA) return;
            const textarea = document.getElementById('gemini-suggestion-text');
            const texto = (textarea ? textarea.value : '').trim();

            if (gerandoSugestaoGemini) return;

            if (!texto) {
                origemTextoAtual = 'nenhum';
                btnIA.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none; flex-shrink: 0;"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3Z"/></svg><span>Sugerir com IA</span>';
                btnIA.title = 'Sugerir uma resposta automática com IA com base no contexto';
            } else if (origemTextoAtual === 'ia') {
                btnIA.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none; flex-shrink: 0;"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path></svg><span>Outra Sugestão</span>';
                btnIA.title = 'Pedir outra sugestão alternativa com IA';
            } else {
                origemTextoAtual = 'usuario';
                btnIA.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none; flex-shrink: 0;"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3Z"/></svg><span>Melhorar com IA</span>';
                btnIA.title = 'Aprimorar o texto digitado por você com IA';
            }
        }

        function atualizarEstadoCard(temTexto) {
            const card = document.getElementById('gemini-docked-panel');
            if (!card) return;
            const textarea = card.querySelector('#gemini-suggestion-text');
            const temConteudoTexto = temTexto !== undefined ? temTexto : (textarea ? textarea.value.trim().length > 0 : false);
            const temImagem = (imagemPendente !== null);
            const podeEnviar = temConteudoTexto || temImagem;

            const btnEnviar = card.querySelector('#btn-gemini-send-now');

            atualizarEstadoBotaoIA();

            if (podeEnviar) {
                if (btnEnviar) {
                    btnEnviar.style.background = 'linear-gradient(135deg, #E3B400, #f59e0b)';
                    btnEnviar.style.color = '#162227';
                    btnEnviar.style.border = 'none';
                    btnEnviar.style.opacity = '1';
                    btnEnviar.style.cursor = 'pointer';
                    btnEnviar.style.boxShadow = '0 2px 8px rgba(227, 180, 0, 0.4)';
                    btnEnviar.disabled = false;
                }
            } else {
                if (btnEnviar) {
                    btnEnviar.style.background = '#1a1b22';
                    btnEnviar.style.color = '#71717a';
                    btnEnviar.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                    btnEnviar.style.opacity = '0.9';
                    btnEnviar.style.cursor = 'not-allowed';
                    btnEnviar.style.boxShadow = 'none';
                    btnEnviar.disabled = true;
                }
            }
        }

        // Sistema de exibição do popover de templates para '/' e '#'
        function configurarSistemaTemplates(card, textarea) {
            if (!textarea || textarea.dataset.templatesConfigured === 'true') return;
            textarea.dataset.templatesConfigured = 'true';

            let popover = card.querySelector('#gemini-template-popover');
            if (!popover) {
                popover = document.createElement('div');
                popover.id = 'gemini-template-popover';
                popover.style.cssText = `
                    position: absolute;
                    bottom: calc(100% + 6px);
                    left: 0;
                    right: 0;
                    background: #18222a;
                    border: 1px solid #2d3c48;
                    border-radius: 8px;
                    box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.65), 0 4px 12px rgba(0, 0, 0, 0.5);
                    max-height: 270px;
                    overflow-y: auto;
                    box-sizing: border-box;
                    z-index: 999999;
                    display: none;
                    flex-direction: column;
                    scrollbar-width: thin;
                    scrollbar-color: #3b4e5d transparent;
                `;
                card.appendChild(popover);
            }

            let itensFiltrados = [];
            let itemSelecionadoIdx = 0;
            let ultimoTrigger = '/';

            function fecharPopover() {
                if (popover) {
                    popover.style.display = 'none';
                    popover.innerHTML = '';
                }
                itensFiltrados = [];
                itemSelecionadoIdx = 0;
            }

            function abrirPopover(trigger, query) {
                ultimoTrigger = trigger;
                const todos = obterListaTemplates();
                const q = (query || '').trim();

                itensFiltrados = todos.filter(t => templateContemTermo(t, q));

                if (itensFiltrados.length === 0) {
                    fecharPopover();
                    return;
                }

                itemSelecionadoIdx = 0;
                renderizarItens();
                popover.style.display = 'flex';
                // Garante que o foco permaneça ininterruptamente no textarea
                if (document.activeElement !== textarea) {
                    textarea.focus();
                }
            }

            function renderizarItens() {
                popover.innerHTML = '';
                itensFiltrados.forEach((item, idx) => {
                    const isSelected = idx === itemSelecionadoIdx;
                    const itemEl = document.createElement('div');
                    itemEl.className = 'gemini-template-item';
                    itemEl.dataset.idx = String(idx);
                    itemEl.style.cssText = `
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                        padding: 10px 14px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                        cursor: pointer;
                        background: ${isSelected ? 'rgba(255, 255, 255, 0.12)' : 'transparent'};
                        transition: background 0.15s ease;
                    `;

                    const displayAtalho = `${ultimoTrigger}${item.atalho.replace(/^[/|#]/, '')}`;
                    const displayTitulo = item.titulo || item.atalho.replace(/^[/|#]/, '');
                    const snippet = (item.conteudo || '').replace(/\s+/g, ' ');

                    itemEl.innerHTML = `
                        <div style="min-width: 140px; flex-shrink: 0; font-weight: 700; color: #E3B400; font-size: 13px; letter-spacing: 0.2px;">
                            ${displayAtalho}
                        </div>
                        <div style="flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px;">
                            <div style="color: #ffffff; font-weight: 700; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${displayTitulo}
                            </div>
                            <div style="color: #94a3b8; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${snippet}
                            </div>
                        </div>
                        <div style="border: 1px solid #15803d; color: #4ade80; background: rgba(34, 197, 94, 0.08); border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; flex-shrink: 0;">
                            ${item.status || 'Aprovado'}
                        </div>
                    `;

                    itemEl.addEventListener('mouseenter', () => {
                        itemSelecionadoIdx = idx;
                        atualizarDestaqueVisual(false); // apenas destaca visualmente sem rolar
                    });

                    itemEl.addEventListener('mousedown', (e) => {
                        e.preventDefault(); // Impede perda de foco do textarea ao clicar
                        inserirTemplate(item);
                    });

                    popover.appendChild(itemEl);
                });

                // Reinicia a rolagem interna do popover no topo sem rolar nenhum elemento da página
                popover.scrollTop = 0;
            }

            function atualizarDestaqueVisual(deveRolar = false) {
                const elementos = popover.querySelectorAll('.gemini-template-item');
                elementos.forEach((el, idx) => {
                    el.style.background = idx === itemSelecionadoIdx ? 'rgba(255, 255, 255, 0.12)' : 'transparent';
                });
                if (deveRolar) {
                    garantirVisibilidadeItem();
                }
            }

            function garantirVisibilidadeItem() {
                const ativo = popover.querySelector(`.gemini-template-item[data-idx="${itemSelecionadoIdx}"]`);
                if (!ativo) return;
                // Rola exclusivamente o container interno do popover através de scrollTop
                // NUNCA usar scrollIntoView(), pois ele rola a página inteira e retira o foco do textarea
                const itemTop = ativo.offsetTop;
                const itemBottom = itemTop + ativo.offsetHeight;
                const popoverScroll = popover.scrollTop;
                const popoverHeight = popover.clientHeight;

                if (itemTop < popoverScroll) {
                    popover.scrollTop = itemTop;
                } else if (itemBottom > popoverScroll + popoverHeight) {
                    popover.scrollTop = itemBottom - popoverHeight;
                }
            }

            function inserirTemplate(template) {
                const val = textarea.value;
                const cursorPos = textarea.selectionStart;
                const textBefore = val.slice(0, cursorPos);
                const textAfter = val.slice(cursorPos);

                const match = textBefore.match(/(?:^|\s)([/|#])([a-zA-Z0-9_\u00C0-\u017F-]*)$/);
                if (!match) return;

                const triggerLen = match[1].length + match[2].length;
                const startPos = cursorPos - triggerLen;

                let texto = template.conteudo;
                const nomeAtendente = obterNomeTecnicoCompleto();
                texto = texto.replace(/\{atendente\}|\{tecnico\}/gi, nomeAtendente);
                texto = texto.replace(/Natha Softcom/g, nomeAtendente);

                if (texto.includes('{cliente}') || texto.includes('{nome}') || texto.includes('NOMEDOCLIENTE')) {
                    const nome = obterNomeClienteParaSaudacao();
                    if (nome) {
                        texto = texto.replace(/\{cliente\}|\{nome\}|NOMEDOCLIENTE/gi, nome);
                    } else {
                        const norm = template.atalho.replace(/^[/|#]/, '').toLowerCase();
                        if (['bd', 'bt', 'bomdia', 'boatarde', 'bn', 'boanoite'].includes(norm)) {
                            const { textoPrefix } = obterSaudacaoPorHorario();
                            texto = `${textoPrefix}. Me chamo ${nomeAtendente}, e irei iniciar seu atendimento. Com quem eu falo?`;
                        } else {
                            texto = texto.replace(/,\s*\{cliente\}|,\s*\{nome\}|,\s*NOMEDOCLIENTE/gi, '')
                                .replace(/\{cliente\}|\{nome\}|NOMEDOCLIENTE/gi, '');
                        }
                    }
                }

                if (texto.includes('{protocolo}') || texto.includes('XXXXXX')) {
                    const ticketId = obterTicketChatAtivo() || '';
                    if (ticketId) {
                        const ticketNum = ticketId.replace(/^[^\d]*/, '').trim() || ticketId;
                        texto = texto.replace(/\{protocolo\}/gi, `#${ticketNum}`).replace(/XXXXXX/g, `#${ticketNum}`);
                    } else {
                        texto = texto.replace(/\{protocolo\}/gi, 'XXXXXX');
                    }
                }

                const novoValor = val.slice(0, startPos) + texto + textAfter;
                textarea.value = novoValor;
                const novoCursor = startPos + texto.length;

                fecharPopover();
                atualizarEstadoCard(true);
                colocarTextoNoCampo(novoValor);

                const chaveAtual = obterChaveIdentificadoraChatAtivo();
                if (chaveAtual) {
                    salvarRascunhoChat(chaveAtual, novoValor);
                }
                textarea.dispatchEvent(new Event('input', { bubbles: true }));

                // Garante que o foco e o cursor permaneçam firmemente no nosso textarea
                textarea.focus();
                textarea.setSelectionRange(novoCursor, novoCursor);
            }

            // Monitora digitação para detectar atalho iniciando com '/' ou '#'
            function checarTriggerDigita() {
                const val = textarea.value;
                const cursorPos = textarea.selectionStart;
                const textBefore = val.slice(0, cursorPos);
                const match = textBefore.match(/(?:^|\s)([/|#])([a-zA-Z0-9_\u00C0-\u017F-]*)$/);

                if (match) {
                    const trigger = match[1];
                    const query = match[2];
                    const q = (query || '').trim();

                    // Se já digitou o template completo (ex: #bt, /bt, /ocaberta, /anydeskinacessivel, etc.)
                    if (q) {
                        const todos = obterListaTemplates();
                        const templateExato = todos.find(t => templateCorrespondeAtalho(t, q));
                        if (templateExato) {
                            // Se for correspondência completa e não houver outros atalhos com mesmo prefixo, expande imediatamente
                            const temOutrosComPrefixo = todos.some(t =>
                                t !== templateExato &&
                                templateTemPrefixo(t, q)
                            );
                            if (!temOutrosComPrefixo) {
                                inserirTemplate(templateExato);
                                return;
                            }
                        }
                    }

                    abrirPopover(trigger, query);
                } else {
                    // Verifica se acabou de digitar um template seguido de espaço (ex: "/bt " ou "/anydeskinacessivel ")
                    const matchEspaco = textBefore.match(/(?:^|\s)([/|#])([a-zA-Z0-9_\u00C0-\u017F-]+)\s$/);
                    if (matchEspaco) {
                        const qEspaco = matchEspaco[2].trim();
                        const todos = obterListaTemplates();
                        const templateExato = todos.find(t => templateCorrespondeAtalho(t, qEspaco));
                        if (templateExato) {
                            const triggerLen = matchEspaco[1].length + matchEspaco[2].length + 1;
                            const startPos = cursorPos - triggerLen;
                            const textAfter = val.slice(cursorPos);

                            let texto = templateExato.conteudo;
                            const nomeAtendente = obterNomeTecnicoCompleto();
                            texto = texto.replace(/\{atendente\}|\{tecnico\}/gi, nomeAtendente);
                            texto = texto.replace(/Natha Softcom/g, nomeAtendente);

                            if (texto.includes('{cliente}') || texto.includes('{nome}') || texto.includes('NOMEDOCLIENTE')) {
                                const nome = obterNomeClienteParaSaudacao();
                                if (nome) {
                                    texto = texto.replace(/\{cliente\}|\{nome\}|NOMEDOCLIENTE/gi, nome);
                                } else {
                                    const normExato = templateExato.atalho.replace(/^[/|#]/, '').toLowerCase();
                                    if (['bd', 'bt', 'bomdia', 'boatarde', 'bn', 'boanoite'].includes(normExato)) {
                                        const { textoPrefix } = obterSaudacaoPorHorario();
                                        texto = `${textoPrefix}. Me chamo ${nomeAtendente}, e irei iniciar seu atendimento. Com quem eu falo?`;
                                    } else {
                                        texto = texto.replace(/,\s*\{cliente\}|,\s*\{nome\}|,\s*NOMEDOCLIENTE/gi, '')
                                            .replace(/\{cliente\}|\{nome\}|NOMEDOCLIENTE/gi, '');
                                    }
                                }
                            }

                            if (texto.includes('{protocolo}') || texto.includes('XXXXXX')) {
                                const ticketId = obterTicketChatAtivo() || '';
                                if (ticketId) {
                                    const ticketNum = ticketId.replace(/^[^\d]*/, '').trim() || ticketId;
                                    texto = texto.replace(/\{protocolo\}/gi, `#${ticketNum}`).replace(/XXXXXX/g, `#${ticketNum}`);
                                } else {
                                    texto = texto.replace(/\{protocolo\}/gi, 'XXXXXX');
                                }
                            }

                            const novoValor = val.slice(0, startPos) + texto + ' ' + textAfter;
                            textarea.value = novoValor;
                            const novoCursor = startPos + texto.length + 1;

                            fecharPopover();
                            atualizarEstadoCard(true);
                            colocarTextoNoCampo(novoValor);

                            textarea.focus();
                            textarea.setSelectionRange(novoCursor, novoCursor);
                            return;
                        }
                    }

                    fecharPopover();
                }
            }

            textarea.addEventListener('input', checarTriggerDigita);

            textarea.addEventListener('keydown', (e) => {
                const isOpen = popover && popover.style.display !== 'none' && itensFiltrados.length > 0;

                // Ao pressionar Espaço, verifica se é um atalho exato para expandir imediatamente
                if (e.key === ' ') {
                    const val = textarea.value;
                    const cursorPos = textarea.selectionStart;
                    const textBefore = val.slice(0, cursorPos);
                    const match = textBefore.match(/(?:^|\s)([/|#])([a-zA-Z0-9_\u00C0-\u017F-]+)$/);
                    if (match) {
                        const q = match[2].trim();
                        const todos = obterListaTemplates();
                        const templateExato = todos.find(t => templateCorrespondeAtalho(t, q));
                        if (templateExato) {
                            e.preventDefault();
                            inserirTemplate(templateExato);
                            return;
                        }
                    }
                }

                if (isOpen) {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        itemSelecionadoIdx = (itemSelecionadoIdx + 1) % itensFiltrados.length;
                        atualizarDestaqueVisual(true);
                        return;
                    }
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        itemSelecionadoIdx = (itemSelecionadoIdx - 1 + itensFiltrados.length) % itensFiltrados.length;
                        atualizarDestaqueVisual(true);
                        return;
                    }
                    if (e.key === 'Enter' || e.key === 'Tab') {
                        e.preventDefault();
                        if (itensFiltrados[itemSelecionadoIdx]) {
                            inserirTemplate(itensFiltrados[itemSelecionadoIdx]);
                        }
                        return;
                    }
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        fecharPopover();
                        return;
                    }
                }

                // Quando o popover NÃO estiver aberto: Enter envia, Shift+Enter quebra linha
                if (e.key === 'Enter') {
                    if (e.shiftKey) {
                        return; // Quebra linha
                    }
                    e.preventDefault();
                    // CRÍTICO: o card fica dentro do rodapé nativo do Workdesk. Sem isso, o Enter borbulha até o handler
                    // nativo, que envia o texto antigo (ex: sugestão da IA) guardado no estado do campo nativo.
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    const texto = textarea.value.trim();

                    // Se o layout nativo de imagem do Workdesk estiver aberto na tela, o Enter dispara o envio dele!
                    // CRÍTICO: só vale quando a caixa do SoftCopilot está VAZIA e houve um encaminhamento real de imagem.
                    // Caso contrário o detector pode achar o botão "Enviar" nativo do rodapé e enviar o texto antigo
                    // (ex: sugestão da IA) que ainda está no campo nativo, ignorando o que o atendente digitou.
                    if (!texto && !imagemPendente && layoutImagemNativoRecente()) {
                        const btnLayout = obterBotaoEnviarLayoutImagemNativo();
                        if (btnLayout) {
                            ultimoEncaminhamentoImagemTs = 0;
                            dispararCliqueCompleto(btnLayout);
                            mostrarNotificacao('⚡ Imagem enviada com sucesso ao cliente!', '#2ecc71');
                            return;
                        }
                    }

                    if (texto || imagemPendente) {
                        enviarTextoAoCliente(texto);
                    }
                }
            });

            // Bloqueia também keypress/keyup de Enter para que nenhum handler nativo do Workdesk os processe
            ['keypress', 'keyup'].forEach(tipo => {
                textarea.addEventListener(tipo, (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.stopPropagation();
                    }
                });
            });

            // Fecha popover ao clicar fora
            document.addEventListener('click', (e) => {
                if (!card.contains(e.target)) {
                    fecharPopover();
                }
            });
        }

        // Extrai arquivos de imagem colados (via clipboardData) ou arrastados (via dataTransfer)
        function extrairArquivosImagem(dados) {
            const imagens = [];
            if (!dados) return imagens;

            // 1. Verifica dados.files
            if (dados.files && dados.files.length > 0) {
                for (let i = 0; i < dados.files.length; i++) {
                    const f = dados.files[i];
                    if (f && f.type && f.type.startsWith('image/')) {
                        imagens.push(f);
                    }
                }
            }

            // 2. Se não encontrou em files, verifica dados.items (muito comum em prints do Windows/Snipping Tool)
            if (imagens.length === 0 && dados.items && dados.items.length > 0) {
                for (let i = 0; i < dados.items.length; i++) {
                    const item = dados.items[i];
                    if (item && item.type && item.type.startsWith('image/')) {
                        const file = item.getAsFile();
                        if (file) {
                            imagens.push(file);
                        }
                    }
                }
            }

            return imagens;
        }

        // Encaminha a imagem colada/arrastada diretamente para o sistema de anexo nativo do Workdesk
        function encaminharImagemAoWorkdesk(imageFiles) {
            if (!imageFiles || imageFiles.length === 0) return;

            const campo = obterCampoMensagem();
            if (!campo) {
                mostrarNotificacao('⚠️ Campo de mensagem nativo não encontrado para anexar a imagem.', '#f59e0b');
                return;
            }

            const dt = new DataTransfer();
            imageFiles.forEach(f => {
                try { dt.items.add(f); } catch (e) { }
            });

            let processou = false;

            // 1. Busca inputs nativos de arquivo (<input type="file">) no formulário do chat ou próximo ao botão Anexar
            const escopo = campo.closest('form') || campo.parentElement?.parentElement || document;
            let inputsArquivo = Array.from(escopo.querySelectorAll('input[type="file"]'));

            const btnAnexar = Array.from(document.querySelectorAll('button, [role="button"], a')).find(el => {
                if (el.closest('#gemini-docked-panel')) return false;
                const txt = (el.innerText || el.textContent || "").trim().toLowerCase();
                const aria = (el.getAttribute('aria-label') || "").toLowerCase();
                const title = (el.getAttribute('title') || "").toLowerCase();
                return txt.includes('anexar') || aria.includes('anexar') || title.includes('anexar');
            });

            if (btnAnexar) {
                const inputPerto = btnAnexar.parentElement?.querySelector('input[type="file"]') ||
                    btnAnexar.querySelector('input[type="file"]');
                if (inputPerto && !inputsArquivo.includes(inputPerto)) {
                    inputsArquivo.unshift(inputPerto);
                }
            }

            if (inputsArquivo.length === 0) {
                const todos = Array.from(document.querySelectorAll('input[type="file"]'));
                inputsArquivo = todos.filter(inp => {
                    if (inp.closest('#gemini-docked-panel')) return false;
                    const aceita = (inp.accept || '').toLowerCase();
                    return aceita.includes('image') || aceita === '*' || aceita === '' || aceita.includes('.png') || aceita.includes('.jpg');
                });
            }

            for (const input of inputsArquivo) {
                if (input.closest('#gemini-docked-panel')) continue;
                try {
                    input.files = dt.files;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    processou = true;
                    break;
                } catch (e) { }
            }

            // 2. Dispara evento sintético de Paste no campo nativo e no formulário (se input de arquivo falhar)
            if (!processou) {
                try {
                    const pasteEvt = new ClipboardEvent('paste', {
                        bubbles: true,
                        cancelable: true,
                        composed: true,
                        clipboardData: dt
                    });
                    campo.dispatchEvent(pasteEvt);
                    const form = campo.closest('form');
                    if (form && form !== campo) {
                        form.dispatchEvent(new ClipboardEvent('paste', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            clipboardData: dt
                        }));
                    }
                    processou = true;
                } catch (e) { }
            }

            // 3. Dispara evento sintético de Drop no campo nativo e no formulário (apenas se ainda não processou)
            if (!processou) {
                try {
                    const dropEvt = new DragEvent('drop', {
                        bubbles: true,
                        cancelable: true,
                        composed: true,
                        dataTransfer: dt
                    });
                    campo.dispatchEvent(dropEvt);
                    const form = campo.closest('form');
                    if (form && form !== campo) {
                        form.dispatchEvent(new DragEvent('drop', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            dataTransfer: dt
                        }));
                    }
                    processou = true;
                } catch (e) { }
            }

            if (processou) {
                aguardarEFocarLayoutImagemNativo();
            } else {
                mostrarNotificacao('⚠️ Não foi possível anexar a imagem ao chat do Workdesk.', '#f59e0b');
            }
            return processou;
        }

        // Momento do último encaminhamento real de imagem ao Workdesk (o layout de preview só pode estar aberto depois disso)
        let ultimoEncaminhamentoImagemTs = 0;
        function layoutImagemNativoRecente() {
            return ultimoEncaminhamentoImagemTs > 0 && (Date.now() - ultimoEncaminhamentoImagemTs) < 120000;
        }

        // Localiza o botão nativo de confirmação/envio do layout de preview de imagem/arquivo do Workdesk
        function obterBotaoEnviarLayoutImagemNativo() {
            // 1. Procura em modais, diálogos, overlays, drawers ou containers de preview
            const seletoresContainers = [
                '[role="dialog"]',
                '.modal',
                '.ac-modal',
                '[class*="modal" i]:not(#modal-softcom-bug):not(#modal-config-tecnico)',
                '[class*="dialog" i]',
                '[class*="overlay" i]',
                '[class*="drawer" i]',
                '[class*="preview" i]',
                '[class*="attachment" i]',
                '[class*="upload" i]',
                '[class*="media" i]',
                '.popover',
                '[class*="popover" i]'
            ];

            const containers = Array.from(document.querySelectorAll(seletoresContainers.join(', '))).filter(el => {
                if (!el || el.id?.includes('gemini') || el.id?.includes('softcom')) return false;
                if (el.offsetWidth === 0 && el.offsetHeight === 0) return false;
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

                // Deve conter um preview de imagem/mídia ou estar relacionado ao anexo recente
                const temImg = el.querySelector('img, canvas, [class*="thumb" i], [class*="preview" i], [class*="image" i]');
                const txt = (el.textContent || '').toLowerCase();
                const temTextoMidia = txt.includes('enviar') || txt.includes('imagem') || txt.includes('anexo') || txt.includes('arquivo');
                return temImg || temTextoMidia;
            });

            // 2. Inclui também o footer/composer do chat caso o layout de anexo seja uma barra ou container inline
            const footerInfo = localizarElementosFooter();
            if (footerInfo && footerInfo.footerRow) {
                const temPreviewInline = footerInfo.footerRow.querySelector('img, [class*="thumb" i], [class*="preview" i], [class*="anexo" i]');
                if (temPreviewInline) {
                    containers.push(footerInfo.footerRow);
                }
            }

            for (const c of containers) {
                const botoes = Array.from(c.querySelectorAll('button, [role="button"], input[type="submit"], a[role="button"]')).filter(b => {
                    if (!b || b.closest('#gemini-docked-panel') || b.disabled) return false;
                    if (ehBotaoDescarteOuCancelar(b) || ehBotaoMic(b) || ehBotaoAnexar(b)) return false;
                    if (b.offsetWidth === 0 && b.offsetHeight === 0) return false;
                    return true;
                });

                // Procura botão com texto de envio explícito
                const btnExplicito = botoes.find(b => {
                    const t = ((b.textContent || '') + ' ' + (b.getAttribute('aria-label') || '') + ' ' + (b.getAttribute('title') || '')).toLowerCase().trim();
                    return t === 'enviar' || t === 'enviar imagem' || t === 'enviar foto' || t === 'enviar anexo' || t === 'enviar arquivo' || t.startsWith('enviar ') || t === 'send';
                });
                if (btnExplicito) return btnExplicito;

                // Se houver uma imagem ou preview no container, aceita submit ou botão primário
                const temImg = c.querySelector('img, canvas, [class*="thumb" i], [class*="preview" i]');
                if (temImg) {
                    const btnPrimario = botoes.find(b => {
                        const cls = (b.className || '').toLowerCase();
                        return b.type === 'submit' || cls.includes('primary') || cls.includes('send') || cls.includes('confirm');
                    });
                    if (btnPrimario) return btnPrimario;
                }
            }

            // 3. Fallback no document para botão "Enviar" dentro de qualquer diálogo/modal ativo
            const todosBotoes = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"]'));
            const btnFallback = todosBotoes.find(b => {
                if (!b || b.closest('#gemini-docked-panel') || b.disabled) return false;
                if (ehBotaoDescarteOuCancelar(b) || ehBotaoMic(b) || ehBotaoAnexar(b)) return false;
                if (b.offsetWidth === 0 && b.offsetHeight === 0) return false;
                const modalPai = b.closest('[role="dialog"], [class*="modal" i], [class*="preview" i], [class*="overlay" i], [class*="drawer" i]');
                if (!modalPai || modalPai.id?.includes('softcom') || modalPai.id?.includes('gemini')) return false;
                const t = ((b.textContent || '') + ' ' + (b.getAttribute('aria-label') || '') + ' ' + (b.getAttribute('title') || '')).toLowerCase().trim();
                return t === 'enviar' || t.includes('enviar') || t === 'send';
            });

            return btnFallback || null;
        }

        // Aguarda a renderização do layout de preview nativo do Workdesk e foca o botão de envio
        function aguardarEFocarLayoutImagemNativo() {
            ultimoEncaminhamentoImagemTs = Date.now();
            let tentativas = 0;
            const intervalo = setInterval(() => {
                tentativas++;
                const btn = obterBotaoEnviarLayoutImagemNativo();
                if (btn) {
                    clearInterval(intervalo);
                    try { btn.focus(); } catch (_) { }
                    mostrarNotificacao('📷 Layout de imagem aberto! Pressione Enter para enviar.', '#3b82f6');
                } else if (tentativas >= 25) {
                    clearInterval(intervalo);
                }
            }, 100);
        }

        // Listener global de captura para interceptar o segundo Enter quando o layout de imagem estiver aberto
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                if (e.target && e.target.id === 'gemini-suggestion-text') {
                    return; // Já tratado no keydown do textarea
                }
                if (e.target && e.target.closest && e.target.closest('#modal-softcom-bug, #modal-config-tecnico')) {
                    return;
                }

                if (!layoutImagemNativoRecente()) return;
                const btnLayout = obterBotaoEnviarLayoutImagemNativo();
                if (btnLayout) {
                    e.preventDefault();
                    e.stopPropagation();
                    ultimoEncaminhamentoImagemTs = 0;
                    dispararCliqueCompleto(btnLayout);
                    mostrarNotificacao('⚡ Imagem enviada com sucesso ao cliente!', '#2ecc71');
                }
            }
        }, true);

        // =========================================================
        // CONTROLE DE GRAVAÇÃO E SALVAMENTO DE ÁUDIO
        // =========================================================
        let gravandoAudioAtivo = false;
        let tempoGravacaoSegundos = 0;
        let intervaloTempoGravacao = null;
        let bloquearCliqueAudioAte = 0;

        function formatarTempoGravacao(segundos) {
            const m = Math.floor(segundos / 60);
            const s = segundos % 60;
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }

        function iniciarGravacaoAudioUI() {
            if (gravandoAudioAtivo) return;
            gravandoAudioAtivo = true;
            tempoGravacaoSegundos = 0;

            atualizarVisualBotaoAudio(true);

            if (intervaloTempoGravacao) clearInterval(intervaloTempoGravacao);
            intervaloTempoGravacao = setInterval(() => {
                tempoGravacaoSegundos++;
                atualizarVisualBotaoAudio(true);
            }, 1000);
        }

        function finalizarGravacaoAudioUI() {
            gravandoAudioAtivo = false;
            tempoGravacaoSegundos = 0;
            if (intervaloTempoGravacao) {
                clearInterval(intervaloTempoGravacao);
                intervaloTempoGravacao = null;
            }
            atualizarVisualBotaoAudio(false);
        }

        function atualizarVisualBotaoAudio(estaGravando) {
            const btnAudio = document.getElementById('btn-gemini-record-audio');
            const btnCancel = document.getElementById('btn-gemini-cancel-audio');
            const card = document.getElementById('gemini-docked-panel');

            if (!btnAudio) return;

            if (estaGravando) {
                const tempoFmt = formatarTempoGravacao(tempoGravacaoSegundos);
                btnAudio.innerHTML = `<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#fff; animation:geminiPulseRec 1s infinite alternate; margin-right:3px;"></span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M20 6L9 17l-5-5"></path></svg><span style="font-size:10px; font-weight:700; margin-left:3px;">${tempoFmt}</span>`;
                btnAudio.title = 'Concluir e salvar gravação de áudio';
                btnAudio.style.setProperty('width', 'auto', 'important');
                btnAudio.style.setProperty('min-width', '64px', 'important');
                btnAudio.style.setProperty('max-width', 'none', 'important');
                btnAudio.style.setProperty('height', '30px', 'important');
                btnAudio.style.setProperty('min-height', '30px', 'important');
                btnAudio.style.setProperty('max-height', '30px', 'important');
                btnAudio.style.setProperty('aspect-ratio', 'auto', 'important');
                btnAudio.style.setProperty('flex', 'none', 'important');
                btnAudio.style.setProperty('padding', '0 8px', 'important');
                btnAudio.style.setProperty('background', '#dc2626', 'important');
                btnAudio.style.setProperty('color', '#ffffff', 'important');
                btnAudio.style.setProperty('border', '1px solid #ef4444', 'important');
                btnAudio.style.setProperty('animation', 'geminiGlowRec 1.5s infinite', 'important');

                btnAudio.classList.add('recording');

                if (btnCancel) {
                    btnCancel.classList.add('recording-active');
                    btnCancel.style.setProperty('display', 'inline-flex', 'important');
                }
                if (card) {
                    card.style.borderColor = '#ef4444';
                }
            } else {
                btnAudio.classList.remove('recording');
                btnAudio.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;
                btnAudio.title = 'Gravar áudio';
                btnAudio.style.setProperty('width', '30px', 'important');
                btnAudio.style.setProperty('height', '30px', 'important');
                btnAudio.style.setProperty('min-width', '30px', 'important');
                btnAudio.style.setProperty('max-width', '30px', 'important');
                btnAudio.style.setProperty('min-height', '30px', 'important');
                btnAudio.style.setProperty('max-height', '30px', 'important');
                btnAudio.style.setProperty('aspect-ratio', '1 / 1', 'important');
                btnAudio.style.setProperty('flex', '0 0 30px', 'important');
                btnAudio.style.setProperty('padding', '0', 'important');
                btnAudio.style.setProperty('background', '#1e293b', 'important');
                btnAudio.style.setProperty('color', '#cbd5e1', 'important');
                btnAudio.style.setProperty('border', '1px solid #334155', 'important');
                btnAudio.style.setProperty('animation', 'none', 'important');

                if (btnCancel) {
                    btnCancel.classList.remove('recording-active');
                    btnCancel.style.setProperty('display', 'none', 'important');
                }
                if (card) {
                    card.style.borderColor = '#E3B400';
                }
            }
        }

        function dispararCliqueCompleto(el) {
            if (!el) return;
            try {
                // Se o elemento estiver com display: none por estarmos ocultando botões duplicados,
                // torna-o temporariamente presente para que eventos sintéticos de clique funcionem perfeitamente
                const estavaOculto = el.dataset.softcomHiddenDuplicate === 'true' || el.style.display === 'none';
                if (estavaOculto) {
                    el.style.setProperty('display', 'inline-flex', 'important');
                    el.style.setProperty('opacity', '0', 'important');
                    el.style.setProperty('position', 'fixed', 'important');
                    el.style.setProperty('top', '0', 'important');
                    el.style.setProperty('left', '0', 'important');
                    el.style.setProperty('pointer-events', 'auto', 'important');
                }

                // Se algum ancestral estiver com pointer-events: none temporário, libera para o clique
                let p = el;
                const restaurar = [];
                while (p && p !== document.body) {
                    if (p.style && p.style.pointerEvents === 'none') {
                        p.style.pointerEvents = 'auto';
                        restaurar.push(p);
                    }
                    p = p.parentElement;
                }

                const evtOpts = { bubbles: true, cancelable: true, composed: true, view: window };
                el.dispatchEvent(new PointerEvent('pointerdown', evtOpts));
                el.dispatchEvent(new MouseEvent('mousedown', evtOpts));
                el.dispatchEvent(new PointerEvent('pointerup', evtOpts));
                el.dispatchEvent(new MouseEvent('mouseup', evtOpts));
                el.click();

                if (restaurar.length > 0) {
                    setTimeout(() => {
                        restaurar.forEach(node => {
                            if (node && node.dataset && node.dataset.softcomHiddenNative === 'true') {
                                node.style.setProperty('pointer-events', 'none', 'important');
                            }
                        });
                    }, 80);
                }

                if (estavaOculto) {
                    setTimeout(() => {
                        try {
                            el.style.removeProperty('display');
                            el.style.removeProperty('opacity');
                            el.style.removeProperty('position');
                            el.style.removeProperty('top');
                            el.style.removeProperty('left');
                            el.style.removeProperty('pointer-events');
                        } catch (_) { }
                    }, 80);
                }
            } catch (_) {
                try { el.click(); } catch (e) { }
            }
        }

        function ehBotaoDescarteOuCancelar(b) {
            if (!b || b.closest('#gemini-docked-panel')) return false;

            // PROTEÇÃO CRÍTICA: Nunca toca em elementos fora do escopo de áudio/footer
            // Impede terminantemente o fechamento do menu lateral direito, gavetas, inspetor, tabs e modais de cliente
            if (b.closest('aside, [class*="inspector" i], [class*="clientPanel" i], [class*="sidePanel" i], [class*="sidebar" i]:not([class*="chatList"]), [role="tabpanel"], [class*="drawer" i], header, nav, [class*="navbar" i], [class*="appHeader" i], [class*="topbar" i]')) {
                return false;
            }

            const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
            const aria = (b.getAttribute('aria-label') || '').toLowerCase();
            const title = (b.getAttribute('title') || '').toLowerCase();
            const cls = (typeof b.className === 'string' ? b.className : '').toLowerCase();

            // Protege botões do cabeçalho do chat como 'Encerrar chat', transferir, etc. NUNCA são descarte de áudio
            const textoCompleto = (txt + ' ' + aria + ' ' + title).toLowerCase();
            if (textoCompleto.includes('encerrar') || textoCompleto.includes('finalizar') || textoCompleto.includes('concluir') || textoCompleto.includes('transferir')) {
                return false;
            }
            if (b.closest('[class*="chatHeader" i], [class*="conversationHeader" i], [class*="subHeader" i], [class*="header" i], [class*="top" i]')) {
                return false;
            }

            // 1. Textos e atributos explícitos de cancelamento / descarte
            const palavrasChave = [
                'descartar', 'cancelar', 'excluir', 'apagar', 'remover',
                'discard', 'cancel', 'delete', 'trash', 'lixeira'
            ];
            for (const kw of palavrasChave) {
                if (txt === kw || txt.includes(kw) ||
                    aria === kw || aria.includes(kw) ||
                    title === kw || title.includes(kw) ||
                    cls.includes(kw)) {
                    return true;
                }
            }

            // 2. Detecção de ícone SVG (Lixeira ou X / Fechar)
            const svgs = b.tagName.toLowerCase() === 'svg' ? [b] : Array.from(b.querySelectorAll('svg'));
            for (const svg of svgs) {
                const sHtml = svg.innerHTML || '';
                // Feather / Lucide trash icon (pontos "3 6", caminhos "19 6", etc.)
                if (sHtml.includes('3 6') || sHtml.includes('19 6') || sHtml.includes('M19 6') || sHtml.includes('M3 6') ||
                    sHtml.includes('trash') || sHtml.includes('delete') || sHtml.includes('lixeira')) {
                    return true;
                }
                // Feather / Lucide X / close icon
                if (sHtml.includes('x1="18"') || sHtml.includes('x1="6"') || sHtml.includes('M18 6') || sHtml.includes('M6 18') ||
                    sHtml.includes('times') || sHtml.includes('close')) {
                    return true;
                }
            }

            return false;
        }

        function ehBotaoPararOuSalvar(b) {
            if (!b || b.closest('#gemini-docked-panel')) return false;
            const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
            const aria = (b.getAttribute('aria-label') || '').toLowerCase();
            const title = (b.getAttribute('title') || '').toLowerCase();
            const cls = (typeof b.className === 'string' ? b.className : '').toLowerCase();

            const palavrasChave = [
                'parar', 'salvar', 'concluir', 'finalizar', 'stop', 'done',
                'transcrever', 'parar gravação', 'concluir gravação', 'finalizar gravação'
            ];
            for (const kw of palavrasChave) {
                if (txt === kw || txt.includes(kw) ||
                    aria === kw || aria.includes(kw) ||
                    title === kw || title.includes(kw) ||
                    cls.includes(kw)) {
                    return true;
                }
            }

            // SVG de Checkmark, Stop Square ou Transcrição
            const svgs = b.tagName.toLowerCase() === 'svg' ? [b] : Array.from(b.querySelectorAll('svg'));
            for (const svg of svgs) {
                const sHtml = svg.innerHTML || '';
                if (sHtml.includes('20 6') || sHtml.includes('rect') || sHtml.includes('check') || sHtml.includes('stop')) {
                    return true;
                }
            }

            return false;
        }

        function ehBotaoMic(b) {
            if (!b || b.closest('#gemini-docked-panel')) return false;
            const txt = (b.innerText || b.textContent || '').toLowerCase().trim();
            const aria = (b.getAttribute('aria-label') || '').toLowerCase();
            const title = (b.getAttribute('title') || '').toLowerCase();
            const cls = (typeof b.className === 'string' ? b.className : '').toLowerCase();

            // Ignora botões de envio ou cancelamento
            if (txt.includes('enviar') || aria.includes('enviar') || title.includes('enviar')) return false;
            if (txt.includes('cancelar') || aria.includes('cancelar') || title.includes('cancelar')) return false;
            if (txt.includes('descartar') || aria.includes('descartar') || title.includes('descartar')) return false;

            const palavrasMic = ['áudio', 'audio', 'gravar', 'gravação', 'gravacao', 'microfone', 'mic', 'voz'];
            for (const kw of palavrasMic) {
                if (txt === kw || txt.includes(kw) ||
                    aria === kw || aria.includes(kw) ||
                    title === kw || title.includes(kw) ||
                    cls.includes(kw)) {
                    return true;
                }
            }

            // Heurística de SVG de microfone (Feather, Lucide, FontAwesome, etc.)
            const svgs = b.tagName.toLowerCase() === 'svg' ? [b] : Array.from(b.querySelectorAll('svg'));
            for (const svg of svgs) {
                const sHtml = svg.innerHTML || '';
                if (sHtml.includes('data-icon="mic"') || sHtml.includes('class="mic') ||
                    sHtml.includes('M12 1') || sHtml.includes('M12 2') || sHtml.includes('19 10') ||
                    sHtml.includes('12 1a3') || sHtml.includes('12 14a3') || sHtml.includes('mic')) {
                    return true;
                }
            }
            return false;
        }

        function ehBotaoAnexar(b) {
            if (!b || b.closest('#gemini-docked-panel')) return false;
            const txt = (b.innerText || b.textContent || '').toLowerCase().trim();
            const aria = (b.getAttribute('aria-label') || '').toLowerCase();
            const title = (b.getAttribute('title') || '').toLowerCase();
            const cls = (typeof b.className === 'string' ? b.className : '').toLowerCase();

            if (txt.includes('enviar') || aria.includes('enviar') || title.includes('enviar')) return false;
            if (txt.includes('cancelar') || aria.includes('cancelar') || title.includes('cancelar')) return false;

            const palavrasAnexo = ['anexar', 'anexo', 'arquivo', 'attach', 'attachment', 'clip', 'clipe', 'upload'];
            for (const kw of palavrasAnexo) {
                if (txt === kw || txt.includes(kw) ||
                    aria === kw || aria.includes(kw) ||
                    title === kw || title.includes(kw) ||
                    cls.includes(kw)) {
                    return true;
                }
            }

            const svgs = b.tagName.toLowerCase() === 'svg' ? [b] : Array.from(b.querySelectorAll('svg'));
            for (const svg of svgs) {
                const sHtml = svg.innerHTML || '';
                if (sHtml.includes('paperclip') || sHtml.includes('clip') || sHtml.includes('attachment') ||
                    sHtml.includes('21.44 11.05') || sHtml.includes('M21.44') || sHtml.includes('m21.44') ||
                    sHtml.includes('M16.5 6') || sHtml.includes('M19.8 11.2')) {
                    return true;
                }
            }
            return false;
        }

        // Localiza a caixa de citação / contexto de resposta nativa ("Respondendo a...")
        function localizarBannerRespostaNativo() {
            const candidatos = Array.from(document.querySelectorAll('div, section, header, [class*="reply" i], [class*="quote" i]'));
            for (const el of candidatos) {
                if (el.id === 'gemini-docked-panel' || el.closest('#gemini-docked-panel')) continue;
                if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;

                const txt = (el.innerText || '').trim();
                if (/respondendo\s+a\b/i.test(txt) || /replying\s+to\b/i.test(txt)) {
                    if (el.offsetHeight <= 140) {
                        return el;
                    }
                }
            }

            const porClasse = document.querySelector('[class*="replyingBanner" i], [class*="reply-banner" i], [class*="replyBanner" i], [class*="quotedMessage" i], [class*="replyBox" i]');
            if (porClasse && !porClasse.closest('#gemini-docked-panel') && porClasse.offsetHeight <= 140) {
                return porClasse;
            }

            return null;
        }

        // Garante que o banner "Respondendo a..." nativo do Workdesk fique perfeitamente visível e estilizado
        // NUNCA move o banner no DOM com insertBefore/appendChild (evita NotFoundError e quebra da Fiber do React)
        function sincronizarBannerResposta(card) {
            const banner = localizarBannerRespostaNativo();
            if (!banner) return;

            banner.dataset.softcomReplyingBanner = 'true';
            banner.style.setProperty('display', 'flex', 'important');
            banner.style.setProperty('visibility', 'visible', 'important');
            banner.style.setProperty('opacity', '1', 'important');
            banner.style.setProperty('pointer-events', 'auto', 'important');
            banner.style.setProperty('width', '100%', 'important');
            banner.style.setProperty('max-width', '100%', 'important');
            banner.style.setProperty('box-sizing', 'border-box', 'important');
            banner.style.setProperty('position', 'relative', 'important');
            banner.style.setProperty('z-index', '10', 'important');

            // Se algum elemento pai do banner foi ocultado como wrapper de input nativo, restaura a visibilidade do container
            let cur = banner.parentElement;
            while (cur && cur !== document.body && cur !== document.documentElement && cur !== card) {
                if (cur.dataset && cur.dataset.softcomHiddenNative === 'true') {
                    delete cur.dataset.softcomHiddenNative;
                    cur.style.removeProperty('position');
                    cur.style.removeProperty('opacity');
                    cur.style.removeProperty('pointer-events');
                    cur.style.removeProperty('width');
                    cur.style.removeProperty('height');
                    cur.style.removeProperty('overflow');
                    cur.style.removeProperty('clip');
                    cur.style.removeProperty('z-index');

                    // Oculta exclusivamente o campo de texto/textarea interno
                    const campoInterno = cur.querySelector('textarea, input, [contenteditable="true"]');
                    if (campoInterno && campoInterno !== banner && !banner.contains(campoInterno)) {
                        ocultarElementoIndividual(campoInterno);
                    }
                }
                cur = cur.parentElement;
            }
        }

        // Oculta botões nativos duplicados (Áudio e Anexar) abaixo ou ao lado da caixa do SoftCopilot
        function ocultarBotoesNativosDuplicados() {
            const footerInfo = localizarElementosFooter();
            const escopo = (footerInfo && footerInfo.footerRow) || document.querySelector('form') || document.body;

            const botoes = Array.from(escopo.querySelectorAll('button, [role="button"], a[role="button"]'));
            botoes.forEach(b => {
                if (b.closest('#gemini-docked-panel')) return;

                if (ehBotaoMic(b) || ehBotaoAnexar(b)) {
                    b.dataset.softcomHiddenDuplicate = 'true';

                    // Oculta também o container wrapper se contiver apenas botões duplicados
                    const parent = b.parentElement;
                    if (parent && parent !== escopo && parent !== document.body && !parent.closest('#gemini-docked-panel')) {
                        const filhosBotoes = Array.from(parent.querySelectorAll('button, [role="button"], a[role="button"]'));
                        const todosOcultos = filhosBotoes.every(f => f.dataset.softcomHiddenDuplicate === 'true');
                        if (todosOcultos && parent.offsetHeight <= 140) {
                            parent.dataset.softcomHiddenContainer = 'true';
                        }
                    }
                }
            });
        }

        function localizarBotaoMicNativo() {
            const footerInfo = localizarElementosFooter();
            const containerBusca = (footerInfo && footerInfo.footerRow) || document.querySelector('form') || document;
            let btn = Array.from(containerBusca.querySelectorAll('button, [role="button"], a[role="button"]')).find(ehBotaoMic);
            if (btn) return btn;

            // Procura também na linha lateral do footer
            if (footerInfo && footerInfo.footerRow) {
                const btnLateral = localizarBotaoLateralFooter(footerInfo.footerRow);
                if (btnLateral && ehBotaoMic(btnLateral)) return btnLateral;
            }

            // Fallback global no document
            if (containerBusca !== document) {
                btn = Array.from(document.querySelectorAll('button, [role="button"], a[role="button"]')).find(ehBotaoMic);
            }
            return btn || null;
        }

        // Descarta qualquer gravação pendente ou cancela preview residual de áudio no Workdesk
        function descartarQualquerAudioPendente() {
            let clicou = false;

            // 1. Se houver card nativo de áudio (preview / gravação salva), clica nos botões internos
            const cardAudio = obterCardAudioNativo();
            if (cardAudio) {
                const botoesCard = Array.from(cardAudio.querySelectorAll('button, [role="button"], svg, span, a'));
                for (const b of botoesCard) {
                    if (ehBotaoDescarteOuCancelar(b)) {
                        try {
                            dispararCliqueCompleto(b);
                            clicou = true;
                        } catch (_) { }
                    }
                }
            }

            // 2. Busca apenas dentro do footer / linha de composer do chat ativo (nunca em menus laterais)
            const footerInfo = localizarElementosFooter();
            const containerBusca = (footerInfo && footerInfo.footerRow) || document.querySelector('form');
            if (containerBusca) {
                const candidatos = Array.from(containerBusca.querySelectorAll(
                    'button, [role="button"], a[role="button"], [class*="rec"] button, [class*="audio"] button'
                ));
                for (const b of candidatos) {
                    if (ehBotaoDescarteOuCancelar(b)) {
                        try {
                            dispararCliqueCompleto(b);
                            clicou = true;
                        } catch (_) { }
                    }
                }
            }

            // 3. Procura por modais/overlays nativos estritamente dedicados à gravação de voz
            const recScreens = Array.from(document.querySelectorAll('.nc-rec-screen, [class*="rec-screen"], [class*="audio-recorder"]'));
            for (const sc of recScreens) {
                if (sc.closest('aside, [class*="inspector" i], [class*="sidePanel" i], [class*="clientPanel" i]')) continue;
                const btns = Array.from(sc.querySelectorAll('button, [role="button"]'));
                for (const b of btns) {
                    if (ehBotaoDescarteOuCancelar(b)) {
                        try {
                            dispararCliqueCompleto(b);
                            clicou = true;
                        } catch (_) { }
                    }
                }
            }

            return clicou;
        }

        function salvarGravacaoAudioNativa() {
            bloquearCliqueAudioAte = Date.now() + 600;

            const footerInfo = localizarElementosFooter();
            const containerBusca = (footerInfo && footerInfo.footerRow) || document.querySelector('form') || document;

            let btnSalvar = Array.from(containerBusca.querySelectorAll('button, [role="button"]')).find(ehBotaoPararOuSalvar);

            if (!btnSalvar) {
                btnSalvar = Array.from(document.querySelectorAll('button, [role="button"]')).find(ehBotaoPararOuSalvar);
            }

            if (!btnSalvar) {
                btnSalvar = localizarBotaoMicNativo();
            }

            if (btnSalvar) {
                dispararCliqueCompleto(btnSalvar);
            }
            finalizarGravacaoAudioUI();
            mostrarNotificacao('⏳ Gravação finalizada!', '#3b82f6');
        }

        function cancelarGravacaoAudioNativa(silencioso = false) {
            bloquearCliqueAudioAte = Date.now() + 600;

            // 1. Dispara Escape SOMENTE em elementos estritamente dedicados à gravação de áudio
            // (NUNCA em window ou document para não fechar gavetas ou menu lateral direito)
            try {
                const recTargets = Array.from(document.querySelectorAll('.nc-rec-screen, [class*="rec-screen"], form [class*="rec"]'));
                recTargets.forEach(tgt => {
                    if (!tgt || tgt.closest('aside, [class*="sidePanel" i], [class*="inspector" i], [class*="clientPanel" i]')) return;
                    try {
                        tgt.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true }));
                        tgt.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true }));
                    } catch (_) { }
                });
            } catch (_) { }

            // 2. Busca e clica em qualquer botão de descarte/cancelar ativo no escopo do áudio
            let cancelou = descartarQualquerAudioPendente();

            // 3. Procura botão de cancelar / lixeira no chat / footer
            if (!cancelou) {
                const footerInfo = localizarElementosFooter();
                const containerBusca = (footerInfo && footerInfo.footerRow) || document.querySelector('form');
                if (containerBusca) {
                    const botoes = Array.from(containerBusca.querySelectorAll('button, [role="button"], svg, div[tabindex]'));
                    const btnCancelar = botoes.find(ehBotaoDescarteOuCancelar);
                    if (btnCancelar) {
                        dispararCliqueCompleto(btnCancelar);
                        cancelou = true;
                    }
                }
            }

            // 4. FALLBACK CRÍTICO (Stop-and-Discard no footer):
            if (!cancelou) {
                const footerInfo = localizarElementosFooter();
                const containerBusca = (footerInfo && footerInfo.footerRow) || document.querySelector('form');
                if (containerBusca) {
                    const botoes = Array.from(containerBusca.querySelectorAll('button, [role="button"]'));
                    const btnParar = botoes.find(ehBotaoPararOuSalvar);
                    if (btnParar) {
                        dispararCliqueCompleto(btnParar);
                        cancelou = true;
                    }
                }
            }

            // 5. Descarte escalonado restrito ao footer
            [40, 120, 300, 600].forEach(ms => {
                setTimeout(descartarQualquerAudioPendente, ms);
            });

            // 6. Restaura layout e finaliza a UI da extensão
            restaurarLayoutModoAudio();
            finalizarGravacaoAudioUI();

            if (!silencioso) {
                mostrarNotificacao('Gravação de áudio cancelada.', '#64748b');
            }
        }

        function configurarEventosCard(card) {
            const textarea = card.querySelector('#gemini-suggestion-text');
            const btnSugerir = card.querySelector('#btn-sugerir-ia');
            const btnEnviar = card.querySelector('#btn-gemini-send-now');
            const btnClear = card.querySelector('#btn-gemini-clear-text');
            const btnConfigTecnico = card.querySelector('#btn-config-tecnico');
            const badgeNomeTecnico = card.querySelector('#badge-nome-tecnico');

            const dispararModalConfig = (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                // Se o popup de novidades estiver visível, leva o usuário direto às novas configurações da IA
                const veioDasNovidades = fecharPopupNovidadesConfig();
                abrirModalConfigTecnico(false, veioDasNovidades ? 'ia' : 'geral');
            };

            if (btnConfigTecnico) {
                btnConfigTecnico.onclick = dispararModalConfig;
                btnConfigTecnico.onmouseover = () => {
                    btnConfigTecnico.style.color = '#E3B400';
                    btnConfigTecnico.style.background = 'rgba(227, 180, 0, 0.18)';
                };
                btnConfigTecnico.onmouseout = () => {
                    btnConfigTecnico.style.color = '#94a3b8';
                    btnConfigTecnico.style.background = 'transparent';
                };
            }

            if (badgeNomeTecnico) {
                badgeNomeTecnico.onclick = dispararModalConfig;
                badgeNomeTecnico.onmouseover = () => {
                    badgeNomeTecnico.style.borderColor = '#E3B400';
                    badgeNomeTecnico.style.background = 'rgba(227, 180, 0, 0.22)';
                };
                badgeNomeTecnico.onmouseout = () => {
                    badgeNomeTecnico.style.borderColor = 'rgba(227, 180, 0, 0.35)';
                    badgeNomeTecnico.style.background = 'rgba(227, 180, 0, 0.12)';
                };
            }

            const badgeUpdate = card.querySelector('#badge-update-disponivel');
            if (badgeUpdate) {
                badgeUpdate.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const v = versaoMaisRecenteDetectada || chrome.runtime.getManifest()?.version || '2.59';
                    exibirNotificacaoAtualizacaoDisponivel(v, true);
                };
            }

            // Configura o sistema de templates (/ e #)
            configurarSistemaTemplates(card, textarea);

            if (textarea) {
                textarea.addEventListener('input', () => {
                    textarea.style.height = 'auto';
                    textarea.style.height = Math.min(120, Math.max(38, textarea.scrollHeight)) + 'px';
                    const val = textarea.value.trim();
                    if (!val) {
                        origemTextoAtual = 'nenhum';
                    } else if (val === ultimoTextoGeradoPorIA) {
                        origemTextoAtual = 'ia';
                    } else {
                        origemTextoAtual = 'usuario';
                        ultimoTextoDigitadoPeloUsuario = val;
                    }
                    atualizarEstadoBotaoIA();
                    atualizarEstadoCard(val.length > 0);
                    if (envioMensagemEmAndamento) return;
                    const chaveAtual = obterChaveIdentificadoraChatAtivo();
                    if (chaveAtual) {
                        salvarRascunhoChat(chaveAtual, textarea.value);
                    }
                });

                textarea.addEventListener('keyup', () => {
                    if (envioMensagemEmAndamento) return;
                    const chaveAtual = obterChaveIdentificadoraChatAtivo();
                    if (chaveAtual) {
                        salvarRascunhoChat(chaveAtual, textarea.value);
                    }
                });

                textarea.addEventListener('focus', () => {
                    textarea.style.borderColor = '#E3B400';
                });
                textarea.addEventListener('blur', () => {
                    textarea.style.borderColor = '#27272a';
                    if (envioMensagemEmAndamento) return;
                    const chaveAtual = obterChaveIdentificadoraChatAtivo();
                    if (chaveAtual) {
                        salvarRascunhoChat(chaveAtual, textarea.value);
                    }
                });

                // Suporte para colar imagens diretamente no campo (Ctrl + V / PrintScreen)
                textarea.addEventListener('paste', (e) => {
                    const clipboardData = e.clipboardData || window.clipboardData;
                    if (!clipboardData) return;

                    const imageFiles = extrairArquivosImagem(clipboardData);
                    if (imageFiles.length > 0) {
                        e.preventDefault();
                        definirImagemPendente(imageFiles[0]);
                    }
                });

                // Suporte para arrastar e soltar imagens no campo
                textarea.addEventListener('dragover', (e) => {
                    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                        textarea.style.borderColor = '#3b82f6';
                    }
                });

                textarea.addEventListener('dragleave', () => {
                    textarea.style.borderColor = '#27272a';
                });

                textarea.addEventListener('drop', (e) => {
                    textarea.style.borderColor = '#27272a';
                    const dt = e.dataTransfer;
                    if (!dt) return;
                    const imageFiles = extrairArquivosImagem(dt);
                    if (imageFiles.length > 0) {
                        e.preventDefault();
                        definirImagemPendente(imageFiles[0]);
                    }
                });
            }

            // Botão de remover imagem anexada
            const btnRemoveImage = card.querySelector('#btn-gemini-remove-image');
            if (btnRemoveImage) {
                btnRemoveImage.onclick = (e) => {
                    e.preventDefault();
                    removerImagemPendente();
                    mostrarNotificacao('Imagem removida do anexo.', '#64748b');
                };
            }

            // Botão de anexar imagem do computador
            const btnAttach = card.querySelector('#btn-gemini-attach-image');
            const fileInput = card.querySelector('#gemini-file-input');
            if (btnAttach && fileInput) {
                btnAttach.onclick = () => fileInput.click();
                fileInput.onchange = () => {
                    if (fileInput.files && fileInput.files.length > 0) {
                        definirImagemPendente(fileInput.files[0]);
                    }
                };
            }

            // Botão de gravar / salvar áudio nativo
            const btnAudio = card.querySelector('#btn-gemini-record-audio');
            if (btnAudio) {
                btnAudio.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (Date.now() < bloquearCliqueAudioAte) return;

                    if (gravandoAudioAtivo) {
                        salvarGravacaoAudioNativa();
                    } else {
                        bloquearCliqueAudioAte = Date.now() + 600;

                        let btnMic = localizarBotaoMicNativo();
                        if (btnMic) {
                            dispararCliqueCompleto(btnMic);
                            iniciarGravacaoAudioUI();
                        } else {
                            // Só se não encontrou de imediato tenta limpar preview residual no footer
                            descartarQualquerAudioPendente();
                            await new Promise(r => setTimeout(r, 120));
                            btnMic = localizarBotaoMicNativo();
                            if (btnMic) {
                                dispararCliqueCompleto(btnMic);
                                iniciarGravacaoAudioUI();
                            } else {
                                finalizarGravacaoAudioUI();
                                mostrarNotificacao('⚠️ Botão de gravação de áudio nativo não encontrado. Verifique se o chat está ativo.', '#f59e0b');
                            }
                        }
                    }
                };
            }

            // Botão de cancelar gravação de áudio
            const btnCancelAudio = card.querySelector('#btn-gemini-cancel-audio');
            if (btnCancelAudio) {
                btnCancelAudio.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    cancelarGravacaoAudioNativa();
                };
            }

            if (btnClear) {
                btnClear.onclick = () => {
                    limparTodosRascunhosDoChatAtual();
                    limparTextareaSoftCopilot();
                    limparCampoNativo();
                };
                btnClear.onmouseover = () => {
                    btnClear.style.color = '#ef4444';
                    btnClear.style.background = 'rgba(239, 68, 68, 0.15)';
                };
                btnClear.onmouseout = () => {
                    btnClear.style.color = '#94a3b8';
                    btnClear.style.background = 'transparent';
                };
            }

            if (btnSugerir) {
                btnSugerir.onclick = () => {
                    if (origemTextoAtual === 'ia') {
                        solicitarSugestaoGemini('Por favor, sugira uma resposta alternativa com outra abordagem ou palavras, mantendo o tom profissional e direto.');
                    } else {
                        solicitarSugestaoGemini();
                    }
                };
                btnSugerir.onmouseover = () => {
                    btnSugerir.style.background = 'linear-gradient(135deg, #312e81, #4338ca)';
                    btnSugerir.style.borderColor = '#818cf8';
                    btnSugerir.style.transform = 'translateY(-1px)';
                };
                btnSugerir.onmouseout = () => {
                    btnSugerir.style.background = 'linear-gradient(135deg, #1e1b4b, #312e81)';
                    btnSugerir.style.borderColor = '#6366f1';
                    btnSugerir.style.transform = 'translateY(0)';
                };
            }

            if (btnEnviar) {
                btnEnviar.onmousedown = (e) => {
                    // Evita perder foco prematuramente ou disparar blur antes do click
                    if (e && e.preventDefault) e.preventDefault();
                };
                btnEnviar.onmouseover = () => {
                    if (!btnEnviar.disabled) {
                        btnEnviar.style.background = '#ffd000';
                        btnEnviar.style.transform = 'translateY(-1px)';
                    }
                };
                btnEnviar.onmouseout = () => {
                    if (!btnEnviar.disabled) {
                        btnEnviar.style.background = 'linear-gradient(135deg, #E3B400, #f59e0b)';
                    } else {
                        btnEnviar.style.background = '#1a1b22';
                    }
                    btnEnviar.style.transform = 'translateY(0)';
                };
                btnEnviar.onclick = () => {
                    const texto = (textarea ? textarea.value : '').trim();
                    if (!texto && !imagemPendente) {
                        mostrarNotificacao('⚠️ Digite uma mensagem ou anexe uma imagem para enviar.', '#f59e0b');
                        return;
                    }
                    enviarTextoAoCliente(texto);
                };
            }

            atualizarEstadoCard(textarea ? textarea.value.trim().length > 0 : false);
        }

        let enviandoMensagemAoCliente = false;

        async function enviarTextoAoCliente(texto) {
            if (enviandoMensagemAoCliente) return;
            enviandoMensagemAoCliente = true;
            envioMensagemEmAndamento = true;

            const imgParaEnviar = imagemPendente;
            const textoParaEnviar = (texto || '').trim();
            const temTexto = (textoParaEnviar.length > 0);
            const temImg = !!imgParaEnviar;

            // Registra para proteção anti-ressurreição de rascunhos nos próximos 10 segundos
            if (temTexto) {
                ultimoTextoEnviadoRecente = {
                    texto: textoParaEnviar,
                    timestamp: Date.now()
                };
            }

            try {
                // Se houver qualquer gravação de áudio ativa ou preview nativo pendente, finaliza e descarta para liberar o chat
                if (gravandoAudioAtivo) {
                    finalizarGravacaoAudioUI();
                }
                descartarQualquerAudioPendente();

                if (!temTexto && !temImg) {
                    mostrarNotificacao('⚠️ Digite uma mensagem ou anexe uma imagem para enviar.', '#f59e0b');
                    return;
                }

                // Limpa todos os rascunhos e a textarea imediatamente para feedback visual instantâneo
                limparTodosRascunhosDoChatAtual(textoParaEnviar);
                limparTextareaSoftCopilot(true, textoParaEnviar);

                // Registra para aprendizado de estilo da IA e rastreio de inatividade (SOP 6 min / 12 min)
                if (temTexto) {
                    const chaveAtual = (typeof obterChaveIdentificadoraChatAtivo === 'function') ? obterChaveIdentificadoraChatAtivo() : null;
                    try {
                        const { ultimaMensagemCliente } = extrairHistoricoConversaParaIA();
                        // 1. Aprendizado geral do estilo do atendente
                        salvarMensagemParaAprendizado(textoParaEnviar, ultimaMensagemCliente);

                        // 2. Aprendizado adaptativo quando o atendente corrigiu a sugestão gerada pela IA
                        const sugestaoIAAtiva = (sugestoesIAPorChat.get(chaveAtual) || ultimoTextoGeradoPorIA || '').trim();
                        if (sugestaoIAAtiva && (textoParaEnviar !== sugestaoIAAtiva) && obterAprendizadoCorrecoesHabilitado()) {
                            salvarCorrecaoDeSugestaoIA(sugestaoIAAtiva, textoParaEnviar, ultimaMensagemCliente);
                        }
                    } catch (_) { }

                    if (chaveAtual) {
                        sugestoesIAPorChat.delete(chaveAtual);
                        origensTextoPorChat.delete(chaveAtual);
                    }
                    ultimoTextoGeradoPorIA = '';
                    origemTextoAtual = 'nenhum';

                    try {
                        const ticketId = obterTicketChatAtivo();
                        if (ticketId) {
                            chrome.storage.local.set({
                                ['softcom_ultimo_envio_' + ticketId]: {
                                    timestamp: Date.now(),
                                    texto: textoParaEnviar
                                }
                            });
                        }
                    } catch (_) { }
                }

                if (temTexto && temImg) {
                    // 1. Envia a mensagem de texto PRIMEIRO enquanto o chat nativo está 100% livre e desbloqueado
                    await colocarTextoNoCampoConfirmado(textoParaEnviar);
                    await new Promise(r => setTimeout(r, 50));
                    enviarMensagemDoCampo();

                    // 2. Aguarda a mensagem de texto ser processada e o campo ser liberado pelo Workdesk
                    for (let i = 0; i < 6; i++) {
                        await new Promise(r => setTimeout(r, 150));
                        const campoAtual = obterCampoMensagem();
                        if (!campoAtual || !campoAtual.value || campoAtual.value.trim().length === 0) {
                            break;
                        }
                    }
                    await new Promise(r => setTimeout(r, 150));

                    // 3. Em seguida, anexa e encaminha a imagem para o Workdesk
                    encaminharImagemAoWorkdesk([imgParaEnviar]);

                    mostrarNotificacao('⚡ Mensagem e imagem enviadas com sucesso ao cliente!', '#2ecc71');
                } else if (temTexto) {
                    await colocarTextoNoCampoConfirmado(textoParaEnviar);
                    await new Promise(r => setTimeout(r, 50));
                    enviarMensagemDoCampo();
                    mostrarNotificacao('⚡ Mensagem enviada com sucesso ao cliente!', '#2ecc71');
                } else if (temImg) {
                    encaminharImagemAoWorkdesk([imgParaEnviar]);
                    mostrarNotificacao('⚡ Imagem enviada com sucesso ao cliente!', '#2ecc71');
                }

                // Ciclos de verificação e limpeza garantida (limpa resíduos de input nativo e rascunhos)
                for (let i = 0; i < 3; i++) {
                    await new Promise(r => setTimeout(r, 120));
                    limparCampoNativo();
                    limparTextareaSoftCopilot(true, textoParaEnviar);
                    limparTodosRascunhosDoChatAtual(textoParaEnviar);
                }
            } catch (err) {
                console.error('[Extensão Softcom] Erro ao enviar mensagem/imagem:', err);
                mostrarNotificacao('⚠️ Erro ao enviar mensagem/imagem.', '#ef4444');
            } finally {
                enviandoMensagemAoCliente = false;
                setTimeout(() => {
                    envioMensagemEmAndamento = false;
                    limparCampoNativo();
                    limparTextareaSoftCopilot(true, textoParaEnviar);
                    limparTodosRascunhosDoChatAtual(textoParaEnviar);
                }, 400);
            }
        }

        // Detecta o bloco COMPLETO nativo de áudio gravado (Gravação salva + Player <audio> + Descartar + Enviar áudio)
        function obterCardAudioNativo() {
            const footerInfo = localizarElementosFooter();
            const composerContainer = (footerInfo && (footerInfo.footerRow || footerInfo.nativeBox)) || document.querySelector('form');
            if (!composerContainer) return null;

            // Busca EXCLUSIVAMENTE dentro do container do footer/composer (NUNCA no histórico/mensagens do chat)
            const audioEl = composerContainer.querySelector('audio');
            const botoes = Array.from(composerContainer.querySelectorAll('button, [role="button"]')).filter(b => !b.closest('#gemini-docked-panel'));
            const btnEnviarAudio = botoes.find(b => {
                const txt = (b.textContent || '').trim().toLowerCase();
                return txt === 'enviar áudio' || txt === 'enviar audio';
            });

            // Se não existe tag <audio> nem botão com texto explícito "Enviar áudio" NO COMPOSER, NÃO estamos no modo preview de áudio
            if (!audioEl && !btnEnviarAudio) return null;

            let ref = audioEl || btnEnviarAudio;
            let cur = ref;
            let containerCompleto = null;

            // Sobe procurando o container que engloba TANTO o player/áudio/texto QUANTO as ações sem sair do composer
            for (let nivel = 0; nivel < 8 && cur && cur !== document.body && cur.tagName !== 'FORM' && cur !== composerContainer.parentElement; nivel++) {
                const txt = (cur.textContent || '').toLowerCase();
                const temAudioOuTexto = cur.querySelector('audio') || txt.includes('gravação salva') || txt.includes('gravacao salva') || txt.includes('escute antes');
                const temAcoes = (txt.includes('descartar') || txt.includes('cancelar')) && (txt.includes('enviar áudio') || txt.includes('enviar audio'));

                if (temAudioOuTexto && temAcoes) {
                    containerCompleto = cur;
                    break;
                }
                cur = cur.parentElement;
            }

            if (containerCompleto) return containerCompleto;

            // Fallback caso estejam em estrutura plana dentro do composer
            cur = ref;
            for (let nivel = 0; nivel < 5 && cur && cur.parentElement && cur.parentElement !== document.body && cur.parentElement.tagName !== 'FORM' && cur !== composerContainer.parentElement; nivel++) {
                const txt = (cur.textContent || '').toLowerCase();
                if ((txt.includes('gravação salva') || txt.includes('gravacao salva')) && (txt.includes('enviar áudio') || txt.includes('enviar audio')) && (txt.includes('descartar') || txt.includes('cancelar'))) {
                    if (cur.offsetHeight > 40 && cur.offsetHeight < 500) {
                        return cur;
                    }
                }
                cur = cur.parentElement;
            }

            return null; // NUNCA retornar nó aleatório se não for comprovadamente o card de áudio!
        }

        // Localiza os elementos estruturais do footer (o box nativo do input e o container/linha)
        function localizarElementosFooter() {
            const campo = obterCampoMensagem();
            if (!campo) return null;

            // 1. Identifica o nativeBox: o container imediato ou ancestral mais próximo que envolve o campo
            // e a dica "Enter envia" (ou o wrapper do input), tendo altura condizente de input (<= 350px)
            let nativeBox = null;
            let cur = campo.parentElement;
            while (cur && cur !== document.body) {
                const temDica = cur.textContent && cur.textContent.includes('Enter envia');
                if (temDica && cur.offsetHeight <= 350) {
                    nativeBox = cur;
                    break;
                }
                cur = cur.parentElement;
            }
            if (!nativeBox) {
                nativeBox = campo.parentElement;
                while (nativeBox && nativeBox.parentElement &&
                    nativeBox.parentElement !== document.body &&
                    nativeBox.parentElement.offsetHeight <= 180) {
                    nativeBox = nativeBox.parentElement;
                }
            }

            if (!nativeBox || nativeBox === document.body) return null;

            const parent = nativeBox.parentElement;
            if (!parent || parent === document.body) return null;

            // 2. Determina se existe uma linha horizontal com botões laterais (Layout A: input + botões Áudio/Anexar à direita)
            // No Layout A, parent é uma DIV baixa (altura <= 220px) contendo nativeBox E outro elemento com botões.
            let temRowLateral = false;
            let footerRow = parent;

            if (parent.offsetHeight <= 220) {
                const temIrmaoComBotoes = Array.from(parent.children).some(ch => {
                    if (ch === nativeBox || ch.id === 'gemini-docked-panel') return false;
                    const txt = (ch.innerText || ch.textContent || '').toLowerCase();
                    const aria = (ch.getAttribute('aria-label') || '').toLowerCase();
                    const title = (ch.getAttribute('title') || '').toLowerCase();
                    return txt.includes('áudio') || txt.includes('audio') || txt.includes('anexar') ||
                        aria.includes('áudio') || aria.includes('audio') || aria.includes('anexar') ||
                        title.includes('áudio') || title.includes('audio') || title.includes('anexar');
                });
                if (temIrmaoComBotoes) {
                    temRowLateral = true;
                }
            }

            return { campo, nativeBox, footerRow, temRowLateral };
        }

        // Oculta o input nativo com segurança absoluta, preservando o layout
        function ocultarNativeBox(nativeBox, footerRow) {
            if (!nativeBox) return;
            if (nativeBox === footerRow) return;
            if (nativeBox === document.body || nativeBox === document.documentElement) return;
            if (nativeBox.id === 'gemini-docked-panel') return;
            if (nativeBox.contains(document.getElementById('gemini-docked-panel'))) return;

            // Se o nativeBox contiver o banner de resposta nativo ("Respondendo a..."), NÃO oculta o container inteiro!
            const banner = localizarBannerRespostaNativo();
            if (banner && nativeBox.contains(banner)) {
                // Em vez disso, oculta apenas o campo de digitação interno
                const campo = obterCampoMensagem();
                if (campo && campo !== banner && !banner.contains(campo)) {
                    ocultarElementoIndividual(campo);
                }
                return;
            }

            ocultarElementoIndividual(nativeBox);
        }

        function ocultarElementoIndividual(el) {
            if (!el) return;
            el.dataset.softcomHiddenNative = 'true';
            el.style.setProperty('position', 'absolute', 'important');
            el.style.setProperty('opacity', '0', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
            el.style.setProperty('width', '1px', 'important');
            el.style.setProperty('height', '1px', 'important');
            el.style.setProperty('overflow', 'hidden', 'important');
            el.style.setProperty('clip', 'rect(0, 0, 0, 0)', 'important');
            el.style.setProperty('z-index', '-9999', 'important');
        }

        function desocultarElementoIndividual(el) {
            if (!el) return;
            delete el.dataset.softcomHiddenNative;
            el.style.removeProperty('position');
            el.style.removeProperty('opacity');
            el.style.removeProperty('pointer-events');
            el.style.removeProperty('width');
            el.style.removeProperty('height');
            el.style.removeProperty('overflow');
            el.style.removeProperty('clip');
            el.style.removeProperty('z-index');
        }

        // Cria o elemento visual do card WorkDesk AI 2.0
        function criarElementoPainelGemini() {
            if (!document.getElementById('gemini-audio-pulse-style')) {
                const s = document.createElement('style');
                s.id = 'gemini-audio-pulse-style';
                s.textContent = `
                    @keyframes geminiPulseRec {
                        0% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(0.75); opacity: 0.35; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    @keyframes geminiGlowRec {
                        0% { box-shadow: 0 0 4px rgba(239, 68, 68, 0.4); }
                        50% { box-shadow: 0 0 12px rgba(239, 68, 68, 0.85); }
                        100% { box-shadow: 0 0 4px rgba(239, 68, 68, 0.4); }
                    }
                    /* Ocultação de botões nativos duplicados (Áudio e Anexar) */
                    [data-softcom-hidden-duplicate="true"],
                    [data-softcom-hidden-container="true"] {
                        display: none !important;
                    }
                    /* Estilização harmonizada para o banner Respondendo a... */
                    [data-softcom-replying-banner="true"] {
                        border-radius: 6px !important;
                    }

                    /* Estilização harmonizada para o modal de áudio gravado (Gravação salva) */
                    [data-softcom-audio-preview="true"] {
                        width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                        background: #162227 !important;
                        border: 1px solid rgba(227, 180, 0, 0.45) !important;
                        border-radius: 8px !important;
                        padding: 12px 16px !important;
                        margin-bottom: 8px !important;
                        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35) !important;
                    }
                    [data-softcom-audio-preview="true"] audio {
                        width: 100% !important;
                        max-width: 100% !important;
                        outline: none !important;
                    }

                    /* Força botões de ícone do SoftCopilot a serem rigorosamente QUADRADOS (evita distorções herdadas do Workdesk) */
                    #gemini-docked-panel button {
                        box-sizing: border-box !important;
                    }
                    #gemini-docked-panel .gemini-btn-icon-square {
                        width: 30px !important;
                        height: 30px !important;
                        min-width: 30px !important;
                        max-width: 30px !important;
                        min-height: 30px !important;
                        max-height: 30px !important;
                        aspect-ratio: 1 / 1 !important;
                        flex: 0 0 30px !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        align-items: center !important;
                        justify-content: center !important;
                        border-radius: 6px !important;
                    }
                    #gemini-docked-panel .gemini-btn-icon-square:not(#btn-gemini-cancel-audio) {
                        display: inline-flex !important;
                    }
                    /* Botão de cancelar áudio: NUNCA aparece na abertura da página, somente durante gravação */
                    #gemini-docked-panel #btn-gemini-cancel-audio {
                        display: none !important;
                    }
                    #gemini-docked-panel #btn-gemini-cancel-audio.recording-active {
                        display: inline-flex !important;
                    }
                    #gemini-docked-panel .gemini-btn-icon-square svg {
                        flex-shrink: 0 !important;
                    }
                    #gemini-docked-panel #btn-gemini-record-audio.recording {
                        width: auto !important;
                        min-width: 64px !important;
                        max-width: none !important;
                        aspect-ratio: auto !important;
                        flex: none !important;
                        padding: 0 8px !important;
                    }
                `;
                document.head.appendChild(s);
            }

            const card = document.createElement('div');
            card.id = 'gemini-docked-panel';
            card.style.cssText = `
                flex: 1 1 auto;
                width: 0;
                min-width: 0;
                box-sizing: border-box;
                margin: 0;
                background: #162227;
                border: 1px solid #E3B400;
                border-radius: 6px;
                padding: 6px 10px;
                color: #ffffff;
                font-family: inherit;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
                display: flex;
                flex-direction: column;
                position: relative;
                overflow: visible !important;
                transition: border-color 0.2s ease;
            `;

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 3px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 13px;">✨</span>
                        <span style="font-size: 11.5px; font-weight: 700; color: #E3B400; letter-spacing: 0.2px;">SoftCopilot</span>
                        <div id="badge-nome-tecnico" title="Atendente configurado (clique para alterar)" style="
                            background: rgba(227, 180, 0, 0.12);
                            border: 1px solid rgba(227, 180, 0, 0.35);
                            color: #fce79a;
                            border-radius: 8px;
                            padding: 1px 6px;
                            font-size: 10px;
                            font-weight: 500;
                            display: inline-flex;
                            align-items: center;
                            gap: 3px;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        ">
                            <span style="font-size: 10px;">👤</span>
                            <span id="label-nome-tecnico">${obterNomeTecnicoCompleto()}</span>
                        </div>
                        <div id="badge-update-disponivel" style="
                            display: none;
                            background: rgba(59, 130, 246, 0.25);
                            border: 1px solid rgba(59, 130, 246, 0.6);
                            color: #93c5fd;
                            border-radius: 8px;
                            padding: 1px 6px;
                            font-size: 10px;
                            font-weight: 600;
                            align-items: center;
                            gap: 3px;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        " title="Nova versão disponível! Clique para ver como atualizar.">
                            <span>🚀</span>
                            <span id="label-update-versao">Nova Versão</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 2px;">
                        <!-- Ícone de engrenagem: Configurações do Nome Softcom e Chaves de API -->
                        <button id="btn-config-tecnico" type="button" title="Configurações (Nome Softcom, Saudação e Chaves de API)" style="
                            background: transparent;
                            border: none;
                            color: #94a3b8;
                            cursor: pointer;
                            padding: 2px 4px;
                            border-radius: 4px;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s ease;
                        ">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                        </button>
                        <!-- Ícone de lixeira: Limpar mensagem -->
                        <button id="btn-gemini-clear-text" type="button" title="Limpar mensagem" style="
                            background: transparent;
                            border: none;
                            color: #94a3b8;
                            cursor: pointer;
                            padding: 2px 4px;
                            border-radius: 4px;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s ease;
                        ">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div style="margin-bottom: 5px; position: relative;">
                    <textarea id="gemini-suggestion-text" placeholder="Digite uma mensagem ou clique em 'Sugerir com IA'... (/ ou # para templates)" style="
                        width: 100%;
                        box-sizing: border-box;
                        min-height: 38px;
                        max-height: 120px;
                        background: #1B292E;
                        color: #f4f4f5;
                        border: 1px solid #27272a;
                        border-radius: 6px;
                        padding: 6px 9px;
                        font-family: inherit;
                        font-size: 12.5px;
                        line-height: 1.4;
                        resize: none;
                        outline: none;
                        transition: border-color 0.2s;
                    "></textarea>

                    <!-- Preview de imagem anexada/colada (estágio antes do envio) -->
                    <div id="gemini-image-preview-container" style="
                        display: none;
                        align-items: center;
                        gap: 8px;
                        margin-top: 5px;
                        padding: 5px 8px;
                        background: #18222a;
                        border: 1px solid #2d3c48;
                        border-radius: 5px;
                    ">
                        <img id="gemini-image-preview-thumb" src="" alt="Preview" style="
                            width: 32px;
                            height: 32px;
                            object-fit: cover;
                            border-radius: 4px;
                            border: 1px solid #3f3f46;
                            background: #000;
                            flex-shrink: 0;
                        " />
                        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px;">
                            <span id="gemini-image-preview-name" style="
                                font-size: 11px;
                                font-weight: 600;
                                color: #f4f4f5;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            ">imagem.png</span>
                            <span id="gemini-image-preview-size" style="
                                font-size: 10px;
                                color: #94a3b8;
                            ">0 KB · Imagem pronta para envio</span>
                        </div>
                        <button id="btn-gemini-remove-image" type="button" title="Remover imagem" style="
                            background: #27272a;
                            border: 1px solid #3f3f46;
                            color: #ef4444;
                            cursor: pointer;
                            font-size: 11px;
                            font-weight: bold;
                            padding: 2px 6px;
                            border-radius: 3px;
                            transition: all 0.2s;
                            flex-shrink: 0;
                        ">✕</button>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                    <!-- LADO ESQUERDO: Sugerir com IA e Outra Opção -->
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <button id="btn-sugerir-ia" type="button" style="
                            display: inline-flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            gap: 5px !important;
                            height: 30px !important;
                            min-height: 30px !important;
                            max-height: 30px !important;
                            padding: 0 10px !important;
                            background: linear-gradient(135deg, #1e1b4b, #312e81) !important;
                            color: #e0e7ff !important;
                            border: 1px solid #6366f1 !important;
                            border-radius: 6px !important;
                            font-family: inherit !important;
                            font-size: 11px !important;
                            font-weight: 600 !important;
                            cursor: pointer !important;
                            transition: all 0.2s ease !important;
                            box-shadow: 0 1px 4px rgba(99, 102, 241, 0.25) !important;
                            margin: 0 !important;
                            box-sizing: border-box !important;
                        ">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none; flex-shrink: 0;">
                                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
                            </svg>
                            <span>Sugerir com IA</span>
                        </button>


                    </div>

                    <!-- LADO DIREITO: Anexar, Áudio, Cancelar Áudio e Enviar ao Cliente (RIGOROSAMENTE QUADRADOS) -->
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <button id="btn-gemini-attach-image" class="gemini-btn-icon-square" type="button" title="Anexar imagem (ou cole com Ctrl+V)" style="
                            display: inline-flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            width: 30px !important;
                            height: 30px !important;
                            min-width: 30px !important;
                            max-width: 30px !important;
                            min-height: 30px !important;
                            max-height: 30px !important;
                            aspect-ratio: 1 / 1 !important;
                            flex: 0 0 30px !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            background: #1e293b !important;
                            color: #cbd5e1 !important;
                            border: 1px solid #334155 !important;
                            border-radius: 6px !important;
                            cursor: pointer !important;
                            transition: all 0.2s ease !important;
                            box-sizing: border-box !important;
                        ">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                            </svg>
                        </button>
                        <input type="file" id="gemini-file-input" accept="image/*" style="display: none;" />

                        <button id="btn-gemini-record-audio" class="gemini-btn-icon-square" type="button" title="Gravar áudio" style="
                            display: inline-flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            width: 30px !important;
                            height: 30px !important;
                            min-width: 30px !important;
                            max-width: 30px !important;
                            min-height: 30px !important;
                            max-height: 30px !important;
                            aspect-ratio: 1 / 1 !important;
                            flex: 0 0 30px !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            background: #1e293b !important;
                            color: #cbd5e1 !important;
                            border: 1px solid #334155 !important;
                            border-radius: 6px !important;
                            cursor: pointer !important;
                            transition: all 0.2s ease !important;
                            box-sizing: border-box !important;
                        ">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                        </button>

                        <button id="btn-gemini-cancel-audio" class="gemini-btn-icon-square" type="button" title="Cancelar gravação de áudio" style="
                            display: none !important;
                            align-items: center !important;
                            justify-content: center !important;
                            width: 30px !important;
                            height: 30px !important;
                            min-width: 30px !important;
                            max-width: 30px !important;
                            min-height: 30px !important;
                            max-height: 30px !important;
                            aspect-ratio: 1 / 1 !important;
                            flex: 0 0 30px !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            background: #27272a !important;
                            color: #ef4444 !important;
                            border: 1px solid #3f3f46 !important;
                            border-radius: 6px !important;
                            cursor: pointer !important;
                            transition: all 0.2s ease !important;
                            box-sizing: border-box !important;
                        ">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        <button id="btn-gemini-send-now" class="gemini-btn-icon-square" type="button" disabled title="Enviar ao cliente (Enter)" style="
                            display: inline-flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            width: 30px !important;
                            height: 30px !important;
                            min-width: 30px !important;
                            max-width: 30px !important;
                            min-height: 30px !important;
                            max-height: 30px !important;
                            aspect-ratio: 1 / 1 !important;
                            flex: 0 0 30px !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            background: #1a1b22 !important;
                            color: #71717a !important;
                            border: 1px solid rgba(255, 255, 255, 0.1) !important;
                            border-radius: 6px !important;
                            cursor: not-allowed !important;
                            transition: all 0.2s ease !important;
                            opacity: 0.9 !important;
                            box-shadow: none !important;
                            box-sizing: border-box !important;
                        ">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none; transform: translate(1px, -1px);">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            `;

            return card;
        }

        // Estilos temporários aplicados em elementos nativos durante o modo áudio (para poder desfazer ao sair)
        const estilosModoAudio = new Map();

        function aplicarEstiloModoAudio(el, propriedades) {
            if (!el) return;
            let props = estilosModoAudio.get(el);
            if (!props) {
                props = new Set();
                estilosModoAudio.set(el, props);
            }
            Object.keys(propriedades).forEach(k => {
                el.style.setProperty(k, propriedades[k], 'important');
                props.add(k);
            });
        }

        function restaurarLayoutModoAudio() {
            try {
                document.querySelectorAll('[data-softcom-audio-preview="true"]').forEach(el => {
                    delete el.dataset.softcomAudioPreview;
                    el.style.removeProperty('width');
                    el.style.removeProperty('max-width');
                    el.style.removeProperty('box-sizing');
                    el.style.removeProperty('background');
                    el.style.removeProperty('border');
                    el.style.removeProperty('border-radius');
                    el.style.removeProperty('padding');
                    el.style.removeProperty('margin-bottom');
                    el.style.removeProperty('box-shadow');
                });
            } catch (_) { }
            if (estilosModoAudio.size === 0) return;
            estilosModoAudio.forEach((props, el) => {
                props.forEach(k => el.style.removeProperty(k));
            });
            estilosModoAudio.clear();
        }

        // Localiza o botão lateral (Áudio / Anexar) que fica ao lado do card de áudio no footer
        function localizarBotaoLateralFooter(containerAudio) {
            return Array.from(document.querySelectorAll('button, [role="button"]')).find(el => {
                if (el.closest('#gemini-docked-panel')) return false;
                if (containerAudio.contains(el)) return false;
                const txt = (el.textContent || '').trim().toLowerCase();
                const aria = (el.getAttribute('aria-label') || '').toLowerCase();
                const title = (el.getAttribute('title') || '').toLowerCase();
                if (txt.length > 20) return false;
                if (txt.includes('enviar')) return false;
                return txt.includes('áudio') || txt.includes('audio') || txt.includes('anexar') ||
                    aria.includes('anexar') || title.includes('anexar') ||
                    aria.includes('áudio') || title.includes('áudio');
            });
        }

        // Injeta o layout integrando perfeitamente tanto no modo texto quanto no modo de escutar áudio
        // EXCLUSIVO para o chat do cliente - Oculta e restaura inputs se estiver sem chats ou em outras telas
        function injetarPainelGemini() {
            // SE NÃO HOUVER CHAT DE CLIENTE LEGÍTIMO ABERTO:
            // Oculta nosso painel imediatamente e restaura qualquer input nativo que tenha sido ocultado
            if (!ehChatDoClienteLegitimo()) {
                const cardExistente = document.getElementById('gemini-docked-panel');
                if (cardExistente) {
                    cardExistente.style.setProperty('display', 'none', 'important');
                }
                document.querySelectorAll('[data-softcom-hidden-native="true"]').forEach(el => {
                    desocultarElementoIndividual(el);
                });
                return null;
            }

            // Garante que o painel volte a ficar visível se estava oculto
            const cardPreExistente = document.getElementById('gemini-docked-panel');
            if (cardPreExistente && cardPreExistente.style.display === 'none') {
                cardPreExistente.style.removeProperty('display');
            }

            // 1. MODO ÁUDIO: Card de escutar áudio gravado (Gravação salva com Descartar e Enviar áudio)
            const audioCard = obterCardAudioNativo();

            if (audioCard) {
                if (gravandoAudioAtivo) {
                    finalizarGravacaoAudioUI();
                }

                const footerContainer = audioCard.parentElement;
                if (!footerContainer || footerContainer === document.body) return null;

                let card = document.getElementById('gemini-docked-panel');
                if (!card) {
                    card = criarElementoPainelGemini();
                    configurarEventosCard(card);
                }

                // Estiliza o bloco nativo de áudio gravado de forma harmoniosa com o modal do SoftCopilot
                audioCard.dataset.softcomAudioPreview = 'true';
                audioCard.style.setProperty('width', '100%', 'important');
                audioCard.style.setProperty('max-width', '100%', 'important');
                audioCard.style.setProperty('box-sizing', 'border-box', 'important');
                audioCard.style.setProperty('background', '#162227', 'important');
                audioCard.style.setProperty('border', '1px solid rgba(227, 180, 0, 0.45)', 'important');
                audioCard.style.setProperty('border-radius', '8px', 'important');
                audioCard.style.setProperty('padding', '12px 16px', 'important');
                audioCard.style.setProperty('margin-bottom', '8px', 'important');
                audioCard.style.setProperty('box-shadow', '0 4px 16px rgba(0, 0, 0, 0.35)', 'important');

                // Garante que o player <audio> nativo ocupe a largura completa
                const playerAudio = audioCard.querySelector('audio');
                if (playerAudio) {
                    playerAudio.style.setProperty('width', '100%', 'important');
                    playerAudio.style.setProperty('max-width', '100%', 'important');
                    playerAudio.style.setProperty('margin', '6px 0', 'important');
                }

                // Garante que a linha de botões de ação (Descartar / Enviar áudio) fique centralizada e integrada
                const botoesAcao = Array.from(audioCard.querySelectorAll('button, [role="button"]')).filter(b => {
                    const txt = (b.textContent || '').trim().toLowerCase();
                    return txt.includes('descartar') || txt.includes('enviar áudio') || txt.includes('enviar audio');
                });
                if (botoesAcao.length > 0) {
                    const containerAcoes = botoesAcao[0].parentElement;
                    if (containerAcoes && containerAcoes !== audioCard) {
                        containerAcoes.style.setProperty('display', 'flex', 'important');
                        containerAcoes.style.setProperty('align-items', 'center', 'important');
                        containerAcoes.style.setProperty('justify-content', 'center', 'important');
                        containerAcoes.style.setProperty('gap', '12px', 'important');
                        containerAcoes.style.setProperty('margin-top', '8px', 'important');
                    }
                }

                // O card do SoftCopilot é posicionado LOGO ABAIXO do bloco de áudio gravado
                card.style.setProperty('flex', 'none', 'important');
                card.style.setProperty('width', '100%', 'important');
                card.style.setProperty('max-width', '100%', 'important');
                card.style.setProperty('min-width', '0', 'important');
                card.style.setProperty('box-sizing', 'border-box', 'important');
                card.style.setProperty('position', 'relative', 'important');
                card.style.setProperty('margin-top', '0px', 'important');

                const textareaAtiva = document.getElementById('gemini-suggestion-text');
                const estaFocado = (document.activeElement === textareaAtiva);
                if (!estaFocado) {
                    if (audioCard.nextSibling !== card || card.parentElement !== footerContainer) {
                        if (audioCard.nextSibling) {
                            footerContainer.insertBefore(card, audioCard.nextSibling);
                        } else {
                            footerContainer.appendChild(card);
                        }
                    }
                }

                return card;
            }

            // Saiu do modo áudio: desfaz os ajustes temporários nos elementos nativos
            restaurarLayoutModoAudio();

            // 2. MODO NORMAL (Digitação de texto):
            const footerInfo = localizarElementosFooter();
            if (!footerInfo || !footerInfo.footerRow) {
                return null;
            }

            const { campo, nativeBox, footerRow, temRowLateral } = footerInfo;

            // Oculta com total segurança a caixa de texto nativa
            ocultarNativeBox(nativeBox, footerRow);

            let card = document.getElementById('gemini-docked-panel');
            if (!card) {
                card = criarElementoPainelGemini();
                configurarEventosCard(card);

                // Sincroniza rascunho da conversa ativa atual no novo card
                const chaveAtual = obterChaveIdentificadoraChatAtivo();
                if (chaveAtual) {
                    ultimoTicketPainel = chaveAtual;
                    let rascunho = envioMensagemEmAndamento ? '' : (obterRascunhoChat(chaveAtual) || '');
                    if (rascunho && ultimoTextoEnviadoRecente.texto && rascunho.trim() === ultimoTextoEnviadoRecente.texto && (Date.now() - ultimoTextoEnviadoRecente.timestamp < 10000)) {
                        limparTodosRascunhosDoChatAtual(rascunho);
                        rascunho = '';
                    }
                    const txtEl = card.querySelector('#gemini-suggestion-text');
                    if (txtEl && rascunho) {
                        txtEl.value = rascunho;
                        const origemSalva = origensTextoPorChat.get(chaveAtual);
                        origemTextoAtual = origemSalva || 'usuario';
                        atualizarEstadoCard(true);
                        atualizarEstadoBotaoIA();
                        ultimoTextoDigitadoPeloUsuario = rascunho;
                    }
                }
            }

            // O card do SoftCopilot é o container unificado de digitação e ações
            card.style.setProperty('flex', 'none', 'important');
            card.style.setProperty('width', '100%', 'important');
            card.style.setProperty('max-width', '100%', 'important');
            card.style.setProperty('min-width', '0', 'important');
            card.style.setProperty('box-sizing', 'border-box', 'important');
            card.style.setProperty('position', 'relative', 'important');
            card.style.setProperty('overflow', 'visible', 'important');
            card.style.setProperty('margin-bottom', '0px', 'important');

            // Se o usuário está com foco no textarea, NUNCA mexe na posição do card para não resetar o foco
            const textareaAtiva = document.getElementById('gemini-suggestion-text');
            const estaFocado = (document.activeElement === textareaAtiva);

            if (!estaFocado) {
                if (nativeBox && nativeBox.parentElement === footerRow) {
                    if (nativeBox.nextSibling !== card || card.parentElement !== footerRow) {
                        footerRow.insertBefore(card, nativeBox.nextSibling);
                    }
                } else if (card.parentElement !== footerRow) {
                    footerRow.appendChild(card);
                }
            }

            // Sincroniza o banner "Respondendo a..." para ficar fixado no fluxo ACIMA do SoftCopilot
            sincronizarBannerResposta(card);

            // Oculta botões nativos redundantes (Microfone e Anexar) que ficam duplicados na barra inferior
            ocultarBotoesNativosDuplicados();

            return card;
        }

        let ultimoTextoDigitadoPeloUsuario = '';
        let cacheBaseConhecimento = null;

        // Cache em memória para acesso instantâneo à base de procedimentos técnicos (0ms de espera)
        async function obterBaseConhecimentoEmMemoria() {
            if (cacheBaseConhecimento && cacheBaseConhecimento.length >= 442) {
                return cacheBaseConhecimento;
            }
            try {
                const res = await new Promise(r => chrome.storage.local.get(['softcom_knowledge_base'], r));
                let dados = res?.softcom_knowledge_base;
                if (!dados || dados.length < 442) {
                    const url = chrome.runtime.getURL('manuais_softcom.json');
                    const resJson = await fetch(url);
                    if (resJson.ok) {
                        dados = await resJson.json();
                        chrome.storage.local.set({ 'softcom_knowledge_base': dados });
                    }
                }
                if (dados && dados.length > 0) {
                    cacheBaseConhecimento = dados;
                }
                return cacheBaseConhecimento || [];
            } catch (_) {
                return [];
            }
        }
        // Pré-aquece a base de conhecimento imediatamente
        try { obterBaseConhecimentoEmMemoria(); } catch (_) { }

        // CACHE DE SUGESTÃO PRÉ-CARREGADA (RESPOSTA INSTANTÂNEA EM 0ms)
        let sugestaoPrecarregada = null;
        let timeoutPrecarregamento = null;
        let precarregandoAgora = false;

        function agendarPreGeracaoSugestao() {
            clearTimeout(timeoutPrecarregamento);
            timeoutPrecarregamento = setTimeout(async () => {
                try {
                    if (!obterPregeracaoHabilitada()) return;
                    if (!obterChaveGeminiParaEnvio() && !obterChaveGroqParaEnvio()) return;
                    if (gerandoSugestaoGemini || precarregandoAgora) return;
                    const textarea = document.getElementById('gemini-suggestion-text');
                    if (textarea && textarea.value.trim().length > 0) return;

                    const ticketId = obterTicketChatAtivo();
                    if (!ticketId) return;

                    const historicoInfo = extrairHistoricoConversaParaIA();
                    const { ultimaMensagemCliente, mensagensDetalhadas } = historicoInfo;
                    if (!ultimaMensagemCliente || ultimaMensagemCliente.length < 3) return;

                    const ultimaMsgGeral = mensagensDetalhadas && mensagensDetalhadas.length > 0 ? mensagensDetalhadas[mensagensDetalhadas.length - 1] : null;
                    if (ultimaMsgGeral && (ultimaMsgGeral.ehAtendente || ultimaMsgGeral.ehBot)) return;

                    const cacheKey = `${ticketId}::${ultimaMensagemCliente.trim()}`;
                    if (sugestaoPrecarregada && sugestaoPrecarregada.key === cacheKey) return;

                    const regra = await detectarSugestaoRegrasSetor(historicoInfo);
                    if (regra && regra.texto) return;

                    const apiKey = obterChaveGeminiParaEnvio();
                    const groqApiKey = obterChaveGroqParaEnvio();
                    const prompt = await montarPromptParaIA(historicoInfo, false, '');

                    precarregandoAgora = true;
                    chrome.runtime.sendMessage({
                        action: 'CALL_GEMINI',
                        apiKey: apiKey,
                        groqApiKey: groqApiKey,
                        prompt: prompt,
                        temperature: obterIATemperatura(),
                        maxTokens: (obterIATamanho() === 'curto' ? 120 : (obterIATamanho() === 'longo' ? 350 : 200))
                    }, (response) => {
                        precarregandoAgora = false;
                        if (response && response.success && response.text) {
                            sugestaoPrecarregada = {
                                key: cacheKey,
                                texto: response.text,
                                timestamp: Date.now()
                            };
                            console.log('[Extensão Softcom] Sugestão pré-gerada pronta em cache para chat #' + ticketId);
                        }
                    });
                } catch (_) {
                    precarregandoAgora = false;
                }
            }, 1200);
        }

        // Constrói prompt otimizado e focado, adaptado ao estilo do atendente e preferências de IA
        async function montarPromptParaIA(historicoInfo, ehModoAprimorar, rascunhoAtendente, instrucaoExtra = '') {
            const { historico, ultimaMensagemCliente, primeiraMensagemCliente, ultimaMensagemAtendente, nomeCliente } = historicoInfo;

            // Busca rápida em manuais (limitada aos 2 mais relevantes e objetiva - SOMENTE no modo sugestão)
            let contextoManuais = '';
            if (!ehModoAprimorar) {
                try {
                    const dadosKb = await obterBaseConhecimentoEmMemoria();
                    if (dadosKb && dadosKb.length > 0) {
                        const stopWords = new Set(['para', 'com', 'como', 'esta', 'esse', 'essa', 'isso', 'pelo', 'pela', 'onde', 'quando', 'mais', 'muito', 'voce', 'você', 'estou', 'está', 'fazer', 'qual', 'pode', 'meu', 'minha', 'meus', 'minhas', 'cliente', 'atendimento', 'suporte', 'ola', 'olá', 'bom', 'boa', 'dia', 'tarde', 'noite', 'favor', 'por', 'sobre', 'aqui', 'estava', 'tenho', 'tudo', 'bem']);
                        const contextoGeral = `${historico} ${primeiraMensagemCliente} ${ultimaMensagemCliente} ${instrucaoExtra}`.toLowerCase();
                        const ehContextoCupom = /\b(cupom|bobina|80mm|58mm|corte|guilhotina|nfce|nfc-e|danfe|comprovante|recibo|caixa|pdv|impressora termica|termica|itens)\b/i.test(contextoGeral);
                        const ehContextoEtiqueta = /\b(etiqueta|etiquetas|etiquetadora|ribbon|gondola|gôndola|l42|elgin l42|zebra|argox|barcode|codigo de barra|blocagem)\b/i.test(contextoGeral);
                        const ehContextoTEF = /\b(tef|paygo|stone|sitef|cartao|cartão|pos|pinpad)\b/i.test(contextoGeral);

                        const termosRecentes = `${ultimaMensagemCliente} ${instrucaoExtra}`.toLowerCase()
                            .split(/[\s,.;:!?/\\()\-"]+/).filter(w => w.length >= 3 && !stopWords.has(w));
                        const termosHistorico = `${historico} ${primeiraMensagemCliente}`.toLowerCase()
                            .split(/[\s,.;:!?/\\()\-"]+/).filter(w => w.length >= 3 && !stopWords.has(w));

                        const matchManuais = dadosKb.map(m => {
                            const tit = (m.titulo || '').toLowerCase();
                            const cat = (m.categoria || '').toLowerCase();
                            const proc = (m.procedimento || '').toLowerCase();
                            const manualEhEtiqueta = /\b(etiqueta|etiquetadora|ribbon|l42|zebra|argox|gondola)\b/i.test(tit + ' ' + cat);
                            const manualEhCupom = /\b(cupom|bobina|80mm|58mm|guilhotina|corte|danfe nfce|pdv: impressoras|cupom fiscal)\b/i.test(tit + ' ' + cat);

                            if (ehContextoCupom && !ehContextoEtiqueta && manualEhEtiqueta) return { m, score: -100 };
                            if (ehContextoEtiqueta && !ehContextoCupom && manualEhCupom) return { m, score: -100 };
                            if (ehContextoTEF && (manualEhEtiqueta || manualEhCupom)) return { m, score: -100 };

                            let score = 0;
                            termosRecentes.forEach(t => {
                                if (m.id && String(m.id).toLowerCase() === t) score += 25;
                                if (tit.includes(t)) score += 10;
                                if (cat.includes(t)) score += 5;
                                if (proc.includes(t)) score += 2;
                            });
                            termosHistorico.forEach(t => {
                                if (tit.includes(t)) score += 4;
                                if (cat.includes(t)) score += 2;
                            });
                            if (ehContextoCupom && manualEhCupom) score += 25;
                            if (ehContextoEtiqueta && manualEhEtiqueta) score += 25;
                            if (ehContextoTEF && (tit.includes('tef') || tit.includes('paygo'))) score += 25;
                            return { m, score };
                        }).filter(x => x.score >= 15)
                            .sort((a, b) => b.score - a.score)
                            .slice(0, 2);

                        if (matchManuais.length > 0) {
                            contextoManuais = '\n\nBASE DE CONHECIMENTO TÉCNICA DO SISTEMA (MANUAIS OFICIAIS):\n' +
                                'Utilize as instruções abaixo como base técnica para ORIENTAR o cliente com clareza, empatia e didática pelo chat, explicando o passo a passo das rotinas no sistema.\n' +
                                'Peça AnyDesk apenas se for erro técnico grave/travamento que impeça o uso ou se o cliente não conseguir após a instrução.\n' +
                                matchManuais.map(x => `[MANUAL ${x.m.id || ''}: ${x.m.titulo}]\n${(x.m.procedimento || '').slice(0, 450)}`).join('\n\n');
                        }
                    }
                } catch (_) { }
            }

            // Detecção de AnyDesk já informado e fluxo de encerramento no atendimento
            const anydeskJaNoHistorico = clienteJaEnviouAnydeskNoHistorico(historicoInfo.mensagensDetalhadas, historico) || ehMensagemComAnydesk(ultimaMensagemCliente);
            const duvidaFinalJaEnviada = atendenteJaFezDuvidaFinal(historicoInfo.mensagensDetalhadas, historico) || ehDuvidaFinal(ultimaMensagemAtendente);

            let blocoInstrucoesCriticas = '';
            if (anydeskJaNoHistorico) {
                blocoInstrucoesCriticas += '\n⚠️ REGRA CRÍTICA DE ANYDESK: O cliente JÁ enviou o AnyDesk ou ID de acesso nesta conversa. É TERMINANTEMENTE PROIBIDO pedir o AnyDesk novamente! Caso precise de algo no acesso remoto, confirme que já está acessando ou solicite autorização na tela.';
            }
            if (!duvidaFinalJaEnviada) {
                blocoInstrucoesCriticas += '\n⚠️ FLUXO DE ENCERRAMENTO (ETAPA 1 OBRIGATÓRIA): A pergunta de dúvida final ("Restou alguma dúvida em relação ao seu atendimento? Posso te auxiliar com algo mais?") AINDA NÃO foi feita pelo atendente. Se o cliente estiver agradecendo ("obrigado", "valeu", "tudo certo", "deu certo") ou indicando que o problema foi resolvido, NUNCA envie mensagem de encerramento ("Como não restaram mais dúvidas...")! Envie OBRIGATORIAMENTE a pergunta de dúvida final: "Restou alguma dúvida em relação ao seu atendimento? Posso te auxiliar com algo mais?".';
            } else {
                blocoInstrucoesCriticas += '\nℹ️ FLUXO DE ENCERRAMENTO (ETAPA 2 LIBERADA): A pergunta de dúvida final já foi feita. Se o cliente confirmar que não tem mais dúvidas, finalize com: "Como não restaram mais dúvidas, estarei finalizando este atendimento. Foi um prazer lhe atender! Tenha um excelente dia!".';
            }

            // Estilo do atendente (3 exemplos gerais mais recentes)
            let blocoExemplosEstilo = '';
            const nomeTecnicoAtual = obterNomeTecnico();
            const nomeTecnicoCompletoAtual = obterNomeTecnicoCompleto();
            if (!ehModoAprimorar) {
                try {
                    const aprendidos = await obterExemplosAprendidos();
                    if (aprendidos && aprendidos.length > 0) {
                        const ultimosExemplos = aprendidos.slice(-3);
                        blocoExemplosEstilo = `\n\nBASE DE MENSAGENS ANTERIORES DO ATENDENTE (${nomeTecnicoCompletoAtual}):\n` +
                            ultimosExemplos.map((ex, i) =>
                                `[${i + 1}]${ex.cliente ? ` Cliente: "${ex.cliente.slice(0, 80)}"\n Atendente respondeu: ` : ' Atendente respondeu: '}"${ex.resposta}"`
                            ).join('\n');
                    }
                } catch (_) { }
            }

            // APRENDIZADO ADAPTATIVO: Exemplos reais de correções que o atendente fez em sugestões anteriores da IA
            let blocoCorrecoesAprendidas = '';
            if (obterAprendizadoCorrecoesHabilitado()) {
                try {
                    const contextoBusca = `${ultimaMensagemCliente || ''} ${historico || ''}`;
                    const correcoesRelevantes = await obterCorrecoesRelevantes(contextoBusca, 3);
                    if (correcoesRelevantes && correcoesRelevantes.length > 0) {
                        blocoCorrecoesAprendidas = '\n\n🧠 BASE DE APRENDIZADO ADAPTATIVO - CORREÇÕES REAIS DO ATENDENTE:\n' +
                            'O atendente já corrigiu sugestões anteriores da IA em atendimentos similares. Analise como ele reescreveu o texto e crie sua resposta INSPIRADO no vocabulário, estilo, tom e abordagem das correções dele:\n' +
                            correcoesRelevantes.map((c, i) =>
                                `[Correção ${i + 1}]${c.contextoCliente ? ` Situação do cliente: "${c.contextoCliente}"\n` : ''}` +
                                `   Sugestão original da IA: "${c.sugestaoOriginal}"\n` +
                                `   Como o atendente corrigiu e prefere: "${c.correcao}"`
                            ).join('\n') +
                            '\nVocê tem total liberdade criativa para redigir o texto que julgar melhor para o atendimento atual, desde que seja inspirado e alinhado ao padrão de escrita e tom demonstrado nas correções acima.';
                    }
                } catch (_) { }
            }

            // Diretrizes dinâmicas configuradas pelo usuário
            const configTom = obterIATom();
            let diretrizTom = 'TOM DE VOZ: Direto, claro, ágil e resolutivo, sem formalidades excessivas.';
            if (configTom === 'acolhedor') {
                diretrizTom = 'TOM DE VOZ: Acolhedor, empático, gentil e atencioso, transmitindo cuidado e paciência ao cliente.';
            } else if (configTom === 'tecnico') {
                diretrizTom = 'TOM DE VOZ: Técnico, didático, preciso e profissional, explicando causas e procedimentos com clareza.';
            }

            const configTamanho = obterIATamanho();
            let diretrizTamanho = 'EXTENSÃO DA RESPOSTA: Equilibrada (2 a 3 frases objetivas, com orientação clara).';
            if (configTamanho === 'curto') {
                diretrizTamanho = 'EXTENSÃO DA RESPOSTA: Muito concisa e direta (1 a 2 frases curtas, ideal para respostas rápidas de chat).';
            } else if (configTamanho === 'longo') {
                diretrizTamanho = 'EXTENSÃO DA RESPOSTA: Detalhada e completa (passo a passo detalhado, explicando as etapas com calma).';
            }

            const configBordoes = obterIABordoes();
            let diretrizBordoes = 'REDUÇÃO DE BORDÕES REPETITIVOS: É PROIBIDO iniciar mensagens com "Perfeito", "Entendi", "Compreendo", "Certo" ou "Com certeza", a menos que haja estrita necessidade lógica de confirmação. Prefira saudar o cliente pelo nome ("Olá, ' + (nomeCliente || 'Cliente') + '!"), confirmar fatos diretamente ou ir direto à solução/orientação técnica com cordialidade.';
            if (configBordoes === 'moderado') {
                diretrizBordoes = 'USO EQUILIBRADO DE BORDÕES: Diminua o uso frequente de termos repetitivos de abertura como "Perfeito", "Entendi" ou "Compreendo". Use apenas quando fizer sentido lógico e varie os inícios saudando pelo nome ou indo direto ao ponto.';
            } else if (configBordoes === 'livre') {
                diretrizBordoes = 'ESTILO DE ABERTURA: Mantenha um tom natural e educado, variando as aberturas das mensagens.';
            }

            if (ehModoAprimorar) {
                return `Você é ${nomeTecnicoCompletoAtual}, atendente do suporte técnico da Softcom Tecnologia.
O atendente redigiu o seguinte rascunho de mensagem para ser enviado ao cliente:
"""${rascunhoAtendente}"""

CONTEXTO DA CONVERSA:
- Atendente: ${nomeTecnicoCompletoAtual}
- Cliente: ${nomeCliente || 'Cliente'}
- Última mensagem enviada pelo atendente ${nomeTecnicoAtual}: "${ultimaMensagemAtendente || 'Nenhuma'}"
- Última mensagem do cliente humano: "${ultimaMensagemCliente || 'Preciso de ajuda.'}"
- Histórico do chat:
${historico || 'Nenhum histórico recente.'}
${blocoInstrucoesCriticas}
${blocoCorrecoesAprendidas}
${instrucaoExtra ? `Instrução adicional: ${instrucaoExtra}` : ''}

PREFERÊNCIAS DE ESTILO CONFIGURADAS:
- ${diretrizBordoes}
- ${diretrizTom}
- ${diretrizTamanho}

SUA TAREFA EXCLUSIVA:
Aprimore o rascunho redigido pelo atendente, mantendo 100% da intenção, sentido e direcionamento do texto original.
DIRETRIZES FUNDAMENTAIS:
1. FIDELIDADE ABSOLUTA AO RASCUNHO DO ATENDENTE: NUNCA apague ou descarte o que o atendente digitou! Se ele escreveu uma frase simples (ex: "só um momento vou verificar", "qual erro apareceu?", "já estou olhando"), preserve integralmente a ideia dele, apenas corrigindo pontuação, acentuação e tornando o tom profissional e polido.
2. NUNCA insira procedimentos técnicos novos, explicações de manuais ou assuntos que o atendente NÃO mencionou no rascunho dele.
3. NUNCA solicite AnyDesk se o atendente não pediu no rascunho dele ou se o cliente já tiver enviado o AnyDesk nesta conversa.
4. EVITE BORDÕES INICIAIS: A menos que o atendente tenha digitado expressamente no rascunho, NÃO adicione palavras de abertura como "Perfeito", "Entendi" ou "Compreendo".
Retorne ESTRITAMENTE o texto final pronto para envio ao cliente, sem aspas, títulos ou explicações.`;
            } else {
                const diretrizAnydesk = anydeskJaNoHistorico
                    ? '4. REGRA ABSOLUTA DE ANYDESK: O cliente JÁ INFORMOU o AnyDesk ou ID de acesso nesta conversa! É ABSOLUTAMENTE PROIBIDO pedir o AnyDesk, ID ou código de acesso novamente. Confirme que já está acessando ou solicite para aceitar a conexão na tela caso precise.'
                    : '4. EQUILÍBRIO NO ANYDESK E ORIENTAÇÃO HUMANIZADA:\n   - Em procedimentos e rotinas comuns do sistema (como emissão de notas fiscais NF-e/NFC-e, entrada de notas XML, cadastros de produtos/clientes, relatórios e consultas): NÃO peça AnyDesk de início! Oriente o cliente com cordialidade e didática pelo chat.\n   - Solicite AnyDesk APENAS se for erro impeditivo/travamento do sistema ou se o cliente relatar dificuldade após a orientação.';

                return `Você é ${nomeTecnicoCompletoAtual}, atendente do suporte técnico da Softcom Tecnologia.
Redija a resposta ideal e definitiva para ser enviada agora ao cliente no chat.

CONTEXTO:
- Atendente: ${nomeTecnicoCompletoAtual}
- Cliente: ${nomeCliente || 'Cliente'}
- Última mensagem enviada pelo atendente ${nomeTecnicoAtual}: "${ultimaMensagemAtendente || 'Nenhuma'}"
- Última mensagem do cliente humano: "${ultimaMensagemCliente || 'Preciso de ajuda com o sistema.'}"
- Histórico do chat:
${historico || 'Nenhum histórico recente.'}
${contextoManuais}
${blocoExemplosEstilo}
${blocoCorrecoesAprendidas}
${blocoInstrucoesCriticas}
${instrucaoExtra ? `Instrução adicional: ${instrucaoExtra}` : ''}

DIRETRIZES DE ATENDIMENTO E ESTILO:
1. REDUÇÃO DE BORDÕES E ABERTURA NATURAL:
   ${diretrizBordoes}
2. ${diretrizTom}
3. ${diretrizTamanho}
${diretrizAnydesk}
5. DISTINÇÃO DE HARDWARE vs SISTEMA: Se for problema mecânico de impressora (corte de guilhotina, cabo solto, queima), oriente técnico de TI particular ou assistência técnica.
6. Distinga rigorosamente Impressora de Cupom (bobina 80mm/58mm/NFC-e) de Impressora de Etiquetas (ribbon/L42/código de barras).
7. FLUXO DE FINALIZAÇÃO EM 2 ETAPAS (SEMPRE PERGUNTE DÚVIDA FINAL ANTES DE ENCERRAR):
   - Etapa 1: Quando resolvido ou o cliente agradecer ("obrigado", "valeu", "deu certo"), pergunte se restou alguma dúvida e se pode auxiliar em algo mais.
   - Etapa 2: Só encerre com "Como não restaram mais dúvidas, estarei finalizando este atendimento..." se a pergunta de dúvida final já foi feita e o cliente respondeu confirmando que não tem dúvidas. NUNCA finalize direto!
8. MENSAGENS DE SISTEMA/BOT: Mensagens marcadas com [Sistema/Bot] no histórico são mensagens automáticas do Workdesk. NUNCA responda ao bot ou à URA; responda exclusivamente ao cliente humano (${nomeCliente}) e à dúvida/solicitação dele.
Retorne ESTRITAMENTE o texto final pronto para envio ao cliente, sem aspas, títulos ou explicações.`;
            }
        }

        // Dispara a consulta ao Gemini para obter sugestão de resposta ou aprimorar o texto digitado
        async function solicitarSugestaoGemini(instrucaoExtra = '') {
            if (gerandoSugestaoGemini) return;

            // Sem nenhuma chave de API (pacote público não traz chaves padrão): orienta e abre as configurações
            if (!obterChaveGeminiParaEnvio() && !obterChaveGroqParaEnvio()) {
                mostrarNotificacao('🔑 Configure sua chave de API (Gemini ou Groq, ambas gratuitas) para usar a IA.', '#f59e0b');
                abrirModalConfigTecnico(false, 'geral');
                return;
            }

            // Alerta o usuário caso ele ainda não tenha configurado suas próprias chaves de API
            if (!usuarioPossuiChavePropria()) {
                mostrarPopupAvisoApiKey();
            }

            const apiKey = obterChaveGeminiParaEnvio();

            const textarea = document.getElementById('gemini-suggestion-text');
            const textoNoCampo = (textarea ? textarea.value : '').trim();

            if (!instrucaoExtra) {
                if (origemTextoAtual === 'usuario') {
                    ultimoTextoDigitadoPeloUsuario = textoNoCampo;
                } else if (!textoNoCampo) {
                    ultimoTextoDigitadoPeloUsuario = '';
                }
            }

            const ehModoAprimorar = (origemTextoAtual === 'usuario' && !!ultimoTextoDigitadoPeloUsuario);
            const historicoInfo = extrairHistoricoConversaParaIA();
            const { historico, ultimaMensagemCliente } = historicoInfo;

            if (!ehModoAprimorar && !ultimaMensagemCliente && !historico) {
                mostrarNotificacao('⚠️ Nenhuma mensagem no chat. Digite algo no campo para a IA aprimorar.', '#f59e0b');
                return;
            }

            // 1. REGRA DETERMINÍSTICA DO SETOR (Instantânea)
            if (!ehModoAprimorar && !instrucaoExtra) {
                const regraSetor = await detectarSugestaoRegrasSetor(historicoInfo);
                if (regraSetor && regraSetor.texto) {
                    injetarPainelGemini();
                    if (textarea) {
                        textarea.value = regraSetor.texto;
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        colocarTextoNoCampo(regraSetor.texto);
                    }
                    ultimoTextoGeradoPorIA = regraSetor.texto.trim();
                    origemTextoAtual = 'ia';
                    const chaveAtiva = obterChaveIdentificadoraChatAtivo() || ultimoTicketPainel;
                    if (chaveAtiva) {
                        origensTextoPorChat.set(chaveAtiva, 'ia');
                        sugestoesIAPorChat.set(chaveAtiva, regraSetor.texto.trim());
                    }
                    atualizarEstadoCard(true);
                    atualizarEstadoBotaoIA();
                    mostrarNotificacao(regraSetor.motivo || 'Sugestão conforme regras do setor!', '#10b981');
                    gerandoSugestaoGemini = false;
                    restaurarBotoesUI();
                    return;
                }
            }

            // 2. RESPOSTA INSTANTÂNEA VIA CACHE PRÉ-CARREGADO (0ms de espera, validade máxima de 15s para evitar respostas desatualizadas)
            if (!ehModoAprimorar && !instrucaoExtra) {
                const ticketId = obterTicketChatAtivo();
                const cacheKey = ticketId + '::' + (ultimaMensagemCliente || '').trim();
                if (sugestaoPrecarregada) {
                    const cacheExpirado = (Date.now() - sugestaoPrecarregada.timestamp >= 15000);
                    if (cacheExpirado || sugestaoPrecarregada.key !== cacheKey) {
                        sugestaoPrecarregada = null; // descarta cache desatualizado
                    } else {
                        const textoPronto = sugestaoPrecarregada.texto;
                        sugestaoPrecarregada = null; // consome o cache
                        injetarPainelGemini();
                        if (textarea) {
                            textarea.value = textoPronto;
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                            colocarTextoNoCampo(textoPronto);
                            textarea.focus();
                        }
                        ultimoTextoGeradoPorIA = textoPronto.trim();
                        origemTextoAtual = 'ia';
                        const chaveAtiva = obterChaveIdentificadoraChatAtivo() || ultimoTicketPainel;
                        if (chaveAtiva) {
                            origensTextoPorChat.set(chaveAtiva, 'ia');
                            sugestoesIAPorChat.set(chaveAtiva, textoPronto.trim());
                        }
                        atualizarEstadoCard(true);
                        atualizarEstadoBotaoIA();
                        mostrarNotificacao('⚡ Sugestão instantânea pronta!', '#10b981');
                        restaurarBotoesUI();
                        return;
                    }
                }
            }

            injetarPainelGemini();
            const btnIA = document.getElementById('btn-sugerir-ia');

            if (btnIA) {
                let txtLoading = 'Gerando...';
                if (ehModoAprimorar) txtLoading = 'Melhorando...';
                else if (instrucaoExtra || origemTextoAtual === 'ia') txtLoading = 'Buscando alternativa...';

                btnIA.innerHTML = '<span style="display:inline-block; width:10px; height:10px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:geminiPulseRec 0.8s infinite alternate;"></span><span>' + txtLoading + '</span>';
                btnIA.style.opacity = '0.7';
                btnIA.disabled = true;
            }
            if (textarea && !textarea.value.trim()) {
                textarea.placeholder = '⚡ Consultando IA em alta velocidade...';
            }

            gerandoSugestaoGemini = true;

            function restaurarBotoesUI() {
                gerandoSugestaoGemini = false;
                const bIA = document.getElementById('btn-sugerir-ia');
                const tArea = document.getElementById('gemini-suggestion-text');
                if (bIA) {
                    bIA.style.opacity = '1';
                    bIA.disabled = false;
                }
                atualizarEstadoBotaoIA();
                if (tArea && !tArea.value.trim()) {
                    tArea.placeholder = "Digite uma mensagem ou clique em 'Sugerir com IA'... (/ ou # para templates)";
                }
            }

            function finalizarComSucesso(textoSugestao, modelo = '') {
                ultimoTextoGeradoPorIA = (textoSugestao || '').trim();
                origemTextoAtual = 'ia';
                const chaveAtiva = obterChaveIdentificadoraChatAtivo() || ultimoTicketPainel;
                if (chaveAtiva) {
                    origensTextoPorChat.set(chaveAtiva, 'ia');
                    sugestoesIAPorChat.set(chaveAtiva, (textoSugestao || '').trim());
                    salvarRascunhoChat(chaveAtiva, textoSugestao);
                }

                const targetTextarea = document.getElementById('gemini-suggestion-text');
                if (targetTextarea) {
                    targetTextarea.value = textoSugestao;
                    targetTextarea.style.height = 'auto';
                    targetTextarea.style.height = Math.min(120, Math.max(38, targetTextarea.scrollHeight)) + 'px';
                    colocarTextoNoCampo(textoSugestao);
                    targetTextarea.focus();
                }
                atualizarEstadoCard(true);
                atualizarEstadoBotaoIA();
                const ehGroq = modelo && modelo.toLowerCase().includes('groq');
                if (ehGroq) {
                    mostrarNotificacao('⚡ Sugestão via Groq Retaguarda (~500ms)!', '#06b6d4');
                } else {
                    mostrarNotificacao(
                        ehModoAprimorar ? '✨ Mensagem aprimorada com sucesso!' : '✨ Resposta sugerida com sucesso!',
                        '#2ecc71'
                    );
                }
                if (!usuarioPossuiChavePropria()) {
                    mostrarPopupAvisoApiKey();
                }
                restaurarBotoesUI();
            }

            try {
                const apiKey = obterChaveGeminiParaEnvio();
                const groqApiKey = obterChaveGroqParaEnvio();
                const prompt = await montarPromptParaIA(historicoInfo, ehModoAprimorar, ultimoTextoDigitadoPeloUsuario, instrucaoExtra);

                chrome.runtime.sendMessage({
                    action: 'CALL_GEMINI',
                    apiKey: apiKey,
                    groqApiKey: groqApiKey,
                    prompt: prompt,
                    temperature: obterIATemperatura(),
                    maxTokens: (obterIATamanho() === 'curto' ? 120 : (obterIATamanho() === 'longo' ? 350 : 200))
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('[Extensão Softcom] Erro de comunicação com background:', chrome.runtime.lastError);
                        mostrarNotificacao('❌ Erro na extensão. Recarregue a página.', '#ef4444');
                        restaurarBotoesUI();
                        return;
                    }

                    if (!response || !response.success) {
                        const erro = response?.error || 'Erro desconhecido ao consultar IA';
                        console.error('[Extensão Softcom] Erro IA:', erro);
                        if (erro.includes('API_KEY_INVALID') || erro.includes('key not valid')) {
                            mostrarNotificacao('❌ Chave de API inválida!', '#ef4444');
                        } else if (erro.includes('quota') || erro.includes('Quota exceeded') || erro.includes('Limite') || erro.includes('429')) {
                            mostrarNotificacao('⚠️ Limite atingido. Clique no ⚙️ para usar sua chave própria.', '#f59e0b');
                        } else if (erro.includes('alta demanda') || erro.includes('high demand') || erro.includes('503') || erro.includes('temporariamente')) {
                            mostrarNotificacao('⚠️ Servidores da IA em alta demanda temporária. Tente novamente em instantes.', '#f59e0b');
                        } else {
                            mostrarNotificacao(`❌ Erro IA: ${erro.slice(0, 60)}...`, '#ef4444');
                        }
                        restaurarBotoesUI();
                        return;
                    }

                    finalizarComSucesso(response.text, response.modelo);
                });
            } catch (err) {
                console.error('[Extensão Softcom] Exceção ao solicitar sugestão:', err);
                mostrarNotificacao('❌ Falha ao solicitar sugestão.', '#ef4444');
                restaurarBotoesUI();
            }
        }

        // Ao abrir ou recarregar a página (F5): registra o chat que JÁ ESTAVA na tela para NUNCA reenviar nele
        const ticketInicial = obterTicketChatAtivo();
        if (ticketInicial) {
            ticketsIniciaisAoAbrir.add(String(ticketInicial));
            console.log(`[Extensão Softcom] Chat #${ticketInicial} registrado como já aberto na inicialização.`);
        }

        // Ao alternar entre conversas/chamados, persiste o rascunho anterior e restaura o rascunho do novo chamado
        function verificarTrocaChatPainel() {
            if (!ehChatDoClienteLegitimo()) {
                const card = document.getElementById('gemini-docked-panel');
                if (card) card.style.setProperty('display', 'none', 'important');
                document.querySelectorAll('[data-softcom-hidden-native="true"]').forEach(el => desocultarElementoIndividual(el));
                return;
            }

            const chaveAtual = obterChaveIdentificadoraChatAtivo();
            if (!chaveAtual) return;

            if (chaveAtual !== ultimoTicketPainel) {
                if (envioMensagemEmAndamento) return;
                const textarea = document.getElementById('gemini-suggestion-text');

                // 1. Salva o rascunho da conversa anterior antes de alternar
                if (ultimoTicketPainel && textarea) {
                    salvarRascunhoChat(ultimoTicketPainel, textarea.value);
                }

                const chaveAnterior = ultimoTicketPainel;
                // 2. Atualiza a referência da conversa ativa
                ultimoTicketPainel = chaveAtual;

                // 3. Recupera o rascunho existente para o novo chamado (vazio se não houver)
                let rascunhoSalvo = obterRascunhoChat(chaveAtual) || '';
                if (rascunhoSalvo && ultimoTextoEnviadoRecente.texto && rascunhoSalvo.trim() === ultimoTextoEnviadoRecente.texto && (Date.now() - ultimoTextoEnviadoRecente.timestamp < 10000)) {
                    limparTodosRascunhosDoChatAtual(rascunhoSalvo);
                    rascunhoSalvo = '';
                }

                if (textarea) {
                    textarea.value = rascunhoSalvo;
                    // Redimensiona o textarea dinamicamente
                    textarea.style.height = 'auto';
                    textarea.style.height = Math.min(120, Math.max(38, textarea.scrollHeight)) + 'px';

                    const origemSalva = origensTextoPorChat.get(chaveAtual);
                    if (rascunhoSalvo.trim()) {
                        origemTextoAtual = origemSalva || 'usuario';
                    } else {
                        origemTextoAtual = 'nenhum';
                    }
                    atualizarEstadoBotaoIA();
                    atualizarEstadoCard(rascunhoSalvo.trim().length > 0);
                    ultimoTextoDigitadoPeloUsuario = rascunhoSalvo;
                }

                // Se o chat alternado não possui rascunho, garante limpeza total do campo nativo do Workdesk
                if (!rascunhoSalvo) {
                    try { limparCampoNativo(); } catch (_) { }
                } else {
                    try { colocarTextoNoCampo(rascunhoSalvo); } catch (_) { }
                }

                removerImagemPendente();
                if (gravandoAudioAtivo) {
                    finalizarGravacaoAudioUI();
                }

                console.log(`[Extensão Softcom] Chat alternado: ${chaveAnterior || 'nenhum'} -> ${chaveAtual}. Rascunho: "${rascunhoSalvo.slice(0, 30)}"`);
            }
        }

        // Vincula cliques para alternar o chat e persistir rascunhos sem perder nenhuma mensagem
        function vincularCliquesCards() {
            // 1. Captura de cliques global com useCapture = true para antecipar qualquer evento de SPA
            if (!document.documentElement.dataset.softcomDraftCaptureHooked) {
                document.documentElement.dataset.softcomDraftCaptureHooked = 'true';

                document.addEventListener('click', (event) => {
                    if (envioMensagemEmAndamento) return;
                    // Ignora cliques dentro do próprio painel do SoftCopilot
                    if (event.target && event.target.closest && event.target.closest('#gemini-docked-panel')) {
                        return;
                    }

                    // Ignora cliques dentro de menus de contexto (ex: menu de responder/reply da mensagem),
                    // modais, popovers e menus de status (ex: dropdown de pausa)
                    if (event.target && event.target.closest && event.target.closest(
                        '[role="menu"], [role="dialog"], [role="menuitem"], [class*="dropdown" i], ' +
                        '[class*="context" i], [class*="menu" i], [class*="popover" i], [class*="modal" i]'
                    )) {
                        return;
                    }

                    const textarea = document.getElementById('gemini-suggestion-text');

                    // Se o clique foi em um card ou item da lista de conversas (apenas na listagem de chats)
                    const cardClicado = event.target.closest && event.target.closest(
                        '[class*="chatCard"], [class*="ticketCard"], [class*="chat-item" i], [class*="ticket-item" i], aside [role="listitem"], aside li'
                    );

                    if (cardClicado && !cardClicado.closest('#gemini-docked-panel')) {
                        const matchTicket = (cardClicado.innerText || '').match(/#(\d{4,8})\b/);
                        if (matchTicket) {
                            const novoKey = 'ticket_' + matchTicket[1];
                            if (novoKey !== ultimoTicketPainel) {
                                // Salva imediatamente o rascunho do chat que estava ativo
                                if (ultimoTicketPainel && textarea) {
                                    salvarRascunhoChat(ultimoTicketPainel, textarea.value);
                                }
                                // Pré-atualiza para o novo ticket (zero latência visual)
                                ultimoTicketPainel = novoKey;
                                let rascunhoNovo = obterRascunhoChat(novoKey) || '';
                                if (rascunhoNovo && ultimoTextoEnviadoRecente.texto && rascunhoNovo.trim() === ultimoTextoEnviadoRecente.texto && (Date.now() - ultimoTextoEnviadoRecente.timestamp < 10000)) {
                                    limparTodosRascunhosDoChatAtual(rascunhoNovo);
                                    rascunhoNovo = '';
                                }
                                if (textarea) {
                                    textarea.value = rascunhoNovo;
                                    textarea.style.height = 'auto';
                                    textarea.style.height = Math.min(120, Math.max(38, textarea.scrollHeight)) + 'px';
                                    const origemSalva = origensTextoPorChat.get(novoKey);
                                    if (rascunhoNovo.trim()) {
                                        origemTextoAtual = origemSalva || 'usuario';
                                    } else {
                                        origemTextoAtual = 'nenhum';
                                    }
                                    atualizarEstadoBotaoIA();
                                    atualizarEstadoCard(rascunhoNovo.trim().length > 0);
                                    ultimoTextoDigitadoPeloUsuario = rascunhoNovo;
                                }
                                removerImagemPendente();
                            }
                        }
                    } else {
                        // Para qualquer outro clique na tela (ex: puxar próximo, abas, etc.)
                        if (ultimoTicketPainel && textarea) {
                            salvarRascunhoChat(ultimoTicketPainel, textarea.value);
                        }
                    }

                    // Verificações suaves para sincronizar após o framework atualizar o DOM
                    setTimeout(verificarTrocaChatPainel, 100);
                    setTimeout(verificarTrocaChatPainel, 350);
                }, true);
            }

            // 2. Vincula também listeners diretos nos elementos identificados como cards
            const chatCards = document.querySelectorAll('[class*="chatCard"], [class*="ticketCard"], [class*="item"]');
            chatCards.forEach(card => {
                if (!card.dataset.greetingHooked) {
                    card.dataset.greetingHooked = 'true';
                    card.addEventListener('click', () => {
                        if (envioMensagemEmAndamento) return;
                        const textarea = document.getElementById('gemini-suggestion-text');
                        if (ultimoTicketPainel && textarea) {
                            salvarRascunhoChat(ultimoTicketPainel, textarea.value);
                        }
                        setTimeout(() => {
                            verificarEEnviarSaudacao();
                            verificarTrocaChatPainel();
                            agendarPreGeracaoSugestao();
                        }, 100);
                    });
                }
            });
        }

        // Verificação rápida periódica (a cada 250ms) para reagir imediatamente assim que um novo chat cair ou alternar
        setInterval(() => {
            verificarEEnviarSaudacao();
            verificarTrocaChatPainel();
        }, 250);

        // =========================================================================
        // LIMPEZA E RESTAURAÇÃO DO LAYOUT ORIGINAL DO WORKDESK
        // =========================================================================
        function limparResiduosModoMelhorado() {
            try {
                localStorage.removeItem('softcom_modo_layout_melhorado');
                sessionStorage.removeItem('softcom_gestores_ativos_tickets');
                document.documentElement.classList.remove('softcom-modern-layout-active');
                document.body.classList.remove('softcom-modern-layout-active');

                const styleLayout = document.getElementById('softcom-modern-layout-styles');
                if (styleLayout) styleLayout.remove();

                const btnToggle = document.getElementById('softcom-toggle-layout-btn');
                if (btnToggle) btnToggle.remove();

                const splitPanel = document.getElementById('softcom-gestor-split-panel');
                if (splitPanel) splitPanel.remove();

                // Remove classes e atributos de layout injetados anteriormente
                document.querySelectorAll(
                    '.softcom-bubble-atendente-clean, .softcom-bubble-cliente-dark, .softcom-card-ativo, ' +
                    '.softcom-btn-puxar-proximo, .softcom-btn-ocorrencia-hidden, .softcom-header-extra-hidden, ' +
                    '[data-softcom-header-extra], [data-softcom-action], [data-softcom-suppressed-toast]'
                ).forEach(el => {
                    el.classList.remove(
                        'softcom-bubble-atendente-clean', 'softcom-bubble-cliente-dark', 'softcom-card-ativo',
                        'softcom-btn-puxar-proximo', 'softcom-btn-ocorrencia-hidden', 'softcom-header-extra-hidden'
                    );
                    delete el.dataset.softcomHeaderExtra;
                    delete el.dataset.softcomAction;
                    delete el.dataset.softcomSuppressedToast;
                    delete el.dataset.softcomGestorHooked;
                    el.style.removeProperty('background');
                    el.style.removeProperty('background-color');
                    el.style.removeProperty('border');
                    el.style.removeProperty('border-color');
                    el.style.removeProperty('color');
                    el.style.removeProperty('box-shadow');
                    el.style.removeProperty('display');
                    el.style.removeProperty('opacity');
                    el.style.removeProperty('pointer-events');
                });
            } catch (_) { }
        }

        // =========================================================================
        // MÓDULO DE REPORT DE BUGS & SUGESTÕES COM ENVIO DE E-MAIL
        // =========================================================================
        const EMAIL_DESTINO_BUG_REPORT = 'nathatargino.dev@gmail.com';

        function encontrarBadgePerfilOperador() {
            // Procura todos os elementos no topo da página (top entre 0 e 80px)
            const todos = Array.from(document.querySelectorAll('div, span, button, a, p, section'));

            // 1. Procura por elementos com texto característico de status ("offline", "online", "ocupado", "pausa")
            const comStatus = todos.filter(el => {
                if (el.id === 'btn-softcom-report-bug' || (el.closest && el.closest('#btn-softcom-report-bug'))) return false;
                const rect = el.getBoundingClientRect();
                if (rect.top >= 0 && rect.top <= 80 && rect.left >= window.innerWidth * 0.4 && rect.height > 0 && rect.height <= 80) {
                    const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
                    return (txt === 'offline' || txt === 'online' || txt === 'ocupado' || txt === 'pausa' ||
                        txt.includes('offline') || txt.includes('online') || txt.includes('ocupado') || txt.includes('pausa')) &&
                        txt.length < 50;
                }
                return false;
            });

            if (comStatus.length > 0) {
                // Sobe a árvore a partir do texto de status para encontrar o container externo do perfil
                for (const el of comStatus) {
                    let cur = el;
                    while (cur && cur.parentElement && cur.parentElement !== document.body && cur.parentElement !== document.documentElement) {
                        const pai = cur.parentElement;
                        const rectCur = cur.getBoundingClientRect();
                        const rectPai = pai.getBoundingClientRect();
                        // O badge do perfil normalmente tem entre 50px e 260px de largura
                        // Quando o pai tem largura significativamente maior que o elemento (ex: barra do topo com sino e tema)
                        if (rectCur.width >= 50 && rectPai.width > rectCur.width + 30 && rectPai.height <= 80) {
                            return cur;
                        }
                        cur = pai;
                    }
                }
                return comStatus[0];
            }

            // 2. Fallback: Procura por elemento contendo "Softcom" ou as iniciais no topo direito
            const comNome = todos.filter(el => {
                if (el.id === 'btn-softcom-report-bug' || (el.closest && el.closest('#btn-softcom-report-bug'))) return false;
                const rect = el.getBoundingClientRect();
                if (rect.top >= 0 && rect.top <= 80 && rect.left >= window.innerWidth * 0.4 && rect.height > 0 && rect.height <= 80) {
                    const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
                    return (txt.includes('softcom') || txt.includes('natha')) && txt.length < 40;
                }
                return false;
            });

            if (comNome.length > 0) {
                let cur = comNome[0];
                while (cur && cur.parentElement && cur.parentElement !== document.body) {
                    const pai = cur.parentElement;
                    if (pai.getBoundingClientRect().width > cur.getBoundingClientRect().width + 30) {
                        return cur;
                    }
                    cur = pai;
                }
                return comNome[0];
            }

            return null;
        }

        function injetarBotaoReportarBugNoCabecalho() {
            const btnExistente = document.getElementById('btn-softcom-report-bug');
            if (btnExistente && document.body.contains(btnExistente)) {
                // Já está presente no DOM - não remove nem reinsere para não conflitar com a reconciliação do React
                return;
            }

            const badge = encontrarBadgePerfilOperador();
            if (!badge || !badge.parentElement) return;

            const btn = document.createElement('button');
            btn.id = 'btn-softcom-report-bug';
            btn.type = 'button';
            btn.title = 'Reportar Bug ou Sugestão (Envia e-mail para nathatargino.dev@gmail.com)';
            btn.setAttribute('aria-label', 'Reportar Bug ou Sugestão');

            btn.innerHTML = `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none; flex-shrink: 0;">
                    <path d="m8 2 1.88 1.88"/>
                    <path d="M14.12 3.88 16 2"/>
                    <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
                    <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/>
                    <path d="M12 20v-9"/>
                    <path d="M6.53 9C4.6 8.8 3 7.1 3 5"/>
                    <path d="M6 13H2"/>
                    <path d="M3 21c0-2.1 1.7-3.9 3.8-4"/>
                    <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/>
                    <path d="M22 13h-4"/>
                    <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>
                </svg>
                <span>Reportar Bugs</span>
            `;

            // Tamanho normal, compacto, perfeitamente integrado no cabeçalho
            btn.style.cssText = `
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 5px !important;
                height: 28px !important;
                min-height: 28px !important;
                max-height: 28px !important;
                width: auto !important;
                min-width: unset !important;
                max-width: fit-content !important;
                flex: 0 0 auto !important;
                align-self: center !important;
                padding: 0 10px !important;
                margin: 0 10px 0 0 !important;
                border-radius: 6px !important;
                background: rgba(239, 68, 68, 0.14) !important;
                color: #fca5a5 !important;
                border: 1px solid rgba(239, 68, 68, 0.42) !important;
                font-family: inherit !important;
                font-size: 11px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                user-select: none !important;
                white-space: nowrap !important;
                box-sizing: border-box !important;
                line-height: 1 !important;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2) !important;
            `;

            btn.onmouseenter = () => {
                btn.style.background = 'rgba(239, 68, 68, 0.26) !important';
                btn.style.borderColor = '#ef4444 !important';
                btn.style.color = '#ffffff !important';
                btn.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.45) !important';
                btn.style.transform = 'translateY(-1px)';
            };
            btn.onmouseleave = () => {
                btn.style.background = 'rgba(239, 68, 68, 0.14) !important';
                btn.style.borderColor = 'rgba(239, 68, 68, 0.42) !important';
                btn.style.color = '#fca5a5 !important';
                btn.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.2) !important';
                btn.style.transform = 'translateY(0)';
            };

            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                abrirModalReportBug();
            };

            // Insere imediatamente antes do badge do operador (ao lado esquerdo de "NS offline Natha Softcom")
            badge.parentElement.insertBefore(btn, badge);
        }

        function abrirModalReportBug() {
            if (document.getElementById('modal-softcom-report-bug-overlay')) {
                const elTitulo = document.getElementById('sw-bug-titulo');
                if (elTitulo) elTitulo.focus();
                return;
            }

            const nomeAtendentePadrao = obterNomeTecnicoCompleto();
            const ticketAtual = obterTicketChatAtivo() || '';
            const ticketDisplay = ticketAtual ? `#${ticketAtual.replace(/^[^\d]*/, '')}` : 'Nenhum chat aberto';
            const clienteAtual = (typeof obterNomeClienteParaSaudacao === 'function' ? obterNomeClienteParaSaudacao() : '') || 'Não identificado';
            const dataHoraAtual = new Date().toLocaleString('pt-BR');
            const resolucaoAtual = `${window.innerWidth}x${window.innerHeight}`;

            const overlay = document.createElement('div');
            overlay.id = 'modal-softcom-report-bug-overlay';
            overlay.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.72);
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                z-index: 9999999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
                box-sizing: border-box;
                animation: softcomFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            `;

            overlay.innerHTML = `
                <div id="modal-softcom-report-bug-content" style="
                    background: #162227;
                    border: 1px solid rgba(227, 180, 0, 0.45);
                    border-radius: 12px;
                    width: 530px;
                    max-width: 100%;
                    max-height: 92vh;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(227, 180, 0, 0.12);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    color: #f4f4f5;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-sizing: border-box;
                ">
                    <!-- CABEÇALHO DO MODAL -->
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 16px 20px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                        background: rgba(0, 0, 0, 0.2);
                    ">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="
                                width: 34px;
                                height: 34px;
                                border-radius: 8px;
                                background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.35));
                                border: 1px solid rgba(239, 68, 68, 0.45);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: #f87171;
                            ">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="m8 2 1.88 1.88"/>
                                    <path d="M14.12 3.88 16 2"/>
                                    <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
                                    <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/>
                                    <path d="M12 20v-9"/>
                                    <path d="M6.53 9C4.6 8.8 3 7.1 3 5"/>
                                    <path d="M6 13H2"/>
                                    <path d="M3 21c0-2.1 1.7-3.9 3.8-4"/>
                                    <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/>
                                    <path d="M22 13h-4"/>
                                    <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>
                                </svg>
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: #ffffff; letter-spacing: 0.2px;">Reportar Bugs & Sugestões</h3>
                                <p style="margin: 2px 0 0 0; font-size: 11.5px; color: #94a3b8;">Destinatário: <span style="color: #E3B400; font-weight: 600;">${EMAIL_DESTINO_BUG_REPORT}</span></p>
                            </div>
                        </div>
                        <button id="btn-softcom-fechar-modal-bug" type="button" title="Fechar" style="
                            background: transparent;
                            border: none;
                            color: #94a3b8;
                            font-size: 18px;
                            width: 28px;
                            height: 28px;
                            border-radius: 6px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        ">✕</button>
                    </div>

                    <!-- CORPO DO MODAL (FORMULÁRIO) -->
                    <div id="modal-softcom-bug-body" style="padding: 18px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px;">
                        <!-- LINHA: ATENDENTE E CATEGORIA -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <label style="display: block; font-size: 11px; font-weight: 600; color: #cbd5e1; margin-bottom: 5px;">Atendente / Autor</label>
                                <input type="text" id="sw-bug-atendente" value="${nomeAtendentePadrao}" style="
                                    width: 100%;
                                    box-sizing: border-box;
                                    padding: 7px 10px;
                                    background: #1B292E;
                                    border: 1px solid #334155;
                                    border-radius: 6px;
                                    color: #f1f5f9;
                                    font-size: 12px;
                                    outline: none;
                                    transition: border-color 0.2s;
                                " />
                            </div>
                            <div>
                                <label style="display: block; font-size: 11px; font-weight: 600; color: #cbd5e1; margin-bottom: 5px;">Categoria / Módulo</label>
                                <select id="sw-bug-categoria" style="
                                    width: 100%;
                                    box-sizing: border-box;
                                    padding: 7px 10px;
                                    background: #1B292E;
                                    border: 1px solid #334155;
                                    border-radius: 6px;
                                    color: #f1f5f9;
                                    font-size: 12px;
                                    outline: none;
                                    cursor: pointer;
                                ">
                                    <option value="Visual / Layout">🐞 Falha Visual ou Layout Quebrado</option>
                                    <option value="Inteligência Artificial">⚡ Inteligência Artificial / Sugestões</option>
                                    <option value="Áudio e Anexos">🎙️ Áudio ou Anexo de Imagens</option>
                                    <option value="Rascunhos e Chats">💬 Rascunhos / Troca de Conversas</option>
                                    <option value="Cadastro do Cliente">👤 Cadastro do Cliente / Ocorrência</option>
                                    <option value="Sugestão de Melhoria">💡 Sugestão de Melhoria</option>
                                    <option value="Outro">❓ Outro Problema</option>
                                </select>
                            </div>
                        </div>

                        <!-- TÍTULO RESUMIDO -->
                        <div>
                            <label style="display: block; font-size: 11px; font-weight: 600; color: #cbd5e1; margin-bottom: 5px;">Título do Bug ou Sugestão *</label>
                            <input type="text" id="sw-bug-titulo" placeholder="Ex: Quebra de layout ao encerrar gravação de áudio" style="
                                width: 100%;
                                box-sizing: border-box;
                                padding: 7px 10px;
                                background: #1B292E;
                                border: 1px solid #334155;
                                border-radius: 6px;
                                color: #f1f5f9;
                                font-size: 12px;
                                outline: none;
                                transition: border-color 0.2s;
                            " />
                        </div>

                        <!-- DESCRIÇÃO DETALHADA -->
                        <div>
                            <label style="display: block; font-size: 11px; font-weight: 600; color: #cbd5e1; margin-bottom: 5px;">Descrição Detalhada *</label>
                            <textarea id="sw-bug-descricao" rows="4" placeholder="Descreva o que aconteceu: passos para reproduzir, comportamento inesperado e detalhes úteis..." style="
                                width: 100%;
                                box-sizing: border-box;
                                padding: 8px 10px;
                                background: #1B292E;
                                border: 1px solid #334155;
                                border-radius: 6px;
                                color: #f1f5f9;
                                font-size: 12px;
                                line-height: 1.45;
                                resize: vertical;
                                min-height: 80px;
                                outline: none;
                                font-family: inherit;
                                transition: border-color 0.2s;
                            "></textarea>
                        </div>

                        <!-- DIAGNÓSTICO AUTOMÁTICO COLETADO EM TEMPO REAL -->
                        <div style="
                            background: rgba(0, 0, 0, 0.28);
                            border: 1px solid rgba(255, 255, 255, 0.08);
                            border-radius: 6px;
                            padding: 8px 12px;
                            font-size: 11px;
                            color: #94a3b8;
                            display: flex;
                            flex-direction: column;
                            gap: 4px;
                        ">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <span style="font-weight: 700; color: #E3B400;">⚙️ Diagnóstico Automático (incluído no e-mail):</span>
                                <span style="color: #64748b; font-size: 10px;">Versão: v2.59</span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; color: #cbd5e1;">
                                <div>• Ticket Atual: <strong style="color: #f1f5f9;">${ticketDisplay}</strong></div>
                                <div>• Cliente: <strong style="color: #f1f5f9;">${clienteAtual}</strong></div>
                                <div>• Horário: <span style="color: #94a3b8;">${dataHoraAtual}</span></div>
                                <div>• Resolução: <span style="color: #94a3b8;">${resolucaoAtual}</span></div>
                            </div>
                        </div>

                        <div id="sw-bug-alert-box" style="display: none; padding: 8px 12px; border-radius: 6px; font-size: 11.5px; font-weight: 500;"></div>
                    </div>

                    <!-- RODAPÉ DO MODAL -->
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: flex-end;
                        padding: 14px 20px;
                        border-top: 1px solid rgba(255, 255, 255, 0.08);
                        background: rgba(0, 0, 0, 0.2);
                        gap: 10px;
                    ">
                        <button id="btn-softcom-bug-cancelar" type="button" style="
                            background: rgba(255, 255, 255, 0.05);
                            border: 1px solid rgba(255, 255, 255, 0.12);
                            color: #cbd5e1;
                            padding: 6px 14px;
                            border-radius: 6px;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        ">Cancelar</button>

                        <button id="btn-softcom-bug-enviar" type="button" style="
                            background: linear-gradient(135deg, #E3B400, #c89b00);
                            border: 1px solid #E3B400;
                            color: #000000;
                            padding: 6px 16px;
                            border-radius: 6px;
                            font-size: 12px;
                            font-weight: 700;
                            cursor: pointer;
                            display: inline-flex;
                            align-items: center;
                            gap: 6px;
                            box-shadow: 0 2px 8px rgba(227, 180, 0, 0.35);
                            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        ">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                            <span>Enviar Report</span>
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Foco inicial
            setTimeout(() => {
                const elTitulo = document.getElementById('sw-bug-titulo');
                if (elTitulo) elTitulo.focus();
            }, 100);

            // Fechamento
            const fecharModal = () => {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.18s ease-out';
                setTimeout(() => overlay.remove(), 180);
            };

            const btnFechar = document.getElementById('btn-softcom-fechar-modal-bug');
            const btnCancelar = document.getElementById('btn-softcom-bug-cancelar');
            if (btnFechar) btnFechar.onclick = fecharModal;
            if (btnCancelar) btnCancelar.onclick = fecharModal;

            // Fechar ao clicar no backdrop (fora do card)
            overlay.onclick = (e) => {
                if (e.target === overlay) fecharModal();
            };

            // Fechar ao pressionar ESC
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    fecharModal();
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);

            // Função para montar objeto com todos os dados
            const obterDadosReport = () => {
                const inputAtendente = document.getElementById('sw-bug-atendente');
                const selectCategoria = document.getElementById('sw-bug-categoria');
                const inputTitulo = document.getElementById('sw-bug-titulo');
                const textareaDescricao = document.getElementById('sw-bug-descricao');

                return {
                    atendente: inputAtendente?.value.trim() || nomeAtendentePadrao,
                    categoria: selectCategoria?.value || 'Geral',
                    titulo: inputTitulo?.value.trim() || '',
                    descricao: textareaDescricao?.value.trim() || '',
                    ticket: ticketDisplay,
                    cliente: clienteAtual,
                    url: window.location.href,
                    versao: '2.59',
                    screen: resolucaoAtual,
                    userAgent: navigator.userAgent,
                    dataHora: dataHoraAtual
                };
            };

            // Envio via FormSubmit
            const btnEnviar = document.getElementById('btn-softcom-bug-enviar');
            const alertBox = document.getElementById('sw-bug-alert-box');

            const exibirAlerta = (msg, tipo = 'erro') => {
                if (!alertBox) return;
                alertBox.style.display = 'block';
                if (tipo === 'erro') {
                    alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
                    alertBox.style.border = '1px solid rgba(239, 68, 68, 0.4)';
                    alertBox.style.color = '#fca5a5';
                } else if (tipo === 'aviso') {
                    alertBox.style.background = 'rgba(234, 179, 8, 0.15)';
                    alertBox.style.border = '1px solid rgba(234, 179, 8, 0.4)';
                    alertBox.style.color = '#fef08a';
                } else {
                    alertBox.style.background = 'rgba(34, 197, 94, 0.15)';
                    alertBox.style.border = '1px solid rgba(34, 197, 94, 0.4)';
                    alertBox.style.color = '#86efac';
                }
                alertBox.innerHTML = msg;
            };

            if (btnEnviar) {
                btnEnviar.onclick = async () => {
                    const dados = obterDadosReport();
                    const inputTitulo = document.getElementById('sw-bug-titulo');
                    const textareaDescricao = document.getElementById('sw-bug-descricao');

                    if (!dados.titulo || dados.titulo.length < 3) {
                        exibirAlerta('⚠️ Por favor, digite um título resumido para o problema.', 'erro');
                        if (inputTitulo) {
                            inputTitulo.style.borderColor = '#ef4444';
                            inputTitulo.focus();
                        }
                        return;
                    }
                    if (!dados.descricao || dados.descricao.length < 5) {
                        exibirAlerta('⚠️ Por favor, descreva com mais detalhes o que aconteceu.', 'erro');
                        if (textareaDescricao) {
                            textareaDescricao.style.borderColor = '#ef4444';
                            textareaDescricao.focus();
                        }
                        return;
                    }

                    // Limpa erros anteriores
                    if (inputTitulo) inputTitulo.style.borderColor = '#334155';
                    if (textareaDescricao) textareaDescricao.style.borderColor = '#334155';
                    if (alertBox) alertBox.style.display = 'none';

                    // Estado de envio
                    btnEnviar.disabled = true;
                    btnEnviar.style.opacity = '0.7';
                    btnEnviar.innerHTML = `
                        <span style="display:inline-block; width:10px; height:10px; border:2px solid rgba(0,0,0,0.3); border-top-color:#000; border-radius:50%; animation:geminiPulseRec 0.8s infinite alternate;"></span>
                        <span>Enviando e-mail...</span>
                    `;

                    async function despacharBugReportDireto(dadosPayload) {
                        try {
                            const resStorage = await new Promise(r => chrome.storage.local.get(['softcom_formsubmit_token'], r));
                            const tokenSalvo = resStorage?.softcom_formsubmit_token?.trim();
                            const target = tokenSalvo || EMAIL_DESTINO_BUG_REPORT;

                            const res = await fetch(`https://formsubmit.co/ajax/${target}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                },
                                body: JSON.stringify({
                                    _subject: `[Workdesk Bug Report] ${dadosPayload.categoria || 'Geral'}: ${dadosPayload.titulo || 'Sem título'}`,
                                    _template: 'table',
                                    _captcha: 'false',
                                    _replyto: EMAIL_DESTINO_BUG_REPORT,
                                    Atendente: dadosPayload.atendente || 'Não informado',
                                    Categoria: dadosPayload.categoria || 'Geral',
                                    Titulo: dadosPayload.titulo || 'Sem título',
                                    Descricao: dadosPayload.descricao || 'Sem descrição',
                                    Ticket_Ativo: dadosPayload.ticket || 'Nenhum',
                                    Cliente_Ativo: dadosPayload.cliente || 'N/A',
                                    URL: window.location.href,
                                    Versao_Extensao: '2.59',
                                    Resolucao_Tela: `${window.screen.width}x${window.screen.height}`,
                                    Navegador: navigator.userAgent,
                                    Data_Hora: new Date().toLocaleString('pt-BR')
                                })
                            });

                            const data = await res.json().catch(() => ({}));
                            const msg = (data.message || '').toLowerCase();
                            const isSuccess = (data.success === 'true' || data.success === true);
                            const isActivation = msg.includes('activation') || msg.includes('activate') || msg.includes('confirm');

                            if (isSuccess) {
                                return { success: true, pendingActivation: false };
                            } else if (isActivation) {
                                return { success: true, pendingActivation: true, message: data.message };
                            } else {
                                return { success: false, error: data.message || `Erro HTTP ${res.status}` };
                            }
                        } catch (errDirect) {
                            console.warn('[Extensão Softcom] Falha no fetch direto do report, tentando via background:', errDirect);
                            return new Promise((resolve) => {
                                chrome.runtime.sendMessage({
                                    action: 'SEND_BUG_REPORT',
                                    payload: dadosPayload
                                }, (bgResp) => {
                                    if (chrome.runtime.lastError) {
                                        resolve({ success: false, error: chrome.runtime.lastError.message });
                                    } else {
                                        resolve(bgResp || { success: false, error: 'Sem resposta do serviço.' });
                                    }
                                });
                            });
                        }
                    }

                    try {
                        despacharBugReportDireto(dados).then((response) => {
                            if (!response || !response.success) {
                                const err = response?.error || 'Erro desconhecido';
                                exibirAlerta(`❌ ${err}. Tente novamente em instantes.`, 'erro');
                                btnEnviar.disabled = false;
                                btnEnviar.style.opacity = '1';
                                btnEnviar.innerHTML = 'Tentar Novamente';
                                return;
                            }

                            // SE EXIGE ATIVAÇÃO INICIAL DO FORMSUBMIT
                            if (response.pendingActivation) {
                                const modalBody = document.getElementById('modal-softcom-bug-body');
                                if (modalBody) {
                                    modalBody.innerHTML = `
                                    <div style="text-align: center; padding: 18px 0; display: flex; flex-direction: column; align-items: center; gap: 14px;">
                                        <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(234, 179, 8, 0.18); border: 2px solid #eab308; display: flex; align-items: center; justify-content: center; font-size: 26px;">
                                            ✉️
                                        </div>
                                        <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #fef08a;">Ativação do Domínio Necessária!</h3>
                                        <p style="margin: 0; font-size: 12.5px; color: #cbd5e1; max-width: 440px; line-height: 1.55;">
                                            O serviço enviou um link de ativação para <strong style="color: #E3B400;">${EMAIL_DESTINO_BUG_REPORT}</strong> com o assunto <em>"Activate form"</em> para autorizar envios deste domínio (<strong>${window.location.hostname}</strong>).
                                        </p>
                                        <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 8px; padding: 12px 16px; max-width: 440px; text-align: left; font-size: 12px; color: #e2e8f0; line-height: 1.55;">
                                            <strong>Instrução rápida:</strong><br/>
                                            1. Abra seu e-mail <strong>${EMAIL_DESTINO_BUG_REPORT}</strong> (veja também na pasta <em>Spam</em>).<br/>
                                            2. Clique em <strong>"Activate Form"</strong> no e-mail mais recente.<br/>
                                            3. Depois clique no botão amarelo abaixo para confirmar o envio!
                                        </div>
                                        <div style="display: flex; gap: 8px; width: 100%; max-width: 440px; margin-top: 6px;">
                                            <button id="btn-softcom-bug-reenviar-apos-ativar" type="button" style="
                                                flex: 1;
                                                background: linear-gradient(135deg, #E3B400, #c89b00);
                                                border: none;
                                                color: #000;
                                                padding: 9px 18px;
                                                border-radius: 6px;
                                                font-size: 12.5px;
                                                font-weight: 700;
                                                cursor: pointer;
                                            ">✅ Já cliquei no e-mail / Reenviar Agora</button>
                                            <button id="btn-softcom-bug-entendido" type="button" style="
                                                background: #27272a;
                                                border: 1px solid #3f3f46;
                                                color: #cbd5e1;
                                                padding: 9px 16px;
                                                border-radius: 6px;
                                                font-size: 12px;
                                                font-weight: 600;
                                                cursor: pointer;
                                            ">Fechar</button>
                                        </div>
                                    </div>
                                `;
                                    const btnReenviar = document.getElementById('btn-softcom-bug-reenviar-apos-ativar');
                                    if (btnReenviar) {
                                        btnReenviar.onclick = () => {
                                            btnReenviar.disabled = true;
                                            btnReenviar.textContent = 'Reenviando...';
                                            despacharBugReportDireto(dados).then((r2) => {
                                                if (r2 && r2.success && !r2.pendingActivation) {
                                                    modalBody.innerHTML = `
                                                    <div style="text-align: center; padding: 22px 0; display: flex; flex-direction: column; align-items: center; gap: 10px;">
                                                        <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(34, 197, 94, 0.18); border: 2px solid #22c55e; display: flex; align-items: center; justify-content: center; font-size: 28px;">✅</div>
                                                        <h3 style="margin: 0; font-size: 17px; font-weight: 700; color: #4ade80;">Report Enviado com Sucesso!</h3>
                                                        <p style="margin: 0; font-size: 12.5px; color: #cbd5e1; max-width: 400px; line-height: 1.5;">O chamado foi entregue diretamente na sua caixa de entrada.</p>
                                                    </div>
                                                `;
                                                    setTimeout(fecharModal, 2500);
                                                } else {
                                                    mostrarNotificacao('⚠️ Ativação ainda pendente no FormSubmit. Verifique o e-mail recente e clique em "Activate Form".', '#f59e0b');
                                                    btnReenviar.disabled = false;
                                                    btnReenviar.textContent = '✅ Já cliquei / Tentar Novamente';
                                                }
                                            });
                                        };
                                    }
                                    const btnEntendido = document.getElementById('btn-softcom-bug-entendido');
                                    if (btnEntendido) {
                                        btnEntendido.onclick = fecharModal;
                                    }
                                }
                                btnEnviar.style.display = 'none';
                                mostrarNotificacao('📧 Ativação enviada para nathatargino.dev@gmail.com!', '#eab308');
                                return;
                            }

                            // SUCESSO TOTAL NO ENVIO
                            const modalBody = document.getElementById('modal-softcom-bug-body');
                            if (modalBody) {
                                modalBody.innerHTML = `
                                    <div style="text-align: center; padding: 22px 0; display: flex; flex-direction: column; align-items: center; gap: 10px;">
                                        <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(34, 197, 94, 0.18); border: 2px solid #22c55e; display: flex; align-items: center; justify-content: center; font-size: 28px;">
                                            ✅
                                        </div>
                                        <h3 style="margin: 0; font-size: 17px; font-weight: 700; color: #4ade80;">Report Enviado com Sucesso!</h3>
                                        <p style="margin: 0; font-size: 12.5px; color: #cbd5e1; max-width: 400px; line-height: 1.5;">
                                            O chamado foi entregue diretamente na caixa de <strong style="color: #E3B400;">${EMAIL_DESTINO_BUG_REPORT}</strong> com todos os detalhes e diagnósticos técnicos.
                                        </p>
                                        <span style="font-size: 11px; color: #64748b; margin-top: 6px;">Obrigado por colaborar com o aprimoramento da extensão!</span>
                                    </div>
                                `;
                            }
                            btnEnviar.style.display = 'none';
                            btnCancelar.textContent = 'Fechar';
                            mostrarNotificacao('✅ Report enviado com sucesso para nathatargino.dev@gmail.com!', '#10b981');
                            setTimeout(fecharModal, 2600);
                        });
                    } catch (err) {
                        console.error('[Extensão Softcom] Exceção ao enviar bug report:', err);
                        exibirAlerta('Erro ao conectar com o serviço de envio. Tente novamente em instantes.', 'erro');
                        btnEnviar.disabled = false;
                        btnEnviar.style.opacity = '1';
                        btnEnviar.innerHTML = 'Tentar Novamente';
                    }
                };
            }
        }

        // =========================================================================
        // SUPRESSÃO DE POPUPS DE PAUSA ("Pausa Iniciada" e "Pausa encerrada")
        // =========================================================================
        function suprimirPopupsPausa(root) {
            if (!root || !root.nodeType) return;

            function ehTextoDePausa(txt) {
                if (!txt || typeof txt !== 'string') return false;
                const limpo = txt.toLowerCase().trim();
                if (limpo.includes('pausa iniciada') || limpo.includes('pausa encerrada')) return true;
                if (limpo.includes('você voltou a ficar online') || limpo.includes('voce voltou a ficar online')) return true;
                return false;
            }

            function processarElemento(el) {
                if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
                if (el.tagName === 'BODY' || el.tagName === 'HTML' || el.id === 'gemini-docked-panel') return;

                // NUNCA suprimir nem interferir em modais, diálogos de confirmação ou menus de opções
                if (el.closest && el.closest('[role="dialog"], [role="menu"], [role="listbox"], [class*="modal" i], [class*="dropdown" i]')) {
                    return;
                }

                const text = el.innerText || el.textContent || '';
                if (!ehTextoDePausa(text)) return;

                // Encontra o container do toast/notificação subindo no DOM
                const container = el.closest(
                    '[role="alert"], [role="status"], .toast, .toastr, .toast-message, ' +
                    '.ant-notification-notice, .ant-notification, .notification, .alert, ' +
                    '.snackbar, [class*="toast" i], [class*="notification" i], [class*="snackbar" i], ' +
                    '[class*="toastContainer" i]'
                );

                let elementoAlvo = container;
                if (!elementoAlvo) {
                    let cur = el;
                    while (cur && cur !== document.body && cur !== document.documentElement) {
                        const style = window.getComputedStyle ? window.getComputedStyle(cur) : null;
                        const isFloating = style && (style.position === 'fixed' || style.position === 'absolute');
                        const isSmallToast = cur.offsetHeight > 0 && cur.offsetHeight <= 120 && cur.offsetWidth < 450;
                        if (isFloating && isSmallToast) {
                            elementoAlvo = cur;
                            break;
                        }
                        cur = cur.parentElement;
                    }
                }

                if (!elementoAlvo && el.offsetHeight > 0 && el.offsetHeight <= 100 && el.offsetWidth < 450) {
                    elementoAlvo = el;
                }

                // Oculta exclusivamente via CSS inline seguro - NUNCA usa .remove() nem .click()
                // Isso mantém a árvore do DOM intacta para que o React Fiber do Workdesk desmonte o nó sem erro
                if (elementoAlvo && elementoAlvo !== document.body && elementoAlvo !== document.documentElement) {
                    elementoAlvo.style.setProperty('display', 'none', 'important');
                    elementoAlvo.style.setProperty('opacity', '0', 'important');
                    elementoAlvo.style.setProperty('visibility', 'hidden', 'important');
                    elementoAlvo.style.setProperty('pointer-events', 'none', 'important');
                    elementoAlvo.style.setProperty('height', '0', 'important');
                    elementoAlvo.style.setProperty('min-height', '0', 'important');
                    elementoAlvo.style.setProperty('max-height', '0', 'important');
                    elementoAlvo.style.setProperty('margin', '0', 'important');
                    elementoAlvo.style.setProperty('padding', '0', 'important');
                    elementoAlvo.style.setProperty('overflow', 'hidden', 'important');
                }
            }

            if (root.nodeType === Node.ELEMENT_NODE) {
                processarElemento(root);
                const potenciais = root.querySelectorAll?.(
                    '[role="alert"], [role="status"], .toast, .toastr, .notification, .alert, .snackbar, ' +
                    'div[class*="toast" i], div[class*="notification" i], div[class*="alert" i]'
                );
                if (potenciais && potenciais.length > 0) {
                    for (let i = 0; i < potenciais.length; i++) {
                        processarElemento(potenciais[i]);
                    }
                }
            }
        }

        let observerAgendado = false;
        let observerExecutando = false;
        function executarCiclosDoObserver() {
            observerAgendado = false;
            observerExecutando = true;
            try { suprimirPopupsPausa(document.body); } catch (_) { }
            try { injetarBotao(); } catch (_) { }
            try { injetarBotaoReportarBugNoCabecalho(); } catch (_) { }
            try { injetarPainelGemini(); } catch (e) { console.error('[Extensão Softcom] Erro ao injetar painel:', e); }
            try { fixarOrdemChats(); } catch (_) { }
            try { vincularCliquesCards(); } catch (_) { }
            try { verificarEEnviarSaudacao(); } catch (_) { }
            try { verificarTrocaChatPainel(); } catch (_) { }
            try { agendarPreGeracaoSugestao(); } catch (_) { }
            observerExecutando = false;
            try { observer.takeRecords(); } catch (e) { }
        }

        const observer = new MutationObserver((mutations) => {
            // Suprime popups de pausa de forma instantânea sem aguardar debounce
            if (mutations && mutations.length > 0) {
                for (let i = 0; i < mutations.length; i++) {
                    const added = mutations[i].addedNodes;
                    if (added && added.length > 0) {
                        for (let j = 0; j < added.length; j++) {
                            suprimirPopupsPausa(added[j]);
                        }
                    }
                }
            }

            // Ignora mutações geradas pela própria execução e agrupa rajadas (debounce de 150ms)
            if (observerExecutando || observerAgendado) return;

            // Ignora mutações que ocorreram exclusivamente dentro do nosso próprio painel
            if (mutations && mutations.length > 0) {
                const todasNossas = mutations.every(m => {
                    const target = m.target;
                    return target && (target.id === 'gemini-docked-panel' || (target.closest && target.closest('#gemini-docked-panel')));
                });
                if (todasNossas) return;
            }

            observerAgendado = true;
            setTimeout(executarCiclosDoObserver, 150);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Execução inicial ao carregar a página
        try { limparResiduosModoMelhorado(); } catch (_) { }
        try { suprimirPopupsPausa(document.body); } catch (_) { }
        setInterval(() => {
            try { suprimirPopupsPausa(document.body); } catch (_) { }
        }, 1200);
        try { injetarBotao(); } catch (_) { }
        try { injetarBotaoReportarBugNoCabecalho(); } catch (_) { }
        try { injetarPainelGemini(); } catch (e) { console.error('[Extensão Softcom] Erro inicial ao injetar painel:', e); }
        try { fixarOrdemChats(); } catch (_) { }
        try { vincularCliquesCards(); } catch (_) { }
        try {
            ultimoTicketPainel = obterChaveIdentificadoraChatAtivo();
            if (ultimoTicketPainel) {
                const rascunhoInicial = obterRascunhoChat(ultimoTicketPainel);
                const textarea = document.getElementById('gemini-suggestion-text');
                if (textarea && rascunhoInicial) {
                    textarea.value = rascunhoInicial;
                    atualizarEstadoCard(true);
                    ultimoTextoDigitadoPeloUsuario = rascunhoInicial;
                }
            }
        } catch (_) { }
        try { verificarTrocaChatPainel(); } catch (_) { }
        try { agendarPreGeracaoSugestao(); } catch (_) { }
        try { verificarAtualizacoesAuto(); } catch (_) { }
        try { exibirPopupNovidadesConfigSePrimeiraVez(); } catch (_) { }
    }
})();
