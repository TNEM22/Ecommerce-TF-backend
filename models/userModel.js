const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  phoneno: String,
  address: String,
});

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: [true, 'Must have a firstname.'],
    trim: true,
  },
  middlename: {
    type: String,
    required: [true, 'Must have a middlename.'],
    trim: true,
  },
  lastname: {
    type: String,
    required: [true, 'Must have a lastname.'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Must have an eamil.'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  addresses: [addressSchema],
  photo: {
    type: String,
    default: 'default-user.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'supplier', 'admin'],
    default: 'user',
  },
  cart: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
    },
  ],
  reviews: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'ProductReview',
    },
  ],
  orders: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Order',
    },
  ],
  password: {
    type: String,
    required: [true, 'Must have a password.'],
    minLength: [8, 'Password must have more than 8 characters.'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Must have a password.'],
    minLength: [8, 'Password must have more than 8 characters.'],
    validate: {
      validator: function (e) {
        return e === this.password;
      },
      message: 'Passwords are not the same!!',
    },
  },
  createdAt: {
    type: Date,
    default: () => Date.now(),
    immutable: true,
  },
  passwordChangedAt: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) next();

  this.password = await bcrypt.hash(this.password, 10);
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.checkPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
