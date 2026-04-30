using HtmlEditorApp.Models;
using Microsoft.Playwright;

namespace HtmlEditorApp.Services
{
    public class DocumentWordService
    {
        private readonly DocumentPdfService _pdfService;

        public DocumentWordService(DocumentPdfService pdfService)
        {
            _pdfService = pdfService;
        }

        public async Task<byte[]> GenerarWord(AppDocumentFormat request)
        {
            // 1. Generar PDF 
            var pdfBytes = await _pdfService.GenerarPdf(request);

            // 2. Guardar PDF temporal
            var tempPdf = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.pdf");
            await File.WriteAllBytesAsync(tempPdf, pdfBytes);

            // 3. Convertir PDF a DOCX con LibreOffice
            var soffice = @"C:\Program Files\LibreOffice\program\soffice.exe";
            var outDir = Path.GetTempPath();

            var userProfile = Path.Combine(Path.GetTempPath(), "libreoffice-profile");
            Directory.CreateDirectory(userProfile);

            var proceso = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = soffice,
                Arguments = $"--headless --norestore --nofirststartwizard \"-env:UserInstallation=file:///{userProfile.Replace('\\', '/')}\" --convert-to docx \"{tempPdf}\" --outdir \"{outDir}\"",
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                WorkingDirectory = @"C:\Program Files\LibreOffice\program"
            });

            await proceso!.WaitForExitAsync();

            var output = await proceso.StandardOutput.ReadToEndAsync();
            var error = await proceso.StandardError.ReadToEndAsync();

            var docxPath = Path.Combine(outDir, Path.GetFileNameWithoutExtension(tempPdf) + ".docx");

            Console.WriteLine($"=== LibreOffice ===");
            Console.WriteLine($"Exit code: {proceso.ExitCode}");
            Console.WriteLine($"Output: {output}");
            Console.WriteLine($"Error: {error}");
            Console.WriteLine($"PDF existe: {File.Exists(tempPdf)}");
            Console.WriteLine($"DOCX path: {docxPath}");
            Console.WriteLine($"DOCX existe: {File.Exists(docxPath)}");

            // Leer el DOCX generado
            var docxBytes = await File.ReadAllBytesAsync(docxPath);

            // Limpiar temporales
            File.Delete(tempPdf);
            File.Delete(docxPath);

            return docxBytes;
        }
    }
}