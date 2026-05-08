// WordExporter.js — Genera un .docx desde el estado del formulario usando docx.js (ESM)
//
// Importa directamente desde esm.sh, que convierte el paquete npm 'docx' a ES module.
// Funciona sin bundler porque formulario.js ya usa type="module".
import {
    Document, Header, Footer, Packer,
    Paragraph, TextRun, Table, TableRow, TableCell,
    ImageRun, PageNumber,
    AlignmentType, BorderStyle, WidthType, VerticalAlign, HeightRule,
} from 'https://esm.sh/docx@9';

// Colores hex sin '#' (formato que usa docx.js)
const AZUL = '000080';
const GRIS = 'AAAAAA';
const FONT = 'Arial';

// docx.js mide el tamaño de fuente en half-points: 9pt → size:18, 7pt → size:14
const pt = n => n * 2;

// docx.js mide posiciones y tamaños de página en twips (1/20 de punto tipográfico).
// 1 mm ≈ 56.692 twips. Se usa para márgenes, tamaño de página y altura de filas.
const mm = n => Math.round(n * 56.692);


// ─────────────────────────────────────────────
// HELPERS DE BORDE
// docx.js requiere que cada lado de un borde se defina como objeto independiente
// con tres propiedades: style, size (en octavos de punto) y color.
// ─────────────────────────────────────────────

// Borde invisible: se usa para eliminar bordes no deseados en tablas de layout
function noBorder() {
    return { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
}

// Borde gris sólido. size=12 equivale a ~1.5pt, similar al CSS border: 1.5px solid #aaa
function grayBorder(size = 12) {
    return { style: BorderStyle.SINGLE, size, color: GRIS };
}

// Aplica borde invisible en los 6 lados de una tabla (top, bottom, left, right,
// insideHorizontal, insideVertical). Se usa en tablas que solo sirven para layout
// (posicionar elementos) y no deben verse.
function allNoBorders() {
    const nb = noBorder();
    return { top: nb, bottom: nb, left: nb, right: nb, insideHorizontal: nb, insideVertical: nb };
}

// Genera el objeto de bordes para una celda dentro de una caja bordeada.
// top/bottom son booleanos: true → borde gris, false → sin borde.
// left y right siempre tienen borde gris (son los laterales de la caja).
// Permite construir cajas con borde exterior sin líneas internas entre filas.
function cellBorderBox(top, bottom) {
    const gb = grayBorder();
    const nb = noBorder();
    return { top: top ? gb : nb, bottom: bottom ? gb : nb, left: gb, right: gb };
}


// ─────────────────────────────────────────────
// HELPERS DE TEXTO
// En docx.js el texto va dentro de TextRun, que a su vez va dentro de Paragraph.
// Nunca se puede poner texto directamente en un Paragraph sin un TextRun.
// ─────────────────────────────────────────────

// TextRun base: aplica fuente Arial y tamaño 9pt a todo el documento.
// opts permite sobreescribir cualquier propiedad (bold, color, italics, size…)
function run(text, opts = {}) {
    return new TextRun({ text: text ?? '', font: FONT, size: pt(9), ...opts });
}

// TextRun para etiquetas de campo: azul + negrita. Ej: "EMPRESA BONIFICADA:"
function label(text) {
    return run(text, { bold: true, color: AZUL });
}

// TextRun para valores introducidos por el usuario: texto normal sin color especial
function val(text) {
    return run(text ?? '');
}

// Párrafo vacío que actúa como separador vertical, equivalente a margin-bottom en CSS.
// 'after' está en twips: 40 twips ≈ 0.7mm. Se usa entre secciones del header.
function emptyPara(after = 40) {
    return new Paragraph({ children: [run('')], spacing: { before: 0, after } });
}


// ─────────────────────────────────────────────
// SECCIÓN: LOGO + TÍTULO
// ─────────────────────────────────────────────

// Devuelve un array con dos Paragraph (no una Table) porque en el HTML original
// el layout es flex-direction:column — logo arriba, título centrado debajo.
// Al devolver array, exportarDocx lo expande con spread (...) en children del Header.
function buildLogoTitle(logoBytes) {
    return [
        // Párrafo con la imagen del logo. logoBytes es un ArrayBuffer obtenido via fetch().
        // transformation define el tamaño renderizado en el Word (en puntos/pixels EMU).
        new Paragraph({
            children: [new ImageRun({ data: logoBytes, transformation: { width: 150, height: 81 }, type: 'jpg' })]
        }),
        // Párrafo con el título, centrado, con margen superior para separarlo del logo
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 0 },
            children: [run('CONTROL DE ASISTENCIA', { bold: true, size: pt(14), color: AZUL })]
        }),
    ];
}


// ─────────────────────────────────────────────
// SECCIÓN: OPCIONES A / B / CÓDIGO
// ─────────────────────────────────────────────

// Construye la caja bordeada de Opción A, Opción B y Código de Agrupación.
// Es una Table de 1 columna y 3 filas. La Table no tiene bordes propios (allNoBorders);
// los bordes los define cada celda individualmente con cellBorderBox para simular
// una única caja rectangular sin líneas horizontales internas visibles.
function buildOpcionesTable(headerState) {
    // spacing en twips: before/after añaden espacio dentro de la celda (padding vertical)
    const spacing = { before: 30, after: 30 };

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: allNoBorders(), // la tabla en sí no tiene borde; cada celda gestiona el suyo
        rows: [
            // Fila Opción A: borde arriba (true) y sin borde abajo (false) → tapa superior de la caja
            new TableRow({ children: [new TableCell({
                borders: cellBorderBox(true, false),
                children: [new Paragraph({ spacing, children: [
                    label('OPCIÓN A    '), label('EMPRESA BONIFICADA: '), val(headerState.empresaBonificada),
                    run('    '), label('CIF.: '), val(headerState.cif),
                ]})]
            })] }),
            // Fila Opción B: sin borde arriba ni abajo → fila intermedia de la caja
            new TableRow({ children: [new TableCell({
                borders: cellBorderBox(false, false),
                children: [new Paragraph({ spacing, children: [
                    label('OPCIÓN B    '), label('ENTIDAD ORGANIZADORA: '), val(headerState.entidad),
                    run('    '), label('CIF.: '), val(headerState.cif2),
                ]})]
            })] }),
            // Fila Código: sin borde arriba, borde abajo (true) → tapa inferior de la caja
            new TableRow({ children: [new TableCell({
                borders: cellBorderBox(false, true),
                children: [new Paragraph({ spacing, children: [
                    run('           '), label('CÓDIGO DE AGRUPACIÓN: '), val(headerState.codigo),
                ]})]
            })] }),
        ],
    });
}


// ─────────────────────────────────────────────
// SECCIÓN: NOTA INFORMATIVA
// ─────────────────────────────────────────────

// Párrafo de texto pequeño en cursiva que aparece entre las opciones y la denominación.
// spacing.before/after en twips añaden margen vertical respecto a los elementos adyacentes.
function buildNota() {
    return new Paragraph({
        spacing: { before: 160, after: 160 },
        children: [run(
            '(Se seleccionará uno de los apartados anteriores dependiendo del perfil con el que ' +
            'se haya accedido al Sistema telemático de Gestión de Acciones Formativas en las Empresas)',
            { italics: true, size: pt(10), color: '888888' }
        )]
    });
}


// ─────────────────────────────────────────────
// SECCIÓN: DENOMINACIÓN + FIRMA
// ─────────────────────────────────────────────

// Construye la caja bordeada con Denominación, Nº/Grupo/Fechas, Horario y Firma.
// Mismo patrón que buildOpcionesTable: Table de 1 columna, cada celda gestiona
// sus propios bordes con cellBorderBox para formar una única caja sin líneas internas.
//
// firmaBytes: ArrayBuffer con la imagen de firma, o null si no se subió ninguna.
// firmaExt:   'jpg' o 'png' según el tipo de imagen subida.
function buildDenominacionTable(headerState, firmaBytes, firmaExt) {
    const nb = noBorder();
    const spacing = { before: 25, after: 25 };

    // Si hay firma, se construye una sub-tabla de 2 columnas: imagen | texto.
    // Si no hay firma, solo se muestran los párrafos de texto de firmado.
    const firmaContent = firmaBytes
        ? [new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: allNoBorders(), // tabla de layout, invisible
            rows: [new TableRow({ children: [
                // Columna izquierda: imagen de la firma
                new TableCell({
                    width: { size: 18, type: WidthType.PERCENTAGE },
                    borders: { top: nb, bottom: nb, left: nb, right: nb },
                    children: [new Paragraph({ children: [
                        new ImageRun({ data: firmaBytes, transformation: { width: 70, height: 45 }, type: firmaExt })
                    ]})]
                }),
                // Columna derecha: nombre del firmante y rol
                new TableCell({
                    borders: { top: nb, bottom: nb, left: nb, right: nb },
                    children: [
                        new Paragraph({ children: [label('Firmado: '), val(headerState.firmaNombre)] }),
                        new Paragraph({ children: [run('(Formador/Resp. Formación)', { size: pt(7), color: AZUL, bold: true })] }),
                    ]
                }),
            ]})],
        })]
        : [
            new Paragraph({ children: [label('Firmado: '), val(headerState.firmaNombre)] }),
            new Paragraph({ children: [run('(Formador/Resp. Formación)', { size: pt(7), color: AZUL, bold: true })] }),
        ];

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: allNoBorders(),
        rows: [
            // Fila 1: Denominación — tapa superior de la caja
            new TableRow({ children: [new TableCell({
                borders: cellBorderBox(true, false),
                children: [new Paragraph({ spacing, children: [
                    label('DENOMINACIÓN DE LA ACCIÓN FORMATIVA: '), val(headerState.denominacion),
                ]})]
            })] }),
            // Fila 2: Nº, Grupo, Fechas — fila intermedia
            new TableRow({ children: [new TableCell({
                borders: cellBorderBox(false, false),
                children: [new Paragraph({ spacing, children: [
                    label('Nº: '), val(headerState.num), run('   '),
                    label('GRUPO: '), val(headerState.grupo), run('   '),
                    label('FECHA DE INICIO: '), val(headerState.fechaInicio), run('   '),
                    label('FECHA FIN: '), val(headerState.fechaFin),
                ]})]
            })] }),
            // Fila 3: Fecha, Turno, Horario — fila intermedia
            new TableRow({ children: [new TableCell({
                borders: cellBorderBox(false, false),
                children: [new Paragraph({ spacing, children: [
                    label('FECHA: '), val(headerState.fecha), run('   '),
                    label('TURNO: '), val(headerState.turno), run('   '),
                    label('HORARIO: DE '), val(headerState.horaDe), run('   '),
                    label('A '), val(headerState.horaA),
                ]})]
            })] }),
            // Fila 4: Firma — tapa inferior de la caja
            new TableRow({ children: [new TableCell({
                borders: cellBorderBox(false, true),
                children: firmaContent,
            })] }),
        ],
    });
}


// ─────────────────────────────────────────────
// TABLA DE ASISTENTES (body del documento)
// ─────────────────────────────────────────────

// Lee los inputs del DOM en el momento de la exportación.
// No recibe parámetros porque accede directamente al DOM vivo: input.value
// da el valor actual aunque no se haya serializado previamente.
// Itera todos los .page en orden y los tr de cada .pagina-tbody.
// Resultado: array plano con todas las filas de todas las páginas.
function leerFilasDom() {
    const filas = [];
    document.querySelectorAll('.page').forEach((pageEl, pIdx) => {
        pageEl.querySelectorAll('.pagina-tbody tr').forEach((tr, rIdx) => {
            const inputs = tr.querySelectorAll('input[type="text"]');
            // inputs[0] = apellidos, inputs[1] = nombre, inputs[2] = NIF
            // (el td tiene clase td-apellido por error de naming, pero es la columna NIF)
            filas.push({
                num:       pIdx * 14 + rIdx + 1,
                apellidos: inputs[0]?.value || '',
                nombre:    inputs[1]?.value || '',
                nif:       inputs[2]?.value || '',
            });
        });
    });
    return filas;
}

// Construye la tabla de asistentes con cabecera de dos filas y filas de datos.
// No recibe parámetros: llama a leerFilasDom() internamente.
//
// Word gestiona la paginación de esta tabla automáticamente: cuando las filas
// no caben en una página, Word rompe la página y repite el header nativo del
// documento (buildLogoTitle + secciones del Header). tableHeader:true en las
// filas de cabecera hace que esas filas se repitan también al inicio de cada página.
function buildAttendanceTable() {
    const gb = grayBorder(8); // borde más fino (8 = 1pt) para las celdas de datos
    const borders = { top: gb, bottom: gb, left: gb, right: gb };

    // Helper local: celda de cabecera con texto centrado azul y negrita
    function headerCell(text, opts = {}) {
        return new TableCell({
            borders,
            ...opts, // permite pasar columnSpan, rowSpan, width desde fuera
            children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [run(text, { bold: true, color: AZUL })],
            })]
        });
    }

    // Fila 1 de cabecera: "DATOS DE LOS ASISTENTES" ocupa 3 columnas (columnSpan:3).
    // "FIRMAS" y "OBSERVACIONES" ocupan 2 filas (rowSpan:2), por eso no aparecen en fila 2.
    // tableHeader:true hace que Word repita esta fila al inicio de cada página nueva.
    const headerRow1 = new TableRow({ tableHeader: true, children: [
        headerCell('DATOS DE LOS ASISTENTES', { columnSpan: 3 }),
        headerCell('FIRMAS',        { rowSpan: 2, width: { size: 16, type: WidthType.PERCENTAGE } }),
        headerCell('OBSERVACIONES', { rowSpan: 2, width: { size: 10, type: WidthType.PERCENTAGE } }),
    ]});

    // Fila 2 de cabecera: solo las 3 columnas de datos (FIRMAS y OBS ya están spaneadas)
    const headerRow2 = new TableRow({ tableHeader: true, children: [
        headerCell('APELLIDOS', { width: { size: 38, type: WidthType.PERCENTAGE } }),
        headerCell('NOMBRE',    { width: { size: 22, type: WidthType.PERCENTAGE } }),
        headerCell('N.I.F.',    { width: { size: 14, type: WidthType.PERCENTAGE } }),
    ]});

    // Filas de datos: una por cada asistente leído del DOM.
    // height con HeightRule.ATLEAST garantiza altura mínima de 8mm aunque la celda esté vacía.
    const dataRows = leerFilasDom().map(({ num, apellidos, nombre, nif }) =>
        new TableRow({
            height: { value: mm(8), rule: HeightRule.ATLEAST },
            children: [
                new TableCell({ borders, width: { size: 38, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [run(`${num}. `, { size: pt(8), color: '555555' }), val(apellidos)] })] }),
                new TableCell({ borders, width: { size: 22, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [val(nombre)]    })] }),
                new TableCell({ borders, width: { size: 14, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [val(nif)]       })] }),
                new TableCell({ borders, width: { size: 16, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: []               })] }),
                new TableCell({ borders, width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: []               })] }),
            ]
        })
    );

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow1, headerRow2, ...dataRows],
    });
}


// ─────────────────────────────────────────────
// FOOTER NATIVO DE WORD
// ─────────────────────────────────────────────

// Construye el footer que Word repite automáticamente al pie de cada página.
// Contiene dos elementos: la caja de Observaciones y la numeración de página.
//
// PageNumber.CURRENT y PageNumber.TOTAL_PAGES no son texto: son field codes de Word
// ({ PAGE } y { NUMPAGES }). Word los evalúa al abrir/imprimir el documento y los
// sustituye por los números reales. docx.js los serializa como campos XML en el .docx.
function buildFooter(footerState) {
    const gb = grayBorder();
    const nb = noBorder();

    return new Footer({ children: [
        // Caja de observaciones: Table de 1 columna, 2 filas.
        // Fila 1: título "OBSERVACIONES GENERALES:" con borde arriba y laterales.
        // Fila 2: texto de las observaciones con borde abajo y laterales.
        // Sin borde entre fila 1 y fila 2 (cellBorderBox lo gestiona) → caja única visual.
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: allNoBorders(),
            rows: [
                new TableRow({ children: [new TableCell({
                    borders: { top: gb, bottom: nb, left: gb, right: gb },
                    children: [new Paragraph({ children: [label('OBSERVACIONES GENERALES:')] })],
                })] }),
                new TableRow({ children: [new TableCell({
                    borders: { top: nb, bottom: gb, left: gb, right: gb },
                    children: [
                        new Paragraph({ spacing: { before: 30, after: 30 }, children: [val(footerState.observaciones || '')] }),
                        emptyPara(20), // pequeño espacio debajo del texto de observaciones
                    ],
                })] }),
            ],
        }),
        // Línea de paginación alineada a la derecha.
        // PageNumber.CURRENT → campo { PAGE } → número de página actual
        // PageNumber.TOTAL_PAGES → campo { NUMPAGES } → total de páginas del documento
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 80 }, // margen superior respecto a la caja de observaciones
            children: [
                run('Hoja ', { bold: true, italics: true, color: AZUL }),
                new TextRun({ children: [PageNumber.CURRENT],     bold: true, italics: true, color: AZUL, font: FONT, size: pt(9) }),
                run(' de ',  { bold: true, italics: true, color: AZUL }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], bold: true, italics: true, color: AZUL, font: FONT, size: pt(9) }),
            ],
        }),
    ]});
}


// ─────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────

// Punto de entrada llamado desde formulario.js.
// headerState: objeto con todos los campos del header (empresaBonificada, cif, etc.)
// footerState: objeto con { observaciones }
//
// Flujo:
//   1. Descarga el logo vía fetch() como ArrayBuffer (necesario para ImageRun)
//   2. Convierte firmaImg (base64 data URL) a ArrayBuffer si existe
//   3. Construye el Document con una sección A4
//   4. Packer.toBlob() serializa el Document a binario .docx en memoria
//   5. Descarga el blob creando un <a> temporal y haciendo click programático
export async function exportarDocx(headerState, footerState) {
    // fetch devuelve ArrayBuffer, que es el formato que ImageRun necesita para imágenes
    const logoBytes = await fetch('/img/FUNDAE-Logo_formacion-Merinero.jpg').then(r => r.arrayBuffer());

    // Convertir la firma de base64 (data URL) a ArrayBuffer.
    // atob() decodifica base64 a string binario; Uint8Array lo convierte a bytes.
    let firmaBytes = null;
    let firmaExt = 'png';
    if (headerState.firmaImg) {
        const b64 = headerState.firmaImg.includes(',') ? headerState.firmaImg.split(',')[1] : headerState.firmaImg;
        const bin = atob(b64);
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        firmaBytes = buf.buffer;
        if (headerState.firmaImg.includes('jpeg') || headerState.firmaImg.includes('jpg')) firmaExt = 'jpg';
    }

    // Document contiene sections. Cada section tiene propiedades de página, header, footer y children.
    // children son los elementos del cuerpo (body): aquí solo la tabla de asistentes.
    // Word calcula cuántas filas caben por página y pagina automáticamente.
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size:   { width: mm(210), height: mm(297) },  // A4
                    margin: {
                        top: mm(20), bottom: mm(20), left: mm(20), right: mm(20),
                        header: mm(10), // distancia del borde del papel al inicio del header
                        footer: mm(10), // distancia del borde del papel al inicio del footer
                    },
                },
            },
            headers: {
                // 'default' es el header para páginas normales (first y even son opcionales)
                default: new Header({ children: [
                    ...buildLogoTitle(logoBytes),  // spread porque devuelve array de 2 párrafos
                    emptyPara(40),
                    buildOpcionesTable(headerState),
                    buildNota(),
                    buildDenominacionTable(headerState, firmaBytes, firmaExt),
                    emptyPara(40),
                ]}),
            },
            footers: {
                default: buildFooter(footerState),
            },
            children: [buildAttendanceTable()], // único elemento en el body: la tabla continua
        }],
    });

    // Packer.toBlob() serializa el Document a formato .docx (ZIP con XML interno) como Blob
    const blob = await Packer.toBlob(doc);

    // Descarga el blob creando un enlace temporal, haciendo click y liberando la URL
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'control-asistencia.docx';
    a.click();
    URL.revokeObjectURL(a.href);
}
