import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";
import Customer from "./Customers.js";

const OrderItem = sequelize.define(
  "OrderItem",
  {
    size: {
      type: DataTypes.STRING,
    },

    qnty: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
      },
    },
    fileName: {
      type: DataTypes.STRING,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: 0,
      },
    },

    money: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: 0,
      }},
    receipt: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);
OrderItem.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer'
});

Customer.hasMany(OrderItem, {
  foreignKey: 'customerId',
  as: 'orderItems'
});
export default OrderItem;