document.addEventListener('DOMContentLoaded', () => {

    // --- Variables y selectores ---
    const mobileMenuIcon = document.querySelector('.mobile-menu-icon');
    const navMenu = document.querySelector('.nav-links');
    const body = document.body;
    const form = document.getElementById('survey-form');
    const searchInput = document.getElementById('localidad-search');
    const optionsList = document.getElementById('localidad-options');
    const hiddenInput = document.getElementById('localidad-value');
    let localidadesRaw = [];

    // --- Menu mobile ---
    if (mobileMenuIcon && navMenu) {
        mobileMenuIcon.addEventListener('click', (e) => {
            e.stopPropagation();
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

    // --- Pedidos dropdown ---
    const orderBtn = document.getElementById('orderBtn');
    const deliveryOptions = document.getElementById('deliveryOptions');

    if (orderBtn && deliveryOptions) {
        orderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            deliveryOptions.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            deliveryOptions.classList.remove('show');
        });
    }

    // --- Configuración SweetAlert ---
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
            if (timerBar) timerBar.style.backgroundColor = '#e2b04a';
        }
    }) : null;

    // --- Funciones auxiliares encuesta ---
    const cleanString = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const updateList = (list) => {
        if (optionsList) {
            optionsList.innerHTML = list.map(name => `<li class="option-item" style="cursor:pointer; touch-action:manipulation;">${name}</li>`).join('');
        }
    };

    // --- Carga de localidades ---
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

    // --- Filtros de entrada (Regex) ---
    const setupFilter = (id, regex) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', (e) => {
                const val = e.target.value;
                const filtered = val.split('').filter(char => regex.test(char)).join('');
                if (val !== filtered) e.target.value = filtered;
            });
        }
    };
    setupFilter('nombre', /[a-zA-Z\s]/);
    setupFilter('apellido', /[a-zA-Z\s]/);
    setupFilter('prefijo', /[0-9]/);
    setupFilter('numero', /[0-9]/);

    // --- Buscador de localidades ---
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = cleanString(e.target.value);
            const filtered = localidadesRaw.filter(loc => cleanString(loc).includes(term));
            
            if (term.length > 0) {
                optionsList.classList.add('is-visible');
                if (filtered.length > 0) {
                    updateList(filtered.slice(0, 100));
                } else {
                    optionsList.innerHTML = '<li class="option-item">No se encontró esa localidad</li>';
                }
            } else {
                optionsList.classList.remove('is-visible');
            }
            if (hiddenInput) hiddenInput.value = ""; 
        });

        // Cerrar lista al clickear fuera (importante en móvil)
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !optionsList.contains(e.target)) {
                optionsList.classList.remove('is-visible');
            }
        });
    }

    if (optionsList) {
        optionsList.addEventListener('click', (e) => {
            const item = e.target.closest('.option-item');
            if (item && item.innerText !== "No se encontró esa localidad") {
                const selected = item.innerText;
                searchInput.value = selected;
                if (hiddenInput) hiddenInput.value = selected;
                optionsList.classList.remove('is-visible');
                // Forzar el cierre del teclado en móvil
                searchInput.blur();
            }
        });
    }

    // --- Validación y envío de encuesta ---
    const alertAndFocus = (msg, elementId) => {
        if (!MitreAlert) return;
        MitreAlert.fire({ title: 'Atención', text: msg, icon: 'warning', timer: 2000 });
        const el = document.getElementById(elementId);
        if (el) {
            setTimeout(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.focus({ preventScroll: true });
            }, 500);
        }
    };

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            // Datos personales
            const nombre = form.nombre.value.trim();
            const apellido = form.apellido.value.trim();
            const nacInput = document.getElementById('nacimiento');
            const prefijo = document.getElementById('prefijo').value.trim();
            const numero = document.getElementById('numero').value.trim();
            
            // Fallback para localidad en móvil
            const localidadVal = (hiddenInput && hiddenInput.value) ? hiddenInput.value : searchInput.value.trim();

            // Calificaciones
            const platos = form.querySelector('input[name="platos"]:checked')?.value;
            const atencion = form.querySelector('input[name="atencion"]:checked')?.value;
            const ambiente = form.querySelector('input[name="ambiente"]:checked')?.value;
            const invitar = form.querySelector('input[name="invitar"]:checked')?.value;

            // --- Validaciones Críticas ---
            if (!nombre) return alertAndFocus('Falta el nombre.', 'nombre');
            if (!apellido) return alertAndFocus('Falta el apellido.', 'apellido');
            
            // Corrección de Fecha para Móviles
            if (!nacInput || !nacInput.value) return alertAndFocus("Ingresá tu fecha de nacimiento.", 'nacimiento');
            const nacDate = new Date(nacInput.value + 'T00:00:00'); 
            const hoy = new Date();
            let edad = hoy.getFullYear() - nacDate.getFullYear();
            const m = hoy.getMonth() - nacDate.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < nacDate.getDate())) edad--;
            if (isNaN(nacDate.getTime()) || edad < 13 || edad > 100) return alertAndFocus("Fecha de nacimiento no válida.", 'nacimiento');

            if (!prefijo || prefijo.length < 2) return alertAndFocus('Revisá el prefijo.', 'prefijo');
            if (!numero || numero.length < 6) return alertAndFocus('Número incompleto.', 'numero');
            if (!localidadVal) return alertAndFocus('Seleccioná tu localidad.', 'localidad-search');

            if (!platos || !atencion || !ambiente || !invitar) {
                return MitreAlert.fire({ title: 'Atención', text: 'Por favor, completa todas las calificaciones con estrellas.', icon: 'warning' });
            }

            try {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ 
                        title: 'Enviando...', 
                        background: '#0a0a0a', 
                        showConfirmButton: false, 
                        allowOutsideClick: false,
                        didOpen: () => Swal.showLoading() 
                    });
                }

                const payload = {
                    nombre, apellido,
                    nacimiento: nacInput.value,
                    whatsapp: `${prefijo}${numero}`,
                    localidad: localidadVal,
                    platos, atencion, ambiente, invitar,
                    comentario: form.critica.value.trim()
                };

                const response = await fetch('/enviar-encuesta', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const res = await response.json();
                if (res.success) {
                    await MitreAlert.fire('¡Enviado!', 'Gracias por tu opinión.', 'success');
                    window.location.href = '/';
                } else { 
                    throw new Error(res.message || 'Error en servidor'); 
                }
            } catch (err) {
                console.error("Error en envío:", err);
                MitreAlert.fire('Error', 'No se pudo enviar. Intenta nuevamente.', 'error');
            }
        });
    }

    // --- Swiper ---
    if (typeof Swiper !== 'undefined') {
        const configFotos = {
            effect: 'fade',
            fadeEffect: { crossFade: true },
            loop: true,
            speed: 2000, 
            autoplay: { delay: 4000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true },
            grabCursor: true
        };

        if (document.querySelector('.swiper-esencia')) new Swiper('.swiper-esencia', configFotos);
        if (document.querySelector('.swiper-carta')) new Swiper('.swiper-carta', configFotos);
    }
});

// --- Modal PDF ---
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