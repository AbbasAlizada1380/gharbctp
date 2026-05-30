import sequelize from '../dbconnection.js';
import Seller from './Seller/Seller.js';
import Income from './Stock/Income.js';                     // main Income model
import SellerAccount from './Seller/SellerAccount.js';
import Pay from './Finance/Pay.js';
import Factor from './Finance/Factor.js';
import User from './user.js';
import Exist from './Stock/exist.js'

// Build models object with consistent keys
const models = {
  Seller,
  SellerAccount,
  Factor,
  Income,               // ✅ used in associations as Income
  Exist ,    // ✅ alias for StockExist (used in controller)
  Pay,
  // Include other models if needed elsewhere
};

// ========== INCOME ASSOCIATION ==========
Income.associate = (models) => {
  Income.belongsTo(models.Seller, { foreignKey: "sellerId", as: "seller" });
};

// ========== SELLER ASSOCIATION ==========
Seller.associate = (models) => {
  Seller.hasMany(models.Income, { foreignKey: "sellerId", as: "incomes" });     // ✅ use models.Income
  Seller.hasOne(models.SellerAccount, { foreignKey: "sellerId", as: "account" });
  Seller.hasMany(models.Pay, { foreignKey: "seller", as: "payments" });
  Seller.hasMany(models.Factor, { foreignKey: "sellerId", as: "factors" });
};

// ========== SELLER ACCOUNT ASSOCIATION ==========
SellerAccount.associate = (models) => {
  SellerAccount.belongsTo(models.Seller, { foreignKey: "sellerId", as: "seller" });
};

// ========== PAY ASSOCIATION ==========
Pay.associate = (models) => {
  Pay.belongsTo(models.Seller, { foreignKey: "seller", as: "sellerInfo" });
};

// ========== FACTOR ASSOCIATION ==========
Factor.associate = (models) => {
  Factor.belongsTo(models.Seller, { foreignKey: "sellerId", as: "seller" });
};

// Apply all associations
Object.keys(models).forEach(modelName => {
  if (models[modelName] && models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export all models and sequelize instance
export {
  sequelize,
  Seller,
  SellerAccount,
  Factor,
  Income,
  Exist as StockExist,   // export both names if needed
  Exist,                 // ✅ directly as Exist for controller
  Pay,
};