const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Payslip = require('../models/Payslip');
const Employee = require('../models/Employee');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Request payment for payslip
// @route   POST /api/payments/request
// @access  Private/Admin
router.post('/request', protect, authorize('admin'), [
  body('payslipId').isMongoId().withMessage('Valid payslip ID is required'),
  body('paymentDate').isISO8601().withMessage('Valid payment date is required'),
  body('paymentMethod').isIn(['bank_transfer', 'cheque', 'cash', 'upi', 'other']).withMessage('Valid payment method is required'),
  body('paymentReference').notEmpty().withMessage('Payment reference is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { payslipId, paymentDate, paymentMethod, paymentReference, bankDetails, remarks } = req.body;

    // Get payslip details
    const payslip = await Payslip.findById(payslipId).populate('employee');
    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ payslip: payslipId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment request already exists for this payslip'
      });
    }

    // Create payment request
    const payment = await Payment.create({
      payslip: payslipId,
      employee: payslip.employee._id,
      employeeCode: payslip.employeeCode,
      employeeName: payslip.employeeName,
      amount: payslip.netSalary,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      paymentReference,
      bankDetails,
      remarks,
      month: payslip.month,
      year: payslip.year,
      requestedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Payment request submitted successfully',
      data: payment
    });
  } catch (error) {
    console.error('Payment request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get payment requests
// @route   GET /api/payments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter based on user role
    let filter = {};
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ employeeCode: req.user.employeeCode });
      if (employee) {
        filter.employee = employee._id;
      }
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.month) {
      filter.month = parseInt(req.query.month);
    }

    if (req.query.year) {
      filter.year = parseInt(req.query.year);
    }

    const payments = await Payment.find(filter)
      .populate('payslip', 'month year netSalary')
      .populate('employee', 'name employeeCode department')
      .populate('requestedBy', 'name email')
      .populate('financeApprovedBy', 'name email')
      .populate('mdApprovedBy', 'name email')
      .populate('processedBy', 'name email')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      count: payments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Approve payment (Finance)
// @route   PUT /api/payments/:id/finance-approve
// @access  Private/Admin
router.put('/:id/finance-approve', protect, authorize('admin'), [
  body('comments').optional().isString()
], async (req, res) => {
  try {
    const { comments } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment request is not in pending status'
      });
    }

    payment.status = 'finance_approved';
    payment.financeApprovedBy = req.user.id;
    payment.financeApprovedAt = new Date();
    payment.financeComments = comments;

    await payment.save();

    res.json({
      success: true,
      message: 'Payment request approved by Finance',
      data: payment
    });
  } catch (error) {
    console.error('Finance approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Approve payment (MD)
// @route   PUT /api/payments/:id/md-approve
// @access  Private/Admin
router.put('/:id/md-approve', protect, authorize('admin'), [
  body('comments').optional().isString()
], async (req, res) => {
  try {
    const { comments } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    if (payment.status !== 'finance_approved') {
      return res.status(400).json({
        success: false,
        message: 'Payment request must be Finance approved first'
      });
    }

    payment.status = 'md_approved';
    payment.mdApprovedBy = req.user.id;
    payment.mdApprovedAt = new Date();
    payment.mdComments = comments;

    await payment.save();

    res.json({
      success: true,
      message: 'Payment request approved by MD',
      data: payment
    });
  } catch (error) {
    console.error('MD approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Mark payment as processed/paid
// @route   PUT /api/payments/:id/process
// @access  Private/Admin
router.put('/:id/process', protect, authorize('admin'), [
  body('remarks').optional().isString()
], async (req, res) => {
  try {
    const { remarks } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    if (payment.status !== 'md_approved') {
      return res.status(400).json({
        success: false,
        message: 'Payment request must be MD approved first'
      });
    }

    payment.status = 'paid';
    payment.processedBy = req.user.id;
    payment.processedAt = new Date();
    payment.remarks = remarks;

    await payment.save();

    // Update payslip status
    const payslip = await Payslip.findById(payment.payslip);
    if (payslip) {
      payslip.isPaid = true;
      payslip.paidAt = new Date();
      await payslip.save();
    }

    res.json({
      success: true,
      message: 'Payment marked as processed',
      data: payment
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Reject payment request
// @route   PUT /api/payments/:id/reject
// @access  Private/Admin
router.put('/:id/reject', protect, authorize('admin'), [
  body('reason').notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    if (payment.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Payment request is already rejected'
      });
    }

    payment.status = 'rejected';
    payment.rejectedBy = req.user.id;
    payment.rejectedAt = new Date();
    payment.rejectionReason = reason;

    await payment.save();

    res.json({
      success: true,
      message: 'Payment request rejected',
      data: payment
    });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let filter = {};
    if (month && year) {
      filter.month = parseInt(month);
      filter.year = parseInt(year);
    }

    const stats = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const totalPayments = await Payment.countDocuments(filter);
    const totalAmount = await Payment.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalPayments,
        totalAmount: totalAmount[0]?.total || 0,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
