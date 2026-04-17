document.addEventListener('DOMContentLoaded', () => {

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

    /* LOGICA DEL BOTON DE PEDIDOS */
    const orderBtn = document.getElementById('orderBtn');
    const deliveryOptions = document.getElementById('deliveryOptions');

    if (orderBtn && deliveryOptions) {
        orderBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deliveryOptions.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            deliveryOptions.classList.remove('show');
        });
    }

    /*logica para cierre de modal con pdf al hacer click fuera*/
    window.onclick = function(e) {
        const modal = document.getElementById('pdfModal');
        if (e.target === modal) {
            closePdfModal();
        }
    };

    const logo = document.querySelector('.logo-area');
    
    if (logo) {
        const currentPage = logo.getAttribute('data-page');

        if (currentPage === 'inicio') {
            let clickCount = 0;
            let clickTimer;

            logo.addEventListener('click', () => {
                clickCount++;

                clearTimeout(clickTimer);
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                }, 2000);

                if (clickCount === 5) {
                    window.location.href = '/login';
                }
            });
        }
    }

    //logica para carrusel de libreria swiper
    const configFotos = {
        effect: 'fade',
        fadeEffect: { crossFade: true },
        loop: true,
        speed: 5000, 
        autoplay: {
            delay: 4000, // Se queda 4 segundos quieta
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
    };

    const configVideos = {
        ...configFotos, 
        speed: 2000,
        autoplay: {
            delay: 8000,
            disableOnInteraction: false,
        },
    };

    if (document.querySelector('.swiper-esencia')) new Swiper('.swiper-esencia', configFotos);
    if (document.querySelector('.swiper-carta')) new Swiper('.swiper-carta', configFotos);
    if (document.querySelector('.swiper-eventos')) {
        const swiperEventos = new Swiper('.swiper-eventos', configVideos);

        //logica para que el video arranque al cambiar
        swiperEventos.on('slideChangeTransitionEnd', function () {
            const activeSlide = swiperEventos.slides[swiperEventos.activeIndex];
            const video = activeSlide.querySelector('video');
            if (video) video.play();
        });
    }
});

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
