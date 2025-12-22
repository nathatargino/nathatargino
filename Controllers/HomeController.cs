using Microsoft.AspNetCore.Mvc;
using Portfolio.Models;
using MailKit.Net.Smtp;
using MimeKit;

namespace Portfolio.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        [IgnoreAntiforgeryToken] // Adicione isso aqui para testar!
       
        public IActionResult EnviarContato(ContatoModel contato)
        {
            try
            {
                var mensagem = new MimeMessage();
                mensagem.From.Add(new MailboxAddress("Meu Portfolio", "nathatargino.dev@gmail.com"));
                mensagem.To.Add(new MailboxAddress("Nathã", "nathatargino.dev@gmail.com"));
                mensagem.Subject = "Novo Contato do Portfólio";

                mensagem.Body = new TextPart("plain")
                {
                    Text = $@"Nome: {contato.Nome}
                    Email: {contato.Email}
                    Telefone: {contato.Telefone}
                    Email Alternativo: {contato.EmailAlternativo}

                    Mensagem:
                    {contato.Mensagem}"
                };

                using (var client = new SmtpClient())
                {
                    client.Connect("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);
                    client.Authenticate("nathatargino.dev@gmail.com", "ncpg izcw qdzi ozgk");
                    client.Send(mensagem);
                    client.Disconnect(true);
                }

                // Se chegar aqui, ele VAI mudar de página
                return RedirectToAction("EmailSucesso");
            }
            catch (System.Exception ex)
            {
                // Se der erro no envio, ele vai mostrar o erro na tela em vez de apenas recarregar
                return Content("Erro detalhado: " + ex.Message + " | StackTrace: " + ex.StackTrace);
            }
        }

        public IActionResult EmailSucesso()
        {
            return View();
        }
    }
}