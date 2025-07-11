const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'A service must have a name'],
      maxlength: [50, 'A service name must be less or equal to 50 characters'],
      minlength: [8, 'A service name must have more or equal to 8 characters'],
    },
    artisan: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Service should have a Artisan'],
    },
    artisanShop: {
      type: mongoose.Schema.ObjectId,
      ref: 'ArtisanShop',
      required: [true, 'Service should have a Artisan'],
    },
    price: {
      type: Number,
      required: [true, 'A service must have a price'],
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A service must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    images: [
      {
        type: String,
        required: [true, 'A service must have at least one image'],
      },
    ],
    duration: {
      type: Number,
      required: [true, 'A service must have a finish duration'],
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    secretService: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

serviceSchema.index({ price: 1 });
serviceSchema.index({ artisan: 1 });
serviceSchema.index({ artisanShop: 1 });
serviceSchema.index({ name: 1, artisanShop: 1 }, { unique: true });

serviceSchema.virtual('reviews', {
  ref: 'ArtisanReview',
  foreignField: 'service',
  localField: '_id',
});

serviceSchema.virtual('priceFinal').get(function () {
  return Math.round(this.price * 1.05);
});

serviceSchema.pre(/^find/, function (next) {
  this.find({ secretService: { $ne: true } });
  this.find({ active: { $ne: false } });

  next();
});
const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;
