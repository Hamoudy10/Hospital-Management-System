import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import pino from 'pino'
import pinoHttp from 'pino-http'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'

// Route imports
import authRoutes from './routes/auth'
import patientRoutes from './routes/patients'
import appointmentRoutes from './routes/appointments'
import billingRoutes from './routes/billing'
import mpesaRoutes from './routes/mpesa'
import labRoutes from './routes/lab'
import pharmacyRoutes from './routes/pharmacy'
import procurementRoutes from './routes/procurement'
import reportRoutes from './routes/reports'
import printRoutes from './routes/print'

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined
})

// Initialize Express app
const app = express()
const httpServer = createServer(app)

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL || 'https://kenya-hms.vercel.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Make io accessible to routes
app.set('io', io)

// Trust proxy (for Render, Vercel, etc.)
app.set('trust proxy', 1)

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'https://kenya-hms.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))
app.use(cors(corsOptions))
app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for M-Pesa callbacks
    return req.path.includes('/mpesa/c2b-callback') || 
           req.path.includes('/mpesa/c2b-validation') ||
           req.path.includes('/mpesa/c2b-confirmation') ||
           req.path.includes('/mpesa/b2c-callback')
  }
})

app.use(limiter)

// Request logging (skip health checks in production)
app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/api/health'
  }
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Swagger API documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kenya Hospital Management System API',
      version: '1.0.0',
      description: 'API documentation for Kenya HMS - A comprehensive hospital management platform',
      contact: {
        name: 'Support',
        email: 'support@yourhospital.co.ke'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:4000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/mpesa', mpesaRoutes)
app.use('/api/lab', labRoutes)
app.use('/api/pharmacy', pharmacyRoutes)
app.use('/api/procurement', procurementRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/print', printRoutes)

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found' 
  })
})

// Global error handler
interface AppError extends Error {
  statusCode?: number
  status?: string
  isOperational?: boolean
}

app.use((err: AppError, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'

  // Log error
  logger.error({
    err,
    req: {
      method: req.method,
      url: req.url,
      body: req.body,
      user: (req as any).user?.id
    }
  }, 'Request error')

  // Don't leak error details in production
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' && statusCode === 500 
      ? 'Internal server error' 
      : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Client connected')

  // Join user to their personal room (for targeted notifications)
  socket.on('join-user-room', (userId: string) => {
    socket.join(`user:${userId}`)
    logger.info({ socketId: socket.id, userId }, 'User joined personal room')
  })

  // Join user to role-based room (for role-specific broadcasts)
  socket.on('join-role-room', (role: string) => {
    socket.join(`role:${role}`)
    logger.info({ socketId: socket.id, role }, 'User joined role room')
  })

  // Join user to department room
  socket.on('join-department-room', (department: string) => {
    socket.join(`department:${department}`)
    logger.info({ socketId: socket.id, department }, 'User joined department room')
  })

  // Handle chat messages
  socket.on('send-message', (data: { roomId: string; message: any }) => {
    io.to(data.roomId).emit('new-message', data.message)
  })

  // Handle typing indicators
  socket.on('typing', (data: { roomId: string; userId: string; userName: string }) => {
    socket.to(data.roomId).emit('user-typing', { userId: data.userId, userName: data.userName })
  })

  socket.on('stop-typing', (data: { roomId: string; userId: string }) => {
    socket.to(data.roomId).emit('user-stopped-typing', { userId: data.userId })
  })

  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id }, 'Client disconnected')
  })
})

// Export io for use in controllers (e.g., mpesaController)
export { io, logger }

// Start server
const PORT = process.env.PORT || 4000

httpServer.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'Server started')
  console.log(`🏥 Kenya HMS API running on port ${PORT}`)
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  httpServer.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  httpServer.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

export default app