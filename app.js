const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const cookieParser = require('cookie-parser');

const userRouter = require('./routes/userRoutes');
const productRouter = require('./routes/productRoutes');
const orderRouter = require('./routes/orderRoutes');

const globalErrorHandler = require('./utils/errorHandler');

const app = express();

app.use(morgan('dev'));

app.use(
  cors({
    origin: [
      'https://ecommerce-tf-frontend.vercel.app',
      'http://localhost:5173',
    ],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send('Working...');
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/orders', orderRouter);

app.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: 'Route does not exists.',
  });
});

app.use(globalErrorHandler);

module.exports = app;
