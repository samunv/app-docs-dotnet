import { Pagina } from './Types/Pagina.js';

const headerState = {
    empresaBonificada: '',
    cif: '',
    entidad: '',
    cif2: '',
    codigo: '',
    denominacion: '',
    num: '',
    grupo: '',
    fechaInicio: '',
    fechaFin: '',
    fecha: '',
    turno: '',
    horaDe: '',
    horaA: '',
    firmaNombre: '',
    firmaImg: null,
};

const footerState = {
    observaciones: '',
};

/** @type {Pagina[]} */
const paginas = [];


const NUM_FILAS = 14;

// ── Render HTML ──

function renderHeaderHTML() {
    return `
    <div class="header">
        <div class="logo">
            <img src="/img/FUNDAE-Logo_formacion-Merinero.jpg"/>
        </div>
        <div class="title-area">
            <div class="main-title">CONTROL DE ASISTENCIA</div>
        </div>
    </div>
    <div class="opciones">
        <div class="opcion-row">
            <div class="opcion-label">OPCIÓN A</div>
            <div class="opcion-content">
                <span class="field-label">EMPRESA BONIFICADA:</span>
                <input type="text" class="input-empresa header-input" data-key="empresaBonificada" placeholder="">
                <span class="field-label">CIF.:</span>
                <input type="text" class="input-cif header-input" data-key="cif" placeholder="">
            </div>
        </div>
        <div class="opcion-row">
            <div class="opcion-label">OPCIÓN B</div>
            <div class="opcion-content">
                <span class="field-label">ENTIDAD ORGANIZADORA:</span>
                <input type="text" class="input-entidad header-input" data-key="entidad" placeholder="">
                <span class="field-label">CIF.:</span>
                <input type="text" class="input-cif2 header-input" data-key="cif2" placeholder="">
            </div>
        </div>
        <div class="opcion-row">
            <div class="opcion-label"></div>
            <div class="opcion-content">
                <span class="field-label-red">CÓDIGO DE AGRUPACIÓN:</span>
                <input type="text" class="input-codigo header-input" data-key="codigo" placeholder="">
            </div>
        </div>
    </div>
    <div class="nota">
        (Se seleccionará uno de los apartados anteriores dependiendo del perfil con el que se haya accedido al Sistema telemático de Gestión de Acciones Formativas en las Empresas)
    </div>
    <div class="denominacion-box">
        <div class="denom-row">
            <span class="denom-label">DENOMINACIÓN DE LA ACCIÓN FORMATIVA:</span>
            <input type="text" class="input-denom header-input" data-key="denominacion" placeholder="">
        </div>
        <div class="denom-row">
            <span class="denom-label">Nº:</span>
            <input type="text" class="input-num header-input" data-key="num" placeholder="">
            <span class="denom-label">GRUPO:</span>
            <input type="text" class="input-grupo header-input" data-key="grupo" placeholder="">
            <span class="denom-label">FECHA DE INICIO:</span>
            <input type="text" class="input-fecha header-input" data-key="fechaInicio" placeholder="dd/mm/aaaa">
            <span class="denom-label">FECHA FIN:</span>
            <input type="text" class="input-fecha header-input" data-key="fechaFin" placeholder="dd/mm/aaaa">
        </div>
        <div class="denom-row">
            <span class="denom-label">FECHA:</span>
            <input type="text" class="input-fecha header-input" data-key="fecha" placeholder="dd/mm/aaaa">
            <div class="turno-group">
                <select class="turno-select header-select" data-key="turno">
                    <option value="">-- TURNO --</option>
                    <option>MAÑANA</option>
                    <option>TARDE</option>
                    <option>MAÑANA/TARDE</option>
                </select>
            </div>
            <span class="denom-label">HORARIO: DE</span>
            <input type="text" class="input-horario header-input" data-key="horaDe" placeholder="00:00">
            <span class="denom-label">A</span>
            <input type="text" class="input-horario header-input" data-key="horaA" placeholder="00:00">
        </div>
        <div class="firma-box">
            <div class="firma-area">
                <span class="firma-placeholder" style="font-size:8px;color:#aaa;text-align:center;">Firma<br>digital</span>
                <img class="firma-preview" src="" style="display:none;width:100%;height:100%;object-fit:contain;"/>
                <input type="file" class="header-file" data-key="firmaImg" accept="image/*">
            </div>
            <div class="firma-info">
                <label>Firmado:</label>
                <input type="text" class="header-input" data-key="firmaNombre" style="width:200px;" placeholder="Nombre del formador/responsable">
                <div style="margin-top:3px;font-size:9px;color:var(--azul);font-weight:bold;">(Formador/Resp. Formación)</div>
            </div>
        </div>
    </div>`;
}

function renderFooterHTML(numPagina) {
    return `
    <div class="obs-generales">
        <div class="obs-title">OBSERVACIONES GENERALES:</div>
        <div class="obs-body">
            <textarea class="obs-input footer-textarea" placeholder="Observaciones del profesor..." style="resize:none;"></textarea>
        </div>
    </div>
    <div class="footer">Hoja ${numPagina} de ${paginas.length}</div>`;
}

function crearFilasBody() {
    let html = '';
    for (let i = 1; i <= NUM_FILAS; i++) {
        html += `
        <tr>
            <td>
                <span style="margin-right:4px;font-size:10px;color:#555;">${i}.</span>
                <input type="text" style="width:calc(100% - 22px);">
            </td>
            <td class="td-nombre"><input type="text" style="width:100%;"></td>
            <td class="td-apellido"><input type="text" style="width:100%;"></td>
            <td class="td-firma"></td>
            <td class="td-nif"></td>
        </tr>`;
    }
    return html;
}

// ── Renderizar página ──

function renderizarPagina(pagina) {
    const contenedor = document.getElementById('contenedor-paginas');

    const div = document.createElement('div');
    div.className = 'page';
    div.dataset.num = pagina.num;

    div.innerHTML = `
        <div class="pagina-header"></div>
        <div class="pagina-body">
            <table>
                <thead>
                    <tr>
                        <th colspan="3" class="th-datos">DATOS DE LOS ASISTENTES</th>
                        <th class="th-firmas" rowspan="2">FIRMAS</th>
                        <th class="th-obs" rowspan="2">OBSERVACIONES</th>
                    </tr>
                    <tr>
                        <th style="width:38%;">APELLIDOS</th>
                        <th style="width:22%;">NOMBRE</th>
                        <th style="width:14%;">N.I.F.</th>
                    </tr>
                </thead>
                <tbody class="pagina-tbody">${pagina.body}</tbody>
            </table>
        </div>
        <div class="pagina-footer"></div>
    `;

    const headerEl = div.querySelector('.pagina-header');
    headerEl.innerHTML = renderHeaderHTML();
    aplicarHeaderState(headerEl);
    bindHeaderListeners(headerEl);

    const footerEl = div.querySelector('.pagina-footer');
    footerEl.innerHTML = renderFooterHTML(pagina.num);
    aplicarFooterState(footerEl);
    bindFooterListeners(footerEl);

    const tbody = div.querySelector('.pagina-tbody');
    tbody.addEventListener('input', () => actualizarBody(pagina.num, tbody.innerHTML));

    contenedor.appendChild(div);
    actualizarNumeracionFooters();
}

// ── Estado header/footer ──

function aplicarHeaderState(headerEl) {
    headerEl.querySelectorAll('.header-input').forEach(input => {
        const key = input.dataset.key;
        if (key && headerState[key] !== undefined) input.value = headerState[key];
    });

    headerEl.querySelectorAll('.header-select').forEach(select => {
        const key = select.dataset.key;
        if (key && headerState[key] !== undefined) select.value = headerState[key];
    });

    if (headerState.firmaImg) {
        const preview = headerEl.querySelector('.firma-preview');
        const placeholder = headerEl.querySelector('.firma-placeholder');
        if (preview) { preview.src = headerState.firmaImg; preview.style.display = 'block'; }
        if (placeholder) placeholder.style.display = 'none';
    }
}

function bindHeaderListeners(headerEl) {
    headerEl.querySelectorAll('.header-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const key = e.target.dataset.key;
            if (!key) return;
            headerState[key] = e.target.value;
            propagarHeader(headerEl, key, e.target.value);
        });
    });

    headerEl.querySelectorAll('.header-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const key = e.target.dataset.key;
            if (!key) return;
            headerState[key] = e.target.value;
            propagarHeader(headerEl, key, e.target.value);
        });
    });

    headerEl.querySelectorAll('.header-file').forEach(fileInput => {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                headerState.firmaImg = ev.target.result;
                document.querySelectorAll('.pagina-header').forEach(h => {
                    const preview = h.querySelector('.firma-preview');
                    const placeholder = h.querySelector('.firma-placeholder');
                    if (preview) { preview.src = ev.target.result; preview.style.display = 'block'; }
                    if (placeholder) placeholder.style.display = 'none';
                });
            };
            reader.readAsDataURL(file);
        });
    });
}

function propagarHeader(origenEl, key, valor) {
    document.querySelectorAll('.pagina-header').forEach(headerEl => {
        if (headerEl === origenEl) return;
        const target = headerEl.querySelector(`[data-key="${key}"]`);
        if (target) target.value = valor;
    });
}

function aplicarFooterState(footerEl) {
    const textarea = footerEl.querySelector('.footer-textarea');
    if (textarea) textarea.value = footerState.observaciones;
}

function bindFooterListeners(footerEl) {
    const textarea = footerEl.querySelector('.footer-textarea');
    if (!textarea) return;
    textarea.addEventListener('input', (e) => {
        footerState.observaciones = e.target.value;
        document.querySelectorAll('.pagina-footer .footer-textarea').forEach(ta => {
            if (ta !== e.target) ta.value = footerState.observaciones;
        });
    });
}

function actualizarNumeracionFooters() {
    document.querySelectorAll('.pagina-footer').forEach((footerEl, i) => {
        const footerDiv = footerEl.querySelector('.footer');
        if (footerDiv) footerDiv.textContent = `Hoja ${i + 1} de ${paginas.length}`;
    });
}

function actualizarBody(num, nuevoBody) {
    const pagina = paginas.find(p => p.num === num);
    if (pagina) pagina.body = nuevoBody;
}

function agregarPagina() {
    const nueva = new Pagina(paginas.length + 1, crearFilasBody());
    paginas.push(nueva);
    renderizarPagina(nueva);
}

// ── Exportar ──





async function exportarPDF() {
    // Serializar valores
    document.querySelectorAll('.page').forEach(page => {
        page.querySelectorAll('input[type="text"]').forEach(input => {
            input.setAttribute('value', input.value);
        });
        page.querySelectorAll('textarea').forEach(ta => {
            ta.textContent = ta.value;
        });
        page.querySelectorAll('select').forEach(sel => {
            [...sel.options].forEach(opt => {
                if (opt.selected) opt.setAttribute('selected', '');
                else opt.removeAttribute('selected');
            });
        });
    });

    // Recoger CSS
    const css = await fetch('/css/formulario.css').then(r => r.text());

    const cssExtra = `
    body { margin: 0 !important; padding: 0 !important; background: white !important; }
    .page { 
        margin: 0 !important; 
        margin-top: 0 !important;
        box-shadow: none !important;
        page-break-after: always;
        page-break-inside: avoid;
    }
    #contenedor-paginas { 
        padding: 0 !important; 
        gap: 0 !important; 
        background: white !important; 
    }
    `

    const estilos = css + cssExtra

    // HTML completo con estilos y páginas
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>${estilos}</style>
        </head>
        <body>
            <div id="contenedor-paginas">
                ${[...document.querySelectorAll('.page')].map(p => p.outerHTML).join('')}
            </div>
        </body>
        </html>`;

    const response = await fetch('/Home/ExportPdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlContent, header: '', footer: '' })
    });

    if (!response.ok) { alert('Error al generar el PDF'); return; }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documento.pdf';
    a.click();
    URL.revokeObjectURL(url);
}

window.exportarPDF = exportarPDF;



async function exportarWord() {
    // Serializar valores
    document.querySelectorAll('.page').forEach(page => {
        page.querySelectorAll('input[type="text"]').forEach(input => {
            input.setAttribute('value', input.value);
        });
        page.querySelectorAll('textarea').forEach(ta => {
            ta.textContent = ta.value;
        });
        page.querySelectorAll('select').forEach(sel => {
            [...sel.options].forEach(opt => {
                if (opt.selected) opt.setAttribute('selected', '');
                else opt.removeAttribute('selected');
            });
        });
    });

    // Recoger CSS
    const css = await fetch('/css/formulario.css').then(r => r.text());

    const cssExtra = `
    body { margin: 0 !important; padding: 0 !important; background: white !important; }
    .page { 
        margin: 0 !important; 
        margin-top: 0 !important;
        box-shadow: none !important;
        page-break-after: always;
        page-break-inside: avoid;
    }
    #contenedor-paginas { 
        padding: 0 !important; 
        gap: 0 !important; 
        background: white !important; 
    }
    `

    const estilos = css + cssExtra

    // HTML completo con estilos y páginas
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>${estilos}</style>
        </head>
        <body>
            <div id="contenedor-paginas">
                ${[...document.querySelectorAll('.page')].map(p => p.outerHTML).join('')}
            </div>
        </body>
        </html>`;

    const response = await fetch('/Home/ExportWord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlContent, header: '', footer: '' })
    });

    if (!response.ok) { alert('Error al generar el Word'); return; }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documento.docx';
    a.click();
    URL.revokeObjectURL(url);
}


// ── Init ──

window.addEventListener('DOMContentLoaded', () => {
    agregarPagina();
});

window.agregarPagina = agregarPagina;
window.exportarWord = exportarWord;