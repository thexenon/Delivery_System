// review / rating / createdAt / ref to artisanShop / ref to user
const mongoose = require('mongoose');
const ArtisanShop = require('./artisanShopModel');

const artisanReviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Artisan Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    artisanShop: {
      type: mongoose.Schema.ObjectId,
      ref: 'ArtisanShop',
      required: [true, 'Artisan Review must belong to a artisanShop.'],
    },
    service: {
      type: mongoose.Schema.ObjectId,
      ref: 'Service',
      required: [true, 'Artisan Review must belong to a service.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'ArtisanReview must belong to a user'],
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

artisanReviewSchema.index({ service: 1, user: 1 }, { unique: true });

artisanReviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name image',
  }).populate({
    path: 'artisanShop',
    select: 'name image',
  });
  next();
});

artisanReviewSchema.statics.calcAverageRatings = async function (
  artisanShopID,
) {
  const stats = await this.aggregate([
    {
      $match: { artisanShop: artisanShopID },
    },
    {
      $group: {
        _id: '$artisanShop',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await ArtisanShop.findByIdAndUpdate(artisanShopID, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await ArtisanShop.findByIdAndUpdate(artisanShopID, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

artisanReviewSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

artisanReviewSchema.post('save', function () {
  // this points to current review
  this.constructor.calcAverageRatings(this.artisanShop);
});

// // findByIdAndUpdate
// // findByIdAndDelete
artisanReviewSchema.post(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

artisanReviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.artisanShop);
});

const ArtisanReview = mongoose.model('ArtisanReview', artisanReviewSchema);

module.exports = ArtisanReview;
