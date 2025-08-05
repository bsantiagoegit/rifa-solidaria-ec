/**
 * PrizeCarousel - Lógica del carousel de premios
 * Maneja el autoplay, navegación, eventos y estados del carousel
 */
class PrizeCarousel {
	constructor() {
		this.track = document.getElementById('carousel-track');
		this.indicators = document.querySelectorAll('.indicator');
		this.slides = document.querySelectorAll('.carousel-slide');
		this.totalSlides = this.indicators.length; // Solo los slides originales
		this.currentSlide = 0;
		this.isPlaying = true;
		this.interval = null;
		this.autoplayDelay = 8000; // 8 segundos
		this.isMobile = window.innerWidth < 768;

		this.init();
	}

	init() {
		this.startAutoplay();
		this.setupEventListeners();
		this.updateIndicators();
	}

	startAutoplay() {
		if (this.interval) clearInterval(this.interval);

		this.interval = setInterval(() => {
			if (this.isPlaying) {
				this.nextSlide();
			}
		}, this.autoplayDelay);
	}

	stopAutoplay() {
		this.isPlaying = false;
	}

	resumeAutoplay() {
		this.isPlaying = true;
	}

	nextSlide() {
		this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
		this.updateCarousel();
	}

	goToSlide(index) {
		this.currentSlide = index;
		this.updateCarousel();
	}

	updateCarousel() {
		// Usamos el segundo conjunto de slides para evitar el salto visual
		const actualIndex = this.currentSlide + this.totalSlides;
		const translateX = -(actualIndex * 100);

		this.track.style.transform = `translateX(${translateX}%)`;
		this.updateIndicators();

		// Si llegamos al final del tercer conjunto, reseteamos sin animación
		if (this.currentSlide === 0) {
			setTimeout(() => {
				this.track.style.transition = 'none';
				this.track.style.transform = `translateX(-${this.totalSlides * 100}%)`;
				setTimeout(() => {
					this.track.style.transition = 'transform 0.5s ease-in-out';
				}, 50);
			}, 500);
		}
	}

	updateIndicators() {
		this.indicators.forEach((indicator, index) => {
			indicator.classList.toggle('active', index === this.currentSlide);
		});
	}

	setupEventListeners() {
		// Eventos para hover en desktop
		if (!this.isMobile) {
			this.slides.forEach((slide) => {
				slide.addEventListener('mouseenter', () => this.stopAutoplay());
				slide.addEventListener('mouseleave', () => this.resumeAutoplay());
			});
		}

		// Eventos para click en mobile y desktop
		this.slides.forEach((slide) => {
			slide.addEventListener('click', () => {
				if (this.isMobile) {
					if (this.isPlaying) {
						this.stopAutoplay();
					} else {
						this.resumeAutoplay();
					}
				}
			});
		});

		// Eventos para indicadores
		this.indicators.forEach((indicator, index) => {
			indicator.addEventListener('click', () => {
				this.goToSlide(index);
			});
		});

		// Pausa al cambiar de pestaña
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) {
				this.stopAutoplay();
			} else {
				this.resumeAutoplay();
			}
		});

		// Responsive behavior
		window.addEventListener('resize', () => {
			const wasMobile = this.isMobile;
			this.isMobile = window.innerWidth < 768;

			if (wasMobile !== this.isMobile) {
				this.setupEventListeners();
			}
		});
	}

	/**
	 * Destruye la instancia del carousel y limpia los event listeners
	 */
	destroy() {
		if (this.interval) {
			clearInterval(this.interval);
		}
		// Aquí podrías agregar más limpieza si fuera necesario
	}
}

/**
 * Inicializa el carousel cuando el DOM esté listo
 */
function initPrizeCarousel() {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			new PrizeCarousel();
		});
	} else {
		new PrizeCarousel();
	}
}

// Auto-inicializar
initPrizeCarousel();

// Exportar para uso modular (si se necesita)
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { PrizeCarousel, initPrizeCarousel };
}
