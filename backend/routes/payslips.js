const express = require('express');
const puppeteer = require('puppeteer');
const { body, validationResult } = require('express-validator');
const Payslip = require('../models/Payslip');
const Employee = require('../models/Employee');
const { protect, authorize } = require('../middleware/auth');
const { sendPayslipEmail } = require('../config/email');

const router = express.Router();

// @desc    Generate payslip
// @route   POST /api/payslips/generate
// @access  Private/Admin
router.post('/generate', protect, authorize('admin'), [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
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

    const { employeeId, month, year } = req.body;

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if payslip already exists for this month/year
    const existingPayslip = await Payslip.findOne({
      employee: employeeId,
      month,
      year
    });

    if (existingPayslip) {
      return res.status(400).json({
        success: false,
        message: 'Payslip already exists for this month and year'
      });
    }

    // Create payslip
    const payslip = await Payslip.create({
      employee: employeeId,
      employeeCode: employee.employeeCode,
      employeeName: employee.name,
      month,
      year,
      salary: employee.salary,
      paidDays: employee.paidDays,
      leaves: employee.leaves,
      basic: employee.basic,
      hra: employee.hra,
      conveyance: employee.conveyance,
      otherAllowance: employee.otherAllowance,
      pf: employee.pf,
      esic: employee.esic,
      dayWiseDeduction: employee.dayWiseDeduction,
      netSalary: employee.netSalary,
      department: employee.department,
      designation: employee.designation,
      generatedBy: req.user.id
    });

    // Send email if requested
    let emailResult = null;
    if (req.body.sendEmail === true) {
      try {
        emailResult = await sendPayslipEmail(employee, payslip);
        
        // Update payslip with email status
        payslip.emailSent = emailResult.success;
        payslip.emailSentAt = emailResult.success ? new Date() : null;
        payslip.emailStatus = emailResult.success ? 'sent' : 'failed';
        payslip.emailMessageId = emailResult.success ? emailResult.messageId : null;
        payslip.emailError = emailResult.success ? null : emailResult.error;
        
        await payslip.save();
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        emailResult = { success: false, error: emailError.message };
      }
    }

    res.status(201).json({
      success: true,
      message: 'Payslip generated successfully',
      data: payslip,
      emailSent: emailResult ? emailResult.success : false,
      emailError: emailResult && !emailResult.success ? emailResult.error : null
    });
  } catch (error) {
    console.error('Generate payslip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Generate bulk payroll for all employees
// @route   POST /api/payslips/generate-bulk
// @access  Private/Admin
router.post('/generate-bulk', protect, authorize('admin'), [
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

    const { month, year } = req.body;

    // Get all active employees
    const employees = await Employee.find({ isActive: true });
    
    if (employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active employees found'
      });
    }

    const generatedPayslips = [];
    const errorMessages = [];
    const emailResults = [];

    // Generate payslips for each employee
    for (const employee of employees) {
      try {
        // Check if payslip already exists
        const existingPayslip = await Payslip.findOne({
          employee: employee._id,
          month,
          year
        });

        if (existingPayslip) {
          errorMessages.push(`Payslip already exists for ${employee.employeeCode} - ${employee.name}`);
          continue;
        }

        // Create payslip
        const payslip = await Payslip.create({
          employee: employee._id,
          employeeCode: employee.employeeCode,
          employeeName: employee.name,
          month,
          year,
          salary: employee.salary,
          paidDays: employee.paidDays,
          leaves: employee.leaves,
          basic: employee.basic,
          hra: employee.hra,
          conveyance: employee.conveyance,
          otherAllowance: employee.otherAllowance,
          pf: employee.pf,
          esic: employee.esic,
          dayWiseDeduction: employee.dayWiseDeduction,
          netSalary: employee.netSalary,
          department: employee.department,
          designation: employee.designation,
          generatedBy: req.user.id
        });

        // Send email if requested
        let emailResult = null;
        if (req.body.sendEmail === true) {
          try {
            emailResult = await sendPayslipEmail(employee, payslip, true); // true for bulk
            
            // Update payslip with email status
            payslip.emailSent = emailResult.success;
            payslip.emailSentAt = emailResult.success ? new Date() : null;
            payslip.emailStatus = emailResult.success ? 'sent' : 'failed';
            payslip.emailMessageId = emailResult.success ? emailResult.messageId : null;
            payslip.emailError = emailResult.success ? null : emailResult.error;
            
            await payslip.save();
            
            emailResults.push({
              employeeCode: employee.employeeCode,
              employeeName: employee.name,
              success: emailResult.success,
              error: emailResult.success ? null : emailResult.error
            });
          } catch (emailError) {
            console.error('Email sending error for', employee.employeeCode, ':', emailError);
            emailResult = { success: false, error: emailError.message };
            emailResults.push({
              employeeCode: employee.employeeCode,
              employeeName: employee.name,
              success: false,
              error: emailError.message
            });
          }
        }

        generatedPayslips.push(payslip);
      } catch (error) {
        errorMessages.push(`Failed to generate payslip for ${employee.employeeCode}: ${error.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: `Generated ${generatedPayslips.length} payslips successfully`,
      data: {
        generated: generatedPayslips.length,
        total: employees.length,
        errors: errorMessages.length > 0 ? errorMessages : undefined,
        emailResults: req.body.sendEmail === true ? emailResults : undefined
      }
    });
  } catch (error) {
    console.error('Generate bulk payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get all payslips
// @route   GET /api/payslips
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    // If employee, only show their payslips
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ employeeCode: req.user.employeeCode });
      if (employee) {
        filter.employee = employee._id;
      } else {
        return res.json({
          success: true,
          count: 0,
          total: 0,
          page: 1,
          pages: 0,
          data: []
        });
      }
    }

    if (req.query.month) {
      filter.month = parseInt(req.query.month);
    }
    if (req.query.year) {
      filter.year = parseInt(req.query.year);
    }
    if (req.query.employeeCode) {
      filter.employeeCode = req.query.employeeCode;
    }

    const payslips = await Payslip.find(filter)
      .populate('employee', 'name employeeCode email')
      .populate('generatedBy', 'name email')
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payslip.countDocuments(filter);

    res.json({
      success: true,
      count: payslips.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: payslips
    });
  } catch (error) {
    console.error('Get payslips error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single payslip
// @route   GET /api/payslips/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id)
      .populate('employee', 'name employeeCode email department designation')
      .populate('generatedBy', 'name email');

    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }

    // Check if user can access this payslip
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ employeeCode: req.user.employeeCode });
      if (!employee || payslip.employee._id.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: payslip
    });
  } catch (error) {
    console.error('Get payslip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Generate PDF for payslip
// @route   GET /api/payslips/:id/pdf
// @access  Private
router.get('/:id/pdf', protect, async (req, res) => {
  let browser;
  try {
    const payslip = await Payslip.findById(req.params.id)
      .populate('employee', 'name employeeCode email department designation')
      .populate('generatedBy', 'name email');

    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }

    // Check if user can access this payslip
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ employeeCode: req.user.employeeCode });
      if (!employee || payslip.employee._id.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Generate HTML for payslip
    const html = generatePayslipHTML(payslip);

    // Get executable path from environment or use fallback for Render
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
      (puppeteer.executablePath ? puppeteer.executablePath() : undefined) ||
      '/opt/render/.cache/puppeteer/chrome/linux-141.0.7390.122/chrome';
    
    console.log('🚀 Launching Puppeteer...');
    console.log('Executable path:', executablePath || 'using default');
    
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--no-zygote'
      ],
      timeout: 30000,
      executablePath: executablePath
    });

    console.log('✅ Puppeteer launched successfully');

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    
    console.log('✅ Content loaded, generating PDF...');

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    console.log('✅ PDF generated successfully');
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payslip-${payslip.employeeCode}-${payslip.month}-${payslip.year}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('❌ Generate PDF error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Clean up browser if it was opened
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Browser close error:', e);
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate PDF. Please try again.',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @desc    Mark payslip as paid (Admin only)
// @route   PUT /api/payslips/:id/mark-paid
// @access  Private/Admin
router.put('/:id/mark-paid', protect, authorize('admin'), async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id);

    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }

    payslip.isPaid = true;
    payslip.paidAt = new Date();
    await payslip.save();

    res.json({
      success: true,
      message: 'Payslip marked as paid',
      data: payslip
    });
  } catch (error) {
    console.error('Mark payslip paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Send payslip email (Admin only)
// @route   POST /api/payslips/:id/send-email
// @access  Private/Admin
router.post('/:id/send-email', protect, authorize('admin'), async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id)
      .populate('employee', 'name email employeeCode');

    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }

    if (!payslip.employee.email) {
      return res.status(400).json({
        success: false,
        message: 'Employee email not found'
      });
    }

    // Create a promise with timeout (30 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000);
    });

    // Send email with timeout
    const emailResult = await Promise.race([
      sendPayslipEmail(payslip.employee, payslip),
      timeoutPromise
    ]);
    
    // Update payslip with email status (allow multiple sends)
    payslip.emailSent = emailResult.success;
    payslip.emailSentAt = emailResult.success ? new Date() : payslip.emailSentAt;
    payslip.emailStatus = emailResult.success ? 'sent' : 'failed';
    payslip.emailMessageId = emailResult.success ? emailResult.messageId : payslip.emailMessageId;
    payslip.emailError = emailResult.success ? null : emailResult.error;
    
    // Add to email history if it doesn't exist
    if (!payslip.emailHistory) {
      payslip.emailHistory = [];
    }
    
    // Add current send to history
    payslip.emailHistory.push({
      sentAt: new Date(),
      success: emailResult.success,
      messageId: emailResult.messageId,
      error: emailResult.error
    });
    
    await payslip.save();

    res.json({
      success: emailResult.success,
      message: emailResult.success ? 
        `Payslip email sent successfully (${payslip.emailHistory.length} total sends)` : 
        'Failed to send payslip email',
      data: {
        emailSent: emailResult.success,
        messageId: emailResult.messageId,
        error: emailResult.success ? null : emailResult.error,
        totalSends: payslip.emailHistory.length,
        lastSentAt: payslip.emailSentAt
      }
    });
  } catch (error) {
    console.error('Send payslip email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Send bulk payslip emails (Admin only)
// @route   POST /api/payslips/send-bulk-emails
// @access  Private/Admin
router.post('/send-bulk-emails', protect, authorize('admin'), [
  body('payslipIds').isArray().withMessage('Payslip IDs array is required'),
  body('payslipIds.*').isMongoId().withMessage('Valid payslip ID is required')
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

    const { payslipIds } = req.body;
    const results = [];

    for (const payslipId of payslipIds) {
      try {
        const payslip = await Payslip.findById(payslipId)
          .populate('employee', 'name email employeeCode');

        if (!payslip) {
          results.push({
            payslipId,
            success: false,
            error: 'Payslip not found'
          });
          continue;
        }

        if (!payslip.employee.email) {
          results.push({
            payslipId,
            employeeCode: payslip.employeeCode,
            success: false,
            error: 'Employee email not found'
          });
          continue;
        }

        // Send email
        const emailResult = await sendPayslipEmail(payslip.employee, payslip, true);
        
        // Update payslip with email status
        payslip.emailSent = emailResult.success;
        payslip.emailSentAt = emailResult.success ? new Date() : null;
        payslip.emailStatus = emailResult.success ? 'sent' : 'failed';
        payslip.emailMessageId = emailResult.success ? emailResult.messageId : null;
        payslip.emailError = emailResult.success ? null : emailResult.error;
        
        await payslip.save();

        results.push({
          payslipId,
          employeeCode: payslip.employeeCode,
          employeeName: payslip.employeeName,
          success: emailResult.success,
          messageId: emailResult.messageId,
          error: emailResult.success ? null : emailResult.error
        });
      } catch (error) {
        results.push({
          payslipId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Email sending completed: ${successCount} successful, ${failureCount} failed`,
      data: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results
      }
    });
  } catch (error) {
    console.error('Send bulk payslip emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete payslip (Admin only)
// @route   DELETE /api/payslips/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id);

    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }

    await Payslip.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Payslip deleted successfully'
    });
  } catch (error) {
    console.error('Delete payslip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to generate payslip HTML
function generatePayslipHTML(payslip) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payslip - ${payslip.employeeCode}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 10px;
        }
        .payslip-title {
          font-size: 18px;
          color: #666;
        }
        .employee-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .info-section {
          flex: 1;
        }
        .info-section h3 {
          margin: 0 0 10px 0;
          color: #007bff;
          font-size: 16px;
        }
        .info-row {
          display: flex;
          margin-bottom: 5px;
        }
        .info-label {
          font-weight: bold;
          width: 120px;
        }
        .salary-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .salary-table th,
        .salary-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .salary-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #007bff;
        }
        .earnings {
          background-color: #e8f5e8;
        }
        .deductions {
          background-color: #ffe8e8;
        }
        .net-salary {
          background-color: #e8f0ff;
          font-weight: bold;
        }
        .total-row {
          font-weight: bold;
          background-color: #f8f9fa;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
        }
        .signature-box {
          text-align: center;
          width: 200px;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 40px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">AXESS & V-ACCEL PAYROLL</div>
        <div class="payslip-title">PAYSLIP FOR ${monthNames[payslip.month - 1]} ${payslip.year}</div>
      </div>

      <div class="employee-info">
        <div class="info-section">
          <h3>Employee Information</h3>
          <div class="info-row">
            <span class="info-label">Employee Code:</span>
            <span>${payslip.employeeCode}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span>${payslip.employeeName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Department:</span>
            <span>${payslip.department || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Designation:</span>
            <span>${payslip.designation || 'N/A'}</span>
          </div>
        </div>
        <div class="info-section">
          <h3>Pay Period</h3>
          <div class="info-row">
            <span class="info-label">Month:</span>
            <span>${monthNames[payslip.month - 1]} ${payslip.year}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Paid Days:</span>
            <span>${payslip.paidDays}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Leaves:</span>
            <span>${payslip.leaves}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Generated On:</span>
            <span>${new Date(payslip.generatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <table class="salary-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr class="earnings">
            <td><strong>EARNINGS</strong></td>
            <td></td>
          </tr>
          <tr>
            <td>Basic Salary</td>
            <td>${payslip.basic.toLocaleString()}</td>
          </tr>
          <tr>
            <td>House Rent Allowance (HRA)</td>
            <td>${payslip.hra.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Conveyance Allowance</td>
            <td>${payslip.conveyance.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Other Allowance</td>
            <td>${payslip.otherAllowance.toLocaleString()}</td>
          </tr>
          <tr class="total-row">
            <td><strong>Total Earnings</strong></td>
            <td><strong>${(payslip.basic + payslip.hra + payslip.conveyance + payslip.otherAllowance).toLocaleString()}</strong></td>
          </tr>
          <tr class="deductions">
            <td><strong>DEDUCTIONS</strong></td>
            <td></td>
          </tr>
          <tr>
            <td>Provident Fund (PF)</td>
            <td>${payslip.pf.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Employee State Insurance (ESIC)</td>
            <td>${payslip.esic.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Day Wise Deduction</td>
            <td>${payslip.dayWiseDeduction.toLocaleString()}</td>
          </tr>
          <tr class="total-row">
            <td><strong>Total Deductions</strong></td>
            <td><strong>${(payslip.pf + payslip.esic + payslip.dayWiseDeduction).toLocaleString()}</strong></td>
          </tr>
          <tr class="net-salary">
            <td><strong>NET SALARY</strong></td>
            <td><strong>₹ ${payslip.netSalary.toLocaleString()}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div>Employee Signature</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div>Authorized Signature</div>
        </div>
      </div>

      <div class="footer">
        <p>This is a computer generated payslip and does not require a signature.</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;
