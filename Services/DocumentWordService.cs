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

                await AgregarHeader(mainPart, request.Header ?? "");
                await AgregarFooter(mainPart, request.Footer ?? "");
                await AgregarContenido(mainPart, request.HtmlContent ?? "");

                mainPart.Document.Save();
            }

            return stream.ToArray();
        }

        private async Task AgregarHeader(MainDocumentPart mainPart, string htmlHeader)
        {
            var body = mainPart.Document.Body!;
            var antes = body.Elements<WordDocument.Paragraph>().Count();

            var converter = new HtmlConverter(mainPart);
            await converter.ParseBody(htmlHeader);

            var parrafos = body.Elements<WordDocument.Paragraph>().Skip(antes).ToList();
            foreach (var p in parrafos) p.Remove();

            var headerPart = mainPart.AddNewPart<HeaderPart>();
            var header = new WordDocument.Header();
            foreach (var p in parrafos) header.AppendChild(p);
            if (!parrafos.Any()) header.AppendChild(new WordDocument.Paragraph());

            headerPart.Header = header;
            headerPart.Header.Save();

            ObtenerSectionProps(mainPart).Append(new WordDocument.HeaderReference()
            {
                Type = WordDocument.HeaderFooterValues.Default,
                Id = mainPart.GetIdOfPart(headerPart)
            });
        }

        private async Task AgregarFooter(MainDocumentPart mainPart, string htmlFooter)
        {
            var body = mainPart.Document.Body!;
            var antes = body.Elements<WordDocument.Paragraph>().Count();

            var converter = new HtmlConverter(mainPart);
            await converter.ParseBody(htmlFooter);

            var parrafos = body.Elements<WordDocument.Paragraph>().Skip(antes).ToList();
            foreach (var p in parrafos) p.Remove();

            var footerPart = mainPart.AddNewPart<FooterPart>();
            var footer = new WordDocument.Footer();
            foreach (var p in parrafos) footer.AppendChild(p);
            if (!parrafos.Any()) footer.AppendChild(new WordDocument.Paragraph());

            footerPart.Footer = footer;
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