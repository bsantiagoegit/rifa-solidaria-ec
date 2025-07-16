export const prerender = false;

import { handleCors } from '@/lib/cors';
import { db } from '@/lib/firebase-admin';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
	const corsResponse = handleCors(request, {
		origin: '*',
		methods: ['POST', 'OPTIONS'],
		allowedHeaders: ['Content-Type'],
	});

	if (request.method === 'OPTIONS') {
		return corsResponse as Response;
	}

	try {
		if (!request.body) {
			return new Response(JSON.stringify({ error: 'El cuerpo de la solicitud está vacío' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const data = await request.json();
		const { numbers, name, phone } = data;

		// Validaciones básicas
		if (!Array.isArray(numbers) || numbers.length === 0 || !name || !phone) {
			return new Response(JSON.stringify({ error: 'Faltan campos requeridos o formato inválido', received: { numbers, name, phone } }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Validar cada número
		const cleanedNumbers = numbers.map(Number).filter((n) => Number.isInteger(n) && n > 0);
		if (cleanedNumbers.length !== numbers.length) {
			return new Response(JSON.stringify({ error: 'Todos los números deben ser enteros positivos', received: numbers }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Verificar si alguno ya está reservado
		const taken: number[] = [];
		for (const number of cleanedNumbers) {
			const ref = db.ref(`numbers/${number}`);
			const snapshot = await ref.get();
			if (snapshot.exists() && snapshot.val() !== null) {
				taken.push(number);
			}
		}

		if (taken.length > 0) {
			return new Response(JSON.stringify({ error: 'Algunos números ya han sido reservados', taken }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Reservar todos
		const reservationData = {
			name: String(name),
			phone: String(phone),
			reservedAt: new Date().toISOString(),
		};

		const updates: Record<string, typeof reservationData> = {};
		for (const number of cleanedNumbers) {
			updates[`numbers/${number}`] = reservationData;
		}
		await db.ref().update(updates);

		return new Response(
			JSON.stringify({
				message: 'Números reservados exitosamente',
				numbers: cleanedNumbers,
				data: reservationData,
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json', ...(corsResponse as { headers: Headers }).headers },
			},
		);
	} catch (error) {
		console.error('Error al procesar la reserva:', error);
		return new Response(
			JSON.stringify({
				error: 'Error al procesar la reserva',
				details: error instanceof Error ? error.message : 'Error desconocido',
				stack: error instanceof Error ? error.stack : undefined,
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json', ...(corsResponse as { headers: Headers }).headers },
			},
		);
	}
};

// Manejar todas las solicitudes
export const ALL: APIRoute = async ({ request }) => {
	if (request.method === 'POST') {
		return POST({ request } as any);
	}
	// Manejar OPTIONS para CORS
	if (request.method === 'OPTIONS') {
		return handleCors(request, {
			origin: '*',
			methods: ['POST', 'OPTIONS'],
			allowedHeaders: ['Content-Type'],
		}) as Response;
	}
	return new Response(null, { status: 405 }); // Method Not Allowed
};
