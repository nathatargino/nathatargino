function handleTranslation() {
    const img = document.getElementById('translateImage');
    const elements = document.querySelectorAll(`
        h1, h2, h3, h4, h5, h6, p, a, span, button, 
        input, textarea, placeholder, label, div, footer, i, .multiplo-texto
    `);

    const translations = {
        'Início': 'Home',
        'Sobre': 'About',
        'Serviços': 'Services',
        'Portfólio': 'Portfolio',
        'Contato': 'Contact',
        'Olá, eu me chamo': 'Hello, my name is',
        'E sou um Desenvolvedor': 'And I am a Developer',
        'Sou um desenvolvedor FullStack apaixonado por criar soluções web dinâmicas e inovadoras. Com experiência em diversas tecnologias de front-end e back-end, estou sempre em busca de novos desafios para aprimorar minhas habilidades e contribuir com projetos impactantes.':
            'I am a FullStack developer passionate about creating dynamic and innovative web solutions. With experience in several front-end and back-end technologies, I am always looking for new challenges to improve my skills and contribute to impactful projects.',
        'Baixar CV': 'Download CV',
        'Sobre mim': 'About me',
        'Desenvolvedor FullStack': 'FullStack Developer',
        'Desenvolvo sites e aplicações web que se adaptam perfeitamente a qualquer dispositivo, utilizando tecnologias modernas como HTML5, CSS3, JavaScript, React.js e Node.js. Combinando front-end dinâmico e back-end robusto, entrego soluções que não só são visualmente atraentes, mas também rápidas, seguras e escaláveis, usando tanto bancos de dados relacionais quanto não relacionais.':
            'I develop websites and web applications that adapt perfectly to any device, using modern technologies like HTML5, CSS3, JavaScript, React.js, and Node.js. Combining dynamic front-end and robust back-end, I deliver solutions that are not only visually appealing but also fast, secure, and scalable, using both relational and non-relational databases.',
        'Mais informações': 'More Information',
        'Meus Serviços': 'My Services',
        'Desenvolvimento Web Completo': 'Complete Web Development',
        'Criação de aplicações web completas, desde o front-end até o back-end. Utilizo tecnologias modernas como React.js e Node.js para construir soluções robustas e escaláveis.':
            'Creation of complete web applications, from front-end to back-end. I use modern technologies like React.js and Node.js to build robust and scalable solutions.',
        'Integrações com APIs e Web': 'API and Web Integrations',
        'Especialista em integração de sistemas, conectando plataformas e serviços para funcionar de forma integrada. Experiência em conectar APIs de terceiros e automação de processos.':
            'Specialist in system integration, connecting platforms and services to work seamlessly. Experience in connecting third-party APIs and automating processes.',
        'Gestão Avançada de Bancos': 'Advanced Database Management',
        'Gerenciamento e otimização de bancos de dados relacionais e não relacionais. Experiência em PostgreSQL, MongoDB e MySQL para garantir desempenho e integridade dos dados.':
            'Management and optimization of relational and non-relational databases. Experience in PostgreSQL, MongoDB, and MySQL to ensure performance and data integrity.',
        'Ultimos Projetos': 'Latest Projects',
        'Este projeto apresenta uma Pokédex interativa com carregamento infinito, integrando dados com a PokeAPI. Os usuários podem explorar uma lista de Pokémons. A Pokédex exibe informações essenciais de cada Pokémon.':'This project features an interactive Pokédex with infinite loading, integrating data with the PokeAPI. Users can browse a list of Pokémon. The Pokédex displays essential information about each Pokémon.',
        'Página de login moderna com efeito de blur, oferecendo uma estética sofisticada e minimalista, com um fundo suavizado que destaca elegantemente o formulário.':'Modern login page with blur effect, offering a sophisticated and minimalist aesthetic, with a smoothed background that elegantly highlights the form.',
        'Página de login com efeito flutuante em SVG, proporcionando um movimento dinâmico e um toque moderno à interface, melhorando o engajamento do usuário.':'Login page with floating effect in SVG, providing a dynamic movement and a modern touch to the interface, improving user engagement.',
        'Jogo web desenvolvido em JavaScript que une a jogabilidade simples com a interface do Super Mario, proporcionando uma experiência divertida e retrô.':'Web game developed in JavaScript that combines simple gameplay with the Super Mario interface, providing a fun and retro experience.',
        'Projeto de portfólio simples com um menu lateral, demonstrando uma navegação clara e intuitiva em um layout minimalista.':'Simple portfolio design with a side menu, demonstrating clear and intuitive navigation in a minimalist layout.',
        'Blog sobre a história do mascote do Android. O projeto integra vídeo do YouTube para enriquecer o conteúdo e demonstrar técnicas de implementação e design.':'Blog about the history of the Android mascot. The project integrates YouTube videos to enrich the content and demonstrate implementation and design techniques.',
        'Contate-me!': 'Contact Me!',
        'Enviar mensagem': 'Send Message',
        'Desenvolvido por Nathã Targino': 'Developed by Nathã Targino',
        '2024 | Todos Direitos Reservados':'2024 | All Rights Reserved',
        'Nome completo':'Full Name',
        'Celular':'Phone Numer',
        'E-mail alternativo':'Alternative E-mail',
        'Escreva sua mensagem':'Write your message',
        
    };

    const reverseTranslations = Object.entries(translations).reduce((obj, [key, value]) => {
        obj[value] = key;
        return obj;
    }, {});

    if (img.src.includes('translate.png')) {
        // Muda para o inglês e altera a imagem
        elements.forEach(element => {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                // Traduz placeholders dos campos de entrada
                const placeholder = element.getAttribute('placeholder');
                if (placeholder && translations[placeholder]) {
                    element.setAttribute('placeholder', translations[placeholder]);
                }
                // Traduz value dos inputs tipo submit
                if (element.type === 'submit' && translations[element.value]) {
                    element.value = translations[element.value];
                }
            } else {
                // Traduz o texto dos outros elementos
                const text = element.innerText.trim();
                if (translations[text]) {
                    element.innerText = translations[text];
                }
            }
        });

        // Traduza o texto específico do h3
        const headerText = document.getElementById('headerText');
        if (headerText) {
            headerText.innerHTML = '<span style="color: #fff;">And I am a </span> <span>Full Stack Developer </span>';
        }

        img.src = 'css/assets/translate2.png';
    } else {
        // Volta para o português e altera a imagem
        elements.forEach(element => {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                // Volta aos placeholders em português
                const placeholder = element.getAttribute('placeholder');
                if (placeholder && reverseTranslations[placeholder]) {
                    element.setAttribute('placeholder', reverseTranslations[placeholder]);
                }
                // Volta ao value do input tipo submit
                if (element.type === 'submit' && reverseTranslations[element.value]) {
                    element.value = reverseTranslations[element.value];
                }
            } else {
                // Volta ao texto dos outros elementos
                const text = element.innerText.trim();
                if (reverseTranslations[text]) {
                    element.innerText = reverseTranslations[text];
                }
            }
        });

        // Volta ao texto específico do h3 em português
        const headerText = document.getElementById('headerText');
        if (headerText) {
            headerText.innerHTML = '<span style="color: #fff;">E sou um </span> <span>Desenvolvedor Full Stack </span>';
        }

        img.src = 'css/assets/translate.png';
    }
}

// Adiciona o evento de clique a múltiplos IDs
document.querySelectorAll('#translateImage, #outroId1, #outroId2').forEach(element => {
    element.addEventListener('click', handleTranslation);
});

// Flip Active (Girar icone)
document.addEventListener('DOMContentLoaded', () => {
    const imgContainer = document.getElementById('flip-img');

    imgContainer.addEventListener('click', () => {
        imgContainer.classList.toggle('flip-active');
    });
});