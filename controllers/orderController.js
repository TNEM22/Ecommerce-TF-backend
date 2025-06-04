const Razorpay = require('razorpay');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Order = require('../models/orderModel');
const { sendOrderPlacedEmail } = require('../utils/email');
const User = require('../models/userModel');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = catchAsync(async (req, res, next) => {
  const options = {
    amount: req.body.amount,
    currency: req.body.currency,
    receipt: 'Sample Receipt',
    payment_capture: 1,
  };

  const rsp = await razorpay.orders.create(options);
  await Order.create({
    userId: req.user._id,
    orderId: rsp.id,
    address: req.body.address,
    currency: rsp.currency,
    amount: rsp.amount,
    cart: req.body.cart,
  });

  res.status(201).json({
    status: 'success',
    data: {
      order_id: rsp.id,
      currency: rsp.currency,
      amount: rsp.amount,
    },
  });
});

exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature == razorpay_signature) {
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    // console.log(razorpay_order_id);
    const order = await Order.findOneAndUpdate(
      { orderId: razorpay_order_id },
      { status: 'Complete' }
    );
    await User.findByIdAndUpdate(req.user._id, { cart: [] });
    // console.log(order);
    await sendOrderPlacedEmail(
      req.user.email,
      order.orderId,
      order.amount / 100
    );

    if (payment.status == 'captured') {
      res.status(200).json({
        status: 'success',
        data: {
          message: 'Payment done!',
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
        },
      });
    } else {
      return next(new AppError('Payment not confirmed yet!', 400));
    }
  } else {
    return next(new AppError('Payment not verified!', 400));
  }
});

exports.getPayment = catchAsync(async (req, res, next) => {
  const { paymentId } = req.params;

  const payment = await razorpay.payments.fetch(paymentId);

  if (!payment) return next(new AppError('Error at razorpay.'));

  res.status(200).json({
    status: payment.status,
    method: payment.method,
    amount: payment.amount,
    currency: payment.currency,
  });
});
