const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payslip: {
    type: mongoose.Schema.ObjectId,
    ref: 'Payslip',
    required: true
  },
  employee: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeCode: {
    type: String,
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  // Payment details
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['bank_transfer', 'cheque', 'cash', 'upi', 'other']
  },
  paymentReference: {
    type: String,
    required: true // Transaction ID, Cheque Number, etc.
  },
  // Approval workflow
  status: {
    type: String,
    enum: ['pending', 'finance_approved', 'md_approved', 'paid', 'rejected'],
    default: 'pending'
  },
  // Approval tracking
  requestedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  financeApprovedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  financeApprovedAt: {
    type: Date
  },
  financeComments: {
    type: String
  },
  mdApprovedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  mdApprovedAt: {
    type: Date
  },
  mdComments: {
    type: String
  },
  processedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  // Additional information
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  remarks: {
    type: String
  },
  // Month/Year for reference
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  }
});

// Index for efficient queries
paymentSchema.index({ payslip: 1 });
paymentSchema.index({ employee: 1, month: 1, year: 1 });
paymentSchema.index({ status: 1, requestedAt: -1 });
paymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
