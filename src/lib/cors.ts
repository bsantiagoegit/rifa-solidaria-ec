// src/lib/cors.ts
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

interface CorsConfig {
	origin?: string | string[];
	methods?: HttpMethod[];
	allowedHeaders?: string[];
	exposedHeaders?: string[];
	credentials?: boolean;
	maxAge?: number;
}

const defaultConfig: CorsConfig = {
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	exposedHeaders: [],
	credentials: true,
	maxAge: 86400, // 24 hours
};

export function handleCors(request: Request, config: CorsConfig = {}) {
	const options = { ...defaultConfig, ...config };
	const headers = new Headers();

	// Handle origin
	const requestOrigin = request.headers.get('origin');
	if (options.origin === '*') {
		headers.set('Access-Control-Allow-Origin', '*');
	} else if (Array.isArray(options.origin)) {
		if (requestOrigin && options.origin.includes(requestOrigin)) {
			headers.set('Access-Control-Allow-Origin', requestOrigin);
		}
	} else if (options.origin) {
		headers.set('Access-Control-Allow-Origin', options.origin);
	}

	// Handle other CORS headers
	if (options.methods) {
		headers.set('Access-Control-Allow-Methods', options.methods.join(', '));
	}

	if (options.allowedHeaders && options.allowedHeaders.length > 0) {
		headers.set('Access-Control-Allow-Headers', options.allowedHeaders.join(', '));
	}

	if (options.exposedHeaders && options.exposedHeaders.length > 0) {
		headers.set('Access-Control-Expose-Headers', options.exposedHeaders.join(', '));
	}

	if (options.credentials) {
		headers.set('Access-Control-Allow-Credentials', 'true');
	}

	if (options.maxAge) {
		headers.set('Access-Control-Max-Age', options.maxAge.toString());
	}

	// Handle preflight request
	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers,
		});
	}

	return { headers };
}
