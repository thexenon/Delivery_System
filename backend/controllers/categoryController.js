const Category = require('./../models/categoryModel');
const factory = require('./handlerFactory');

exports.getAllCategorys = factory.getAll(Category);
exports.getCategory = factory.getOne(Category);
exports.createCategory = factory.createOne(Category);
exports.updateCategory = factory.updateOne(Category);
exports.deleteCategory = factory.deleteOne(Category);
