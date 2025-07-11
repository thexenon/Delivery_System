const express = require('express');
const morgan = require('morgan');
const path = require('path');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const userRouter = require('./routes/userRoutes');
const productRouter = require('./routes/productRoutes');
const orderRouter = require('./routes/orderRoutes');
const storeRouter = require('./routes/storeRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const categoryRouter = require('./routes/categoryRoutes');
const orderitemRouter = require('./routes/orderItemRoutes');
const favoriteRouter = require('./routes/favoriteRoutes');
const artisanShopRouter = require('./routes/artisanShopRoutes');
const artisanReviewRouter = require('./routes/artisanReviewRoutes');
const serviceRouter = require('./routes/serviceRoutes');
const serviceRequestRouter = require('./routes/serviceRequestRoutes');
const AppError = require('./utils/appError');
const myErrorHandler = require('./controllers/errorController');

const app = express();

// Middlewares
// 1) GLOBAL MIDDLEWARES
// Allow Access
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:5174',
  'http://localhost:5173',
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log('====================================');
    console.log('🌍 Allowed Origins:', allowedOrigins);
    console.log('🌍 Incoming Origin:', origin);
    console.log('====================================');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Allow preflight

// View engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
// app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ['duration'],
  }),
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use(compression());
// 3) Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/favorites', favoriteRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/orderitems', orderitemRouter);
app.use('/api/v1/stores', storeRouter);
app.use('/api/v1/artisanshops', artisanShopRouter);
app.use('/api/v1/artisanreviews', artisanReviewRouter);
app.use('/api/v1/services', serviceRouter);
app.use('/api/v1/servicerequests', serviceRequestRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Error: ${req.originalUrl} is not on this server`, 404));
});

app.use(myErrorHandler);

module.exports = app;
