using HtmlEditorApp.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using HtmlEditorApp.Services;

namespace HtmlEditorApp.Controllers
{
    public class HomeController : Controller
    {
        private readonly DocumentService _documentService;


        public HomeController(DocumentService documentService)
        {
            _documentService = documentService;
        }

        public IActionResult Index()
        {
            return View();
        }

        // POST /Home/ExportWord
        // recibe el HTML y se lo pasamos al service para que se encargue de generar el word
        [HttpPost]
        public async Task<IActionResult> ExportWord([FromBody] RequestDocumento request)
        {
            var bytes = await _documentService.GenerarWord(request);
            return File(bytes, 
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
                "documento.docx");
        }

        //// POST /Home/ExportPDF
        //// recibe el HTML y convertimos a PDF para exportar
        //[HttpPost]
        //public IActionResult ExportPDF([FromBody] RequestDocumento request)
        //{
        //    var bytes = _documentService.GenerarPdf(request);
        //    return File(bytes, "application/pdf", "documento.pdf");
        //}

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}