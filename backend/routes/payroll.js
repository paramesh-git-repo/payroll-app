const express = require('express');
const puppeteer = require('puppeteer');
const Payslip = require('../models/Payslip');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @desc    Generate payroll report
// @route   GET /api/payroll/report
// @access  Private/Admin
router.get('/report', protect, authorize('admin'), async (req, res) => {
  try {
    const { type, month, year, includeDetails } = req.query;

    // Validate required parameters
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    // Build filter based on report type
    let filter = {};
    
    switch (type) {
      case 'monthly':
        filter = { month: monthNum, year: yearNum };
        break;
      case 'quarterly':
        const quarterStartMonth = Math.floor((monthNum - 1) / 3) * 3 + 1;
        filter = {
          year: yearNum,
          month: { $gte: quarterStartMonth, $lte: quarterStartMonth + 2 }
        };
        break;
      case 'yearly':
        filter = { year: yearNum };
        break;
      case 'summary':
        filter = { year: yearNum };
        break;
      default:
        filter = { month: monthNum, year: yearNum };
    }

    // Get payslips data
    const payslips = await Payslip.find(filter)
      .populate('employee', 'name employeeCode department designation')
      .sort({ month: 1, employeeCode: 1 });

    // Get employees data for summary
    const employees = await Employee.find({ isActive: true });

    // Generate HTML report
    const html = generatePayrollReportHTML(payslips, employees, {
      type,
      month: monthNum,
      year: yearNum,
      includeDetails: includeDetails === 'true'
    });

    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payroll-report-${type}-${yearNum}-${monthNum.toString().padStart(2, '0')}.pdf"`);

    res.send(pdf);
  } catch (error) {
    console.error('Generate payroll report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to generate payroll report HTML
function generatePayrollReportHTML(payslips, employees, options) {
  const { type, month, year, includeDetails } = options;
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate totals
  const totalSalary = payslips.reduce((sum, p) => sum + p.netSalary, 0);
  const totalPaid = payslips.filter(p => p.isPaid).reduce((sum, p) => sum + p.netSalary, 0);
  const totalPending = payslips.filter(p => !p.isPaid).reduce((sum, p) => sum + p.netSalary, 0);

  let reportTitle = '';
  let reportPeriod = '';
  
  switch (type) {
    case 'monthly':
      reportTitle = 'Monthly Payroll Report';
      reportPeriod = `${monthNames[month - 1]} ${year}`;
      break;
    case 'quarterly':
      reportTitle = 'Quarterly Payroll Report';
      reportPeriod = `Q${Math.ceil(month / 3)} ${year}`;
      break;
    case 'yearly':
      reportTitle = 'Yearly Payroll Report';
      reportPeriod = year.toString();
      break;
    case 'summary':
      reportTitle = 'Payroll Summary Report';
      reportPeriod = year.toString();
      break;
    default:
      reportTitle = 'Payroll Report';
      reportPeriod = `${monthNames[month - 1]} ${year}`;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${reportTitle}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2E7D32;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #2E7D32;
          margin-bottom: 10px;
        }
        .report-title {
          font-size: 18px;
          color: #666;
        }
        .summary-section {
          display: flex;
          justify-content: space-around;
          margin-bottom: 30px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-value {
          font-size: 24px;
          font-weight: bold;
          color: #2E7D32;
        }
        .summary-label {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        .payslips-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .payslips-table th,
        .payslips-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .payslips-table th {
          background-color: #2E7D32;
          color: white;
          font-weight: bold;
        }
        .payslips-table tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        .status-paid {
          color: #28a745;
          font-weight: bold;
        }
        .status-pending {
          color: #ffc107;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .no-data {
          text-align: center;
          padding: 40px;
          color: #666;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">AXESS & V-ACCEL PAYROLL</div>
        <div class="report-title">${reportTitle} - ${reportPeriod}</div>
      </div>

      <div class="summary-section">
        <div class="summary-item">
          <div class="summary-value">${payslips.length}</div>
          <div class="summary-label">Total Payslips</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">₹${totalSalary.toLocaleString()}</div>
          <div class="summary-label">Total Salary</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">₹${totalPaid.toLocaleString()}</div>
          <div class="summary-label">Paid Amount</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">₹${totalPending.toLocaleString()}</div>
          <div class="summary-label">Pending Amount</div>
        </div>
      </div>

      ${payslips.length > 0 ? `
        <table class="payslips-table">
          <thead>
            <tr>
              <th>Employee Code</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Month/Year</th>
              <th>Net Salary</th>
              <th>Status</th>
              ${includeDetails ? '<th>Paid Days</th><th>Leaves</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${payslips.map(payslip => `
              <tr>
                <td>${payslip.employeeCode}</td>
                <td>${payslip.employeeName}</td>
                <td>${payslip.department || 'N/A'}</td>
                <td>${monthNames[payslip.month - 1]} ${payslip.year}</td>
                <td>₹${payslip.netSalary.toLocaleString()}</td>
                <td class="${payslip.isPaid ? 'status-paid' : 'status-pending'}">
                  ${payslip.isPaid ? 'Paid' : 'Pending'}
                </td>
                ${includeDetails ? `
                  <td>${payslip.paidDays}</td>
                  <td>${payslip.leaves}</td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `
        <div class="no-data">
          No payslips found for the selected period.
        </div>
      `}

      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>This is a computer generated report.</p>
      </div>
    </body>
    </html>
  `;
}

// @desc    Get moved records for payroll processing
// @route   GET /api/payroll/moved-records
// @access  Private/Admin
router.get('/moved-records', protect, authorize('admin'), async (req, res) => {
  try {
    const { month, year } = req.query;

    console.log('=== PAYROLL MOVED RECORDS DEBUG ===');
    console.log('Query params:', { month, year });
    console.log('===================================');

    // Build filter for moved records (status = 'submitted')
    let filter = { status: 'submitted' };
    
    if (month) {
      filter.month = parseInt(month);
    }
    
    if (year) {
      filter.year = parseInt(year);
    }

    const movedRecords = await Attendance.find(filter)
      .populate('employee', 'name employeeCode department designation salary netSalary dayWiseDeduction paidDays leaves deductPF deductESIC reimbursement note')
      .populate('submittedBy', 'name email')
      .sort({ year: -1, month: -1, employeeCode: 1 });

    console.log('Found moved records:', movedRecords.length);
    console.log('Sample record:', movedRecords[0]?.employeeCode);

    res.json({
      success: true,
      count: movedRecords.length,
      data: movedRecords
    });
  } catch (error) {
    console.error('Get moved records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Mark record as salary processed
// @route   POST /api/payroll/mark-processed
// @access  Private/Admin
router.post('/mark-processed', protect, authorize('admin'), [
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

    console.log('=== MARK SALARY PROCESSED DEBUG ===');
    console.log('Processing employee:', employeeCode, 'for', month, year);
    console.log('===================================');

    // Find the attendance record
    const attendance = await Attendance.findOne({
      employeeCode,
      month,
      year,
      status: 'submitted' // Only process submitted records
    }).populate('employee');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Submitted attendance record not found'
      });
    }

    // Update the status to indicate salary is processed
    attendance.status = 'approved'; // Changed from 'submitted' to 'approved'
    attendance.approvedBy = req.user._id;
    attendance.approvedAt = new Date();
    
    await attendance.save();

    console.log('Successfully marked as salary processed:', attendance.employeeCode);

    res.json({
      success: true,
      message: 'Salary processed successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Mark processed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get salary processed records
// @route   GET /api/payroll/processed-records
// @access  Private/Admin
router.get('/processed-records', protect, authorize('admin'), async (req, res) => {
  try {
    const { month, year } = req.query;

    console.log('=== SALARY PROCESSED RECORDS DEBUG ===');
    console.log('Query params:', { month, year });
    console.log('=====================================');

    // Build filter for processed records (status = 'approved')
    let filter = { status: 'approved' };
    
    if (month) {
      filter.month = parseInt(month);
    }
    
    if (year) {
      filter.year = parseInt(year);
    }

    const processedRecords = await Attendance.find(filter)
      .populate('employee', 'name employeeCode department designation salary netSalary dayWiseDeduction paidDays leaves deductPF deductESIC reimbursement note')
      .populate('submittedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ year: -1, month: -1, employeeCode: 1 });

    console.log('Found processed records:', processedRecords.length);
    console.log('Sample record:', processedRecords[0]?.employeeCode);

    res.json({
      success: true,
      count: processedRecords.length,
      data: processedRecords
    });
  } catch (error) {
    console.error('Get processed records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Revert salary processed record back to submitted
// @route   POST /api/payroll/revert-processed
// @access  Private/Admin
router.post('/revert-processed', protect, authorize('admin'), [
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

    console.log('=== REVERT SALARY PROCESSED DEBUG ===');
    console.log('Reverting employee:', employeeCode, 'for', month, year);
    console.log('====================================');

    // Find the attendance record
    const attendance = await Attendance.findOne({
      employeeCode,
      month,
      year,
      status: 'approved' // Only revert approved records
    }).populate('employee');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Processed attendance record not found'
      });
    }

    // Update the status back to submitted
    attendance.status = 'submitted';
    attendance.approvedBy = undefined;
    attendance.approvedAt = undefined;
    
    await attendance.save();

    console.log('Successfully reverted salary processed:', attendance.employeeCode);

    res.json({
      success: true,
      message: 'Salary processing reverted successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Revert processed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
