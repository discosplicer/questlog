export const config = {
  database: {
    url: process.env['DATABASE_URL']!,
  },
  security: {
    bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12'),
    jwtSecret: process.env['JWT_SECRET']!,
    jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
  },
  server: {
    port: parseInt(process.env['PORT'] || '3001'),
    host: process.env['HOST'] || '0.0.0.0',
  },
  cors: {
    allowedOrigins: process.env['ALLOWED_ORIGINS']?.split(',') || [
      'http://localhost:3000',
    ],
  },
  logging: {
    level: process.env['LOG_LEVEL'] || 'info',
  },
} as const;
