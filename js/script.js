/*==================== toggle icon navbar ====================*/
let menuIcon = document.querySelector('#icone-menu');
let navbar = document.querySelector('.navbar');

/*==================== scroll sections active link ====================*/
let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a');

window.onscroll = () => {
    sections.forEach(sec => {
        const top = window.scrollY;
        const offset = sec.offsetTop - 150;
        const height = sec.offsetHeight;
        const id = sec.getAttribute('id');

        if (top >= offset && top < offset + height) {
            navLinks.forEach(link => {
                link.classList.remove('ativo');
                const linkHref = link.getAttribute('href');
                if (linkHref === `#${id}`) {
                    link.classList.add('ativo');
                }
            });
        }
    });

    /*==================== sticky navbar ====================*/
    let header = document.querySelector('header');

    header.classList.toggle('sticky', window.scrollY > 100);

    /*==================== remove toggle icon and navbar when click navbar link (scroll) ====================*/
    menuIcon.onclick = () => {
        menuIcon.classList.toggle('bx-x');
        navbar.classList.toggle('active');
    };
    
};
/*==================== scroll reveal ====================*/

ScrollReveal({ 
   //  reset: true,
    distance: '80px',
    duration: 2000,
    delay: 200,

});

ScrollReveal().reveal('.conteudo-inicio, .heading', {delay: 500});

ScrollReveal().reveal('.img-inicio, .conteudo-servicos, .caixa-do-portfolio, .contato form', {origin: 'bottom'});

ScrollReveal().reveal('.conteudo-inicio h1, .img-sobre',{origin: 'left'});

ScrollReveal().reveal('.conteudo-inicio p, .conteudo-sobre',{origin: 'right'});

/*==================== typed js ====================*/

const typed = new Typed ('.multiplo-texto',{
    strings: ['Front-End', 'Back-end', 'Full Stack'],
    typeSpeed: 100,
    backSpeed: 100,
    backDelay: 1000,
    loop: true
});

/*==================== Download CV ====================*/


document.getElementById("cvbtn").addEventListener("click", function() {
    // Caminho para o arquivo PDF
    const pdfPath = "css/assets/Nathã - Curriculo .pdf";

    // Abre o PDF em uma nova janela/aba
    window.open(pdfPath, "_blank");
    
    // Cria um link temporário
    const link = document.createElement("a");
    link.href = pdfPath;

    // Nome do arquivo que será baixado
    link.download = "Nathã - Curriculo.pdf";

    // Add link ao documento e simula o clique
    document.body.appendChild(link);
    link.click();

    // Remove o link do documento
    document.body.removeChild(link);
});

// Mascara Input Phone

const inputTelefone = document.getElementById('phone');

inputTelefone.addEventListener('focus', function() {
    this.placeholder = "Digite seu número";
});

inputTelefone.addEventListener('blur', function() {
    this.placeholder = "Celular";
});

inputTelefone.addEventListener('input', function(e) {
    var x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
    e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
});


// Alerta Mais Informações em Manutenção

function showAlert(service) {
    window.alert('Em manutenção, tente novamente mais tarde!');
  }



  