/**
 * RaffleManager - Gestiona la lógica de selección de números y reservas
 * Maneja paginación, selección, validaciones y comunicación con la API
 */
class RaffleManager {
	constructor() {
		// Estado de la aplicación
		this.selectedNumbers = new Set();
		this.takenNumbersCache = {};
		this.pageSize = 50;
		this.numbers = Array.from({ length: 1000 }, (_, i) => i + 1);
		this.currentPage = 1;
		this.totalPages = Math.ceil(this.numbers.length / this.pageSize);

		// Referencias a elementos del DOM
		this.modal = null;
		this.selectedNumberSpan = null;
		this.reservationForm = null;
		this.messageDiv = null;
		this.container = null;
		this.currentPageLabel = null;

		this.init();
	}

	/**
	 * Inicializa el gestor de la rifa
	 */
	init() {
		this.initializeDOMReferences();
		this.setupEventListeners();
		this.loadTakenNumbers();
	}

	/**
	 * Obtiene las referencias a los elementos del DOM
	 */
	initializeDOMReferences() {
		this.modal = document.getElementById('reservationModal');
		this.selectedNumberSpan = document.getElementById('selectedNumber');
		this.reservationForm = document.getElementById('reservationForm');
		this.messageDiv = document.getElementById('message');
		this.container = document.getElementById('numberContainer');
		this.currentPageLabel = document.getElementById('currentPage');
	}

	/**
	 * Configura todos los event listeners
	 */
	setupEventListeners() {
		// Paginación
		document.getElementById('prevPage')?.addEventListener('click', () => {
			if (this.currentPage > 1) {
				this.currentPage--;
				this.renderPage();
			}
		});

		document.getElementById('nextPage')?.addEventListener('click', () => {
			if (this.currentPage < this.totalPages) {
				this.currentPage++;
				this.renderPage();
			}
		});

		// Modal
		document.getElementById('openReservationModal')?.addEventListener('click', () => {
			this.openReservationModal();
		});

		// Cerrar modal
		document.querySelectorAll('.close-modal').forEach((btn) => {
			btn?.addEventListener('click', () => this.closeModal());
		});

		this.modal?.addEventListener('click', (e) => {
			if (e.target === this.modal) {
				this.closeModal();
			}
		});

		// Tecla Escape para cerrar modal
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
				this.closeModal();
			}
		});

		// Formulario de reserva
		this.reservationForm?.addEventListener('submit', (e) => {
			this.handleReservationSubmit(e);
		});
	}

	/**
	 * Actualiza el estado visual de los botones según números tomados
	 */
	updateButtonStates(takenNumbers) {
		Object.keys(takenNumbers).forEach((number) => {
			const label = document.querySelector(`.number-label[data-number="${number}"]`);
			const checkbox = document.querySelector(`.number-checkbox[data-number="${number}"]`);

			if (label && checkbox) {
				checkbox.disabled = true;
				label.classList.add('line-through', 'bg-gray-200', 'cursor-not-allowed', 'text-gray-400');
				label.classList.remove('hover:bg-indigo-100', 'cursor-pointer');
			}
		});
	}

	/**
	 * Renderiza una página de números
	 */
	renderPage() {
		if (!this.container) return;

		this.container.innerHTML = '';
		const start = (this.currentPage - 1) * this.pageSize;
		const end = start + this.pageSize;

		this.numbers.slice(start, end).forEach((number) => {
			const label = document.createElement('label');
			label.className =
				'number-label relative flex items-center justify-center rounded-lg border-2 border-indigo-300 cursor-pointer hover:bg-indigo-100 transition-colors duration-200 size-[50px]';
			label.dataset.number = number;

			const input = document.createElement('input');
			input.type = 'checkbox';
			input.className = 'number-checkbox absolute opacity-0 w-0 h-0';
			input.dataset.number = number;

			const span = document.createElement('span');
			span.textContent = number;
			span.className = 'pointer-events-none';

			// Restaurar estado de selección si el número estaba seleccionado
			if (this.selectedNumbers.has(String(number))) {
				input.checked = true;
				label.classList.add('bg-indigo-300', 'text-white');
			}

			input.addEventListener('change', (e) => this.handleCheckboxChange(e));
			label.appendChild(input);
			label.appendChild(span);
			this.container.appendChild(label);
		});

		if (this.currentPageLabel) {
			this.currentPageLabel.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
		}

		this.updateButtonStates(this.takenNumbersCache);
	}

	/**
	 * Maneja el cambio de estado de los checkboxes
	 */
	handleCheckboxChange(event) {
		const checkbox = event.currentTarget;
		const number = checkbox.dataset.number;

		if (checkbox.checked) {
			this.selectedNumbers.add(number);
			checkbox.parentElement.classList.add('bg-indigo-300', 'text-white');
		} else {
			this.selectedNumbers.delete(number);
			checkbox.parentElement.classList.remove('bg-indigo-300', 'text-white');
		}
	}

	/**
	 * Muestra mensajes de notificación al usuario
	 */
	showMessage(message, type = 'success') {
		if (!this.messageDiv) return;

		this.messageDiv.textContent = message;
		this.messageDiv.classList.remove('hidden');

		// Configurar colores según el tipo
		if (type === 'error') {
			this.messageDiv.classList.remove('bg-green-500');
			this.messageDiv.classList.add('bg-red-500');
		} else {
			this.messageDiv.classList.remove('bg-red-500');
			this.messageDiv.classList.add('bg-green-500');
		}

		// Animación de entrada
		this.messageDiv.style.transform = 'translateY(-100%)';
		requestAnimationFrame(() => {
			this.messageDiv.style.transform = 'translateY(0)';
		});

		// Auto-ocultar después de 3 segundos
		setTimeout(() => {
			this.messageDiv.style.transform = 'translateY(-100%)';
			requestAnimationFrame(() => {
				this.messageDiv.classList.add('hidden');
				this.messageDiv.style.transform = '';
			});
		}, 3000);
	}

	/**
	 * Abre el modal de reserva
	 */
	openReservationModal() {
		if (this.selectedNumbers.size === 0) {
			this.showMessage('Selecciona al menos un número antes de reservar', 'error');
			return;
		}

		if (this.selectedNumberSpan) {
			this.selectedNumberSpan.textContent = [...this.selectedNumbers].join(', ');
		}

		if (this.modal) {
			this.modal.classList.remove('hidden');
			this.modal.classList.add('flex');
			document.body.style.overflow = 'hidden';
		}
	}

	/**
	 * Cierra el modal de reserva
	 */
	closeModal() {
		if (this.modal) {
			this.modal.classList.add('hidden');
			this.modal.classList.remove('flex');
			document.body.style.overflow = '';
		}
	}

	/**
	 * Maneja el envío del formulario de reserva
	 */
	async handleReservationSubmit(e) {
		e.preventDefault();

		const nameInput = document.getElementById('name');
		const phoneInput = document.getElementById('phone');

		if (!nameInput || !phoneInput) return;

		const name = nameInput.value.trim();
		const phone = phoneInput.value.trim();

		if (this.selectedNumbers.size === 0) {
			this.showMessage('Por favor selecciona al menos un número', 'error');
			return;
		}

		try {
			const numbers = [...this.selectedNumbers].map((n) => parseInt(n, 10));
			this.showMessage('Procesando reserva...', 'info');

			const response = await fetch('/api/reservar', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					numbers,
					name,
					phone,
				}),
			});

			const result = await response.json();

			if (response.ok) {
				this.showMessage('¡Números reservados exitosamente!', 'success');
				this.processSuccessfulReservation(numbers, name, phone);
			} else {
				this.showMessage(result.error || 'Error al procesar la reserva', 'error');
			}
		} catch (error) {
			console.error('Error:', error);
			this.showMessage('Error de conexión. Por favor, intenta de nuevo.', 'error');
		}
	}

	/**
	 * Procesa una reserva exitosa
	 */
	processSuccessfulReservation(numbers, name, phone) {
		// Actualizar caché de números tomados
		numbers.forEach((number) => {
			this.takenNumbersCache[number] = {
				name,
				phone,
				reservedAt: new Date().toISOString(),
			};
			// Remover de números seleccionados
			this.selectedNumbers.delete(String(number));
		});

		// Re-renderizar la página actual para aplicar los cambios
		this.renderPage();

		// Limpiar formulario y cerrar modal
		if (this.reservationForm) {
			this.reservationForm.reset();
		}
		this.closeModal();
	}

	/**
	 * Carga los números ya tomados desde la API
	 */
	async loadTakenNumbers() {
		try {
			const response = await fetch('/api/tomados');
			const data = await response.json();
			this.takenNumbersCache = data;
			this.renderPage();
		} catch (error) {
			console.error('Error al cargar números reservados:', error);
			this.showMessage('Error al cargar los números reservados', 'error');
		}
	}

	/**
	 * Limpia todos los recursos y event listeners
	 */
	destroy() {
		// Aquí se pueden agregar limpiezas adicionales si es necesario
		this.selectedNumbers.clear();
		this.takenNumbersCache = {};
	}
}

/**
 * Inicializa el gestor de la rifa cuando el DOM esté listo
 */
function initRaffleManager() {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			new RaffleManager();
		});
	} else {
		new RaffleManager();
	}
}

// Auto-inicializar
initRaffleManager();

// Exportar para uso modular (si se necesita)
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { RaffleManager, initRaffleManager };
}
