using HtmlEditorApp.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using HtmlEditorApp.Services;

namespace HtmlEditorApp.Controllers
{
    public class HomeController : Controller
    {
        private readonly DocumentWordService _documentWordService;
        private readonly DocumentPdfService _documentPdfService;


        public HomeController(DocumentWordService documentWordService, DocumentPdfService documentPdfService)
        {
            _documentWordService = documentWordService;
            _documentPdfService = documentPdfService;
        }

        public IActionResult Index()
        {
            return View();
        }

        // POST /Home/ExportWord
        // recibe el HTML y se lo pasamos al service para que se encargue de generar el word
        [HttpPost]
        public async Task<IActionResult> ExportWord([FromBody] AppDocumentFormat request)
        {
            var bytes = await _documentWordService.GenerarWord(request);
            return File(bytes, 
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
                "documento.docx");
        }

        /** POST /Home/ExportPDF
        / recibe el HTML y convertimos a PDF para exportar**/
        [HttpPost]
        public  async Task<IActionResult> ExportPDF([FromBody] AppDocumentFormat request)
        {
            var bytes = await _documentPdfService.GenerarPdf(request);
            return File(bytes, "application/pdf", "documento.pdf");
        }



        public IActionResult Formulario()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}