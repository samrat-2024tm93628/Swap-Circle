const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'SwapCircle — Listing Service',
    version: '1.0.0',
    description: 'Manages offer and request listings with category filtering and search.',
  },
  servers: [{ url: 'http://localhost:3003', description: 'Local' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Listing: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          userName: { type: 'string', example: 'John Doe' },
          type: { type: 'string', enum: ['offer', 'request'] },
          title: { type: 'string', example: "I'll fix your bike" },
          description: { type: 'string', example: '5+ years of experience with all bike types.' },
          category: {
            type: 'string',
            enum: ['Technology', 'Education', 'Home Services', 'Transportation', 'Arts & Creative', 'Food & Cooking', 'Health & Wellness', 'Other'],
          },
          estimatedHours: { type: 'number', example: 2 },
          tags: { type: 'array', items: { type: 'string' }, example: ['bike', 'repair'] },
          status: { type: 'string', enum: ['active', 'in-swap', 'completed', 'cancelled'], example: 'active' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: { message: { type: 'string' } },
      },
    },
  },
  paths: {
    '/listings': {
      get: {
        tags: ['Listings'],
        summary: 'Get all listings with optional filters',
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['offer', 'request'] }, description: 'Filter by type' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by title' },
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Defaults to active' },
        ],
        responses: {
          200: { description: 'List of listings', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Listing' } } } } },
        },
      },
      post: {
        tags: ['Listings'],
        summary: 'Create a new listing',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'title', 'description', 'category', 'estimatedHours'],
                properties: {
                  type: { type: 'string', enum: ['offer', 'request'] },
                  title: { type: 'string', example: "I'll fix your bike" },
                  description: { type: 'string' },
                  category: { type: 'string', example: 'Home Services' },
                  estimatedHours: { type: 'number', example: 2 },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Listing created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Listing' } } } },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/listings/user/{userId}': {
      get: {
        tags: ['Listings'],
        summary: 'Get all listings by a specific user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'User listings', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Listing' } } } } },
        },
      },
    },
    '/listings/{id}': {
      get: {
        tags: ['Listings'],
        summary: 'Get a single listing by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Listing details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Listing' } } } },
          404: { description: 'Not found' },
        },
      },
      put: {
        tags: ['Listings'],
        summary: 'Update a listing (owner or admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['active', 'in-swap', 'completed', 'cancelled'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated listing', content: { 'application/json': { schema: { $ref: '#/components/schemas/Listing' } } } },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
        },
      },
      delete: {
        tags: ['Listings'],
        summary: 'Delete a listing (owner or admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Deleted successfully' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
