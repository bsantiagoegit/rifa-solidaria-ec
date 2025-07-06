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
		// Verificar que el request tenga contenido
		if (!request.body) {
			console.error('El cuerpo de la solicitud está vacío');
			return new Response(JSON.stringify({ error: 'El cuerpo de la solicitud está vacío' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const data = await request.json().catch((error) => {
			console.error('Error al parsear JSON:', error);
			throw new Error('Formato de solicitud inválido');
		});

		const { number, name, phone } = data;

		// Validar que todos los campos requeridos estén presentes
		if (number === undefined || !name || !phone) {
			return new Response(
				JSON.stringify({
					error: 'Faltan campos requeridos',
					received: { number, name: !!name, phone: !!phone },
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

		// Validar que el número sea efectivamente un número
		const numberValue = Number(number);
		if (isNaN(numberValue) || !Number.isInteger(numberValue) || numberValue <= 0) {
			console.error('Número inválido:', number);
			return new Response(
				JSON.stringify({
					error: 'El número debe ser un entero positivo',
					received: number,
					type: typeof number,
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

		const numberRef = db.ref(`numbers/${numberValue}`);
		const snapshot = await numberRef.get();
		// Verificar si el número ya está tomado
		if (snapshot.exists() && snapshot.val() !== null) {
			return new Response(
				JSON.stringify({
					error: 'Este número ya ha sido reservado',
					number: numberValue,
					existingData: snapshot.val(),
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

		const reservationData = {
			name: String(name),
			phone: String(phone),
			reservedAt: new Date().toISOString(),
		};

		await numberRef.set(reservationData);

		return new Response(
			JSON.stringify({
				message: 'Número reservado exitosamente',
				number: numberValue,
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
