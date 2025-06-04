const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const Users = await User.find();

  res.status(200).json({
    status: 'success',
    results: Users.length,
    data: Users,
  });
});

exports.createUser = catchAsync(async (req, res, next) => {
  res.status(404).json({
    status: 'error',
    data: 'This route does not exists, use Sign Up(/signup) instead.',
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  // console.log(req.user);
  const user = await User.findById(req.user._id).populate(
    'cart',
    'name currPrice ratingsAverage ratingsQuantity imageCover availabel'
  );
  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const { number, address } = req.body;

  await User.findByIdAndUpdate(
    req.user._id,
    { $push: { addresses: { phoneno: number, address: address } } },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Address Updated!',
  });
});

exports.getCartItemsCount = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: req.user.cart.length,
  });
});

exports.addCartItem = catchAsync(async (req, res, next) => {
  const user = req.user;
  const productId = req.body.productId;

  if (!productId) return next(new AppError('ProductId not present', 400));

  user.cart = [...user.cart, productId];
  await User.findByIdAndUpdate(user._id, user);

  let count = 0;
  await user.cart.forEach((element) => {
    if (productId == element) count++;
  });

  res.status(200).json({
    status: 'success',
    data: {
      count: count,
    },
  });
});

exports.deleteCartItem = catchAsync(async (req, res, next) => {
  const user = req.user;
  const productId = req.body.productId;

  if (!productId) return next(new AppError('ProductId not present', 400));
  console.log(productId);

  const ObjectId = mongoose.Types.ObjectId;
  const product = new ObjectId(String(productId));

  console.log(product);

  console.log(user.cart);
  // user.cart = user.cart.filter((item) => !item.equals(product));
  const index = user.cart.findIndex((item) => item.equals(product));
  if (index !== -1) {
    user.cart.splice(index, 1);
  }
  console.log(user.cart);
  await User.findByIdAndUpdate(user._id, user);

  let count = 0;
  await user.cart.forEach((element) => {
    if (productId == element) count++;
  });

  res.status(200).json({
    status: 'success',
    data: {
      count: count,
    },
  });
});

exports.emptyCart = catchAsync(async (req, res, next) => {
  const user = req.user;

  user.cart = [];
  await User.findByIdAndUpdate(user._id, user);

  res.status(200).json({
    status: 'success',
  });
});
