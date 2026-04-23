document.addEventListener('DOMContentLoaded', () => {

    // --- variables y selectores ---
    const mobileMenuIcon = document.querySelector('.mobile-menu-icon');
    const navMenu = document.querySelector('.nav-links');
    const body = document.body;
    const form = document.getElementById('survey-form');
    const searchInput = document.getElementById('localidad-search');
    const optionsList = document.getElementById('localidad-options');
    const hiddenInput = document.getElementById('localidad-value');
    let localidadesRaw = [];

    // --- menu mobile ---
    if (mobileMenuIcon && navMenu) {
        mobileMenuIcon.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const isOpened = navMenu.classList.contains('active');
            
            const icon = mobileMenuIcon.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars', !isOpened);
                icon.classList.toggle('fa-xmark', isOpened);
            }
            body.style.overflow = isOpened ? 'hidden' : 'auto';
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                body.style.overflow = 'auto';
                const icon = mobileMenuIcon.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-xmark');
                }
            });
        });
    }

    // --- scroll active links ---
    const sections = document.querySelectorAll("main[id], section[id]");
    const navLinksList = document.querySelectorAll(".nav-links a");

    if (sections.length > 0) {
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
    }

    // --- pedidos dropdown ---
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

    // --- configuración sweetalert ---
    const MitreAlert = typeof Swal !== 'undefined' ? Swal.mixin({
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        background: '#0a0a0a',
        color: '#ffffff',
        willOpen: (popup) => {
            popup.style.border = '2px solid #e2b04a';
            popup.style.boxShadow = '0 0 15px rgba(226, 176, 74, 0.3)';
            const timerBar = popup.querySelector('.swal2-timer-progress-bar');
            if (timerBar) {
                timerBar.style.backgroundColor = '#e2b04a';
            }
        }
    }) : null;

    // --- funciones auxiliares encuesta ---
    const cleanString = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const updateList = (list) => {
        if (optionsList) {
            optionsList.innerHTML = list.map(name => `<li class="option-item">${name}</li>`).join('');
        }
    };

    // --- carga de localidades ---
    const cargarLocalidades = async () => {
        try {
            const [resBA, resCABA] = await Promise.all([
                fetch('https://apis.datos.gob.ar/georef/api/localidades?provincia=06&max=5000&campos=nombre'),
                fetch('https://apis.datos.gob.ar/georef/api/localidades?provincia=02&max=1000&campos=nombre')
            ]);

            const dataBA = await resBA.json();
            const dataCABA = await resCABA.json();

            const nombresBA = dataBA.localidades.map(l => l.nombre);
            const nombresCABA = dataCABA.localidades.map(l => l.nombre);
            
            const extrasZonaSur = ["José Mármol", "Rafael Calzada", "Claypole", "Longchamps", "Glew", "Burzaco", "Adrogué", "Turdera", "Llavallol", "Alejandro Korn", "Guernica", "Banfield", "Temperley", "Lomas de Zamora", "Lanús", "Remedios de Escalada", "Gerli", "Avellaneda", "Wilde", "Sarandí", "Quilmes", "Bernal", "Berazategui", "San José", "Don Orione", "Malvinas Argentinas", "San Francisco Solano"];
            const extrasCaba = ["Palermo", "Recoleta", "Belgrano", "Caballito", "Flores", "San Telmo", "Puerto Madero", "Almagro", "Villa Crespo", "Chacarita", "Colegiales", "Núñez", "Villa Urquiza", "Devoto", "Paternal", "Barracas", "Once", "Constitución", "Montserrat", "Retiro", "Balvanera", "Boedo", "Parque Patricios"];
            
            localidadesRaw = [...new Set([...nombresBA, ...nombresCABA, ...extrasZonaSur, ...extrasCaba])].sort((a, b) => a.localeCompare(b));
            updateList(localidadesRaw.slice(0, 50)); 
        } catch (error) {
            localidadesRaw = ["Rafael Calzada", "José Mármol", "Palermo", "Recoleta", "Adrogué"];
            updateList(localidadesRaw);
        }
    };

    if (searchInput) cargarLocalidades();

    // --- filtros de entrada ---
    const setupFilter = (id, regex) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('keypress', (e) => {
                if (!regex.test(e.key)) e.preventDefault();
            });
        }
    };
    setupFilter('nombre', /[a-zA-Z\s]/);
    setupFilter('apellido', /[a-zA-Z\s]/);
    setupFilter('prefijo', /[0-9]/);
    setupFilter('numero', /[0-9]/);

    // --- buscador de localidades ---
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = cleanString(e.target.value);
            const filtered = localidadesRaw.filter(loc => cleanString(loc).includes(term));
            
            if (term.length > 0) {
                if (filtered.length > 0) {
                    updateList(filtered.slice(0, 100));
                    optionsList.classList.add('is-visible');
                } else {
                    optionsList.innerHTML = '<li class="option-item">No se encontró esa localidad</li>';
                    optionsList.classList.add('is-visible');
                }
            } else {
                optionsList.classList.remove('is-visible');
            }
            if (hiddenInput) hiddenInput.value = ""; 
        });
    }

    if (optionsList) {
        optionsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('option-item') && e.target.innerText !== "No se encontró esa localidad") {
                const selected = e.target.innerText;
                searchInput.value = selected;
                if (hiddenInput) hiddenInput.value = selected;
                optionsList.classList.remove('is-visible');
            }
        });
    }

    // --- validacion y envio de encuesta ---
    const alertAndFocus = (msg, elementId) => {
        if (!MitreAlert) return;
        MitreAlert.fire({ title: 'Atención', text: msg, icon: 'warning' }).then(() => {
            const el = document.getElementById(elementId);
            if (el) {
                const targetY = el.getBoundingClientRect().top + window.pageYOffset - 150;
                window.scrollTo({ top: targetY, behavior: 'smooth' });
                setTimeout(() => {
                    el.focus({ preventScroll: true });
                    el.classList.add('input-error-shake');
                    setTimeout(() => el.classList.remove('input-error-shake'), 1000);
                }, 850);
            }
        });
    };

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            // Datos personales
            const nombre = form.nombre.value.trim();
            const apellido = form.apellido.value.trim();
            const nacInput = document.getElementById('nacimiento');
            const prefijo = form.prefijo.value.trim();
            const numero = form.numero.value.trim();
            const localidadVal = hiddenInput ? hiddenInput.value : "";

            // Calificaciones (estrellas)
            const platos = form.platos.value;
            const atencion = form.atencion.value;
            const ambiente = form.ambiente.value;
            const invitar = form.invitar.value;

            // --- Validaciones de datos personales ---
            if (!nombre) return alertAndFocus('Falta el nombre.', 'nombre');
            if (!apellido) return alertAndFocus('Falta el apellido.', 'apellido');

            if (!nacInput || !nacInput.value) return alertAndFocus("Por favor, ingresá tu fecha de nacimiento.", 'nacimiento');
            const nacDate = new Date(nacInput.value);
            const hoy = new Date();
            let edad = hoy.getFullYear() - nacDate.getFullYear();
            if (hoy.getMonth() < nacDate.getMonth() || (hoy.getMonth() === nacDate.getMonth() && hoy.getDate() < nacDate.getDate())) edad--;
            if (edad < 16 || edad > 95) return alertAndFocus("Edad no válida.", 'nacimiento');

            if (!prefijo || prefijo.length < 2) return alertAndFocus('Revisá el prefijo de área.', 'prefijo');
            if (!numero || numero.length < 6) return alertAndFocus('El número de teléfono es muy corto.', 'numero');
            if (!localidadVal) return alertAndFocus('Seleccioná tu barrio de la lista.', 'localidad-search');

            // --- Validaciones de Estrellas (Obligatorias) ---
            if (!platos) return alertAndFocus('Por favor, calificá la calidad de los platos.', 'survey-form');
            if (!atencion) return alertAndFocus('Por favor, calificá la atención recibida.', 'survey-form');
            if (!ambiente) return alertAndFocus('Por favor, calificá el ambiente del lugar.', 'survey-form');
            if (!invitar) return alertAndFocus('Por favor, indicanos si volverías o invitarías a alguien.', 'survey-form');

            // Si todo está ok (el comentario es opcional por defecto ya que no se valida)
            try {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ title: 'Enviando...', background: '#0a0a0a', showConfirmButton: false, didOpen: () => Swal.showLoading() });
                }

                const payload = {
                    nombre: nombre,
                    apellido: apellido,
                    nacimiento: nacInput.value,
                    whatsapp: `${prefijo}${numero}`,
                    localidad: localidadVal,
                    platos: platos,
                    atencion: atencion,
                    ambiente: ambiente,
                    invitar: invitar,
                    comentario: form.critica.value.trim() // Opcional
                };

                const response = await fetch('/enviar-encuesta', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const res = await response.json();
                if (res.success) {
                    MitreAlert.fire('¡Enviado!', '¡Gracias por participar!', 'success').then(() => window.location.href = '/');
                    form.reset();
                } else { 
                    throw new Error(); 
                }
            } catch (err) {
                MitreAlert.fire('Error', 'No se pudo enviar la encuesta.', 'error');
            }
        });
    }

    // --- swiper configuración ---
    if (typeof Swiper !== 'undefined') {
        const configFotos = {
            effect: 'fade',
            fadeEffect: { crossFade: true },
            loop: true,
            speed: 2000, 
            autoplay: { delay: 4000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true, dynamicBullets: true },
            grabCursor: true
        };

        if (document.querySelector('.swiper-esencia')) new Swiper('.swiper-esencia', configFotos);
        if (document.querySelector('.swiper-carta')) new Swiper('.swiper-carta', configFotos);
        
        if (document.querySelector('.swiper-eventos')) {
            new Swiper('.swiper-eventos', {
                ...configFotos,
                autoplay: { delay: 8000, disableOnInteraction: false },
                on: {
                    slideChangeTransitionEnd: function () {
                        const activeSlide = this.slides[this.activeIndex];
                        const video = activeSlide.querySelector('video');
                        if (video) video.play();
                    }
                }
            });
        }
    }
});

// --- modal pdf functions ---
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