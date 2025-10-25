const express = require('express');
const { body, validationResult } = require('express-validator');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get current employee data (for employees) or all employees (for admins)
// @route   GET /api/employees
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // If user is employee, return only their data
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ employeeCode: req.user.employeeCode })
        .populate('user', 'name email role');
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee data not found'
        });
      }

      return res.json({
        success: true,
        count: 1,
        total: 1,
        data: [employee]
      });
    }

    // If user is admin, return all employees (original logic)
    
    // Check if requesting all employees (for attendance management)
    console.log('=== EMPLOYEES ENDPOINT DEBUG ===');
    console.log('Query params:', req.query);
    console.log('all parameter:', req.query.all);
    console.log('===============================');
    
    if (req.query.all === 'true') {
      console.log('=== ALL EMPLOYEES REQUEST DETECTED ===');
      const allEmployees = await Employee.find()
        .populate('user', 'name email role')
        .select('name employeeCode email department designation isActive')
        .sort({ name: 1 });
      
      console.log('=== ALL EMPLOYEES REQUEST ===');
      console.log('Total employees found:', allEmployees.length);
      console.log('====================');
      
      return res.json({
        success: true,
        count: allEmployees.length,
        data: allEmployees
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.department) {
      filter.department = new RegExp(req.query.department, 'i');
    }
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { employeeCode: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') }
      ];
    }

    const employees = await Employee.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Employee.countDocuments(filter);
    
    console.log('=== EMPLOYEE LIST API DEBUG ===');
    console.log('Filter:', filter);
    console.log('Found employees:', employees.length);
    console.log('Total count:', total);
    console.log('Sample employee:', employees[0] ? `${employees[0].name} (${employees[0].employeeCode})` : 'none');
    console.log('================================');

    res.json({
      success: true,
      count: employees.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: employees
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get all employees (Admin only) - Legacy endpoint
// @route   GET /api/employees/all
// @access  Private/Admin
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.department) {
      filter.department = new RegExp(req.query.department, 'i');
    }
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { employeeCode: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') }
      ];
    }

    const employees = await Employee.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Employee.countDocuments(filter);
    
    console.log('=== EMPLOYEE LIST API DEBUG ===');
    console.log('Filter:', filter);
    console.log('Found employees:', employees.length);
    console.log('Total count:', total);
    console.log('Sample employee:', employees[0] ? `${employees[0].name} (${employees[0].employeeCode})` : 'none');
    console.log('================================');

    res.json({
      success: true,
      count: employees.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: employees
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('user', 'name email role');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if user can access this employee
    if (req.user.role === 'employee' && req.user.employeeCode !== employee.employeeCode) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new employee (Admin only)
// @route   POST /api/employees
// @access  Private/Admin
router.post('/', protect, authorize('admin'), [
  body('employeeCode').trim().notEmpty().withMessage('Employee code is required'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('salary').isNumeric().isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('paidDays').optional().isInt({ min: 0, max: 31 }).withMessage('Paid days must be between 0 and 31'),
  body('leaves').optional().isInt({ min: 0 }).withMessage('Leaves cannot be negative'),
  body('department').optional().trim(),
  body('designation').optional().trim()
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
      employeeCode,
      name,
      email,
      salary,
      paidDays = 30,
      leaves = 0,
      department,
      designation
    } = req.body;

    // Check if employee code already exists
    const existingEmployee = await Employee.findOne({ employeeCode });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee code already exists'
      });
    }

    // Check if email already exists
    const existingEmail = await Employee.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create employee
    const employee = await Employee.create({
      employeeCode,
      name,
      email,
      salary,
      paidDays,
      leaves,
      department,
      designation
    });

    // Calculate salary components
    employee.calculateSalaryComponents();
    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
router.put('/:id', protect, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('salary').optional().isNumeric().isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('paidDays').optional().isInt({ min: 0, max: 31 }).withMessage('Paid days must be between 0 and 31'),
  body('leaves').optional().isInt({ min: 0 }).withMessage('Leaves cannot be negative'),
  body('department').optional().trim(),
  body('designation').optional().trim()
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

    let employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if user can update this employee
    if (req.user.role === 'employee' && req.user.employeeCode !== employee.employeeCode) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if email is being changed and already exists
    if (req.body.email && req.body.email !== employee.email) {
      const existingEmail = await Employee.findOne({ 
        email: req.body.email, 
        _id: { $ne: req.params.id } 
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update employee
    employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Recalculate salary components
    employee.calculateSalaryComponents();
    await employee.save();

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete employee (Admin only)
// @route   DELETE /api/employees/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Permanently delete the employee and associated user
    await Employee.findByIdAndDelete(req.params.id);
    
    // Also delete the associated user account
    await User.findOneAndDelete({ employeeCode: employee.employeeCode });

    res.json({
      success: true,
      message: 'Employee permanently deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get employee salary breakdown
// @route   GET /api/employees/:id/salary-breakdown
// @access  Private
router.get('/:id/salary-breakdown', protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if user can access this employee
    if (req.user.role === 'employee' && req.user.employeeCode !== employee.employeeCode) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const salaryBreakdown = employee.getSalaryBreakdown();

    res.json({
      success: true,
      data: salaryBreakdown
    });
  } catch (error) {
    console.error('Get salary breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Calculate salary for specific values
// @route   POST /api/employees/calculate-salary
// @access  Private
router.post('/calculate-salary', protect, [
  body('salary').isNumeric().isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('paidDays').optional().isInt({ min: 0, max: 31 }).withMessage('Paid days must be between 0 and 31')
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

    const { salary, paidDays = 30 } = req.body;

    // Create temporary employee object for calculation
    const tempEmployee = new Employee({
      salary,
      paidDays
    });

    // Calculate salary components
    tempEmployee.calculateSalaryComponents();

    const salaryBreakdown = tempEmployee.getSalaryBreakdown();

    res.json({
      success: true,
      data: salaryBreakdown
    });
  } catch (error) {
    console.error('Calculate salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Bulk upload employees from CSV file
// @route   POST /api/employees/bulk-upload
// @access  Private/Admin
router.post('/bulk-upload', protect, authorize('admin'), async (req, res) => {
  try {
    const { employees } = req.body; // Array of employee objects from CSV

    console.log('Received employees data:', employees);

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No employee data provided'
      });
    }

    const createdEmployees = [];
    const errorMessages = [];
    const duplicateEmployees = [];

    for (let i = 0; i < employees.length; i++) {
      const employeeData = employees[i];
      const rowNumber = i + 1;

      try {
        console.log(`Processing row ${rowNumber}:`, employeeData);
        
        // Validate required fields
        const requiredFields = ['name', 'email', 'employeeCode', 'department', 'designation', 'salary'];
        const missingFields = requiredFields.filter(field => !employeeData[field]);
        
        if (missingFields.length > 0) {
          console.log(`Row ${rowNumber} missing fields:`, missingFields);
          errorMessages.push(`Row ${rowNumber}: Missing required fields: ${missingFields.join(', ')}`);
          continue;
        }

        // Check if employee code already exists
        const existingEmployee = await Employee.findOne({ employeeCode: employeeData.employeeCode });
        if (existingEmployee) {
          duplicateEmployees.push(`Row ${rowNumber}: Employee code ${employeeData.employeeCode} already exists`);
          continue;
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: employeeData.email });
        if (existingUser) {
          duplicateEmployees.push(`Row ${rowNumber}: Email ${employeeData.email} already exists`);
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(employeeData.email)) {
          console.log(`Row ${rowNumber} email validation failed:`, employeeData.email);
          errorMessages.push(`Row ${rowNumber}: Invalid email format: ${employeeData.email}`);
          continue;
        }

        // Validate employee code format (XX1234) - more flexible
        const employeeCodeRegex = /^[A-Z]{2}\d{4}$/;
        if (!employeeCodeRegex.test(employeeData.employeeCode)) {
          console.log(`Row ${rowNumber} employee code validation failed:`, employeeData.employeeCode);
          errorMessages.push(`Row ${rowNumber}: Invalid employee code format: ${employeeData.employeeCode} (should be XX1234)`);
          continue;
        }
        
        console.log(`Row ${rowNumber} validation passed, proceeding with creation...`);

        // Validate and convert salary
        const salary = parseFloat(employeeData.salary);
        if (isNaN(salary) || salary < 0) {
          errorMessages.push(`Row ${rowNumber}: Invalid salary: ${employeeData.salary}`);
          continue;
        }

        // Convert boolean values
        let isActive = true;
        if (employeeData.isActive !== undefined) {
          isActive = employeeData.isActive === 'true' || employeeData.isActive === 'TRUE' || employeeData.isActive === true;
        }

        // Convert date format
        let joiningDate = new Date();
        if (employeeData.joiningDate) {
          // Handle DD/MM/YY format
          if (employeeData.joiningDate.includes('/')) {
            const [day, month, year] = employeeData.joiningDate.split('/');
            const fullYear = year.length === 2 ? `20${year}` : year;
            joiningDate = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
          } else {
            joiningDate = new Date(employeeData.joiningDate);
          }
          
          if (isNaN(joiningDate.getTime())) {
            errorMessages.push(`Row ${rowNumber}: Invalid date format: ${employeeData.joiningDate}`);
            continue;
          }
        }

        // Create user account
        console.log(`Creating user for row ${rowNumber}:`, {
          name: employeeData.name,
          email: employeeData.email,
          employeeCode: employeeData.employeeCode
        });
        
        const user = await User.create({
          name: employeeData.name,
          email: employeeData.email,
          password: employeeData.password || 'defaultPassword123', // Default password
          role: 'employee',
          employeeCode: employeeData.employeeCode
        });
        
        console.log(`User created successfully for row ${rowNumber}:`, user._id);

        // Create employee record
        console.log(`Creating employee for row ${rowNumber}:`, {
          user: user._id,
          name: employeeData.name,
          email: employeeData.email,
          employeeCode: employeeData.employeeCode,
          department: employeeData.department,
          designation: employeeData.designation,
          salary: salary,
          phone: employeeData.phone || '',
          joiningDate: joiningDate,
          isActive: isActive,
          paidDays: employeeData.paidDays || 30,
          leaves: employeeData.leaves || 0
        });
        
        const employee = await Employee.create({
          user: user._id,
          name: employeeData.name,
          email: employeeData.email,
          employeeCode: employeeData.employeeCode,
          department: employeeData.department,
          designation: employeeData.designation,
          salary: salary,
          phone: employeeData.phone || '',
          joiningDate: joiningDate,
          isActive: isActive,
          paidDays: employeeData.paidDays || 30,
          leaves: employeeData.leaves || 0
        });
        
        console.log(`Employee created successfully for row ${rowNumber}:`, employee._id);

        // Calculate salary components
        employee.calculateSalaryComponents();
        await employee.save();

        createdEmployees.push({
          row: rowNumber,
          employeeCode: employee.employeeCode,
          name: employee.name,
          email: employee.email
        });

      } catch (error) {
        errorMessages.push(`Row ${rowNumber}: ${error.message}`);
      }
    }

    console.log('Final results:', {
      created: createdEmployees.length,
      total: employees.length,
      errors: errorMessages.length,
      duplicates: duplicateEmployees.length,
      errorMessages: errorMessages,
      duplicateMessages: duplicateEmployees
    });

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdEmployees.length} employees`,
      data: {
        created: createdEmployees.length,
        total: employees.length,
        createdEmployees,
        errors: errorMessages.length > 0 ? errorMessages : undefined,
        duplicates: duplicateEmployees.length > 0 ? duplicateEmployees : undefined
      }
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk upload'
    });
  }
});

// @desc    Get all employees without pagination (for attendance management)
// @route   GET /api/employees/all
// @access  Private/Admin
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const allEmployees = await Employee.find()
      .populate('user', 'name email role')
      .select('name employeeCode email department designation isActive')
      .sort({ name: 1 });
    
    console.log('=== ALL EMPLOYEES ENDPOINT ===');
    console.log('Total employees found:', allEmployees.length);
    console.log('====================');
    
    res.json({
      success: true,
      count: allEmployees.length,
      data: allEmployees
    });
  } catch (error) {
    console.error('All employees endpoint error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Simple test endpoint to check employees
// @route   GET /api/employees/test
// @access  Private/Admin
router.get('/test', protect, authorize('admin'), async (req, res) => {
  try {
    const allEmployees = await Employee.find().select('name employeeCode email isActive createdAt');
    console.log('=== TEST ENDPOINT ===');
    console.log('Total employees found:', allEmployees.length);
    console.log('All employees:', allEmployees);
    console.log('====================');
    
    res.json({
      success: true,
      count: allEmployees.length,
      employees: allEmployees
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Debug endpoint to check employee count
// @route   GET /api/employees/debug
// @access  Private/Admin
router.get('/debug', protect, authorize('admin'), async (req, res) => {
  try {
    const employeeCount = await Employee.countDocuments();
    const userCount = await User.countDocuments();
    const recentEmployees = await Employee.find().sort({ createdAt: -1 }).limit(5).select('name employeeCode email createdAt');
    
    // Also check for employees with the specific codes from CSV
    const csvEmployees = await Employee.find({
      employeeCode: { $in: ['JD1234', 'JS5678', 'MJ9012', 'SW3456', 'DB7890', 'AT1003'] }
    }).select('name employeeCode email isActive');

    console.log('Debug - Total employees:', employeeCount);
    console.log('Debug - CSV employees found:', csvEmployees.length);
    console.log('Debug - CSV employees:', csvEmployees);
    
    res.json({
      success: true,
      data: {
        employeeCount,
        userCount,
        recentEmployees,
        csvEmployees
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
