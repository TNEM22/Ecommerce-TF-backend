const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  phoneno: String,
  address: String,
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  orderId: {
    type: String,
    unique: true,
  },
  address: addressSchema,
  currency: String,
  amount: String,
  status: {
    type: String,
    enum: ['Not Complete', 'Complete'],
    default: 'Not Complete',
  },
  cart: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
    },
  ],
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
