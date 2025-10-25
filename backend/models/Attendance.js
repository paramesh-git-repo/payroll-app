const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
  // Month/Year tracking
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
  // Attendance details
  totalWorkingDays: {
    type: Number,
    required: true,
    default: 30
  },
  presentDays: {
    type: Number,
    required: true,
    default: 0
  },
  absentDays: {
    type: Number,
    required: true,
    default: 0
  },
  // Leave tracking
  casualLeaves: {
    type: Number,
    default: 0
  },
  sickLeaves: {
    type: Number,
    default: 0
  },
  earnedLeaves: {
    type: Number,
    default: 0
  },
  otherLeaves: {
    type: Number,
    default: 0
  },
  totalLeaves: {
    type: Number,
    default: 0
  },
  // Additional details
  halfDays: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  // Approval workflow
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  submittedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  submittedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  comments: {
    type: String
  },
  // Salary and deduction fields
  deductPF: {
    type: Boolean,
    default: true
  },
  deductESIC: {
    type: Boolean,
    default: true
  },
  reimbursement: {
    type: Number,
    default: 0
  },
  note: {
    type: String
  },
  // Daily attendance details (optional detailed tracking)
  dailyAttendance: [{
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'leave'],
      required: true
    },
    leaveType: {
      type: String,
      enum: ['casual', 'sick', 'earned', 'other', 'none']
    },
    checkIn: {
      type: String // Time format HH:MM
    },
    checkOut: {
      type: String // Time format HH:MM
    },
    remarks: {
      type: String
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to calculate totals
attendanceSchema.pre('save', function(next) {
  this.totalLeaves = this.casualLeaves + this.sickLeaves + this.earnedLeaves + this.otherLeaves;
  this.absentDays = this.totalLeaves + (this.totalWorkingDays - this.presentDays - this.totalLeaves);
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
attendanceSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
attendanceSchema.index({ employeeCode: 1, month: 1, year: 1 });
attendanceSchema.index({ month: 1, year: 1, status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
