const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    products: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: [true, 'Order must belong to a product.'],
      },
    ],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a user'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total Amount must be set'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    status: {
      type: String,
      default: 'pending',
      enum: {
        values: [
          'cancelled',
          'pending',
          'delivered',
          'picked-up',
          'in-transit',
        ],
        message:
          'Status is either ||in-transit||pending||delivered||cancelled||picked-up||',
      },
    },
    payment: {
      type: String,
      default: 'Momo',
      enum: {
        values: ['Cash', 'Momo', 'In-app'],
        message: 'Status is either ||In-app||Momo||Cash||',
      },
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

orderSchema.index({ location: '2dsphere' });

orderSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name phone location address image',
  })
    .populate({
      path: 'rider',
      select: 'name phone image location',
    })
    .populate({
      path: 'products',
      select: 'name images store',
    });
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
