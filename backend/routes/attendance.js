const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Payslip = require('../models/Payslip');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

// @desc    Create or update attendance record
// @route   POST /api/attendance
// @access  Private/Admin
router.post('/', protect, authorize('admin'), [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030'),
  body('salary').isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('paidDays').isInt({ min: 0, max: 31 }).withMessage('Paid days must be between 0 and 31'),
  body('netSalary').isFloat().withMessage('Net salary must be a valid number'),
  body('dayWiseDeduction').isFloat({ min: 0 }).withMessage('Day wise deduction must be a positive number')
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

    const {
      employeeId,
      month,
      year,
      salary,
      paidDays,
      netSalary,
      dayWiseDeduction,
      deductPF,
      deductESIC,
      reimbursement,
      note,
      comments
    } = req.body;

    console.log('=== BACKEND ATTENDANCE SAVE DEBUG ===');
    console.log('Received data:', {
      employeeId,
      month,
      year,
      salary,
      paidDays,
      netSalary,
      dayWiseDeduction,
      deductPF,
      deductESIC,
      reimbursement,
      note
    });
    console.log('=====================================');

    // Validate paid days
    if (paidDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Paid days must be greater than 0'
      });
    }

    // Get employee details
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if attendance record already exists
    let attendance = await Attendance.findOne({
      employee: employeeId,
      month,
      year
    });

    // Calculate attendance data based on paid days
    const totalWorkingDays = 30;
    const absentDays = totalWorkingDays - paidDays;
    
    // Update employee salary and attendance data
    employee.salary = salary;
    employee.paidDays = paidDays;
    employee.netSalary = netSalary;
    employee.dayWiseDeduction = dayWiseDeduction;
    employee.leaves = absentDays;
    employee.deductPF = deductPF !== undefined ? deductPF : true;
    employee.deductESIC = deductESIC !== undefined ? deductESIC : true;
    employee.reimbursement = reimbursement || 0;
    employee.note = note || '';
    
    // Recalculate salary components
    employee.calculateSalaryComponents();
    await employee.save();

    if (attendance) {
      // Update existing record
      attendance.presentDays = paidDays;
      attendance.totalWorkingDays = totalWorkingDays;
      attendance.absentDays = absentDays;
      attendance.totalLeaves = absentDays;
      attendance.casualLeaves = Math.floor(absentDays * 0.4);
      attendance.sickLeaves = Math.floor(absentDays * 0.3);
      attendance.earnedLeaves = Math.floor(absentDays * 0.2);
      attendance.otherLeaves = Math.floor(absentDays * 0.1);
      attendance.deductPF = deductPF !== undefined ? deductPF : true;
      attendance.deductESIC = deductESIC !== undefined ? deductESIC : true;
      attendance.reimbursement = reimbursement || 0;
      attendance.note = note || '';
      attendance.comments = comments;
      attendance.status = 'draft';
    } else {
      // Create new record
      attendance = await Attendance.create({
        employee: employeeId,
        employeeCode: employee.employeeCode,
        employeeName: employee.name,
        month,
        year,
        totalWorkingDays,
        presentDays: paidDays,
        absentDays,
        totalLeaves: absentDays,
        casualLeaves: Math.floor(absentDays * 0.4),
        sickLeaves: Math.floor(absentDays * 0.3),
        earnedLeaves: Math.floor(absentDays * 0.2),
        otherLeaves: Math.floor(absentDays * 0.1),
        halfDays: 0,
        overtimeHours: 0,
        deductPF: deductPF !== undefined ? deductPF : true,
        deductESIC: deductESIC !== undefined ? deductESIC : true,
        reimbursement: reimbursement || 0,
        note: note || '',
        comments,
        status: 'draft'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Attendance record saved successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Save attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    let filter = {};
    
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ employeeCode: req.user.employeeCode });
      if (employee) {
        filter.employee = employee._id;
      }
    }

    if (req.query.month) {
      filter.month = parseInt(req.query.month);
    }

    if (req.query.year) {
      filter.year = parseInt(req.query.year);
    }


    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.employeeId) {
      filter.employee = req.query.employeeId;
    }

    const attendanceRecords = await Attendance.find(filter)
      .populate('employee', 'name employeeCode department designation salary netSalary dayWiseDeduction paidDays leaves deductPF deductESIC reimbursement note')
      .populate('submittedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limit);


    const total = await Attendance.countDocuments(filter);

    res.json({
      success: true,
      count: attendanceRecords.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: attendanceRecords
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Submit attendance for approval
// @route   PUT /api/attendance/:id/submit
// @access  Private/Admin
router.put('/:id/submit', protect, authorize('admin'), async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    if (attendance.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Attendance record is not in draft status'
      });
    }

    attendance.status = 'submitted';
    attendance.submittedBy = req.user.id;
    attendance.submittedAt = new Date();

    await attendance.save();

    res.json({
      success: true,
      message: 'Attendance record submitted for approval',
      data: attendance
    });
  } catch (error) {
    console.error('Submit attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Approve attendance record
// @route   PUT /api/attendance/:id/approve
// @access  Private/Admin
router.put('/:id/approve', protect, authorize('admin'), [
  body('comments').optional().isString()
], async (req, res) => {
  try {
    const { comments } = req.body;
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    if (attendance.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Attendance record must be submitted first'
      });
    }

    attendance.status = 'approved';
    attendance.approvedBy = req.user.id;
    attendance.approvedAt = new Date();
    attendance.comments = comments;

    await attendance.save();

    // Update employee record with final attendance data
    const employee = await Employee.findById(attendance.employee);
    if (employee) {
      employee.paidDays = attendance.presentDays;
      employee.leaves = attendance.totalLeaves;
      await employee.save();
    }

    res.json({
      success: true,
      message: 'Attendance record approved',
      data: attendance
    });
  } catch (error) {
    console.error('Approve attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Reject attendance record
// @route   PUT /api/attendance/:id/reject
// @access  Private/Admin
router.put('/:id/reject', protect, authorize('admin'), [
  body('comments').notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
  try {
    const { comments } = req.body;
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    if (attendance.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Attendance record is already rejected'
      });
    }

    attendance.status = 'rejected';
    attendance.approvedBy = req.user.id;
    attendance.approvedAt = new Date();
    attendance.comments = comments;

    await attendance.save();

    res.json({
      success: true,
      message: 'Attendance record rejected',
      data: attendance
    });
  } catch (error) {
    console.error('Reject attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let filter = {};
    if (month && year) {
      filter.month = parseInt(month);
      filter.year = parseInt(year);
    }

    const stats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          totalPresentDays: { $sum: '$presentDays' },
          totalAbsentDays: { $sum: '$absentDays' },
          totalLeaves: { $sum: '$totalLeaves' },
          avgAttendance: { $avg: { $divide: ['$presentDays', '$totalWorkingDays'] } }
        }
      }
    ]);

    const statusBreakdown = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalEmployees: 0,
          totalPresentDays: 0,
          totalAbsentDays: 0,
          totalLeaves: 0,
          avgAttendance: 0
        },
        statusBreakdown
      }
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Bulk create attendance for all employees
// @route   POST /api/attendance/bulk
// @access  Private/Admin
router.post('/bulk', protect, authorize('admin'), [
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030'),
  body('totalWorkingDays').isInt({ min: 1, max: 31 }).withMessage('Total working days must be between 1 and 31')
], async (req, res) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: validationErrors.array()
      });
    }

    const { month, year, totalWorkingDays, defaultPresentDays = 30 } = req.body;

    // Get all active employees
    const employees = await Employee.find({ isActive: true });
    
    if (employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active employees found'
      });
    }

    const createdRecords = [];
    const errorMessages = [];

    for (const employee of employees) {
      try {
        // Check if attendance record already exists
        const existingRecord = await Attendance.findOne({
          employee: employee._id,
          month,
          year
        });

        if (existingRecord) {
          errorMessages.push(`Attendance record already exists for ${employee.employeeCode} - ${employee.name}`);
          continue;
        }

        // Create attendance record
        const attendance = await Attendance.create({
          employee: employee._id,
          employeeCode: employee.employeeCode,
          employeeName: employee.name,
          month,
          year,
          totalWorkingDays,
          presentDays: defaultPresentDays,
          casualLeaves: 0,
          sickLeaves: 0,
          earnedLeaves: 0,
          otherLeaves: 0,
          halfDays: 0,
          overtimeHours: 0
        });

        createdRecords.push(attendance);
      } catch (error) {
        errorMessages.push(`Failed to create attendance for ${employee.employeeCode}: ${error.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdRecords.length} attendance records`,
      data: {
        created: createdRecords.length,
        total: employees.length,
        errors: errorMessages.length > 0 ? errorMessages : undefined
      }
    });
  } catch (error) {
    console.error('Bulk create attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Upload CSV file for bulk attendance creation
// @route   POST /api/attendance/upload-csv
// @access  Private/Admin
router.post('/upload-csv', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const results = [];
    const errors = [];

    // Parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        try {
          const processedRecords = [];
          
          for (const row of results) {
            try {
              // Extract data from CSV row
              const employeeCode = row['Emp Code'] || row['empCode'] || row['Employee Code'] || row['employeeCode'] || row['EmployeeCode'];
              const name = row['Name'] || row['name'] || row['Employee Name'];
              const salary = parseFloat(row['Salary'] || row['salary'] || '0');
              const paidDays = parseInt(row['Paid Days'] || row['paidDays'] || row['Present Days'] || row['presentDays'] || '30');
              const netSalary = parseFloat(row['Net Salary'] || row['netSalary'] || row['NetSalary'] || '0');
              const dayWiseDeduction = parseFloat(row['Day Wise Deduction'] || row['dayWiseDeduction'] || row['DayWiseDeduction'] || '0');

              if (!employeeCode) {
                errors.push(`Missing employee code for row: ${JSON.stringify(row)}`);
                continue;
              }

              // Find employee by code
              const employee = await Employee.findOne({ employeeCode });
              if (!employee) {
                errors.push(`Employee not found with code: ${employeeCode}`);
                continue;
              }

              // Check if attendance record already exists
              const existingRecord = await Attendance.findOne({
                employee: employee._id,
                month: parseInt(month),
                year: parseInt(year)
              });

              // Calculate leaves based on paid days (assuming 30 working days per month)
              const totalWorkingDays = 30;
              const absentDays = totalWorkingDays - paidDays;
              
              // Update employee salary and attendance data
              employee.salary = salary;
              employee.paidDays = paidDays;
              employee.netSalary = netSalary;
              employee.dayWiseDeduction = dayWiseDeduction;
              employee.leaves = absentDays; // Total leaves = absent days
              
              // Recalculate salary components
              employee.calculateSalaryComponents();
              await employee.save();

              if (existingRecord) {
                // Update existing attendance record
                existingRecord.presentDays = paidDays;
                existingRecord.totalWorkingDays = totalWorkingDays;
                existingRecord.absentDays = absentDays;
                existingRecord.totalLeaves = absentDays;
                existingRecord.casualLeaves = Math.floor(absentDays * 0.4); // Estimate leave distribution
                existingRecord.sickLeaves = Math.floor(absentDays * 0.3);
                existingRecord.earnedLeaves = Math.floor(absentDays * 0.2);
                existingRecord.otherLeaves = Math.floor(absentDays * 0.1);
                await existingRecord.save();
                processedRecords.push({ employeeCode, action: 'updated' });
              } else {
                // Create new attendance record
                const attendance = await Attendance.create({
                  employee: employee._id,
                  employeeCode: employee.employeeCode,
                  employeeName: employee.name,
                  month: parseInt(month),
                  year: parseInt(year),
                  totalWorkingDays,
                  presentDays: paidDays,
                  absentDays,
                  totalLeaves: absentDays,
                  casualLeaves: Math.floor(absentDays * 0.4),
                  sickLeaves: Math.floor(absentDays * 0.3),
                  earnedLeaves: Math.floor(absentDays * 0.2),
                  otherLeaves: Math.floor(absentDays * 0.1),
                  halfDays: 0,
                  overtimeHours: 0,
                  status: 'draft'
                });
                processedRecords.push({ employeeCode, action: 'created' });
              }

            } catch (error) {
              errors.push(`Error processing row for ${row['Employee Code'] || 'unknown'}: ${error.message}`);
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.status(201).json({
            success: true,
            message: `Successfully processed ${processedRecords.length} records`,
            data: {
              processed: processedRecords.length,
              total: results.length,
              errors: errors.length > 0 ? errors : undefined,
              records: processedRecords
            }
          });

        } catch (error) {
          // Clean up uploaded file
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          
          console.error('CSV processing error:', error);
          res.status(500).json({
            success: false,
            message: 'Error processing CSV file'
          });
        }
      })
      .on('error', (error) => {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        console.error('CSV parsing error:', error);
        res.status(400).json({
          success: false,
          message: 'Error parsing CSV file'
        });
      });

  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Move attendance record to payroll (HR verification)
// @route   POST /api/attendance/move-to-payroll
// @access  Private/Admin
router.post('/move-to-payroll', protect, authorize('admin'), [
  body('employeeCode').notEmpty().withMessage('Employee code is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030')
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

    const { employeeCode, month, year } = req.body;

    console.log('=== MOVE TO PAYROLL DEBUG ===');
    console.log('Moving employee:', employeeCode, 'for', month, year);
    console.log('=============================');

    // Find the attendance record
    const attendance = await Attendance.findOne({
      employeeCode,
      month,
      year
    }).populate('employee');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Update the status to indicate it's moved to payroll
    attendance.status = 'submitted'; // Changed from 'draft' to 'submitted'
    attendance.submittedBy = req.user._id;
    attendance.submittedAt = new Date();
    
    await attendance.save();

    console.log('Successfully moved to payroll:', attendance.employeeCode);

    res.json({
      success: true,
      message: 'Employee moved to payroll successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Move to payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Revert attendance record back to draft (from payroll)
// @route   POST /api/attendance/revert-from-payroll
// @access  Private/Admin
router.post('/revert-from-payroll', protect, authorize('admin'), [
  body('employeeCode').notEmpty().withMessage('Employee code is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030')
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

    const { employeeCode, month, year } = req.body;

    console.log('=== REVERT FROM PAYROLL DEBUG ===');
    console.log('Reverting employee:', employeeCode, 'for', month, year);
    console.log('=================================');

    // Find the attendance record
    const attendance = await Attendance.findOne({
      employeeCode,
      month,
      year,
      status: 'submitted' // Only revert submitted records
    }).populate('employee');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Submitted attendance record not found'
      });
    }

    // Update the status back to draft
    attendance.status = 'draft';
    attendance.submittedBy = undefined;
    attendance.submittedAt = undefined;
    
    await attendance.save();

    console.log('Successfully reverted from payroll:', attendance.employeeCode);

    res.json({
      success: true,
      message: 'Record reverted from payroll successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Revert from payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
