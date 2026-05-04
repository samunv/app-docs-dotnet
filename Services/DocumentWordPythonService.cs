using HtmlEditorApp.Models;
using Microsoft.Playwright;

namespace HtmlEditorApp.Services
{
    public class DocumentWordPythonService
    {
        private readonly DocumentPdfService _pdfService;

        public DocumentWordPythonService(DocumentPdfService pdfService)
        {
            _pdfService = pdfService;
        }

        public async Task<byte[]> GenerarWord(AppDocumentFormat request)
        {
            //  Generar PDF
            var pdfBytes = await _pdfService.GenerarPdf(request);

            //  Guardar PDF temporal
            var tempPdf = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.pdf");
            await File.WriteAllBytesAsync(tempPdf, pdfBytes);

            //  Definir ruta del DOCX de salida
            var docxPath = Path.ChangeExtension(tempPdf, ".docx");

            //  Ejecutar script Python
            var scriptPath = Path.Combine(AppContext.BaseDirectory, "Scripts", "convertir.py");

            var proceso = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = "python",
                Arguments = $"\"{scriptPath}\" \"{tempPdf}\" \"{docxPath}\"",
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            });

            await proceso!.WaitForExitAsync();

            var output = await proceso.StandardOutput.ReadToEndAsync();
            var error = await proceso.StandardError.ReadToEndAsync();

            Console.WriteLine($"Output: {output}");
            Console.WriteLine($"Error: {error}");
            Console.WriteLine($"Exit code: {proceso.ExitCode}");
            Console.WriteLine($"DOCX existe: {File.Exists(docxPath)}");

            //  Leer el DOCX generado
            var docxBytes = await File.ReadAllBytesAsync(docxPath);

            //  Limpiar temporales
            File.Delete(tempPdf);
            File.Delete(docxPath);

            return docxBytes;
        }
    }
}