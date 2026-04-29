import { Pagina } from './Types/Pagina.js';
import { ImagenManager } from "./Types/ImageManager.js"

/** @type {Pagina[]} */
const paginas = [];


let seleccionGuardada = null;


const imagenManager = new ImagenManager();


window.addEventListener('DOMContentLoaded', () => {
    const inputHeader = document.getElementById('inputHeader');
    const inputFooter = document.getElementById('inputFooter');

    inputHeader.style.display = "none";
    inputFooter.style.display = "none"


    // Esconder al detectar click fuera
    detectarClickFuera(inputHeader)
    detectarClickFuera(inputFooter)



    inputHeader.oninput = sincronizarHeaderFooter;
    inputFooter.oninput = sincronizarHeaderFooter;


    // Detectar salida del ratón de la selección de texto (para aplicar tamaño de fuente)
    document.addEventListener('mouseup', () => {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            // Solo guardar si la selección está dentro del editor
            const contenido = range.commonAncestorContainer;
            const estaEnEditor = contenido.closest
                ? contenido.closest('.pagina-contenido')
                : contenido.parentElement?.closest('.pagina-contenido');

            if (estaEnEditor) {
                seleccionGuardada = range.cloneRange();
            }
        }
    });

    agregarPagina();
});

function detectarClickFuera(input) {
    input.addEventListener('blur', () => {
        input.style.display = 'none';
    });
}

function detectarClickSection(section, input) {
    section.addEventListener('dblclick', () => {
        input.style.display = 'block';
        input.focus()
    });
}

function renderizarPagina(pagina) {
    const contenedor = document.getElementById('contenedor-paginas');

    const div = document.createElement('div');
    div.className = 'pagina';
    div.dataset.num = pagina.num;
    div.innerHTML = `
        <div class="pagina-header"></div>
        <div class="pagina-contenido" contenteditable="true">${pagina.body}</div>
        <div class="pagina-footer">
            <span class="footer-texto"></span>
            <span>Página ${pagina.num}</span>
        </div>
    `;

    // Aquí seleccionamos el header de ESTA página recién creada
    const headerEl = div.querySelector('.pagina-header');
    const footerEl = div.querySelector('.pagina-footer')

    const inputHeader = document.getElementById('inputHeader');
    const inputFooter = document.getElementById("inputFooter");

    detectarClickSection(headerEl, inputHeader)
    detectarClickSection(footerEl, inputFooter)

    const contenido = div.querySelector('.pagina-contenido');

    contenido.addEventListener('input', () => {
        actualizarBody(pagina.num, contenido.innerHTML);
        comprobarDesbordamiento(contenido, pagina);
    });

    contenedor.appendChild(div);
    sincronizarHeaderFooter();
}

function agregarPagina() {
    const nueva = new Pagina(paginas.length + 1);
    paginas.push(nueva);
    renderizarPagina(nueva);
}

function actualizarBody(num, nuevoBody) {
    const pagina = paginas.find(p => p.num === num);
    if (pagina) pagina.body = nuevoBody;
}

function comprobarDesbordamiento(contenido, pagina) {
    if (contenido.scrollHeight > contenido.clientHeight) {
        const esUltima = pagina.num === paginas.length;
        if (esUltima) {
            agregarPagina();
            const todas = document.querySelectorAll('.pagina-contenido');
            todas[todas.length - 1].focus();
        }
    }
}

function sincronizarHeaderFooter() {
    const h = document.getElementById('inputHeader').value;
    const f = document.getElementById('inputFooter').value;
    document.querySelectorAll('.pagina-header').forEach(el => el.textContent = h);
    document.querySelectorAll('.footer-texto').forEach(el => el.textContent = f);
}

function formato(comando, valor=null) { document.execCommand(comando, false, valor); }
function cambiarColor() { document.getElementById('colorPicker').click(); }
function insertarEnlace() {
    const url = prompt('URL:', 'https://');
    if (url) document.execCommand('createLink', false, url);
}

async function exportarPDF() {
    const header = document.getElementById('inputHeader').value;
    const footer = document.getElementById('inputFooter').value;
    const htmlContent = paginas.map(p => p.body).join('');

    const response = await fetch('/Home/ExportPDF', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlContent, header, footer })
    });

    if (!response.ok) {
        alert('Error al generar el PDF');
        return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documento.pdf';
    a.click();
    URL.revokeObjectURL(url); }

async function exportarWord() {
    const header = document.getElementById('inputHeader').value;
    const footer = document.getElementById('inputFooter').value;
    const htmlContent = paginas.map(p => p.body).join('');

    const response = await fetch('/Home/ExportWord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlContent, header, footer })
    });

    if (!response.ok) {
        alert('Error al generar el Word');
        return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documento.docx';
    a.click();
    URL.revokeObjectURL(url);
}

function cambiarTamano(px) {
    if (!seleccionGuardada) return;

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(seleccionGuardada);

    // Si no hay selección de texto, salir
    if (seleccionGuardada.collapsed) return;

    // Envolver el texto seleccionado en un span con el estilo
    const span = document.createElement('span');
    span.style.fontSize = px + 'px';

    try {
        seleccionGuardada.surroundContents(span);
    } catch (e) {
        // Si no se puede envolver directamente (selección compleja), extraemos y volvemos a insertar
        const contenido = seleccionGuardada.extractContents();
        span.appendChild(contenido);
        seleccionGuardada.insertNode(span);
    }

    // Actualizar el body de la página correspondiente
    const paginaContenido = span.closest('.pagina-contenido');
    if (paginaContenido) {
        const num = parseInt(paginaContenido.parentElement.dataset.num);
        actualizarBody(num, paginaContenido.innerHTML);
    }
}

function aplicarColor(color) {
    document.execCommand('foreColor', false, color);

    // Cambiar el color del icono SVG
    const svg = document.getElementById("icono-color-texto");
    if (svg) svg.style.fill=color
}

function insertarImagen() {
    document.getElementById('inputImagen').click();
}

function cargarImagen(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const html = `<img src="${e.target.result}" style="max-width:100%;" />`;

        if (seleccionGuardada) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(seleccionGuardada);
        }

        document.execCommand('insertHTML', false, html);
    };
    reader.readAsDataURL(file);
    input.value = '';
}





window.insertarImagen = insertarImagen;
window.cargarImagen = cargarImagen;
window.cambiarTamano = cambiarTamano;

window.formato = formato;
window.cambiarColor = cambiarColor;
window.aplicarColor = aplicarColor;
window.insertarEnlace = insertarEnlace;
window.exportarPDF = exportarPDF;
window.exportarWord = exportarWord;
window.agregarPagina = agregarPagina;