const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'SwapCircle — User Service',
    version: '1.0.0',
    description: 'Manages user profiles, skills, location, and reputation ratings.',
  },
  servers: [{ url: 'http://localhost:3002', description: 'Local' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Profile: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
          bio: { type: 'string', example: 'I fix bikes and love cooking.' },
          skills: { type: 'array', items: { type: 'string' }, example: ['bike repair', 'cooking'] },
          location: { type: 'string', example: 'Mumbai, India' },
          rating: { type: 'number', example: 4.5 },
          ratingCount: { type: 'number', example: 6 },
          completedSwaps: { type: 'number', example: 6 },
        },
      },
      Error: {
        type: 'object',
        properties: { message: { type: 'string' } },
      },
    },
  },
  paths: {
    '/users/{userId}': {
      get: {
        tags: ['Users'],
        summary: 'Get a user profile (auto-creates if not found)',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'User profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/Profile' } } } },
          500: { description: 'Server error' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update own profile (bio, skills, location)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  bio: { type: 'string', example: 'Freelance developer and cyclist.' },
                  skills: { type: 'array', items: { type: 'string' }, example: ['React', 'cycling'] },
                  location: { type: 'string', example: 'Bangalore, India' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/Profile' } } } },
          403: { description: 'Cannot edit another user\'s profile' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/users/{userId}/rating': {
      patch: {
        tags: ['Users'],
        summary: 'Update rolling rating (called internally by swap service)',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rating'],
                properties: { rating: { type: 'number', minimum: 1, maximum: 5, example: 4 } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated profile with new rating', content: { 'application/json': { schema: { $ref: '#/components/schemas/Profile' } } } },
          404: { description: 'Profile not found' },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
