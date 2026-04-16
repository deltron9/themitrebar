
const sections = document.querySelectorAll("main[id], section[id]");
const navLinks = document.querySelectorAll(".nav-links a");

/*LOGICA DE SCROLL*/
window.addEventListener("scroll", () => {
    let currentSection = "";

    sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.pageYOffset >= sectionTop - 150) {
            currentSection = section.getAttribute("id");
        }
    });

    navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${currentSection}`) {
            link.classList.add("active");
        }
    });
});

/*LOGICA DEL MODAL PDF*/
function openPdfModal(path) {
    const modal = document.getElementById('pdfModal');
    const frame = document.getElementById('pdfFrame');
    
    if (modal && frame) {
        //el timestamp (?v=) obliga al navegador a cargar el archivo nuevo aunque se llame igual
        frame.src = path + "?v=" + new Date().getTime();
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; //bloquea scroll del fondo
    }
}

function closePdfModal() {
    const modal = document.getElementById('pdfModal');
    const frame = document.getElementById('pdfFrame');
    
    if (modal) {
        if (frame) frame.src = ""; //limpia el frame para detener la carga
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; //devuelve el scroll
    }
}

/*logica para cierre de modal con pdf al hacer click fuera*/
window.onclick = function(e) {
    const modal = document.getElementById('pdfModal');
    if (e.target === modal) {
        closePdfModal();
    }
};