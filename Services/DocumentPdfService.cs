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

            var htmlCompleto = $@"<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; }}
    </style>
</head>
<body>
    {request.HtmlContent ?? ""}
</body>
</html>";

            await page.SetContentAsync(htmlCompleto);

            var pdfBytes = await page.PdfAsync(new PagePdfOptions
            {
                Format = "A4",
                PrintBackground = true,
                DisplayHeaderFooter = true,
                HeaderTemplate = $"<div style='font-size:10pt; width:100%; text-align:center; padding:5px'>{request.Header ?? ""}</div>",
                FooterTemplate = $"<div style='font-size:10pt; width:100%; text-align:center; padding:5px'>{request.Footer ?? ""} - Página <span class='pageNumber'></span> de <span class='totalPages'></span></div>",
                Margin = new Margin
                    {
                        Top = "60px",
                        Bottom = "60px",
                        Left = "40px",
                        Right = "40px"
                    }
            });

            return pdfBytes;
        }
    }
}
