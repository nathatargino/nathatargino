document.getElementById('translateImage').addEventListener('click', function() {
    const img = document.getElementById('translateImage');
    const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, span, button');

    const translations = {
        'Início': 'Home',
        'Sobre': 'About',
        'Serviços': 'Services',
        'Portfólio': 'Portfolio',
        'Contato': 'Contact',
        'Olá, eu me chamo': 'Hello, my name is',
        'E sou um Desenvolvedor': 'And I am a Developer',
        'Sou um desenvolvedor FullStack apaixonado por criar soluções web dinâmicas e inovadoras. Com experiência em diversas tecnologias de front-end e back-end, estou sempre em busca de novos desafios para aprimorar minhas habilidades e contribuir com projetos impactantes.': 
            'I am a FullStack developer passionate about creating dynamic and innovative web solutions. With experience in various front-end and back-end technologies, I am always looking for new challenges to enhance my skills and contribute to impactful projects.',
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
        'Contate-me!': 'Contact Me!',
        'Enviar mensagem': 'Send Message',
        'Desenvolvido por Nathã Targino &copy; 2024 | Todos Direitos Reservados': 'Developed by Nathã Targino &copy; 2024 | All Rights Reserved',
    };

    const reverseTranslations = Object.entries(translations).reduce((obj, [key, value]) => {
        obj[value] = key;
        return obj;
    }, {});

    if (img.src.includes('translate.png')) {
        // Muda para o inglês e altera a imagem
        elements.forEach(element => {
            const text = element.innerText.trim();
            if (translations[text]) {
                element.innerText = translations[text];
            }
        });
        img.src = 'css/assets/translate2.png';
    } else {
        // Volta para o português e altera a imagem
        elements.forEach(element => {
            const text = element.innerText.trim();
            if (reverseTranslations[text]) {
                element.innerText = reverseTranslations[text];
            }
        });
        img.src = 'css/assets/translate.png';
    }
});
