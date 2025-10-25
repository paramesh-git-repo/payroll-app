const nodemailer = require('nodemailer');

const {
  GMAIL_USER,
  GMAIL_PASS
} = process.env;

// Gmail App Password configuration
async function getGmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    logger: true, // turn on for debugging
    debug: true
  });
}

// Alternative SMTP configuration (uncomment and modify as needed)
/*
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};
*/

// Email templates
const emailTemplates = {
  payslipNotification: (employeeName, month, year, payslipUrl) => {
    return {
      subject: `Payslip for ${month}/${year} - ${employeeName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #2E7D32;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background: #1B5E20;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
            .highlight {
              background: #e8f5e8;
              padding: 15px;
              border-left: 4px solid #2E7D32;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏢 AXESS & V-ACCEL PAYROLL</h1>
            <h2>Your Payslip is Ready!</h2>
          </div>
          
          <div class="content">
            <h3>Dear ${employeeName},</h3>
            
            <p>Your payslip for <strong>${month}/${year}</strong> has been generated and is ready for download.</p>
            
            <div class="highlight">
              <p><strong>📄 Payslip Details:</strong></p>
              <ul>
                <li>Employee: ${employeeName}</li>
                <li>Pay Period: ${month}/${year}</li>
                <li>Generated: ${new Date().toLocaleDateString()}</li>
              </ul>
            </div>
            
            <p>Please click the button below to download your payslip:</p>
            
            <div style="text-align: center;">
              <a href="${payslipUrl}" class="button">📥 Download Payslip</a>
            </div>
            
            <p><strong>Important Notes:</strong></p>
            <ul>
              <li>This payslip is password protected for your security</li>
              <li>Please keep this payslip for your records</li>
              <li>If you have any questions, contact HR department directly</li>
              <li><strong>This is an automated email - please do not reply</strong></li>
            </ul>
            
            <p>Thank you for your service!</p>
            
            <p>Best regards,<br>
            <strong>AXESS & V-ACCEL Payroll System</strong><br>
            <em>Automated Email Service</em></p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} AXESS & V-ACCEL. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Dear ${employeeName},
        
        Your payslip for ${month}/${year} has been generated and is ready for download.
        
        Payslip Details:
        - Employee: ${employeeName}
        - Pay Period: ${month}/${year}
        - Generated: ${new Date().toLocaleDateString()}
        
        Please download your payslip from: ${payslipUrl}
        
        Important Notes:
        - This payslip is password protected for your security
        - Please keep this payslip for your records
        - If you have any questions, contact HR department
        
        Thank you for your service!
        
        Best regards,
        HR Department
        AXESS & V-ACCEL
        
        This is an automated email. Please do not reply to this email.
      `
    };
  },

  bulkPayslipNotification: (employeeName, month, year, payslipUrl) => {
    return {
      subject: `Bulk Payslip Distribution - ${month}/${year}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #2E7D32;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background: #1B5E20;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
            .highlight {
              background: #e8f5e8;
              padding: 15px;
              border-left: 4px solid #2E7D32;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏢 AXESS & V-ACCEL PAYROLL</h1>
            <h2>Bulk Payslip Distribution</h2>
          </div>
          
          <div class="content">
            <h3>Dear ${employeeName},</h3>
            
            <p>As part of our bulk payslip distribution for <strong>${month}/${year}</strong>, your payslip has been generated and is ready for download.</p>
            
            <div class="highlight">
              <p><strong>📄 Payslip Details:</strong></p>
              <ul>
                <li>Employee: ${employeeName}</li>
                <li>Pay Period: ${month}/${year}</li>
                <li>Generated: ${new Date().toLocaleDateString()}</li>
              </ul>
            </div>
            
            <p>Please click the button below to download your payslip:</p>
            
            <div style="text-align: center;">
              <a href="${payslipUrl}" class="button">📥 Download Payslip</a>
            </div>
            
            <p><strong>Important Notes:</strong></p>
            <ul>
              <li>This payslip is password protected for your security</li>
              <li>Please keep this payslip for your records</li>
              <li>If you have any questions, contact HR department directly</li>
              <li><strong>This is an automated email - please do not reply</strong></li>
            </ul>
            
            <p>Thank you for your service!</p>
            
            <p>Best regards,<br>
            <strong>AXESS & V-ACCEL Payroll System</strong><br>
            <em>Automated Email Service</em></p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} AXESS & V-ACCEL. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Dear ${employeeName},
        
        As part of our bulk payslip distribution for ${month}/${year}, your payslip has been generated and is ready for download.
        
        Payslip Details:
        - Employee: ${employeeName}
        - Pay Period: ${month}/${year}
        - Generated: ${new Date().toLocaleDateString()}
        
        Please download your payslip from: ${payslipUrl}
        
        Important Notes:
        - This payslip is password protected for your security
        - Please keep this payslip for your records
        - If you have any questions, contact HR department
        
        Thank you for your service!
        
        Best regards,
        HR Department
        AXESS & V-ACCEL
        
        This is an automated email. Please do not reply to this email.
      `
    };
  }
};

// Send email function
const sendEmail = async (to, subject, html, text, attachments = []) => {
  try {
    const transporter = await getGmailTransporter();
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'AXESS & V-ACCEL Payroll System'}" <${GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: text,
      attachments: attachments,
      replyTo: 'noreply@v-accel.ai' // No-reply setup
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      response: result.response
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send payslip email
const sendPayslipEmail = async (employee, payslip, isBulk = false) => {
  try {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthName = monthNames[payslip.month - 1];
    const payslipUrl = `${process.env.FRONTEND_URL}/payslips/${payslip._id}/pdf`;
    
    const template = isBulk 
      ? emailTemplates.bulkPayslipNotification(employee.name, monthName, payslip.year, payslipUrl)
      : emailTemplates.payslipNotification(employee.name, monthName, payslip.year, payslipUrl);
    
    const result = await sendEmail(
      employee.email,
      template.subject,
      template.html,
      template.text
    );
    
    return result;
  } catch (error) {
    console.error('Send payslip email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  getGmailTransporter,
  sendEmail,
  sendPayslipEmail,
  emailTemplates
};
