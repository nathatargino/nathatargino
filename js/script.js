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
    strings: ['Desenvolvedor FullStack', 'Gamer', 'Web Designer'],
    typeSpeed: 100,
    backSpeed: 100,
    backDelay: 1000,
    loop: true
});