const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Service request must have a customer'],
    },
    service: {
      type: mongoose.Schema.ObjectId,
      ref: 'Service',
      required: [true, 'Service request must have a service'],
    },
    artisan: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Service request must have an artisan'],
    },
    artisanShop: {
      type: mongoose.Schema.ObjectId,
      ref: 'ArtisanShop',
      required: [true, 'Service request must have an artisan shop'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    scheduledTime: { type: Date, required: true },
    preference: { type: String, trim: true },
    address: {
      type: String,
      trim: true,
      required: [true, 'An address must be set'],
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    amount: {
      type: Number,
      required: [true, 'Amount must be set'],
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

serviceRequestSchema.index({ 'location.coordinates': '2dsphere' });

serviceRequestSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

serviceRequestSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'customer',
    select: 'name email phone image location address',
  })
    .populate({
      path: 'artisan',
      select: 'name email phone image location address',
    })
    .populate({
      path: 'artisanShop',
      select:
        'name email phone image location address ratingsAverage ratingsQuantity available experienceYears isVerified',
    })
    .populate({
      path: 'service',
      select: 'name images price description summary duration ',
    });
  next();
});

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

module.exports = ServiceRequest;
