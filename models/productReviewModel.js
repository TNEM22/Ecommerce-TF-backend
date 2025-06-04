const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'A review should be given by a user.'],
    ref: 'User',
  },
  productId: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'A review should have product.'],
    ref: 'Product',
  },
  subject: {
    type: String,
    required: [true, 'Review should have a subject'],
    trim: true,
  },
  desc: {
    type: String,
    required: [true, 'Review should have a description'],
    trim: true,
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    default: 0,
  },
  createdAt: {
    type: Date,
    default: () => Date.now(),
    immutable: true,
  },
  images: [String],
});

const ProductReview = mongoose.model('ProductReview', reviewSchema);

module.exports = ProductReview;
