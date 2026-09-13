/*==================== DADOS DOS PROJETOS (MODAL DETALHADO) ====================*/
const projetosData = {
    "concord": {
        titulo: "Concord",
        categoria: "Web & Desktop (Electron)",
        imagens: [
            "/images/concord.png",
            "/images/concord-chat.png",
            "/images/concord-video.png"
        ],
        tags: ["React", "Electron", ".NET / C#", "SignalR", "WebRTC", "Audio Streaming"],
        descricao: "O Concord é uma plataforma completa de comunicação em tempo real inspirada no Discord. O projeto foi concebido e estruturado inicialmente em .NET para os serviços de mensageria e sinalização; posteriormente, sua interface web foi totalmente migrada para React, alcançando altíssima reatividade e fluidez no navegador. Para a experiência Desktop nativa multiplataforma, foi desenvolvido com Electron. O ecossistema suporta chamadas de voz de baixíssima latência via WebRTC, canais de texto dinâmicos com SignalR, salas permanentes e temporárias com expiração automática em 14 horas, além de streaming de áudio e vídeo compartilhado.",
        recursos: [
            "Arquitetura multiplataforma: Aplicação Web em React e versão Desktop nativa empacotada com Electron.",
            "Evolução arquitetural: Inicialmente estruturado em .NET e migrado para ecossistema React moderno.",
            "Comunicação por voz peer-to-peer criptografada de ponta a ponta com WebRTC.",
            "Chat instantâneo e sinalização de presença em tempo real via SignalR.",
            "Salas permanentes e salas temporárias com ciclo de vida automático de 14 horas.",
            "Streaming de áudio e música sincronizados entre todos os participantes da chamada."
        ],
        stack: [
            { nome: "React", desc: "Front-end reativo moderno com componentes modulares" },
            { nome: "Electron", desc: "Aplicação Desktop nativa para Windows, macOS e Linux" },
            { nome: ".NET / C#", desc: "Arquitetura base original e inteligência de sinalização" },
            { nome: "SignalR & WebRTC", desc: "Mensageria instantânea e voz peer-to-peer de baixa latência" }
        ],
        linkDemo: "https://concord-olive.vercel.app/",
        linkGithub: "https://github.com/nathatargino/Concord-Repo/",
        isPrivate: false
    },
    "deskjet-ai": {
        titulo: "Deskjet AI",
        categoria: "Automação Multimodal & IA",
        imagens: [
            "/images/deskjet-bot.png",
            "/images/deskjet-dashboard.png",
            "/images/deskjet-charts.png",
            "/images/deskjet-table.png"
        ],
        tags: ["Google Gemini AI", "n8n Workflows", "Multimodal (Áudio, Voz e OCR)", "Google Sheets API", "WhatsApp API", "Dashboard Reativo"],
        descricao: "O Deskjet AI é um assistente financeiro inteligente e multimodal de alta produtividade. Através do WhatsApp com orquestração via n8n, o bot é capaz de compreender mensagens de texto, gravações de áudio/voz e fotografias de comprovantes ou notas fiscais físicas. O modelo Google Gemini realiza a análise multimodal completa: transcreve a voz, executa OCR em notas fiscais, extrai valores, datas e estabelecimentos, e categoriza automaticamente as despesas. Todos os dados são sincronizados instantaneamente com o Google Sheets e visualizados em um dashboard analítico reativo com gráficos de evolução, horários de pico e recomendações inteligentes de economia.",
        recursos: [
            "Entrada Multimodal Inteligente: Compreensão de mensagens em texto, áudios/notas de voz e fotos de comprovantes fiscais com OCR.",
            "Processamento com Google Gemini: Análise contextual, extração precisa de valores e categorização preditiva instantânea.",
            "Orquestração via n8n: Pipelines automatizados conectando mensageria, IA generativa e bancos de dados em nuvem.",
            "Sincronização em Tempo Real com Google Sheets: Persistência estruturada e atualização bidirecional contínua.",
            "Dashboard Analítico Avançado: Gráficos de evolução diária, distribuição por categoria, top 5 maiores despesas e horários de pico.",
            "Auditoria Completa de Lançamentos: Tabela dinâmica com filtros avançados de busca e exportação para CSV e PDF."
        ],
        stack: [
            { nome: "Google Gemini AI", desc: "Análise multimodal de texto, áudio/voz e visão computacional em comprovantes" },
            { nome: "n8n Workflow", desc: "Orquestração de fluxos automatizados, webhooks e regras de negócio" },
            { nome: "Google Sheets API", desc: "Armazenamento estruturado e persistência de despesas na nuvem" },
            { nome: "Dashboard Reativo", desc: "Interface analítica em tempo real com métricas, gráficos e exportação" }
        ],
        linkDemo: "https://financeai-sigma-six.vercel.app/",
        linkGithub: "",
        isPrivate: true
    },
    "auracommerce": {
        titulo: "AuraCommerce",
        categoria: "Full Stack .NET",
        imagens: [
            "/images/auracommerce.png",
            "/images/auracommerce-vendedores.png",
            "/images/auracommerce-vendas.png"
        ],
        tags: ["ASP.NET Core MVC", "C#", "LINQ", "SQL Server", "Entity Framework Core", "Azure"],
        descricao: "Sistema corporativo de gestão comercial e controle de vendas desenvolvido com ASP.NET Core MVC e C#. O AuraCommerce centraliza a governança de departamentos corporativos, cadastros e controle de equipes de vendedores e histórico operacional de vendas. Oferece consultas analíticas com filtros por período (busca simples e agrupada), cálculo automatizado de totalizadores em LINQ, operações transacionais completas de CRUD com validação de modelos e persistência íntegra em SQL Server.",
        recursos: [
            "Gestão Estruturada de Departamentos: Organização e visualização dos setores da empresa.",
            "Controle Completo de Vendedores: Gestão de equipe de vendas, salários base, e-mails e histórico com operações CRUD.",
            "Filtros Dinâmicos de Vendas: Módulo de busca simples por intervalo de datas (Min/Max) com status de pedidos.",
            "Cálculos em Tempo Real com LINQ: Agregação e somatório automático de faturamento total do período selecionado.",
            "Persistência e Integridade: Modelagem relacional em SQL Server com Entity Framework Core e tratamento de concorrência.",
            "Interface Moderna e Fluida: Layout escuro com navegação intuitiva e tabelas com ações rápidas de edição, visualização e exclusão."
        ],
        stack: [
            { nome: "ASP.NET Core MVC", desc: "Arquitetura corporativa em C# com padrão MVC e controllers modulares" },
            { nome: "LINQ & EF Core", desc: "Mapeamento objeto-relacional, agregação de vendas e queries performáticas" },
            { nome: "SQL Server", desc: "Modelagem de dados, chaves estrangeiras e integridade transacional" },
            { nome: "Microsoft Azure", desc: "Deploy em nuvem de alta disponibilidade com App Service" }
        ],
        linkDemo: "https://auracommerce.azurewebsites.net/",
        linkGithub: "https://github.com/nathatargino/AuraCommerce",
        isPrivate: false
    },
    "aurascale": {
        titulo: "AuraScale",
        categoria: "Gestão & Escalas Corporativas",
        imagens: [
            "/images/aurascale.png",
            "/images/aurascale-dashboard.png"
        ],
        tags: ["C# .NET", "Algoritmos de Escala", "Gestão 5x2 e 6x1", "Painel de Rodízios", "SQL Server", "Azure Cloud"],
        descricao: "Solução especializada para planejamento, gestão e otimização de escalas de colaboradores e turnos de trabalho (do modelo 5x2 ao 6x1). O AuraScale automatiza a distribuição de folgas, controle de horas extras e regras de descanso de segunda a domingo. Oferece um Painel de Gestão centralizado com telemetria da equipe (equipe total, colaboradores trabalhando e folgas ativas). (Aviso: A hospedagem online deste projeto encontra-se temporariamente pausada para manutenção técnica).",
        recursos: [
            "Algoritmo inteligente de distribuição de turnos e prevenção de choques de escala (5x2 e 6x1).",
            "Painel de Gestão e Rodízios: Métricas de colaboradores ativos, de folga e modelos de escala.",
            "Gestão preventiva de horas extras e conformidade com intervalos legais de descanso.",
            "Módulo de geração e exportação de relatórios de cobertura de turnos.",
            "Arquitetura com ASP.NET Core, modelagem relacional em SQL Server e deploy em nuvem na Azure."
        ],
        stack: [
            { nome: "C# / .NET", desc: "Lógica de negócio, regras de rodízio e cálculos de grade" },
            { nome: "SQL Server", desc: "Modelagem de colaboradores, jornadas e históricos de escalas" },
            { nome: "ASP.NET Core", desc: "Camada de APIs, controladores e validações" },
            { nome: "Microsoft Azure", desc: "Infraestrutura corporativa em nuvem" }
        ],
        linkDemo: null,
        isPaused: true,
        avisoPausado: "AuraScale: A hospedagem online está temporariamente pausada para manutenção técnica. O repositório segue acessível no GitHub!",
        linkGithub: "https://github.com/nathatargino/AuraScale",
        isPrivate: false
    },
    "infinitedex": {
        titulo: "InfiniteDex",
        categoria: "Consumo de API & Front-End",
        imagens: [
            "/images/infinitedex.png",
            "/images/infinitedex-light.png",
            "/images/infinitedex-busca.png"
        ],
        tags: ["JavaScript ES6+", "PokéAPI REST", "Dark/Light Mode", "Filtros Reativos", "UI/UX Fluida"],
        descricao: "Catálogo interativo de alta performance que consome e normaliza dados da PokéAPI pública em tempo real. Implementa busca instantânea com debounce por nome e número, alternância completa de tema (Dark e Light Mode com persistência de preferência), cards dinâmicos categorizados por tipos elementares com paleta de cores dedicada e renderização assíncrona fluida.",
        recursos: [
            "Alternância Dinâmica de Tema: Suporte completo a Dark Mode e Light Mode com chaveamento instantâneo de interface.",
            "Busca Instantânea Inteligente: Filtragem em tempo real por nome ou número do Pokémon com alta responsividade.",
            "Consumo Assíncrono com PokéAPI: Requisições otimizadas via Fetch API e Promises para carregamento sem travamentos.",
            "Cards Estilizados por Tipo: Paleta visual adaptativa baseada nos elementos (Planta, Fogo, Água, Inseto, Veneno, etc.).",
            "Design Responsivo e Fluido: Layout adaptável para qualquer resolução de tela (desktop, tablet e mobile)."
        ],
        stack: [
            { nome: "JavaScript Moderno", desc: "Manipulação avançada de DOM, Fetch API, Async/Await e estados" },
            { nome: "PokéAPI REST", desc: "Consumo assíncrono de dados oficiais de monstros de bolso" },
            { nome: "CSS3 Dinâmico", desc: "Variáveis de tema Dark/Light, Grid fluido e transições suaves" },
            { nome: "GitHub Pages", desc: "Deploy contínuo e hospedagem rápida" }
        ],
        linkDemo: "https://nathatargino.github.io/Pokedex-integrado-ao-PokeApi-/",
        linkGithub: "https://github.com/nathatargino/Pokedex-integrado-ao-PokeApi-",
        isPrivate: false
    },
    "servermaster": {
        titulo: "Server Master",
        categoria: "Desktop C# .NET 8 (Avalonia UI)",
        imagens: [
            "/images/servermaster.png",
            "/images/servermaster-console.png",
            "/images/servermaster-wizard.png"
        ],
        tags: ["C# .NET 8", "Avalonia UI (XAML)", "CommunityToolkit.Mvvm", "Rx.NET", "Playit.gg API", "Google Drive API", "System.Diagnostics"],
        descricao: "O Server Master é uma aplicação Desktop completa para gerenciamento e hospedagem de servidores de jogos multiplayer (Minecraft e Hytale). Desenvolvido com C# .NET 8 e Avalonia UI (XAML moderno multiplataforma), o aplicativo elimina a necessidade de configurações complexas de rede, roteador ou CGNAT através da integração nativa com os túneis dinâmicos do Playit.gg. O ecossistema conta com telemetria de hardware em tempo real (CPU, RAM alocada e Uptime), console reativo para visualização de logs e envio de comandos, além de rotinas de backup duplo (armazenamento local e sincronização automática na nuvem com o Google Drive).",
        recursos: [
            "Criação Guiada (Wizard Multi-Step): Passos simplificados para configurar motor do jogo, memória RAM, rede e módulos para Minecraft (Paper, Purpur, Forge, Fabric) e Hytale.",
            "Túnel Global Playit.gg: Instâncias automáticas e isoladas de túneis seguros que permitem amigos jogarem juntos sem abrir portas no roteador (sem CGNAT/Port-Forwarding).",
            "Telemetria em Tempo Real: Monitoramento contínuo de CPU, memória RAM e tempo de atividade com métricas reativas via System.Diagnostics e Rx.NET.",
            "Console e Terminal Integrado: Leitura assíncrona de StandardOutput/Error com filtros rápidos (INFO, WARN, ERR, CHAT) e envio de comandos via RCON / stdin.",
            "Sistema de Backup Duplo: Salvamento automatizado de mundos e dados tanto em diretório local quanto em nuvem integrado com o Google Drive.",
            "Interface Desktop Fluida: Dark Mode moderno construído sobre o Avalonia UI com animações suaves e arquitetura reativa MVVM."
        ],
        stack: [
            { nome: "C# & .NET 8", desc: "Núcleo de alta performance para controle de processos e ciclo de vida dos servidores" },
            { nome: "Avalonia UI", desc: "Framework XAML moderno para entrega de aplicações Desktop elegantes e multiplataforma" },
            { nome: "MVVM & Rx.NET", desc: "CommunityToolkit.Mvvm com Source Generators e fluxos reativos assíncronos para telemetria" },
            { nome: "Playit.gg & Google Drive", desc: "Túneis dinâmicos de rede global e sincronização automática de backups em nuvem" }
        ],
        linkDemo: "https://github.com/nathatargino/ServerMaster/releases/download/v1.0.7-20260903211230/ServerMaster-Setup.exe",
        textoDemo: "Baixar Aplicação (.exe)",
        iconeDemo: "bx bx-download",
        linkGithub: "https://github.com/nathatargino/ServerMaster/",
        isPrivate: false
    }
};

/*==================== CARROSSEL / SCROLL AUTOMÁTICO DE FOTOS ====================*/
let carouselTimer = null;
let currentSlideIndex = 0;
let currentImagesList = [];
let isCarouselPaused = false;

function renderizarCarousel(imagens, titulo) {
    currentImagesList = (imagens && imagens.length > 0) ? imagens : ["/images/favicon.png"];
    currentSlideIndex = 0;

    const track = document.getElementById('modalCarouselTrack');
    const dotsContainer = document.getElementById('modalCarouselDots');
    const btnPrev = document.getElementById('carouselPrev');
    const btnNext = document.getElementById('carouselNext');

    if (!track) return;

    // Renderiza slides
    track.innerHTML = currentImagesList.map((imgUrl, i) => `
        <div class="carousel-slide">
            <img src="${imgUrl}" alt="${titulo} - Foto ${i + 1}" loading="lazy">
        </div>
    `).join('');

    track.style.transform = 'translateX(0%)';

    // Se tiver mais de uma imagem, habilita controles e auto-scroll
    if (currentImagesList.length > 1) {
        if (btnPrev) btnPrev.style.display = "flex";
        if (btnNext) btnNext.style.display = "flex";
        if (dotsContainer) {
            dotsContainer.style.display = "flex";
            dotsContainer.innerHTML = currentImagesList.map((_, i) => `
                <span class="carousel-dot ${i === 0 ? 'active' : ''}" onclick="irParaSlide(${i})" title="Foto ${i + 1}"></span>
            `).join('');
        }
        iniciarAutoScroll();
    } else {
        if (btnPrev) btnPrev.style.display = "none";
        if (btnNext) btnNext.style.display = "none";
        if (dotsContainer) dotsContainer.style.display = "none";
        pararAutoScroll();
    }
}

function irParaSlide(index) {
    if (!currentImagesList || currentImagesList.length <= 1) return;
    currentSlideIndex = (index + currentImagesList.length) % currentImagesList.length;

    const track = document.getElementById('modalCarouselTrack');
    if (track) {
        track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    }

    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentSlideIndex);
    });
}

function mudarSlideManual(direcao) {
    irParaSlide(currentSlideIndex + direcao);
    reiniciarAutoScroll();
}

function iniciarAutoScroll() {
    pararAutoScroll();
    if (currentImagesList && currentImagesList.length > 1) {
        carouselTimer = setInterval(() => {
            if (!isCarouselPaused) {
                irParaSlide(currentSlideIndex + 1);
            }
        }, 3500); // transição a cada 3.5 segundos
    }
}

function pararAutoScroll() {
    if (carouselTimer) {
        clearInterval(carouselTimer);
        carouselTimer = null;
    }
}

function reiniciarAutoScroll() {
    pararAutoScroll();
    iniciarAutoScroll();
}

// Pausa ao passar o mouse sobre a imagem
const bannerWrap = document.getElementById('modalBannerWrap');
if (bannerWrap) {
    bannerWrap.addEventListener('mouseenter', () => {
        isCarouselPaused = true;
    });
    bannerWrap.addEventListener('mouseleave', () => {
        isCarouselPaused = false;
    });
}

/*==================== MODAL DE DETALHES DO PROJETO ====================*/
function abrirModalProjeto(projetoId) {
    const p = projetosData[projetoId];
    if (!p) return;

    const modal = document.getElementById('modalProjeto');
    if (!modal) return;

    // Renderiza carrossel com auto-scroll
    const imagens = p.imagens && p.imagens.length > 0 ? p.imagens : [p.img];
    renderizarCarousel(imagens, p.titulo);

    document.getElementById('modalCategoria').innerText = p.categoria;
    document.getElementById('modalTitulo').innerText = p.titulo;
    document.getElementById('modalDescricao').innerText = p.descricao;

    // Tags
    const tagsContainer = document.getElementById('modalTags');
    tagsContainer.innerHTML = p.tags.map(t => `<span class="modal-tag">${t}</span>`).join('');

    // Recursos
    const recursosList = document.getElementById('modalRecursos');
    recursosList.innerHTML = p.recursos.map(r => `<li><i class='bx bx-check-circle'></i> <span>${r}</span></li>`).join('');

    // Stack
    const stackContainer = document.getElementById('modalStack');
    stackContainer.innerHTML = p.stack.map(s => `
        <div class="stack-card">
            <strong>${s.nome}</strong>
            <small>${s.desc}</small>
        </div>
    `).join('');

    // Links de ação
    const btnDemo = document.getElementById('modalLinkDemo');
    const btnGithub = document.getElementById('modalLinkGithub');
    const avisoPrivado = document.getElementById('modalAvisoPrivado');
    const avisoPausado = document.getElementById('modalAvisoPausado');

    if (p.isPaused) {
        btnDemo.style.display = "none";
        if (avisoPausado) {
            avisoPausado.style.display = "inline-flex";
            avisoPausado.onclick = () => {
                mostrarToastAviso(p.avisoPausado || "AuraScale: Aplicação online temporariamente pausada para manutenção.");
            };
        }
    } else {
        if (avisoPausado) avisoPausado.style.display = "none";
        if (p.linkDemo) {
            btnDemo.href = p.linkDemo;
            btnDemo.style.display = "inline-flex";
            if (p.textoDemo) {
                btnDemo.innerHTML = `<i class='${p.iconeDemo || "bx bx-download"}'></i> ${p.textoDemo}`;
            } else {
                btnDemo.innerHTML = `<i class='bx bx-link-external'></i> Acessar Aplicação Online`;
            }
        } else {
            btnDemo.style.display = "none";
        }
    }

    if (p.isPrivate || !p.linkGithub) {
        btnGithub.style.display = "none";
        avisoPrivado.style.display = "inline-flex";
    } else {
        btnGithub.href = p.linkGithub;
        btnGithub.style.display = "inline-flex";
        avisoPrivado.style.display = "none";
    }

    // Abre o modal
    modal.classList.add('active');
    document.body.style.overflow = "hidden"; // trava o scroll de fundo
}

function fecharModalProjeto() {
    const modal = document.getElementById('modalProjeto');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = ""; // restaura o scroll
    pararAutoScroll();
}

// Fechamento ao clicar fora ou na tecla ESC
window.addEventListener('click', (e) => {
    const modalProjeto = document.getElementById('modalProjeto');
    if (modalProjeto && e.target === modalProjeto) {
        fecharModalProjeto();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        fecharModalProjeto();
        fecharModal();
    }
});

/*==================== NAVEGAÇÃO & HEADER FLUTUANTE ====================*/
const menuIcon = document.querySelector('#icone-menu');
const navbar = document.querySelector('.navbar');
const header = document.querySelector('.header');
const navLinks = document.querySelectorAll('.navbar a');
const sections = document.querySelectorAll('section');

// Toggle menu mobile
if (menuIcon && navbar) {
    menuIcon.onclick = () => {
        menuIcon.classList.toggle('bx-x');
        navbar.classList.toggle('active');
    };
}

// Fecha navbar ao clicar em qualquer item (mobile)
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (navbar && navbar.classList.contains('active')) {
            navbar.classList.remove('active');
            if (menuIcon) menuIcon.classList.remove('bx-x');
        }
    });
});

// Scroll spy & sticky header
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // Header sticky com efeito condensado
    if (header) {
        header.classList.toggle('sticky', scrollY > 60);
    }

    // Active link indicator
    sections.forEach(sec => {
        const top = scrollY;
        const offset = sec.offsetTop - 180;
        const height = sec.offsetHeight;
        const id = sec.getAttribute('id');

        if (top >= offset && top < offset + height) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${id}`) {
                    link.classList.add('active');
                }
            });
        }
    });
});

/*==================== TYPED JS ====================*/
if (document.querySelector('.multiplo-texto')) {
    new Typed('.multiplo-texto', {
        strings: ['Full Stack .NET', 'C#', 'ASP.NET Core', 'SQL Server e API´s', 'Automações e IA'],
        typeSpeed: 80,
        backSpeed: 50,
        backDelay: 1400,
        loop: true
    });
}

/*==================== SCROLL REVEAL ====================*/
if (typeof ScrollReveal !== 'undefined') {
    const sr = ScrollReveal({
        distance: '40px',
        duration: 1000,
        delay: 150,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        reset: false
    });

    sr.reveal('.status-badge, .hero-greeting', { delay: 100, origin: 'top' });
    sr.reveal('.hero-title, .hero-role', { delay: 200, origin: 'left' });
    sr.reveal('.hero-description, .hero-tech-pills', { delay: 300, origin: 'right' });
    sr.reveal('.hero-actions, .social-media', { delay: 400, origin: 'bottom' });

    sr.reveal('.section-header', { delay: 150, origin: 'top' });
    sr.reveal('.bento-card', { interval: 150, origin: 'bottom' });
    sr.reveal('.caixa-de-servicos', { interval: 120, origin: 'bottom' });
    sr.reveal('.caixa-do-portfolio', { interval: 120, origin: 'bottom' });
    sr.reveal('.contato-info-card', { delay: 200, origin: 'left' });
    sr.reveal('.contato-form-card', { delay: 300, origin: 'right' });
}

/*==================== DOWNLOAD CV ====================*/
const cvBtn = document.getElementById("cvbtn");
if (cvBtn) {
    cvBtn.addEventListener("click", function () {
        const pdfPath = "css/assets/Nathã - Currículo.pdf";
        window.open(pdfPath, "_blank");

        const link = document.createElement("a");
        link.href = pdfPath;
        link.download = "Natha-Targino-Curriculo.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

/*==================== MÁSCARA TELEFONE ====================*/
const inputTelefone = document.getElementById('phone');
if (inputTelefone) {
    inputTelefone.addEventListener('input', function (e) {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });
}

/*==================== ENVIO DE CONTATO AJAX ====================*/
const formContato = document.getElementById('formContato');
const modalSucesso = document.getElementById('modalSucesso');

if (formContato) {
    formContato.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = document.querySelector('#btn-enviar');
        const btnText = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('#spinner');

        btn.disabled = true;
        if (btnText) btnText.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Enviando...";
        if (spinner) spinner.style.display = "inline-block";

        const formData = new FormData(formContato);
        const actionUrl = formContato.getAttribute('action') || '/Home/EnviarContato';

        try {
            const response = await fetch(actionUrl, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                if (modalSucesso) modalSucesso.classList.add('active');
                formContato.reset();
            } else {
                const errorMsg = await response.text();
                alert("Não foi possível enviar a mensagem no momento: " + errorMsg);
            }
        } catch (error) {
            console.error("Erro no envio:", error);
            alert("Erro de conexão ao enviar mensagem. Tente novamente.");
        } finally {
            btn.disabled = false;
            if (btnText) btnText.innerHTML = "<i class='bx bx-send'></i> Enviar Mensagem";
            if (spinner) spinner.style.display = "none";
        }
    });
}

function fecharModal() {
    if (modalSucesso) {
        modalSucesso.classList.remove('active');
    }
}

/*==================== NOTIFICAÇÃO TOAST FLUTUANTE ====================*/
function mostrarToastAviso(mensagem) {
    let toast = document.getElementById('toastGlobalAviso');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastGlobalAviso';
        toast.className = 'toast-global-aviso';
        document.body.appendChild(toast);
    }

    toast.innerHTML = `<i class='bx bx-time-five'></i> <span>${mensagem}</span>`;
    toast.classList.add('visible');

    if (window.toastAvisoTimer) clearTimeout(window.toastAvisoTimer);
    window.toastAvisoTimer = setTimeout(() => {
        toast.classList.remove('visible');
    }, 4200);
}