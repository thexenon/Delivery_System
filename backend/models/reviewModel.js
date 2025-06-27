// review / rating / createdAt / ref to store / ref to user
const mongoose = require('mongoose');
const Store = require('./storeModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    store: {
      type: mongoose.Schema.ObjectId,
      ref: 'Store',
      required: [true, 'Review must belong to a store.'],
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name image',
  }).populate({
    path: 'store',
    select: 'name image',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (storeId) {
  const stats = await this.aggregate([
    {
      $match: { store: storeId },
    },
    {
      $group: {
        _id: '$store',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Store.findByIdAndUpdate(storeId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Store.findByIdAndUpdate(storeId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

reviewSchema.post('save', function () {
  // this points to current review
  this.constructor.calcAverageRatings(this.store);
});

// // findByIdAndUpdate
// // findByIdAndDelete
// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   this.r = await this.findOne();
//   // console.log(this.r);
//   next();
// });

// reviewSchema.post(/^findOneAnd/, async function () {
//   // await this.findOne(); does NOT work here, query has already executed
//   await this.r.constructor.calcAverageRatings(this.r.store);
// });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
