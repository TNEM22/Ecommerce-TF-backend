const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'A product must have a supplier'],
    ref: 'User',
  },
  name: {
    type: String,
    required: [true, 'A product must have a name'],
    trim: true,
  },
  desc: {
    type: String,
    required: [true, 'A product must have a description'],
    trim: true,
  },
  actualPrice: {
    type: Number,
    trim: true,
    default: undefined,
    required: [true, 'There should MRP of product'],
  },
  currPrice: {
    type: Number,
    required: [true, 'A product must have price.'],
    trim: true,
  },
  components: [
    {
      type: String,
      enum: [
        'passive',
        'active',
        'electromechanical',
        'power',
        'sensors',
        'leds',
      ],
    },
  ],
  brand: {
    type: String,
    enum: ['all', 'arduino', 'raspberrypi', 'beaglebone', 'esps', 'nvidia'],
    default: 'all',
  },
  ratingsAverage: {
    type: Number,
    default: 4.9,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    set: (val) => Math.round(val * 10) / 10,
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  imageCover: {
    type: String,
    default: 'default-cover-image.jpg',
  },
  image: [String],
  availabel: {
    type: Boolean,
    default: true,
  },
  availabelQuantity: {
    type: Number,
    required: [true, 'There should be product quantity.'],
    min: [0, 'Less than zero products, not allowed!'],
  },
  createdAt: {
    type: Date,
    default: () => Date.now(),
    immutable: true,
  },
  reviews: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'ProductReview',
    },
  ],
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

productSchema.pre('save', function (next) {
  if (this.availabelQuantity <= 0) {
    this.availabel = false;
  }
  next();
});

productSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
