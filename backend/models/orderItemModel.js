const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    order: {
      type: mongoose.Schema.ObjectId,
      ref: 'Order',
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'Order Item must belong to a product.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Order Item must belong to a product.'],
    },

    amount: {
      type: Number,
      required: [true, 'Amount must be set'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity must be set'],
    },
    preference: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      default: 'pending',
      enum: {
        values: [
          'accepted',
          'cancelled',
          'pending',
          'delivered',
          'picked-up',
          'in-transit',
        ],
        message:
          'Status is either ||in-transit||pending||delivered||accepted||cancelled||picked-up||',
      },
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

orderItemSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name phone',
  }).populate({
    path: 'product',
    select: 'name priceDiscount',
  });
  next();
});

const OrderItem = mongoose.model('OrderItem', orderItemSchema);

module.exports = OrderItem;
