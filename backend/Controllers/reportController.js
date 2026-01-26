import { Op, QueryTypes } from "sequelize";
import sequelize from "../dbconnection.js";
import Owner from "../Models/owners.js";
import Money from "../Models/Money.js";
import Customer from "../Models/Customers.js";
import OrderItem from "../Models/OrderItems.js";
import Receipt from "../Models/receipt.js";
import Remain from "../Models/remain.js";
import Expense from "../Models/Expense.js";
import Staff from "../Models/staff/staff.js";
import Attendance from "../Models/Attendence.js";
import Exist from "../Models/Stock/exist.js";
import Income from "../Models/Stock/income.js";
import Outgoing from "../Models/Stock/outgoing.js";
import User from "../Models/User.js";

/**
 * Generate Complete System Report
 */
export const generateCompleteReport = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            ownerId,
            customerId,
            staffId,
            reportType = 'all' // all, financial, customers, staff, inventory
        } = req.query;

        // Date range setup
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        // Generate report based on type
        let report;

        switch (reportType) {
            case 'financial':
                console.log('Generating financial report...');
                report = await generateFinancialReport(dateFilter, ownerId);
                break;
            case 'customers':
                console.log('Generating customer report...');
                report = await generateCustomerReport(dateFilter, customerId);
                break;
            case 'staff':
                console.log('Generating staff report...');
                report = await generateStaffReport(dateFilter, staffId);
                break;
            case 'inventory':
                console.log('Generating inventory report...');
                report = await generateInventoryReport(dateFilter);
                break;
            default:
                console.log('Generating all report...');
                report = await generateAllReport(dateFilter, ownerId, customerId, staffId);
        }

        res.status(200).json({
            success: true,
            message: "Report generated successfully",
            report,
            filters: {
                startDate,
                endDate,
                ownerId,
                customerId,
                staffId,
                reportType
            }
        });

    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({
            success: false,
            message: "Error generating report",
            error: error.message
        });
    }
};

// 1. Generate Complete All-in-One Report
async function generateAllReport(dateFilter, ownerId, customerId, staffId) {
    const [
        financial,
        customers,
        staff,
        inventory,
        system,
        summary
    ] = await Promise.all([
        generateFinancialData(dateFilter, ownerId),
        generateCustomerData(dateFilter, customerId),
        generateStaffData(dateFilter, staffId),
        generateInventoryData(dateFilter),
        generateSystemData(),
        generateSummaryData(dateFilter)
    ]);

    return {
        reportDate: new Date().toISOString(),
        period: dateFilter.createdAt ? `${startDate} to ${endDate}` : 'All Time',
        summary,
        financial,
        customers,
        staff,
        inventory,
        system
    };
}

// 2. Generate Financial Report
async function generateFinancialReport(dateFilter, ownerId) {
    const financialData = await generateFinancialData(dateFilter, ownerId);
    return {
        reportType: 'financial',
        reportDate: new Date().toISOString(),
        ...financialData
    };
}

// 3. Generate Customer Report
async function generateCustomerReport(dateFilter, customerId) {
    const customerData = await generateCustomerData(dateFilter, customerId);
    return {
        reportType: 'customer',
        reportDate: new Date().toISOString(),
        ...customerData
    };
}

// 4. Generate Staff Report
async function generateStaffReport(dateFilter, staffId) {
    const staffData = await generateStaffData(dateFilter, staffId);
    return {
        reportType: 'staff',
        reportDate: new Date().toISOString(),
        ...staffData
    };
}

// 5. Generate Inventory Report
async function generateInventoryReport(dateFilter) {
    const inventoryData = await generateInventoryData(dateFilter);
    return {
        reportType: 'inventory',
        reportDate: new Date().toISOString(),
        ...inventoryData
    };
}

// ========== HELPER FUNCTIONS ==========

// Financial Data Generator
async function generateFinancialData(dateFilter, ownerId) {
    const moneyWhere = { ...dateFilter };
    if (ownerId) moneyWhere.ownerId = ownerId;

    const expenseWhere = { ...dateFilter };
    const receiptWhere = { ...dateFilter };

    // Get all data in parallel
    const [
        moneyRecords,
        expenseRecords,
        receiptRecords,
        orderItems,
        totalMoney,
        totalExpenses,
        totalReceipts,
        totalOrderMoney,
        ownerSummary
    ] = await Promise.all([
        Money.findAll({
            where: moneyWhere,
            include: [{ model: Owner, as: 'owner' }],
            order: [['createdAt', 'DESC']]
        }),
        Expense.findAll({ where: expenseWhere, order: [['createdAt', 'DESC']] }),
        // FIXED: Using the correct association for Receipt -> Customer
        Receipt.findAll({
            where: receiptWhere,
            include: [{
                model: Customer,
                // The association is defined as Receipt.belongsTo(Customer, { foreignKey: 'customer' })
                // So we need to use the default association (no alias)
            }],
            order: [['createdAt', 'DESC']]
        }),
        OrderItem.findAll({
            where: dateFilter,
            include: [{ model: Customer, as: 'customer' }],
            order: [['createdAt', 'DESC']]
        }),
        Money.sum('amount', { where: moneyWhere }),
        Expense.sum('amount', { where: expenseWhere }),
        Receipt.sum('amount', { where: receiptWhere }),
        OrderItem.sum('money', { where: dateFilter }),
        getOwnerFinancialSummary(dateFilter, ownerId)
    ]);

    const calculatedTotal = moneyRecords.filter(m => m.calculated).reduce((sum, m) => sum + parseFloat(m.amount), 0);
    const manualTotal = moneyRecords.filter(m => !m.calculated).reduce((sum, m) => sum + parseFloat(m.amount), 0);

    return {
        totals: {
            totalMoney: totalMoney || 0,
            totalExpenses: totalExpenses || 0,
            totalReceipts: totalReceipts || 0,
            totalOrderMoney: totalOrderMoney || 0,
            calculatedMoney: calculatedTotal,
            manualMoney: manualTotal,
            netCashFlow: (totalMoney || 0) - (totalExpenses || 0),
            netIncome: (totalMoney || 0) + (totalReceipts || 0) - (totalExpenses || 0)
        },
        breakdown: {
            moneyRecords: moneyRecords.map(m => ({
                id: m.id,
                owner: m.owner?.name,
                amount: m.amount,
                type: m.calculated ? 'calculated' : 'manual',
                date: m.createdAt
            })),
            expenses: expenseRecords.map(e => ({
                id: e.id,
                purpose: e.purpose,
                by: e.by,
                amount: e.amount,
                date: e.createdAt
            })),
            receipts: receiptRecords.map(r => ({
                id: r.id,
                customer: r.Customer?.fullname, // Accessing through the associated Customer
                amount: r.amount,
                date: r.createdAt
            }))
        },
        ownerSummary,
        count: {
            moneyRecords: moneyRecords.length,
            expenses: expenseRecords.length,
            receipts: receiptRecords.length,
            orderItems: orderItems.length
        }
    };
}

// Customer Data Generator
async function generateCustomerData(dateFilter, customerId) {
    const customerWhere = {};
    const orderWhere = { ...dateFilter };
    const receiptWhere = { ...dateFilter };

    if (customerId) {
        customerWhere.id = customerId;
        orderWhere.customerId = customerId;
        receiptWhere.customer = customerId;
    }

    const [
        customers,
        orderItems,
        receipts,
        remains,
        topCustomers,
        totalOrdersValue,
        totalReceiptsValue,
        activeCustomers,
        inactiveCustomers
    ] = await Promise.all([
        Customer.findAll({
            where: customerWhere,
            order: [['createdAt', 'DESC']]
        }),
        OrderItem.findAll({
            where: orderWhere,
            include: [{ model: Customer, as: 'customer' }],
            order: [['createdAt', 'DESC']]
        }),
        // FIXED: No alias for Receipt -> Customer association
        Receipt.findAll({
            where: receiptWhere,
            include: [{ model: Customer }],
            order: [['createdAt', 'DESC']]
        }),
        Remain.findAll({
            where: dateFilter,
            include: [{ model: Customer, as: 'customer' }],
            order: [['updatedAt', 'DESC']]
        }),
        getTopCustomers(dateFilter),
        OrderItem.sum('money', { where: orderWhere }),
        Receipt.sum('amount', { where: receiptWhere }),
        Customer.count({ where: { isActive: true } }),
        Customer.count({ where: { isActive: false } })
    ]);

    // Get last order dates for all customers
    const customersWithLastOrder = await Promise.all(
        customers.map(async (c) => {
            const lastOrder = await getLastOrderDate(c.id, dateFilter);
            return {
                id: c.id,
                name: c.fullname,
                phone: c.phoneNumber,
                status: c.isActive ? 'active' : 'inactive',
                createdAt: c.createdAt,
                lastOrder: lastOrder
            };
        })
    );

    const customerBalance = {};
    remains.forEach(remain => {
        const customerId = remain.customerId;
        if (!customerBalance[customerId]) {
            customerBalance[customerId] = {
                customer: remain.customer?.fullname,
                pendingOrders: remain.remainOrders?.length || 0,
                completedOrders: remain.receiptOrders?.length || 0,
                totalOrders: (remain.remainOrders?.length || 0) + (remain.receiptOrders?.length || 0)
            };
        }
    });

    return {
        totals: {
            totalCustomers: customers.length,
            activeCustomers,
            inactiveCustomers,
            totalOrdersValue: totalOrdersValue || 0,
            totalReceiptsValue: totalReceiptsValue || 0,
            pendingAmount: (totalOrdersValue || 0) - (totalReceiptsValue || 0)
        },
        customers: customersWithLastOrder,
        topCustomers,
        balances: Object.values(customerBalance),
        recentOrders: orderItems.slice(0, 10).map(o => ({
            id: o.id,
            customer: o.customer?.fullname,
            size: o.size,
            quantity: o.qnty,
            price: o.price,
            total: o.money,
            date: o.createdAt
        })),
        recentReceipts: receipts.slice(0, 10).map(r => ({
            id: r.id,
            customer: r.Customer?.fullname,
            amount: r.amount,
            date: r.createdAt
        })),
        count: {
            orders: orderItems.length,
            receipts: receipts.length,
            pendingOrders: remains.reduce((sum, r) => sum + (r.remainOrders?.length || 0), 0)
        }
    };
}

// Staff Data Generator
async function generateStaffData(dateFilter, staffId) {
    const staffWhere = {};
    const attendanceWhere = { ...dateFilter };

    if (staffId) {
        staffWhere.id = staffId;
        attendanceWhere.staffId = staffId;
    }

    const [
        staffMembers,
        attendances,
        totalSalaryPaid,
        totalOvertimePaid,
        totalStaff,
        attendanceStats
    ] = await Promise.all([
        Staff.findAll({ where: staffWhere, order: [['createdAt', 'DESC']] }),
        // FIXED: Using correct association for Attendance -> Staff
        Attendance.findAll({
            where: attendanceWhere,
            include: [{ model: Staff }], // No alias defined in the model
            order: [['createdAt', 'DESC']]
        }),
        Attendance.sum('salary', { where: attendanceWhere }),
        Attendance.sum('overtime', { where: attendanceWhere }),
        Staff.count(),
        getAttendanceStats(dateFilter)
    ]);

    const weeklyAttendance = {};
    attendances.forEach(att => {
        const staffName = att.Staff?.name;
        if (staffName) {
            if (!weeklyAttendance[staffName]) {
                weeklyAttendance[staffName] = [];
            }
            weeklyAttendance[staffName].push({
                week: att.createdAt,
                salary: att.salary,
                overtime: att.overtime,
                total: att.total,
                receipt: att.receipt
            });
        }
    });

    return {
        totals: {
            totalStaff,
            activeStaff: staffMembers.filter(s => s.isActive !== false).length,
            totalSalaryPaid: totalSalaryPaid || 0,
            totalOvertimePaid: totalOvertimePaid || 0,
            totalPaid: (totalSalaryPaid || 0) + (totalOvertimePaid || 0)
        },
        staffList: staffMembers.map(s => ({
            id: s.id,
            name: s.name,
            fatherName: s.fatherName,
            NIC: s.NIC,
            salary: s.salary,
            overtimeRate: s.overTimePerHour,
            workingDays: s.workingDaysPerWeek,
            status: s.isActive === false ? 'inactive' : 'active'
        })),
        attendance: attendanceStats,
        weeklyAttendance,
        recentAttendances: attendances.slice(0, 10).map(a => ({
            id: a.id,
            staff: a.Staff?.name,
            salary: a.salary,
            overtime: a.overtime,
            total: a.total,
            receipt: a.receipt,
            week: a.createdAt
        })),
        count: {
            attendanceRecords: attendances.length
        }
    };
}

// Inventory Data Generator
async function generateInventoryData(dateFilter) {
    const [
        exists,
        incomes,
        outgoings,
        totalExistValue,
        totalIncomeValue,
        totalOutgoingValue,
        inventorySummary
    ] = await Promise.all([
        Exist.findAll({ where: dateFilter, order: [['createdAt', 'DESC']] }),
        Income.findAll({ where: dateFilter, order: [['createdAt', 'DESC']] }),
        Outgoing.findAll({ where: dateFilter, order: [['createdAt', 'DESC']] }),
        calculateInventoryValue('Exist'),
        calculateInventoryValue('Income'),
        calculateInventoryValue('Outgoing'),
        getInventorySummary()
    ]);

    const sizeBreakdown = {};

    // Process Exist records
    exists.forEach(item => {
        if (!sizeBreakdown[item.size]) {
            sizeBreakdown[item.size] = {
                size: item.size,
                currentStock: 0,
                totalIn: 0,
                totalOut: 0
            };
        }
        sizeBreakdown[item.size].currentStock += parseInt(item.quantity || 0);
    });

    // Process Income records
    incomes.forEach(item => {
        if (!sizeBreakdown[item.size]) {
            sizeBreakdown[item.size] = {
                size: item.size,
                currentStock: 0,
                totalIn: 0,
                totalOut: 0
            };
        }
        sizeBreakdown[item.size].totalIn += parseInt(item.quantity || 0);
    });

    // Process Outgoing records
    outgoings.forEach(item => {
        if (!sizeBreakdown[item.size]) {
            sizeBreakdown[item.size] = {
                size: item.size,
                currentStock: 0,
                totalIn: 0,
                totalOut: 0
            };
        }
        sizeBreakdown[item.size].totalOut += parseInt(item.quantity || 0);
    });

    return {
        totals: {
            totalExistValue: totalExistValue || 0,
            totalIncomeValue: totalIncomeValue || 0,
            totalOutgoingValue: totalOutgoingValue || 0,
            netInventory: (totalExistValue || 0) + (totalIncomeValue || 0) - (totalOutgoingValue || 0)
        },
        summary: inventorySummary,
        sizeBreakdown: Object.values(sizeBreakdown),
        currentStock: exists.map(e => ({
            id: e.id,
            size: e.size,
            quantity: e.quantity,
            lastUpdated: e.updatedAt
        })),
        recentIncomes: incomes.slice(0, 10).map(i => ({
            id: i.id,
            size: i.size,
            quantity: i.quantity,
            price: i.price,
            money: i.money,
            spent: i.spent,
            date: i.createdAt
        })),
        recentOutgoings: outgoings.slice(0, 10).map(o => ({
            id: o.id,
            size: o.size,
            quantity: o.quantity,
            money: o.money,
            date: o.createdAt
        })),
        count: {
            existItems: exists.length,
            incomeRecords: incomes.length,
            outgoingRecords: outgoings.length
        }
    };
}

// System Data Generator
async function generateSystemData() {
    const [
        users,
        totalUsers,
        activeUsers,
        owners,
        totalOwners,
        activeOwners
    ] = await Promise.all([
        User.findAll({
            attributes: ['id', 'fullname', 'email', 'role', 'isActive', 'createdAt'],
            order: [['createdAt', 'DESC']]
        }),
        User.count(),
        User.count({ where: { isActive: true } }),
        Owner.findAll({
            attributes: ['id', 'name', 'isActive', 'createdAt'],
            order: [['createdAt', 'DESC']]
        }),
        Owner.count(),
        Owner.count({ where: { isActive: true } })
    ]);

    return {
        users: {
            total: totalUsers,
            active: activeUsers,
            list: users.map(u => ({
                id: u.id,
                name: u.fullname,
                email: u.email,
                role: u.role,
                status: u.isActive ? 'active' : 'inactive',
                joined: u.createdAt
            }))
        },
        owners: {
            total: totalOwners,
            active: activeOwners,
            list: owners.map(o => ({
                id: o.id,
                name: o.name,
                status: o.isActive ? 'active' : 'inactive',
                joined: o.createdAt
            }))
        },
        database: {
            totalTables: 12, // Your models count
            lastBackup: await getLastBackupDate(),
            systemHealth: 'operational'
        }
    };
}

// Summary Data Generator
async function generateSummaryData(dateFilter) {
    const [
        totalMoney,
        totalExpenses,
        totalReceipts,
        totalOrders,
        totalCustomers,
        totalStaff,
        totalSalary,
        inventoryValue
    ] = await Promise.all([
        Money.sum('amount', { where: dateFilter }),
        Expense.sum('amount', { where: dateFilter }),
        Receipt.sum('amount', { where: dateFilter }),
        OrderItem.sum('money', { where: dateFilter }),
        Customer.count({ where: dateFilter }),
        Staff.count(),
        Attendance.sum('total', { where: dateFilter }),
        calculateTotalInventoryValue(dateFilter)
    ]);

    return {
        financial: {
            totalIncome: (totalMoney || 0) + (totalReceipts || 0),
            totalExpenses: (totalExpenses || 0) + (totalSalary || 0),
            netProfit: (totalMoney || 0) + (totalReceipts || 0) - (totalExpenses || 0) - (totalSalary || 0),
            cashOnHand: (totalMoney || 0) - (totalExpenses || 0)
        },
        operations: {
            totalCustomers,
            totalOrders: totalOrders || 0,
            totalStaff,
            activeStaff: await Staff.count(), // or remove this line if you don't have isActive,
            inventoryValue: inventoryValue || 0
        },
        performance: {
            avgOrderValue: totalCustomers > 0 ? (totalOrders / totalCustomers) : 0,
            avgCustomerLifetime: 0,
            staffProductivity: totalStaff > 0 ? (totalOrders / totalStaff) : 0
        }
    };
}

// ========== UTILITY FUNCTIONS ==========

async function getOwnerFinancialSummary(dateFilter, ownerId) {
  const whereClause = { ...dateFilter };
  if (ownerId) whereClause.ownerId = ownerId;

  const ownerSummary = await Money.findAll({
    attributes: [
      [sequelize.col('Money.ownerId'), 'ownerId'],
      [sequelize.fn('SUM', sequelize.col('Money.amount')), 'totalAmount'],
      [sequelize.fn('COUNT', sequelize.col('Money.id')), 'transactionCount']
    ],
    where: whereClause,
    include: [{ model: Owner, as: 'owner', attributes: ['id', 'name'] }],
    group: ['Money.ownerId', 'owner.id'],
    order: [[sequelize.fn('SUM', sequelize.col('Money.amount')), 'DESC']]
  });

  return ownerSummary.map(os => ({
    ownerId: os.get('ownerId'),
    ownerName: os.owner?.name,
    totalAmount: os.get('totalAmount'),
    transactionCount: os.get('transactionCount')
  }));
}

async function getTopCustomers(dateFilter) {
  const results = await OrderItem.findAll({
    attributes: [
      [sequelize.col('OrderItem.customerId'), 'customerId'],
      [sequelize.fn('SUM', sequelize.col('OrderItem.money')), 'totalSpent'],
      [sequelize.fn('COUNT', sequelize.col('OrderItem.id')), 'orderCount']
    ],
    where: dateFilter,
    include: [{ model: Customer, as: 'customer', attributes: ['id', 'fullname'] }],
    group: ['OrderItem.customerId', 'customer.id'],
    order: [[sequelize.fn('SUM', sequelize.col('OrderItem.money')), 'DESC']],
    limit: 10
  });

  return results.map(r => ({
    customerId: r.get('customerId'),
    customerName: r.customer?.fullname,
    totalSpent: r.get('totalSpent'),
    orderCount: r.get('orderCount')
  }));
}

async function getAttendanceStats(dateFilter) {
  const stats = await Attendance.findAll({
    attributes: [
      [sequelize.col('Attendance.staffId'), 'staffId'],
      [sequelize.fn('SUM', sequelize.col('Attendance.salary')), 'totalSalary'],
      [sequelize.fn('SUM', sequelize.col('Attendance.overtime')), 'totalOvertime'],
      [sequelize.fn('SUM', sequelize.col('Attendance.total')), 'totalPaid'],
      [sequelize.fn('COUNT', sequelize.col('Attendance.id')), 'weeksCount']
    ],
    where: dateFilter,
    include: [{ model: Staff, attributes: ['id', 'name'] }],
    group: ['Attendance.staffId', 'Staff.id'],
    order: [[sequelize.fn('SUM', sequelize.col('Attendance.total')), 'DESC']]
  });

  return stats.map(s => ({
    staffId: s.get('staffId'),
    staffName: s.Staff?.name,
    totalSalary: s.get('totalSalary'),
    totalOvertime: s.get('totalOvertime'),
    totalPaid: s.get('totalPaid'),
    weeksCount: s.get('weeksCount'),
    avgWeeklyPay: (s.get('totalPaid') / (s.get('weeksCount') || 1))
  }));
}

async function getInventorySummary() {
    const sizes = await Exist.findAll({
        attributes: ['size', [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity']],
        group: ['size'],
        order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']]
    });

    return sizes.map(s => ({
        size: s.size,
        totalQuantity: s.get('totalQuantity')
    }));
}

async function calculateInventoryValue(modelName) {
    let total = 0;

    switch (modelName) {
        case 'Exist':
            const exists = await Exist.findAll();
            exists.forEach(e => {
                total += parseFloat(e.quantity || 0);
            });
            break;
        case 'Income':
            const incomes = await Income.findAll();
            incomes.forEach(i => {
                total += parseFloat(i.money || 0);
            });
            break;
        case 'Outgoing':
            const outgoings = await Outgoing.findAll();
            outgoings.forEach(o => {
                total += parseFloat(o.money || 0);
            });
            break;
    }

    return total;
}

async function calculateTotalInventoryValue(dateFilter) {
    const exists = await Exist.sum('quantity', { where: dateFilter });
    const incomes = await Income.sum('money', { where: dateFilter });
    const outgoings = await Outgoing.sum('money', { where: dateFilter });

    return (exists || 0) + (incomes || 0) - (outgoings || 0);
}

async function getLastBackupDate() {
    // Implement your backup system check here
    return null;
}

async function getLastOrderDate(customerId, dateFilter) {
    const lastOrder = await OrderItem.findOne({
        where: {
            customerId,
            ...dateFilter
        },
        order: [['createdAt', 'DESC']],
        attributes: ['createdAt']
    });

    return lastOrder ? lastOrder.createdAt : null;
}

/**
 * Export Report to Excel/PDF
 */
export const exportReport = async (req, res) => {
    try {
        const { format = 'json', reportType = 'all', ...filters } = req.query;

        // Generate report
        const report = await generateCompleteReportData(filters, reportType);

        switch (format.toLowerCase()) {
            case 'excel':
                return res.status(501).json({ message: "Excel export not implemented" });
            case 'pdf':
                return res.status(501).json({ message: "PDF export not implemented" });
            case 'csv':
                return res.status(501).json({ message: "CSV export not implemented" });
            default:
                return res.status(200).json({
                    success: true,
                    message: "Report generated successfully",
                    report
                });
        }
    } catch (error) {
        console.error("Error exporting report:", error);
        res.status(500).json({
            success: false,
            message: "Error exporting report",
            error: error.message
        });
    }
};

/**
 * Get Dashboard Statistics (Quick Overview)
 */
export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        const [
            totalMoney,
            totalExpenses,
            totalReceipts,
            totalOrders,
            newCustomers,
            totalStaff,
            pendingOrders,
            recentTransactions
        ] = await Promise.all([
            // Monthly totals
            Money.sum('amount', { where: { createdAt: { [Op.gte]: startOfMonth } } }),
            Expense.sum('amount', { where: { createdAt: { [Op.gte]: startOfMonth } } }),
            Receipt.sum('amount', { where: { createdAt: { [Op.gte]: startOfMonth } } }),
            OrderItem.sum('money', { where: { createdAt: { [Op.gte]: startOfMonth } } }),
            // Recent activities
            Customer.count({ where: { createdAt: { [Op.gte]: startOfWeek } } }),
            Staff.count(),
            Remain.count(),
            // Recent transactions
            Money.findAll({
                include: [{ model: Owner, as: 'owner' }],
                order: [['createdAt', 'DESC']],
                limit: 5
            })
        ]);

        const stats = {
            overview: {
                totalIncome: (totalMoney || 0) + (totalReceipts || 0),
                totalExpenses: totalExpenses || 0,
                netProfit: (totalMoney || 0) + (totalReceipts || 0) - (totalExpenses || 0),
                totalOrders: totalOrders || 0
            },
            counts: {
                customers: await Customer.count(),
                staff: totalStaff,
                pendingOrders: pendingOrders || 0,
                newCustomersThisWeek: newCustomers
            },
            recentTransactions: recentTransactions.map(t => ({
                id: t.id,
                type: 'money',
                description: `From ${t.owner?.name}`,
                amount: t.amount,
                date: t.createdAt
            }))
        };

        res.status(200).json({
            success: true,
            message: "Dashboard stats retrieved",
            stats
        });

    } catch (error) {
        console.error("Error getting dashboard stats:", error);
        res.status(500).json({
            success: false,
            message: "Error getting dashboard statistics",
            error: error.message
        });
    }
};

// Helper function for complete report data
async function generateCompleteReportData(filters, reportType) {
    // This uses the same logic as generateCompleteReport but returns data
    const dateFilter = {};
    if (filters.startDate && filters.endDate) {
        dateFilter.createdAt = {
            [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)]
        };
    }

    switch (reportType) {
        case 'financial':
            return generateFinancialData(dateFilter, filters.ownerId);
        case 'customers':
            return generateCustomerData(dateFilter, filters.customerId);
        case 'staff':
            return generateStaffData(dateFilter, filters.staffId);
        case 'inventory':
            return generateInventoryData(dateFilter);
        default:
            const [financial, customers, staff, inventory, system, summary] = await Promise.all([
                generateFinancialData(dateFilter, filters.ownerId),
                generateCustomerData(dateFilter, filters.customerId),
                generateStaffData(dateFilter, filters.staffId),
                generateInventoryData(dateFilter),
                generateSystemData(),
                generateSummaryData(dateFilter)
            ]);

            return {
                reportDate: new Date().toISOString(),
                period: filters.startDate && filters.endDate
                    ? `${filters.startDate} to ${filters.endDate}`
                    : 'All Time',
                summary,
                financial,
                customers,
                staff,
                inventory,
                system
            };
    }
}