import { handleCors } from '@/lib/cors';
import { db } from '@/lib/firebase-admin';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
	const corsResponse = handleCors(request, {
		origin: '*',
		methods: ['GET', 'OPTIONS'],
		allowedHeaders: ['Content-Type'],
	});
	if (request.method === 'OPTIONS') {
		return corsResponse as Response;
	}
	try {
		const numbersRef = db.ref('numbers');
		const snapshot = await numbersRef.get();

		const takenNumbers: Record<string, any> = {};

		if (snapshot.exists()) {
			const data = snapshot.val();

			// Si los datos son un array, convertirlos a un objeto
			if (Array.isArray(data)) {
				data.forEach((value, index) => {
					if (value) {
						takenNumbers[index] = value;
					}
				});
			} else if (typeof data === 'object' && data !== null) {
				// Si ya es un objeto, usarlo directamente
				Object.entries(data).forEach(([key, value]) => {
					if (value) {
						takenNumbers[key] = value;
					}
				});
			}
		}

		return new Response(JSON.stringify(takenNumbers), {
			status: 200,
			headers: {
				...corsResponse.headers,
				'Content-Type': 'application/json',
			},
		});
	} catch (error) {
		console.error('Error al obtener números:', error);
		return new Response(JSON.stringify({ error: 'Error al obtener los números' }), {
			status: 500,
			headers: {
				...corsResponse.headers,
				'Content-Type': 'application/json',
			},
		});
	}
};

// Manejar todas las solicitudes (GET, OPTIONS)
export const ALL: APIRoute = async ({ request }) => {
	if (request.method === 'GET') {
		return GET({ request } as any);
	}
	// Manejar OPTIONS
	if (request.method === 'OPTIONS') {
		return handleCors(request, {
			origin: '*',
			methods: ['GET', 'OPTIONS'],
		}) as Response;
	}
	return new Response(null, { status: 405 }); // Method Not Allowed
};
