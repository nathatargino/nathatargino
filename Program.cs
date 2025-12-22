var builder = WebApplication.CreateBuilder(args);

// Adiciona suporte para Controllers e Views (MVC)
builder.Services.AddControllersWithViews();

// Caso queira usar IConfiguration no Controller para ler o appsettings.json, 
// o builder.Configuration já faz isso automaticamente.

var app = builder.Build();

// Configura o pipeline de requisições HTTP
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // O valor padrão de HSTS é 30 dias. 
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles(); // Essencial para carregar CSS, JS e Imagens da wwwroot

app.UseRouting();

app.UseAuthorization();

// Define a rota padrão: se o usuário não digitar nada, vai para Home/Index
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// CORREÇÃO AQUI: Garante que o comando termine corretamente
app.Run();