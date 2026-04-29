using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using HtmlEditorApp.Models;
using WordDocument = DocumentFormat.OpenXml.Wordprocessing;
using HtmlToOpenXml;

namespace HtmlEditorApp.Services
{
    public class DocumentWordService
    {
        public async Task<byte[]> GenerarWord(RequestDocumento request)
        {
            var stream = new MemoryStream();

            using (var doc = WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document, true))
            {
                var mainPart = doc.AddMainDocumentPart();
                mainPart.Document = new WordDocument.Document(new WordDocument.Body());

                var stylesPart = mainPart.AddNewPart<StyleDefinitionsPart>();
                stylesPart.Styles = new WordDocument.Styles(
                    new WordDocument.DocDefaults(
                        new WordDocument.RunPropertiesDefault(
                            new WordDocument.RunPropertiesBaseStyle(
                                new WordDocument.RunFonts { Ascii = "Arial", HighAnsi = "Arial" },
                                new WordDocument.FontSize { Val = "24" }
                            )
                        )
                    )
                );
                stylesPart.Styles.Save();

                await AgregarHeader(mainPart, request.Header ?? "");
                await AgregarFooter(mainPart, request.Footer ?? "");
                await AgregarContenido(mainPart, request.HtmlContent ?? "");

                mainPart.Document.Save();
            }

            return stream.ToArray();
        }

        private async Task AgregarHeader(MainDocumentPart mainPart, string htmlHeader)
        {
            var converter = new HtmlConverter(mainPart);
            await converter.ParseHeader(htmlHeader, WordDocument.HeaderFooterValues.Default);
        }

        private async Task AgregarFooter(MainDocumentPart mainPart, string htmlFooter)
        {
            var converter = new HtmlConverter(mainPart);
            await converter.ParseFooter(htmlFooter, WordDocument.HeaderFooterValues.Default);
        }


        private async Task AgregarContenido(MainDocumentPart mainPart, string htmlContent)
        {
            var converter = new HtmlToOpenXml.HtmlConverter(mainPart);
            await converter.ParseBody(htmlContent);
        }

    }
}