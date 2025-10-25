const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema({
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
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030
  },
  // Salary components
  salary: {
    type: Number,
    required: true
  },
  paidDays: {
    type: Number,
    required: true
  },
  leaves: {
    type: Number,
    default: 0
  },
  basic: {
    type: Number,
    required: true
  },
  hra: {
    type: Number,
    required: true
  },
  conveyance: {
    type: Number,
    required: true
  },
  otherAllowance: {
    type: Number,
    required: true
  },
  pf: {
    type: Number,
    required: true
  },
  esic: {
    type: Number,
    required: true
  },
  dayWiseDeduction: {
    type: Number,
    required: true
  },
  netSalary: {
    type: Number,
    required: true
  },
  // Additional information
  department: {
    type: String
  },
  designation: {
    type: String
  },
  generatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  },
  // Email tracking
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  emailStatus: {
    type: String,
    enum: ['not_sent', 'sent', 'delivered', 'failed'],
    default: 'not_sent'
  },
  emailMessageId: {
    type: String
  },
  emailError: {
    type: String
  }
});

// Index for efficient queries
payslipSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
payslipSchema.index({ employeeCode: 1, month: 1, year: 1 });

module.exports = mongoose.model('Payslip', payslipSchema);
