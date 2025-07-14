const OrderItem = require('./../models/orderItemModel');
const factory = require('./handlerFactory');


exports.getAllOrderItems = factory.getAll(OrderItem);
exports.getOrderItem = factory.getOne(OrderItem);
exports.createOrderItem = factory.createOne(OrderItem);
exports.updateOrderItem = factory.updateOne(OrderItem);
exports.deleteOrderItem = factory.deleteOne(OrderItem);
