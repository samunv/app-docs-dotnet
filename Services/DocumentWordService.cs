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

                AgregarHeader(mainPart, request.Header ?? "");
                AgregarFooter(mainPart, request.Footer ?? "");
                await AgregarContenido(mainPart, request.HtmlContent ?? "");

                mainPart.Document.Save();
            }

            return stream.ToArray();
        }

        private void AgregarHeader(MainDocumentPart mainPart, string textoHeader)
        {
            var headerPart = mainPart.AddNewPart<HeaderPart>();
            headerPart.Header = new WordDocument.Header(
                new WordDocument.Paragraph(
                    new WordDocument.ParagraphProperties(
                        new WordDocument.Justification { Val = WordDocument.JustificationValues.Center }
                    ),
                    new WordDocument.Run(new WordDocument.Text(textoHeader))
                )
            );
            headerPart.Header.Save();

            ObtenerSectionProps(mainPart).Append(new WordDocument.HeaderReference()
            {
                Type = WordDocument.HeaderFooterValues.Default,
                Id = mainPart.GetIdOfPart(headerPart)
            });
        }

        private void AgregarFooter(MainDocumentPart mainPart, string textoFooter)
        {
           
            var footerPart = mainPart.AddNewPart<FooterPart>();

            // Footer con texto + número de página
            var paragraph = new WordDocument.Paragraph(
                new WordDocument.ParagraphProperties(
                    new WordDocument.Justification { Val = WordDocument.JustificationValues.Center }
                ),
                new WordDocument.Run(new WordDocument.Text($"{textoFooter}  -  Página ") { Space = SpaceProcessingModeValues.Preserve }),
                new WordDocument.SimpleField() { Instruction = "PAGE" }
            );

            footerPart.Footer = new WordDocument.Footer(paragraph);
            footerPart.Footer.Save();

            ObtenerSectionProps(mainPart).Append(new WordDocument.FooterReference()
            {
                Type = WordDocument.HeaderFooterValues.Default,
                Id = mainPart.GetIdOfPart(footerPart)
            });
        }


        private async Task AgregarContenido(MainDocumentPart mainPart, string htmlContent)
        {
            var converter = new HtmlToOpenXml.HtmlConverter(mainPart);
            await converter.ParseBody(htmlContent);
        }

        private WordDocument.SectionProperties ObtenerSectionProps(MainDocumentPart mainPart)
        {
            var body = mainPart.Document.GetFirstChild<WordDocument.Body>()!;
            var sectionProps = body.GetFirstChild<WordDocument.SectionProperties>();

            if (sectionProps == null)
            {
                sectionProps = new WordDocument.SectionProperties();
                body.AppendChild(sectionProps);
            }

            return sectionProps;
        }
    }
}