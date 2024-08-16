//   Google Translate Script

var lazyts = !1;
window.addEventListener("scroll", function() {
  (0 != document.documentElement.scrollTop && !1 === lazyts ||
    0 != document.body.scrollTop && !1 === lazyts) &&
  (!function() {
    var e = document.createElement("script");
    e.type = "text/javascript";
    e.async = !0;
    e.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    var a = document.getElementsByTagName("script")[0];
    a.parentNode.insertBefore(e, a);
  }(), lazyts = !0);
}, !0);



function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: 'pt', autoDisplay: false,
    includedLanguages: 'en,es,it,fr,ar',
    layout: google.translate.TranslateElement.InlineLayout.SIMPLE
  }, 'google_translate_element');
}


var lazyts = !1;

window.addEventListener("scroll", function() {
    if ((document.documentElement.scrollTop !== 0 && !lazyts) || (document.body.scrollTop !== 0 && !lazyts)) {
        (function() {
            var e = document.createElement("script");
            e.type = "text/javascript";
            e.async = true;
            e.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
            var a = document.getElementsByTagName("script")[0];
            a.parentNode.insertBefore(e, a);
        })();
        lazyts = true;
    }
}, true);

function googleTranslateElementInit() {
    // Verifica se a tradução foi desativada pelo usuário
    if (localStorage.getItem('disableTranslation') === 'true') {
        return; // Não inicializa o Google Translate
    }

    // Recupera o idioma preferido do localStorage ou define o idioma original se não estiver disponível
    var preferredLanguage = localStorage.getItem('preferredLanguage') || 'pt';

    new google.translate.TranslateElement({
        pageLanguage: 'pt', // Defina o idioma da página original
        includedLanguages: 'en,es,it,fr,ar', // Idiomas incluídos para tradução
        autoDisplay: false, // Impede a exibição automática da tradução
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');

    // Monitorar mudanças de idioma
    google.translate.TranslateElement.prototype.onLanguageChanged = function() {
        var selectedLanguage = google.translate.TranslateElement.getInstance().getTranslator().getCurrentLanguage();
        localStorage.setItem('preferredLanguage', selectedLanguage);
    };
}

// Adiciona o link para o CSS após o carregamento do DOM
document.addEventListener("DOMContentLoaded", function() {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "translate.css";
    document.head.appendChild(link);

    // Configura o botão para desativar a tradução
    document.getElementById('disableTranslate').addEventListener('click', function() {
        localStorage.setItem('disableTranslation', 'true');
        location.reload(); // Recarrega a página para aplicar a mudança
    });
});


