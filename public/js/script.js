document.addEventListener('DOMContentLoaded', () => {

    const mobileMenuIcon = document.querySelector('.mobile-menu-icon');
    const navMenu = document.querySelector('.nav-links');

    if (mobileMenuIcon && navMenu) {
        mobileMenuIcon.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            
            const icon = mobileMenuIcon.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-xmark');
            }
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = mobileMenuIcon.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-xmark');
                }
            });
        });
    }

    const sections = document.querySelectorAll("main[id], section[id]");
    const navLinksList = document.querySelectorAll(".nav-links a");

    window.addEventListener("scroll", () => {
        let currentSection = "";
        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            if (window.pageYOffset >= sectionTop - 150) {
                currentSection = section.getAttribute("id");
            }
        });

        navLinksList.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${currentSection}`) {
                link.classList.add("active");
            }
        });
    });

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

    const logo = document.querySelector('.logo-area');
    if (logo) {
        const currentPage = logo.getAttribute('data-page');
        if (currentPage === 'inicio') {
            let clickCount = 0;
            let clickTimer;

            logo.addEventListener('click', (e) => {
                clickCount++;
                clearTimeout(clickTimer);
                clickTimer = setTimeout(() => { clickCount = 0; }, 2000);

                if (clickCount === 5) {
                    e.preventDefault();
                    window.location.href = '/login';
                }
            });
        }
    }

    const configFotos = {
        effect: 'fade',
        fadeEffect: { crossFade: true },
        loop: true,
        speed: 5000, 
        autoplay: { delay: 4000, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination', clickable: true },
    };

    if (document.querySelector('.swiper-esencia')) new Swiper('.swiper-esencia', configFotos);
    if (document.querySelector('.swiper-carta')) new Swiper('.swiper-carta', configFotos);
    if (document.querySelector('.swiper-eventos')) {
        const swiperEventos = new Swiper('.swiper-eventos', {
            ...configFotos,
            speed: 2000,
            autoplay: { delay: 8000, disableOnInteraction: false },
        });

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
        frame.src = path + "?v=" + new Date().getTime();
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closePdfModal() {
    const modal = document.getElementById('pdfModal');
    const frame = document.getElementById('pdfFrame');
    
    if (modal) {
        if (frame) frame.src = "";
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('pdfModal');
    if (e.target === modal) {
        closePdfModal();
    }
});