// Background Service Worker para integração com Google Gemini API e Retaguarda Ultra-Rápida Groq
const DEFAULT_GEMINI_KEY = '';
const DEFAULT_GROQ_KEY = '';

// Inicializa e sincroniza a Base de Conhecimento Mestre (HelpTools + Treinamentos Técnicos)
chrome.runtime.onInstalled.addListener(async () => {
    try {
        const url = chrome.runtime.getURL('manuais_softcom.json');
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            chrome.storage.local.get(['softcom_knowledge_base'], (result) => {
                const atual = result?.softcom_knowledge_base || [];
                if (!atual || atual.length < data.length) {
                    chrome.storage.local.set({ 'softcom_knowledge_base': data }, () => {
                        console.log('[Extensão Softcom] Base de conhecimento pré-carregada no storage:', data.length);
                    });
                }
            });
        }
    } catch (e) {
        console.warn('[Extensão Softcom] Falha ao pré-carregar base mestre:', e);
    }

    // Registra credenciais padrão para report de bugs no storage
    try {
        chrome.storage.local.set({
            softcom_bug_report_config: {
                email: 'nathatargino.dev@gmail.com'
            }
        });
    } catch (_) { }
});

// Suporte a mensagens do content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Validação de segurança: garante que sender.id === chrome.runtime.id
    if (!sender || sender.id !== chrome.runtime.id) {
        return false;
    }

    if (request.action === 'CALL_GEMINI' || request.action === 'CALL_AI') {
        const geminiKey = request.apiKey || DEFAULT_GEMINI_KEY;
        const groqKey = request.groqApiKey || DEFAULT_GROQ_KEY;
        const options = {
            temperature: typeof request.temperature === 'number' ? request.temperature : 0.6,
            maxTokens: typeof request.maxTokens === 'number' ? request.maxTokens : (request.imageData ? 600 : 180),
            imageData: request.imageData || null
        };
        executarChamadaHibrida(geminiKey, groqKey, request.prompt, request.systemInstruction, options)
            .then(resultado => sendResponse({ success: true, text: resultado.text, modelo: resultado.modelo }))
            .catch(erro => sendResponse({ success: false, error: erro.message }));
        return true; // Mantém a porta de comunicação aberta para resposta assíncrona
    }

    if (request.action === 'SEND_BUG_REPORT') {
        tratarEnvioBugReport(request.payload)
            .then(res => sendResponse(res))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    if (request.action === 'CHECK_FOR_UPDATE') {
        fetch('https://raw.githubusercontent.com/nathatargino/nathatargino/main/softcopilot-version.json', { cache: 'no-store' })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => sendResponse({ success: true, latestVersion: data.version }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }
});

// =========================================================================
// MÓDULO DE DISPARO DE REPORT DE BUGS / SUGESTÕES VIA E-MAIL
// =========================================================================
const DEFAULT_BUG_REPORT_EMAIL = 'nathatargino.dev@gmail.com';

async function tratarEnvioBugReport(payload) {
    const recipient = DEFAULT_BUG_REPORT_EMAIL;
    const bodyPayload = {
        _subject: `[Workdesk Bug Report] ${payload?.categoria || 'Geral'}: ${payload?.titulo || 'Sem título'}`,
        _template: 'table',
        _captcha: 'false',
        _replyto: recipient,
        Atendente: payload?.atendente || 'Não informado',
        Categoria: payload?.categoria || 'Geral',
        Titulo: payload?.titulo || 'Sem título',
        Descricao: payload?.descricao || 'Sem descrição',
        Ticket_Ativo: payload?.ticket || 'Nenhum',
        Cliente_Ativo: payload?.cliente || 'N/A',
        URL: payload?.url || '',
        Versao_Extensao: payload?.versao || '2.54',
        Resolucao_Tela: payload?.screen || '',
        Navegador: payload?.userAgent || '',
        Data_Hora: payload?.dataHora || new Date().toLocaleString('pt-BR')
    };

    try {
        const response = await fetch(`https://formsubmit.co/ajax/${recipient}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(bodyPayload)
        });

        const data = await response.json().catch(() => ({}));

        // Registra histórico local no storage
        chrome.storage.local.get(['softcom_bug_reports_history'], (st) => {
            const hist = st?.softcom_bug_reports_history || [];
            hist.push({
                dataHora: payload?.dataHora || new Date().toLocaleString('pt-BR'),
                titulo: payload?.titulo,
                categoria: payload?.categoria,
                status: data.success === 'true' ? 'enviado' : 'pendente_ou_erro',
                retorno: data.message || 'ok'
            });
            if (hist.length > 50) hist.shift();
            chrome.storage.local.set({ softcom_bug_reports_history: hist });
        });

        const msg = (data.message || '').toLowerCase();
        const isSuccess = (data.success === 'true' || data.success === true);
        const isActivation = msg.includes('activation') || msg.includes('activate') || msg.includes('confirm');

        if (isSuccess) {
            return {
                success: true,
                pendingActivation: false,
                message: 'Report enviado com sucesso!'
            };
        } else if (isActivation) {
            return {
                success: true,
                pendingActivation: true,
                message: data.message || 'Ativação inicial do formulário necessária.'
            };
        }

        return {
            success: false,
            error: data.message || `Erro HTTP ${response.status}`
        };
    } catch (e) {
        console.error('[Extensão Softcom] Erro ao enviar report de bug via background:', e);
        return {
            success: false,
            error: e.message || 'Falha de conexão ao enviar o formulário.'
        };
    }
}

// =========================================================================
// MOTOR HÍBRIDO RESILIENTE: GEMINI (ALTA CAPACIDADE) + GROQ (RETAGUARDA ~500ms)
// =========================================================================
const MODELOS_GEMINI_POOL = [
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite'
];

// System Instruction padrão para a IA com diretrizes de atendimento técnico da Softcom (Seção 1 - PROMPTS_COMPLETOS.md)
const DEFAULT_SYSTEM_INSTRUCTION =
    "Você é {{NOME_ATENDENTE_COMPLETO}}, especialista do suporte técnico da Softcom Tecnologia. Redija respostas diretas, empáticas e resolutivas para o chat ao vivo.\n\n" +
    "DIRETRIZES INVIOLÁVEIS:\n" +
    "1. ABERTURA SEM BORDÕES: Proibido iniciar frases com \"Perfeito\", \"Entendi\", \"Compreendo\", \"Certo\" ou \"Com certeza\". Cumprimente pelo nome (\"Olá, {{NOME_CLIENTE}}!\") ou vá direto à orientação (\"Para emitir a nota...\").\n" +
    "2. CONCISÃO: Responda em 2 a 3 frases objetivas, sem justificativas teóricas. Ignore mensagens de bot/URA; responda apenas ao cliente humano.\n" +
    "3. EQUILÍBRIO NO ANYDESK:\n" +
    "   - Rotinas operacionais simples (emissão/cancelamento de NF-e/NFC-e, importação de XML, cadastros, relatórios): NUNCA peça AnyDesk de início; oriente o caminho no sistema pelo chat.\n" +
    "   - Peça AnyDesk APENAS em travamentos, rejeições fiscais complexas ou se o cliente não conseguir após orientação.\n" +
    "   - PROIBIDO pedir AnyDesk se o cliente já enviou o código no histórico.\n" +
    "4. HARDWARE vs. SISTEMA:\n" +
    "   - Impressora de Cupom (bobina 80mm/58mm, NFC-e, PDV) ≠ Impressora de Etiquetas (ribbon, gôndola, Elgin L42, Zebra, Argox). Nunca confunda.\n" +
    "   - Defeito físico (guilhotina/corte travado, cabo rompido, queima): oriente assistência técnica ou TI local; nunca peça AnyDesk.\n" +
    "5. FINALIZAÇÃO E INATIVIDADE (SOP):\n" +
    "   - Etapa 1 (Dúvida Final): Ao resolver ou receber agradecimento (\"obrigado\", \"deu certo\"), pergunte obrigatoriamente: \"Restou alguma dúvida em relação ao seu atendimento? Posso te auxiliar com algo mais?\".\n" +
    "   - Etapa 2 (Encerramento): Só sugira \"Como não restaram mais dúvidas, estarei finalizando este atendimento. Foi um prazer lhe atender! Tenha um excelente dia!\" se a Etapa 1 já foi enviada e o cliente confirmou não ter dúvidas.\n" +
    "   - Em pedido de aguardo interno, peça mais um momento com cordialidade (proibido enviar aviso de falta de contato).\n" +
    "   - Aviso de 6 min sem contato: apenas se a última mensagem do atendente foi uma pergunta/solicitação ao cliente. Aos 12 min, encerramento por inatividade.\n" +
    "6. SAÍDA LIMPA: Retorne estritamente o texto final para o cliente, sem aspas, títulos ou comentários.";

async function executarChamadaHibrida(geminiKey, groqKey, prompt, systemInstruction, options = {}) {
    const keyGemini = (geminiKey && geminiKey.trim()) || DEFAULT_GEMINI_KEY;
    const keyGroq = (groqKey && groqKey.trim()) || DEFAULT_GROQ_KEY;
    const instrucaoEfetiva = systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;
    const temperaturaEfetiva = typeof options?.temperature === 'number' ? options.temperature : 0.6;
    const maxTokensEfetivo = typeof options?.maxTokens === 'number' ? options.maxTokens : 180;
    const imageData = options?.imageData || null; // { mimeType: string, base64: string }

    if (!keyGemini && !keyGroq) {
        throw new Error('Nenhuma chave de API configurada. Clique na engrenagem ⚙️ do SoftCopilot e cole sua chave do Gemini ou da Groq (gratuitas).');
    }

    const controllerGlobal = new AbortController();
    let finalizado = false;
    const erros = [];
    let groqJaDisparado = false;

    // Chamada nativa Google Gemini API
    const chamarGemini = async (modelo) => {
        if (finalizado || controllerGlobal.signal.aborted) return null;
        if (!keyGemini) throw new Error(`[Gemini:${modelo}] Chave de API do Gemini não configurada.`);

        const parts = [];
        if (imageData && imageData.base64 && imageData.mimeType) {
            parts.push({
                inline_data: {
                    mime_type: imageData.mimeType,
                    data: imageData.base64
                }
            });
        }
        parts.push({ text: prompt });

        const bodyPayload = {
            contents: [{ role: "user", parts: parts }],
            generationConfig: { temperature: temperaturaEfetiva, maxOutputTokens: maxTokensEfetivo }
        };
        if (instrucaoEfetiva) {
            bodyPayload.system_instruction = { parts: [{ text: instrucaoEfetiva }] };
        }

        const apiKey = keyGemini.trim();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            signal: controllerGlobal.signal,
            body: JSON.stringify(bodyPayload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const msg = errorData.error?.message || `Erro HTTP ${response.status}`;
            throw new Error(`[Gemini:${modelo}] ${msg}`);
        }

        const data = await response.json();
        const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textPart && textPart.trim()) {
            return { text: textPart.trim(), modelo: modelo };
        }
        throw new Error(`[Gemini:${modelo}] Resposta vazia da IA.`);
    };

    // Chamada ultra-rápida Groq LPU API (Retaguarda)
    const chamarGroq = async (modelo = 'qwen/qwen3.8-27b') => {
        if (finalizado || controllerGlobal.signal.aborted) return null;
        if (!keyGroq) throw new Error(`[Groq:${modelo}] Chave de API da Groq não configurada.`);

        // Se houver anexo não suportado pelo Groq (ex: PDF), delega exclusivamente ao Gemini
        if (imageData && (!imageData.mimeType || !imageData.mimeType.startsWith('image/'))) {
            throw new Error(`[Groq:${modelo}] Formato de anexo não suportado no Groq; delegado ao Gemini.`);
        }

        const modeloGroqEfetivo = (imageData && imageData.base64 && imageData.mimeType?.startsWith('image/'))
            ? 'llama-3.2-11b-vision-preview'
            : modelo;

        const messages = [];
        if (instrucaoEfetiva) {
            messages.push({ role: 'system', content: instrucaoEfetiva });
        }

        if (imageData && imageData.base64 && imageData.mimeType?.startsWith('image/')) {
            messages.push({
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:${imageData.mimeType};base64,${imageData.base64}`
                        }
                    }
                ]
            });
        } else {
            messages.push({ role: 'user', content: prompt });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${keyGroq.trim()}`,
                'Content-Type': 'application/json'
            },
            signal: controllerGlobal.signal,
            body: JSON.stringify({
                model: modeloGroqEfetivo,
                messages: messages,
                temperature: temperaturaEfetiva,
                max_tokens: maxTokensEfetivo
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const msg = errorData.error?.message || `Erro HTTP ${response.status}`;
            throw new Error(`[Groq:${modeloGroqEfetivo}] ${msg}`);
        }

        const data = await response.json();
        const textPart = data.choices?.[0]?.message?.content;
        if (textPart && textPart.trim()) {
            const nomeCurto = modeloGroqEfetivo.split('/')[1] || modeloGroqEfetivo;
            return { text: textPart.trim(), modelo: `Groq (${nomeCurto})` };
        }
        throw new Error(`[Groq:${modeloGroqEfetivo}] Resposta vazia da IA.`);
    };

    return new Promise((resolve, reject) => {
        const timeoutTotal = setTimeout(() => {
            if (!finalizado) {
                finalizado = true;
                controllerGlobal.abort();
                reject(new Error('Os servidores da IA estão em alta demanda temporária. Tente novamente em instantes.'));
            }
        }, 25000);

        let concluidos = 0;
        let totalTarefas = 0;
        let geminiIndexDisparado = 0;

        const registrarSucesso = (res) => {
            if (!finalizado && res && res.text) {
                finalizado = true;
                clearTimeout(timeoutTotal);
                controllerGlobal.abort();
                console.log(`[Extensão Softcom] Sucesso: modelo ${res.modelo} respondeu.`);
                resolve(res);
            }
        };

        const registrarErro = (origem, err) => {
            const msg = err?.message || '';
            if (!msg.toLowerCase().includes('abort')) {
                erros.push(msg);
                console.warn(`[Extensão Softcom] Falha em ${origem}: ${msg}`);
            }

            // SE QUALQUER GEMINI FALHAR: FAILOVER INSTANTÂNEO NO GEMINI E NO GROQ
            if (origem.startsWith('Gemini') && !finalizado) {
                if (geminiIndexDisparado < MODELOS_GEMINI_POOL.length) {
                    dispararProximoGemini('Failover Imediato por instabilidade');
                }
                if (!groqJaDisparado) {
                    dispararGroq('Failover Gemini');
                }
            }

            concluidos++;
            if (concluidos >= totalTarefas && !finalizado) {
                // Antes de desistir, se ainda houver modelo Gemini elegível no pool que não foi disparado, tenta-o
                if (geminiIndexDisparado < MODELOS_GEMINI_POOL.length) {
                    dispararProximoGemini('Tentativa de resgate');
                    return;
                }

                finalizado = true;
                clearTimeout(timeoutTotal);
                const temQuota = erros.some(e => e.includes('quota') || e.includes('Quota exceeded') || e.includes('429'));
                const tem503 = erros.some(e => e.includes('demand') || e.includes('unavailable') || e.includes('503'));
                if (temQuota) {
                    reject(new Error('Limite diário atingido na chave padrão. Configure sua chave própria no ícone de engrenagem ⚙️ do SoftCopilot.'));
                } else if (tem503) {
                    reject(new Error('Os servidores da IA estão temporariamente em alta demanda. Tente novamente em instantes.'));
                } else {
                    reject(new Error(erros.join(' | ') || 'Alta demanda nos servidores da IA.'));
                }
            }
        };

        const dispararProximoGemini = (motivo = '') => {
            if (finalizado || geminiIndexDisparado >= MODELOS_GEMINI_POOL.length) return;
            const modelo = MODELOS_GEMINI_POOL[geminiIndexDisparado++];
            totalTarefas++;
            console.log(`[Extensão Softcom] Disparando Gemini [${modelo}] (${motivo})...`);
            chamarGemini(modelo)
                .then(registrarSucesso)
                .catch(err => registrarErro(`Gemini:${modelo}`, err));
        };

        const dispararGroq = (motivo = 'Hedging') => {
            if (finalizado || groqJaDisparado) return;
            groqJaDisparado = true;
            totalTarefas++;
            console.log(`[Extensão Softcom] Disparando Groq Retaguarda (${motivo})...`);
            chamarGroq('qwen/qwen3.8-27b')
                .then(registrarSucesso)
                .catch(err => {
                    // Se qwen oscilar, tenta gpt-oss-120b no Groq como segurança
                    if (!finalizado) {
                        totalTarefas++;
                        chamarGroq('openai/gpt-oss-120b')
                            .then(registrarSucesso)
                            .catch(e2 => registrarErro('Groq:gpt-oss-120b', e2));
                    }
                    registrarErro('Groq:qwen3.8-27b', err);
                });
        };

        // 1. T=0ms: Dispara o modelo primário mais rápido e estável do Gemini
        dispararProximoGemini('Primário');

        // 2. T=1500ms: Dispara Groq Retaguarda caso o Gemini demore mais de 1.5s
        setTimeout(() => {
            if (!finalizado && !groqJaDisparado) {
                dispararGroq('Hedging por latência no Gemini > 1.5s');
            }
        }, 1500);

        // 3. T=3000ms: Se ainda não finalizou, dispara modelo de contingência adicional do Gemini
        setTimeout(() => {
            if (!finalizado && geminiIndexDisparado < MODELOS_GEMINI_POOL.length) {
                dispararProximoGemini('Contingência agendada');
            }
        }, 3000);
    });
}
