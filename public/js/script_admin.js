let hideTimeouts = {}; //variable para trackear los timeouts de cada elemento

function autoHide(elementId) {
    const target = document.getElementById(elementId);
    if (!target) return;

    // Si ya hay un proceso de ocultado para este elemento, se cancela para reiniciar el contador
    if (hideTimeouts[elementId]) {
        clearTimeout(hideTimeouts[elementId].timer1);
        clearTimeout(hideTimeouts[elementId].timer2);
    }

    //reinicio el estado visual inmediatamente
    target.style.display = "block";
    target.style.transition = "none"; 
    target.style.opacity = "1";

    const t1 = setTimeout(() => {
        target.style.transition = "opacity 1s ease";
        target.style.opacity = "0";
        
        const t2 = setTimeout(() => {
            target.style.display = "none";
        }, 1000); 

        hideTimeouts[elementId].timer2 = t2;
    }, 5000);

    hideTimeouts[elementId] = { timer1: t1 };
}

/*Inicializacion de validaciones y eventos */
document.addEventListener('DOMContentLoaded', () => {
    //se ejecuta para el mensaje de éxito que viene del servidor
    autoHide('success-alert');

    const adminForm = document.getElementById('adminForm');
    
    if (adminForm) {
        adminForm.addEventListener('submit', function(e) {
            const desc = document.getElementById('descText').value.trim();
            const imgInput = document.getElementById('imgInput');
            const pdfInput = document.getElementById('pdfInput');
            const warning = document.getElementById('js-warning');

            const imgCount = imgInput ? imgInput.files.length : 0;
            const pdfCount = pdfInput ? pdfInput.files.length : 0;

            if (desc === "" && imgCount === 0 && pdfCount === 0) {
                e.preventDefault();
                
                if (warning) {
                    warning.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> No se han realizado cambios para subir';
                    
                    //reinicio la animacion de sacudida (shake)
                    warning.style.animation = 'none';
                    warning.offsetHeight; //forzado frl reflujo para que el navegador note el cambio
                    warning.style.animation = 'shake 0.8s'; 

                    //contador de 5 segundos para desaparecer
                    autoHide('js-warning');
                }
            } else if (warning) {
                warning.style.display = 'none';
            }
        });
    }
});