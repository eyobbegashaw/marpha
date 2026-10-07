"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Pharmacy Operations & Intelligence Platform API',
        version: '1.0.0',
        description: `
Enterprise Pharmacy Operations & Intelligence Platform Backend.

### Key Business Architecture:
- **Location-Aware Multi-Tier Stock**: Strict separation between front customer-facing **Sales Shelf** and back reserve **Warehouse** stock.
- **Smart Shelf Refill Logic**: Shelf Stock = 0 does NOT trigger Out of Stock if Warehouse stock exists; instead triggers Shelf Empty / Refill recommendation.
- **Batches & FEFO**: Batches tracked by manufacturing date, expiry date, purchase cost, and selling price. First-Expired, First-Out automatic sales allocation.
- **Historical Price/Cost Snapshots**: Every sale item freezes historical unit price and cost for accurate COGS and gross profit accounting.
- **Context-Aware Smart Alerts**: Threshold evaluations for Shelf Low, Shelf Empty, Warehouse Low, Complete Out-of-Stock, Expiry Risk, and ADS Demand Restock recommendations.
- **Bilingual Amharic & English**: System messages and UI support bilingual localized text while medicine/product names strictly remain in English.
    `,
        contact: {
            name: 'Pharmacy Intelligence Platform Team',
        },
    },
    servers: [
        {
            url: 'http://localhost:5000/api/v1',
            description: 'Local Development Server',
        },
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter your JWT token in the format: Bearer <token>',
            },
        },
    },
    security: [
        {
            BearerAuth: [],
        },
    ],
};
const options = {
    swaggerDefinition,
    apis: ['./src/docs/openapi-paths.ts'], // or paths defined inline
};
exports.swaggerSpec = swaggerDefinition;
//# sourceMappingURL=swagger.js.map