namespace HtmlEditorApp.Models
{
    public class AppDocumentFormat
    {
        public string? HtmlContent { get; set; }  // el html del editor
        public string? Header { get; set; }        // html del encabezado
        public string? Footer { get; set; }        // html del pie de página
    }
}
