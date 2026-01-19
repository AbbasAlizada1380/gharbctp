import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";
import Customer from "./Customers.js";

const Remain = sequelize.define(
  "remain",
  {
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Customer,
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    orderId: {
      type: DataTypes.JSON,
      defaultValue: [],
      get() {
        const rawValue = this.getDataValue('orderId');
        return Array.isArray(rawValue) ? rawValue : [];
      },
      set(value) {
        const arrayValue = Array.isArray(value) ? value : (value ? [value] : []);
        this.setDataValue('orderId', arrayValue);
      }
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['customerId']
      }
      // REMOVED the orderId index - it causes the error in MySQL
    ],
    hooks: {
      beforeSave: (remain, options) => {
        // Only merge if we're updating and orderId has changed
        if (remain.id && remain.changed('orderId')) {
          const previousOrderIds = remain.previous('orderId') || [];
          const newOrderIds = remain.orderId || [];
          
          // Merge arrays and remove duplicates
          const mergedOrderIds = [...new Set([...previousOrderIds, ...newOrderIds])];
          remain.orderId = mergedOrderIds;
        }
      }
    }
  }
);

// Define associations
Remain.belongsTo(Customer, { 
  foreignKey: 'customerId',
  as: 'customer'
});

// Instance methods
Remain.prototype.addOrderIds = function(orderIds) {
  const currentOrderIds = this.orderId;
  const idsToAdd = Array.isArray(orderIds) ? orderIds : [orderIds];
  
  idsToAdd.forEach(orderId => {
    if (orderId && !currentOrderIds.includes(orderId)) {
      currentOrderIds.push(orderId);
    }
  });
  
  this.orderId = currentOrderIds;
  return this;
};

Remain.prototype.removeOrderIds = function(orderIds) {
  const currentOrderIds = this.orderId;
  const idsToRemove = Array.isArray(orderIds) ? orderIds : [orderIds];
  
  this.orderId = currentOrderIds.filter(orderId => !idsToRemove.includes(orderId));
  return this;
};

Remain.prototype.hasOrderId = function(orderId) {
  return this.orderId.includes(orderId);
};

Remain.prototype.clearOrderIds = function() {
  this.orderId = [];
  return this;
};

Remain.prototype.getOrderCount = function() {
  return this.orderId.length;
};

// Static method for MySQL
Remain.findByOrderId = async function(orderId) {
  return await this.findOne({
    where: sequelize.where(
      sequelize.fn('JSON_CONTAINS', sequelize.col('orderId'), JSON.stringify(orderId)),
      1
    )
  });
};

export default Remain;