using DocumentFormat.OpenXml.Drawing.Charts;
using HtmlEditorApp.Models;
using Microsoft.Playwright;

namespace HtmlEditorApp.Services
{
    public class DocumentPdfService
    {
        public async Task<byte[]> GenerarPdf(AppDocumentFormat request)
        {
            using var playwright = await Playwright.CreateAsync();
            await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
            {
                Headless = true
            });

            var page = await browser.NewPageAsync();

            // Primero navegar al servidor para establecer el contexto
            await page.GotoAsync("http://localhost:5034");

            // Luego setear el contenido — ahora las rutas relativas se resolverán contra localhost:5034
            await page.SetContentAsync(request.HtmlContent ?? "", new PageSetContentOptions
            {
                WaitUntil = WaitUntilState.NetworkIdle
            });

            var pdfBytes = await page.PdfAsync(new PagePdfOptions
            {
                Width = "210mm",
                Height = "297mm",
                PrintBackground = true,
                Tagged = true,
                Margin = new Margin { Top = "0", Bottom = "0", Left = "0", Right = "0" }
            });

            return pdfBytes;
        }
    }
    }
