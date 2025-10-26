const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeCode: {
    type: String,
    required: [true, 'Employee code is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  salary: {
    type: Number,
    required: [true, 'Salary is required'],
    min: [0, 'Salary cannot be negative']
  },
  paidDays: {
    type: Number,
    default: 30,
    min: [0, 'Paid days cannot be negative'],
    max: [31, 'Paid days cannot exceed 31']
  },
  leaves: {
    type: Number,
    default: 0,
    min: [0, 'Leaves cannot be negative']
  },
  // Calculated fields
  basic: {
    type: Number,
    default: 0
  },
  hra: {
    type: Number,
    default: 0
  },
  conveyance: {
    type: Number,
    default: 1600
  },
  otherAllowance: {
    type: Number,
    default: 0
  },
  pf: {
    type: Number,
    default: 0
  },
  esic: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },
  dayWiseDeduction: {
    type: Number,
    default: 0
  },
  // Deduction flags
  deductPF: {
    type: Boolean,
    default: true
  },
  deductESIC: {
    type: Boolean,
    default: true
  },
  // Additional fields
  reimbursement: {
    type: Number,
    default: 0
  },
  note: {
    type: String
  },
  // Additional fields
  department: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for faster queries
employeeSchema.index({ employeeCode: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ isActive: 1 });
employeeSchema.index({ createdAt: -1 });

// Calculate salary components before saving
employeeSchema.pre('save', function(next) {
  this.calculateSalaryComponents();
  this.updatedAt = Date.now();
  next();
});

// Method to calculate salary components based on formulas
employeeSchema.methods.calculateSalaryComponents = function() {
  const salary = this.salary;
  const paidDays = this.paidDays;
  const leaves = this.leaves || 0;
  
  // Basic = Salary * 40% (as per your formula: D2*0.4)
  this.basic = Math.round(salary * 0.4);
  
  // HRA = Basic * 50% (as per your formula: F2*0.5)
  this.hra = Math.round(this.basic * 0.5);
  
  // Conveyance = Fixed 1600 (as per your formula)
  this.conveyance = 1600;
  
  // Other Allowance = Salary - (Basic + HRA + Conveyance)
  this.otherAllowance = Math.round(salary - (this.basic + this.hra + this.conveyance));
  
  // PF = MIN(Basic * 12%, 1800) - only if deductPF is true
  this.pf = this.deductPF ? Math.min(Math.round(this.basic * 0.12), 1800) : 0;
  
  // ESIC = IF(Salary <= 21000, ROUND(Salary * 0.75%, 0), 0) - only if deductESIC is true
  this.esic = (this.deductESIC && salary <= 21000) ? Math.round(salary * 0.0075) : 0;
  
  // Day Wise Deduction = ROUND((Salary / 30) * (30 - Paid Days), 0)
  this.dayWiseDeduction = Math.round((salary / 30) * (30 - paidDays));
  
  // Net Salary = (Basic + HRA + Conveyance + Other Allowance) - PF - ESIC - Day Wise Deduction + Reimbursement
  const reimbursement = this.reimbursement || 0;
  this.netSalary = Math.round((this.basic + this.hra + this.conveyance + this.otherAllowance) - this.pf - this.esic - this.dayWiseDeduction + reimbursement);
};

// Method to get salary breakdown
employeeSchema.methods.getSalaryBreakdown = function() {
  return {
    employeeCode: this.employeeCode,
    name: this.name,
    salary: this.salary,
    paidDays: this.paidDays,
    leaves: this.leaves,
    basic: this.basic,
    hra: this.hra,
    conveyance: this.conveyance,
    otherAllowance: this.otherAllowance,
    pf: this.pf,
    esic: this.esic,
    dayWiseDeduction: this.dayWiseDeduction,
    netSalary: this.netSalary
  };
};

module.exports = mongoose.model('Employee', employeeSchema);
