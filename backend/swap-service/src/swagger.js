const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'SwapCircle — Swap Service',
    version: '1.0.0',
    description: 'Manages the full swap lifecycle: propose → accept → complete → rate.',
  },
  servers: [{ url: 'http://localhost:3004', description: 'Local' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Swap: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          proposerId: { type: 'string' },
          proposerName: { type: 'string', example: 'John Doe' },
          receiverId: { type: 'string' },
          receiverName: { type: 'string', example: 'Jane Smith' },
          offeredListingId: { type: 'string' },
          offeredListingTitle: { type: 'string', example: "I'll fix your bike" },
          requestedListingId: { type: 'string' },
          requestedListingTitle: { type: 'string', example: "I'll teach you guitar" },
          message: { type: 'string', example: 'Sounds like a fair deal!' },
          status: {
            type: 'string',
            enum: ['pending', 'accepted', 'in-progress', 'completed', 'rejected', 'cancelled'],
            example: 'pending',
          },
          proposerRating: { type: 'number', nullable: true, example: null },
          receiverRating: { type: 'number', nullable: true, example: null },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
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
    '/swaps': {
      post: {
        tags: ['Swaps'],
        summary: 'Propose a new swap between two listings',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['offeredListingId', 'requestedListingId', 'receiverId', 'receiverName'],
                properties: {
                  offeredListingId: { type: 'string', description: 'Must be one of your own listings' },
                  requestedListingId: { type: 'string', description: "The listing you want from the other person" },
                  receiverId: { type: 'string' },
                  receiverName: { type: 'string' },
                  message: { type: 'string', example: 'I think this is a fair swap!' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Swap proposed', content: { 'application/json': { schema: { $ref: '#/components/schemas/Swap' } } } },
          403: { description: 'Offered listing does not belong to you' },
          409: { description: 'An active swap already exists for these listings' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/swaps/mine': {
      get: {
        tags: ['Swaps'],
        summary: 'Get all swaps for the current user (as proposer or receiver)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of swaps', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Swap' } } } } },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/swaps/{id}': {
      get: {
        tags: ['Swaps'],
        summary: 'Get a specific swap (only accessible to the two parties)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Swap details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Swap' } } } },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
        },
      },
    },
    '/swaps/{id}/accept': {
      patch: {
        tags: ['Swaps'],
        summary: 'Accept a swap proposal (receiver only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Swap accepted, both listings move to in-swap', content: { 'application/json': { schema: { $ref: '#/components/schemas/Swap' } } } },
          400: { description: 'Swap is not in pending state' },
          403: { description: 'Only the receiver can accept' },
        },
      },
    },
    '/swaps/{id}/reject': {
      patch: {
        tags: ['Swaps'],
        summary: 'Reject a swap proposal (receiver only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Swap rejected', content: { 'application/json': { schema: { $ref: '#/components/schemas/Swap' } } } },
          400: { description: 'Swap is not in pending state' },
          403: { description: 'Only the receiver can reject' },
        },
      },
    },
    '/swaps/{id}/cancel': {
      patch: {
        tags: ['Swaps'],
        summary: 'Cancel a swap you proposed (proposer only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Swap cancelled', content: { 'application/json': { schema: { $ref: '#/components/schemas/Swap' } } } },
          400: { description: 'Cannot cancel at this stage' },
          403: { description: 'Only the proposer can cancel' },
        },
      },
    },
    '/swaps/{id}/complete': {
      patch: {
        tags: ['Swaps'],
        summary: 'Mark a swap as completed (either party)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Swap completed, both listings move to completed', content: { 'application/json': { schema: { $ref: '#/components/schemas/Swap' } } } },
          400: { description: 'Swap must be in accepted state first' },
        },
      },
    },
    '/swaps/{id}/rate': {
      patch: {
        tags: ['Swaps'],
        summary: 'Rate the other party after swap completion (1–5)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rating'],
                properties: { rating: { type: 'number', minimum: 1, maximum: 5, example: 5 } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Rating submitted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Swap' } } } },
          400: { description: 'Already rated or swap not completed' },
          403: { description: 'Not a party to this swap' },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
