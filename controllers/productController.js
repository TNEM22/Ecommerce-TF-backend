const multer = require('multer');
const crypto = require('crypto');

const Product = require('../models/productModel');
const ProductReview = require('../models/productReviewModel');
const catchAsync = require('../utils/catchAsync');
const handleUpload = require('../utils/cloudinary');

const AppError = require('../utils/appError');
const User = require('../models/userModel');

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadProductImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'image', maxCount: 5 },
]);

exports.getAllProducts = catchAsync(async (req, res, next) => {
  if (req.query.price) {
    const price = req.query.price;
    delete req.query.price;
    if (price.split('-')[1] != '?') {
      req.query.currPrice = {
        $gte: Number(price.split('-')[0]),
        $lte: Number(price.split('-')[1]),
      };
    } else {
      req.query.currPrice = {
        $gte: Number(price.split('-')[0]),
      };
    }
  }
  if (req.query.excludeProductId) {
    req.query._id = { $ne: req.query.excludeProductId };
    delete req.query.excludeProductId;
  }
  let Products = null;
  // console.log(req.query);
  // Check for filters
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (req.query.page) delete req.query.page;
  if (req.query.limit) delete req.query.limit;
  // console.log(req.query);
  Products = await Product.find(req.query).skip(skip).limit(limit);
  const countOfProducts = await Product.countDocuments(req.query);

  res.status(200).json({
    status: 'success',
    results: Products.length,
    total: countOfProducts,
    data: Products,
  });
});

exports.createProduct = catchAsync(async (req, res, next) => {
  // Check all required fields and create a product with temporary cover image.
  const newProduct = await Product.create({
    supplierId: req.user._id,
    name: req.body.name,
    desc: req.body.desc,
    actualPrice: req.body.actualPrice,
    currPrice: req.body.currPrice,
    availabelQuantity: req.body.availabelQuantity,
    image: [],
    components: req.body.components,
    brand: req.body.brand,
  });

  // Upload received files to cloudinary
  const files = req.files;
  if (files) {
  }
  if (files.imageCover) {
    // console.log(files.imageCover[0]);
    const file = files.imageCover[0];
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = 'data:' + file.mimetype + ';base64,' + b64;
    const cldRes = await handleUpload(dataURI);
    newProduct.imageCover = cldRes.url;
  }
  if (files.image) {
    // console.log(files.image);
    for (const file of files.image) {
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = 'data:' + file.mimetype + ';base64,' + b64;
      const cldRes = await handleUpload(dataURI);
      newProduct.image.push(cldRes.url);
    }
  }
  // console.log(newProduct.image);
  await Product.findByIdAndUpdate(newProduct._id, newProduct, {
    // new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const productId = req.body.id;
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      status: 'error',
      data: 'Product not found.',
    });
  }
  if (product.supplierId != req.user._id) {
    return res.status(401).json({
      status: 'error',
      data: `You don't have permission to delete this product.`,
    });
  }
  await Product.findByIdAndDelete(productId);
  res.status(204).json({
    status: 'success',
    data: 'Product deleted successfully.',
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  // Check if product Id is valid
  if (req.params.id.length != 24) {
    return res.status(404).json({
      status: 'error',
      data: 'Product Not Found',
    });
  }

  // Get product
  const product = await Product.findById(req.params.id);

  // Check if product found
  if (product == null) {
    return res.status(404).json({
      status: 'error',
      data: 'Product Not Found',
    });
  }

  res.status(200).json({
    status: 'success',
    data: product,
  });
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  if (!productId) {
    return res.status(400).json({
      status: 'error',
      data: 'ProductId not present',
    });
  }
  // Check if product exists
  const product = Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      status: 'error',
      data: 'Product not found',
    });
  }

  // Check for filters
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  // Get all reviews and forward
  const reviews = await ProductReview.find({ productId })
    .sort({ createdAt: -1 }) // Get latest review first
    .skip(skip)
    .limit(limit)
    .populate('userId');

  res.status(200).json({
    status: 'succes',
    results: reviews.length,
    data: reviews,
  });
});

exports.writeReview = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  // Check if product exists
  const user = req.user;
  const productId = req.params.id;
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      status: 'error',
      data: 'Product not found',
    });
  }
  const newReview = await ProductReview.create({
    userId: user._id,
    productId: productId,
    subject: req.body.subject,
    desc: req.body.desc,
    rating: req.body.rating,
    images: req.body.images,
  });

  user.reviews = [...user.reviews, newReview._id];

  await User.findByIdAndUpdate(user._id, user);

  res.status(200).json({
    status: 'success',
  });
});

exports.deleteImage = catchAsync(async (req, res, next) => {
  const { public_id } = req.body;
  if (!public_id) {
    return res.status(400).json({
      status: 'error',
      data: 'Invalid image id',
    });
  }
  const api_secret = process.env.API_SECRET;
  const timestamp = Math.floor(Date.now() / 1000); // Required for signature
  const string_to_sign = `public_id=${public_id}&timestamp=${timestamp}${api_secret}`;
  const signature = crypto
    .createHash('sha1')
    .update(string_to_sign)
    .digest('hex');
  const query = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/image/destroy`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_id,
        api_key: process.env.API_KEY,
        timestamp,
        signature,
      }),
    }
  );
  // console.log(query);
  res.status(200).json({
    status: 'success',
  });
});

exports.searchProduct = catchAsync(async (req, res, next) => {
  const { query } = req.body;

  const products = await Product.aggregate([
    {
      $search: {
        index: 'default', // or your custom index name
        text: {
          query: query,
          path: 'name',
        },
      },
    },
  ]);

  console.log(products);

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: products,
  });
});
