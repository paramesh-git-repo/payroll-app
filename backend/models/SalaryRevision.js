const mongoose = require('mongoose');

const salaryRevisionSchema = new mongoose.Schema({
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
  // Salary details
  currentSalary: {
    type: Number,
    required: true
  },
  newSalary: {
    type: Number,
    required: true
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['increment', 'promotion', 'adjustment', 'bonus', 'other']
  },
  description: {
    type: String,
    required: true
  },
  // Approval workflow
  status: {
    type: String,
    enum: ['pending', 'hr_approved', 'finance_approved', 'md_approved', 'rejected'],
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
  hrApprovedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  hrApprovedAt: {
    type: Date
  },
  hrComments: {
    type: String
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
  rejectedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  // Implementation
  implementedAt: {
    type: Date
  },
  implementedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
});

// Index for efficient queries
salaryRevisionSchema.index({ employee: 1, status: 1 });
salaryRevisionSchema.index({ employeeCode: 1, status: 1 });
salaryRevisionSchema.index({ status: 1, requestedAt: -1 });

module.exports = mongoose.model('SalaryRevision', salaryRevisionSchema);
