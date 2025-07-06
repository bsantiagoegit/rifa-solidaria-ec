/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly FIREBASE_ADMIN_KEY_JSON: string;
	readonly FIREBASE_DB_URL: string;
	// Añade aquí otras variables de entorno si las necesitas
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// Configuración de Firebase Admin
const serviceAccount = JSON.parse(import.meta.env.FIREBASE_ADMIN_KEY_JSON || '{}');

// Inicialización de Firebase Admin
let app;
if (!getApps().length) {
	try {
		app = initializeApp({
			credential: cert(serviceAccount),
			databaseURL: import.meta.env.FIREBASE_DB_URL,
		});
	} catch (error) {
		console.error('Error al inicializar Firebase Admin:', error);
		throw error;
	}
} else {
	app = getApp();
}

export const db = getDatabase(app);
