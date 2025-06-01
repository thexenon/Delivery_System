const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category can not be empty!'],
    },
    subcategory: [
      {
        type: String,
        required: [true, 'Category can not be empty!'],
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
