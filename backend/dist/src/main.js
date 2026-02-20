"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:3000');
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (origin === corsOrigin)
                return callback(null, true);
            if (origin.endsWith('.app.github.dev'))
                return callback(null, true);
            if (/^https?:\/\/localhost(:\d+)?$/.test(origin))
                return callback(null, true);
            callback(new Error(`CORS not allowed for origin: ${origin}`));
        },
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginOpenerPolicy: false,
        crossOriginEmbedderPolicy: false,
    }));
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Trinity Management System API')
        .setDescription('API for managing sound/event business operations')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('Authentication', 'User authentication endpoints')
        .addTag('Users', 'User management (Admin only)')
        .addTag('Equipment', 'Equipment inventory management')
        .addTag('Clients', 'Client management')
        .addTag('Events', 'Event management and booking')
        .addTag('Action Logs', 'System action logs')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = configService.get('PORT', 3001);
    await app.listen(port);
    console.log(`🚀 Trinity Management API running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map