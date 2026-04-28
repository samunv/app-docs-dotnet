namespace HtmlEditorApp.Models
{
    public class RequestDocumento
    {
        public string? HtmlContent { get; set; }  // el html del editor
        public string? Header { get; set; }        // texto del encabezado
        public string? Footer { get; set; }        // texto del pie de página
    }
}
