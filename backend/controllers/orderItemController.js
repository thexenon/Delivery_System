const OrderItem = require('./../models/orderItemModel');
const factory = require('./handlerFactory');

exports.setRequiredIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.order) req.body.order = req.params.order.id;
  if (!req.body.product) req.body.product = req.params.product.id;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllOrderItems = factory.getAll(OrderItem);
exports.getOrderItem = factory.getOne(OrderItem);
exports.createOrderItem = factory.createOne(OrderItem);
exports.updateOrderItem = factory.updateOne(OrderItem);
exports.deleteOrderItem = factory.deleteOne(OrderItem);
