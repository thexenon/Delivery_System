const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.ObjectId,
      ref: 'Order',
    },
    store: {
      type: mongoose.Schema.ObjectId,
      ref: 'Store',
      required: [true, 'Order Item must belong to a store.'],
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
    merchant: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Order Item should have a Merchant'],
    },
    rider: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    amount: {
      type: Number,
      required: [true, 'Amount must be set'],
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
    address: {
      type: String,
      required: [true, 'Delivery Address must be set'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity must be set'],
    },
    preference: {
      type: String,
      trim: true,
    },
    variety: {
      type: String,
    },
    orderoptions: [
      {
        name: {
          type: String,
        },
        options: [
          {
            optionname: {
              type: String,
            },
            quantity: {
              type: Number,
            },
          },
        ],
      },
    ],
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

orderItemSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

orderItemSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name phone location address image',
  })
    .populate({
      path: 'rider',
      select: 'name phone image location',
    })
    .populate({
      path: 'product',
      select: 'name images price priceDiscount',
    })
    .populate({
      path: 'store',
      select: 'name image location',
    });
  next();
});

const OrderItem = mongoose.model('OrderItem', orderItemSchema);

module.exports = OrderItem;
