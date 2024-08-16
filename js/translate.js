var lazyts = false;
window.addEventListener("scroll", function() {
    if ((document.documentElement.scrollTop !== 0 && lazyts === false) ||
        (document.body.scrollTop !== 0 && lazyts === false)) {
        (function() {
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.async = true;
            script.src = "js/elements.js"; 
            var firstScript = document.getElementsByTagName("script")[0];
            firstScript.parentNode.insertBefore(script, firstScript);
        })();
        lazyts = true;
    }
}, true);

function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'pt',
        autoDisplay: false,
        includedLanguages: 'en,es,it,fr,ar,pt',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
}

