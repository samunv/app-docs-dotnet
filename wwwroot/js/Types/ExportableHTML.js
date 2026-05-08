
export class ExportableHTML {

    static construirHtmlExport(css, htmlContent) {
         return `<!DOCTYPE html>
            <html><head><meta charset='utf-8'><style>${css}</style></head>
            <body>
                ${htmlContent}
           </body></html>`;
    }

}

    
