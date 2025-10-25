const express = require('express');
const { body, validationResult } = require('express-validator');
const SalaryRevision = require('../models/SalaryRevision');
const Employee = require('../models/Employee');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Request salary revision
// @route   POST /api/salary/revision
// @access  Private/Admin
router.post('/revision', protect, authorize('admin'), [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
  body('newSalary').isNumeric().withMessage('New salary must be a number'),
  body('effectiveDate').isISO8601().withMessage('Valid effective date is required'),
  body('reason').isIn(['increment', 'promotion', 'adjustment', 'bonus', 'other']).withMessage('Valid reason is required'),
  body('description').notEmpty().withMessage('Description is required')
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

    const { employeeId, newSalary, effectiveDate, reason, description } = req.body;

    // Get employee details
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Create salary revision request
    const salaryRevision = await SalaryRevision.create({
      employee: employeeId,
      employeeCode: employee.employeeCode,
      employeeName: employee.name,
      currentSalary: employee.salary,
      newSalary,
      effectiveDate: new Date(effectiveDate),
      reason,
      description,
      requestedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Salary revision request submitted successfully',
      data: salaryRevision
    });
  } catch (error) {
    console.error('Salary revision request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get salary revision requests
// @route   GET /api/salary/revisions
// @access  Private
router.get('/revisions', protect, async (req, res) => {
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

    const revisions = await SalaryRevision.find(filter)
      .populate('employee', 'name employeeCode department')
      .populate('requestedBy', 'name email')
      .populate('hrApprovedBy', 'name email')
      .populate('financeApprovedBy', 'name email')
      .populate('mdApprovedBy', 'name email')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SalaryRevision.countDocuments(filter);

    res.json({
      success: true,
      count: revisions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: revisions
    });
  } catch (error) {
    console.error('Get salary revisions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Approve salary revision (HR)
// @route   PUT /api/salary/revision/:id/hr-approve
// @access  Private/Admin
router.put('/revision/:id/hr-approve', protect, authorize('admin'), [
  body('comments').optional().isString()
], async (req, res) => {
  try {
    const { comments } = req.body;
    const revision = await SalaryRevision.findById(req.params.id);

    if (!revision) {
      return res.status(404).json({
        success: false,
        message: 'Salary revision not found'
      });
    }

    if (revision.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Salary revision is not in pending status'
      });
    }

    revision.status = 'hr_approved';
    revision.hrApprovedBy = req.user.id;
    revision.hrApprovedAt = new Date();
    revision.hrComments = comments;

    await revision.save();

    res.json({
      success: true,
      message: 'Salary revision approved by HR',
      data: revision
    });
  } catch (error) {
    console.error('HR approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Approve salary revision (Finance)
// @route   PUT /api/salary/revision/:id/finance-approve
// @access  Private/Admin
router.put('/revision/:id/finance-approve', protect, authorize('admin'), [
  body('comments').optional().isString()
], async (req, res) => {
  try {
    const { comments } = req.body;
    const revision = await SalaryRevision.findById(req.params.id);

    if (!revision) {
      return res.status(404).json({
        success: false,
        message: 'Salary revision not found'
      });
    }

    if (revision.status !== 'hr_approved') {
      return res.status(400).json({
        success: false,
        message: 'Salary revision must be HR approved first'
      });
    }

    revision.status = 'finance_approved';
    revision.financeApprovedBy = req.user.id;
    revision.financeApprovedAt = new Date();
    revision.financeComments = comments;

    await revision.save();

    res.json({
      success: true,
      message: 'Salary revision approved by Finance',
      data: revision
    });
  } catch (error) {
    console.error('Finance approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Approve salary revision (MD)
// @route   PUT /api/salary/revision/:id/md-approve
// @access  Private/Admin
router.put('/revision/:id/md-approve', protect, authorize('admin'), [
  body('comments').optional().isString()
], async (req, res) => {
  try {
    const { comments } = req.body;
    const revision = await SalaryRevision.findById(req.params.id);

    if (!revision) {
      return res.status(404).json({
        success: false,
        message: 'Salary revision not found'
      });
    }

    if (revision.status !== 'finance_approved') {
      return res.status(400).json({
        success: false,
        message: 'Salary revision must be Finance approved first'
      });
    }

    revision.status = 'md_approved';
    revision.mdApprovedBy = req.user.id;
    revision.mdApprovedAt = new Date();
    revision.mdComments = comments;

    await revision.save();

    // Implement the salary change
    const employee = await Employee.findById(revision.employee);
    if (employee) {
      employee.salary = revision.newSalary;
      await employee.save();

      revision.implementedAt = new Date();
      revision.implementedBy = req.user.id;
      await revision.save();
    }

    res.json({
      success: true,
      message: 'Salary revision approved by MD and implemented',
      data: revision
    });
  } catch (error) {
    console.error('MD approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Reject salary revision
// @route   PUT /api/salary/revision/:id/reject
// @access  Private/Admin
router.put('/revision/:id/reject', protect, authorize('admin'), [
  body('reason').notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
  try {
    const { reason } = req.body;
    const revision = await SalaryRevision.findById(req.params.id);

    if (!revision) {
      return res.status(404).json({
        success: false,
        message: 'Salary revision not found'
      });
    }

    if (revision.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Salary revision is already rejected'
      });
    }

    revision.status = 'rejected';
    revision.rejectedBy = req.user.id;
    revision.rejectedAt = new Date();
    revision.rejectionReason = reason;

    await revision.save();

    res.json({
      success: true,
      message: 'Salary revision rejected',
      data: revision
    });
  } catch (error) {
    console.error('Reject salary revision error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
