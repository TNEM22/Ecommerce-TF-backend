const OTP = require('../models/otpModel');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const { promisify } = require('util');
const AppError = require('../utils/appError');

const { sendOTPEmail } = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

const createToken = (user, status, req, res) => {
  const token = signToken(user._id);
  console.log(process.env.COOKIE_EXPIRY);
  res.cookie('token', token, {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRY * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: 'none',
    secure: false,
  });
  // res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(status).json({
    status: 'success',
    token: token,
    data: user,
  });
};

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const otpSignup = catchAsync(async (req, res, next) => {
  const email = req.body.email;

  // Before OTP process check once if user exists
  const virtualUser = await User.findOne({ email });
  if (virtualUser)
    return next(new AppError('User already exists, please login!!', 409));

  const otp = generateOTP();

  await OTP.create({ email, otp });

  await sendOTPEmail(email, otp);

  res.status(200).json({
    status: 'success',
    message: `Mail sent to ${email}, enter otp and signup within 5 minutes.`,
  });
});

function getRemainingTime(xTime) {
  // console.log(Math.floor(xTime / 1000));
  const x = 300 - Math.floor(xTime / 1000);
  // console.log(x);
  // console.log(x / 60);
  let str = 'Incorrect OTP, time remaining ';
  if (x > 60) {
    const minutes = Math.floor(x / 60);
    str += `${minutes} minutes ${x - minutes * 60} seconds.`;
  } else if (x <= 0) {
    str = `OTP Expired!`;
  } else {
    str += `${x} seconds.`;
  }
  return str;
}

exports.signup = catchAsync(async (req, res, next) => {
  // Check if user exists in the OTP document
  const virtualUser = await OTP.findOne({ email: req.body.email });

  // Virtual User not exists, signup the user and send otp token.
  if (!virtualUser) {
    if (req.body.otp) {
      return next(new AppError('OTP Expired!', 401));
    }
    return otpSignup(req, res, next);
  }

  // Check for the otp
  const otp = req.body.otp;

  // If otp does not exists then user do....
  if (!otp)
    return next(
      new AppError('Email already sent, try again after 10 minutes', 400)
    );

  // If user exists check for otp match
  if (virtualUser.otp != otp)
    return next(
      new AppError(getRemainingTime(Date.now() - virtualUser.createdAt), 400)
    );

  await OTP.findByIdAndDelete(virtualUser._id);

  const newUser = await User.create({
    firstname: req.body.firstname,
    middlename: req.body.middlename,
    lastname: req.body.lastname,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // User registered successfully send the token
  createToken(newUser, 201, req, res);
});

exports.checkOTP = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const otp = req.body.otp;

  const virtualUser = await OTP.findOne({ email: email, otp: otp });

  if (!virtualUser) {
    res.status(404).json({
      status: 'error',
      message: 'Incorrect email or otp.',
    });
  } else {
    res.status(200).json({
      status: 'success',
      message: 'OTP Verified!',
    });
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check for email and password
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // Try to get user
  const user = await User.findOne({ email: email }).select('+password');

  // Check if user exists and password is correct
  if (!user || !(await user.checkPassword(password))) {
    return next(new AppError('Invalid email and password!', 401));
  }

  // Everything is ok send the token
  createToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  const token = req.cookies.token || req.body.token;

  if (!token) {
    return res.status(401).json({
      status: 'error',
      data: 'You are not authorized to access this route',
    });
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  req.user = await User.findById(decoded.id);

  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(401).json({
        status: 'error',
        data: 'You do not have permission to access this route.',
      });
    }
    next();
  };
