export class ImagenManager {
    constructor() {
        this.imagenArrastrada = null;
        this.inicializarEventos();
    }

    inicializarEventos() {
        document.addEventListener('click', (e) => this.alHacerClick(e));
        document.addEventListener('dragstart', (e) => this.alEmpezarArrastre(e));
        document.addEventListener('dragover', (e) => this.alArrastrarSobre(e));
        document.addEventListener('drop', (e) => this.alSoltar(e));
    }

    // Al hacer clic en una imagen, la envuelve para hacerla redimensionable
    alHacerClick(e) {
        const esImagenDelEditor = e.target.tagName === 'IMG' &&
            e.target.closest('.pagina-contenido');

        if (esImagenDelEditor) {
            const yaEnvuelta = e.target.parentElement.classList.contains('img-resizable');
            if (yaEnvuelta) return;

            this.desenvolverTodas();
            this.envolverImagen(e.target);
        } else if (e.target.tagName !== 'IMG') {
            this.desenvolverTodas();
        }
    }

    // Envuelve una imagen en un span con resize
    envolverImagen(img) {
        const ancho = img.offsetWidth;
        const alto = img.offsetHeight;

        const wrapper = document.createElement('span');
        wrapper.className = 'img-resizable';
        wrapper.contentEditable = 'false';
        wrapper.style.cssText = `display:inline-block; resize:both; overflow:hidden; vertical-align:middle; width:${ancho}px; height:${alto}px;`;

        img.style.cssText = 'width:100%; height:100%; display:block;';

        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
    }

    // Quita los wrappers y guarda el tamaño en la imagen
    desenvolverTodas() {
        document.querySelectorAll('.img-resizable').forEach(wrapper => {
            const img = wrapper.querySelector('img');
            if (!img) return;

            img.style.cssText = `width:${wrapper.offsetWidth}px; height:${wrapper.offsetHeight}px;`;
            wrapper.parentNode.insertBefore(img, wrapper);
            wrapper.remove();
        });
    }

    // Cuando empieza a arrastrar una imagen
    alEmpezarArrastre(e) {
        if (e.target.classList?.contains('img-resizable')) {
            const wrapper = e.target;
            const img = wrapper.querySelector('img');

            // Guardar tamaño en el img y desenvolver
            img.style.cssText = `width:${wrapper.offsetWidth}px; height:${wrapper.offsetHeight}px;`;
            wrapper.parentNode.insertBefore(img, wrapper);
            wrapper.remove();

            this.imagenArrastrada = img;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', '');
        } else if (e.target.tagName === 'IMG') {
            this.imagenArrastrada = e.target;
            e.dataTransfer.effectAllowed = 'move';
        }
    }

    alArrastrarSobre(e) {
        if (this.imagenArrastrada) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        }
    }

    // Cuando se suelta la imagen en otro lugar
    alSoltar(e) {
        if (!this.imagenArrastrada) return;

        e.preventDefault();
        const img = this.imagenArrastrada;
        const range = document.caretRangeFromPoint(e.clientX, e.clientY);

        if (range) {
            img.remove();
            range.insertNode(img);
        }

        this.imagenArrastrada = null;
    }
}