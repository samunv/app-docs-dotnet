import { Pagina } from './Types/Pagina.js';
import { ImagenManager } from "./Types/ImageManager.js"

/** @type {Pagina[]} */
const paginas = [];


let seleccionGuardada = null;
let headerContent = '';
let footerContent = '';
let spellcheckEnabled = true;

const OBSERVER_CONFIG = { subtree: true, childList: true, characterData: true, attributes: true };
const headerObservers = new Map();
const footerObservers = new Map();


const imagenManager = new ImagenManager();


window.addEventListener('DOMContentLoaded', () => {
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

function renderizarPagina(pagina) {
    const contenedor = document.getElementById('contenedor-paginas');

    const div = getHTMLDivPage(pagina)

    const headerEl = div.querySelector('.pagina-header');
    const footerTexto = div.querySelector('.footer-texto');

    headerEl.innerHTML = headerContent;
    footerTexto.innerHTML = footerContent;

    useDoubleClickListener(headerEl)
    useDoubleClickListener(footerTexto)

    useObserver(headerEl, headerObservers, '.pagina-header', c => headerContent = c);
    useObserver(footerTexto, footerObservers, '.footer-texto', c => footerContent = c);

    const contenido = div.querySelector('.pagina-contenido');

    contenido.addEventListener('input', () => {
        actualizarBody(pagina.num, contenido.innerHTML);
        comprobarDesbordamiento(contenido, pagina);
    });

    contenedor.appendChild(div);
}

function getHTMLDivPage(pagina) {
    const div = document.createElement('div');
    div.className = 'pagina';
    div.dataset.num = pagina.num;
    div.innerHTML = `
        <div class="pagina-header" spellcheck="${spellcheckEnabled}"></div>
        <div class="pagina-contenido" contenteditable="true" spellcheck="${spellcheckEnabled}">${pagina.body}</div>
        <div class="pagina-footer">
            <span class="footer-texto" spellcheck="${spellcheckEnabled}"></span>
            <span>Página ${pagina.num}</span>
        </div>
    `;
    return div;
}

function useDoubleClickListener(element) {
    element.addEventListener('dblclick', () => {
        element.contentEditable = 'true';
        element.focus();
    });
}

function useObserver(element, elementObservers, classSelector, setContent) {
    const observer = new MutationObserver(() => {
        const content = element.innerHTML;
        setContent(content);
        document.querySelectorAll(classSelector).forEach(el => {
            if (el !== element) {
                const obs = elementObservers.get(el);
                obs?.disconnect();
                el.innerHTML = content;
                obs?.observe(el, OBSERVER_CONFIG);
            }
        });
    });
    observer.observe(element, OBSERVER_CONFIG);
    elementObservers.set(element, observer);
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


function formato(comando, valor=null) { document.execCommand(comando, false, valor); }
function cambiarColor() { document.getElementById('colorPicker').click(); }
function insertarEnlace() {
    const url = prompt('URL:', 'https://');
    if (url) document.execCommand('createLink', false, url);
}

async function exportarPDF() {
    const header = document.querySelector('.pagina-header')?.textContent.trim() ?? '';
    const footer = document.querySelector('.footer-texto')?.textContent.trim() ?? '';
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
    const HTMLtoDOCX = window.HTMLtoDOCX;
    if (!HTMLtoDOCX) {
        alert('La librería de exportación Word no está disponible. Verifica tu conexión.');
        return;
    }

    const htmlContent = paginas.map(p => p.body).join('');

    const blob = await HTMLtoDOCX(
        htmlContent,
        headerContent,
        { font: 'Arial', fontSize: 24 },
        footerContent
    );

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





function toggleSpellcheck() {
    spellcheckEnabled = !spellcheckEnabled;
    const btn = document.getElementById('btn-spellcheck');
    btn.classList.toggle('btn-active', spellcheckEnabled);
    document.querySelectorAll('.pagina-contenido, .pagina-header, .footer-texto').forEach(el => {
        el.spellcheck = spellcheckEnabled;
    });
}

window.toggleSpellcheck = toggleSpellcheck;
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