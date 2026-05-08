using HtmlEditorApp.Models;

namespace HtmlEditorApp.Services
{
    public class DocumentWordService
    {

        private DocumentPdfService _pdfService;

        public DocumentWordService(DocumentPdfService pdfService)
        {
            _pdfService = pdfService;
        }

        public async Task<byte[]> GenerarWord(AppDocumentFormat request)
        {
            var pdfBytes = await _pdfService.GenerarPdf(request);
            var tempPdf = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.pdf");
            var docxPath = Path.ChangeExtension(tempPdf, ".docx");

            try
            {
                await File.WriteAllBytesAsync(tempPdf, pdfBytes);

                var scriptPath = Path.Combine(AppContext.BaseDirectory, "Scripts", "convertir.py");
                var psi = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "python",
                    Arguments = $"\"{scriptPath}\" \"{tempPdf}\" \"{docxPath}\"",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true
                };

                using var proceso = System.Diagnostics.Process.Start(psi)!;
                var output = await proceso.StandardOutput.ReadToEndAsync();
                var error = await proceso.StandardError.ReadToEndAsync();
                await proceso.WaitForExitAsync();

                if (proceso.ExitCode != 0 || !File.Exists(docxPath))
                    throw new InvalidOperationException(
                        $"Falló (exit {proceso.ExitCode}).\nOutput: {output}\nError: {error}");

                return await File.ReadAllBytesAsync(docxPath);
            }
            finally
            {
                if (File.Exists(tempPdf)) File.Delete(tempPdf);
                if (File.Exists(docxPath)) File.Delete(docxPath);
            }
        }
    }
}
