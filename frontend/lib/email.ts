// Email service for BetterAuth
import nodemailer from 'nodemailer';

// Create transporter using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send verification email
export async function sendVerificationEmail(email: string, verificationUrl: string) {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'WyZar <noreply@wyzar.co.zw>',
    to: email,
    subject: 'Verify Your WyZar Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2F5233 0%, #4A7C59 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to WyZar!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2F5233; margin-top: 0;">Verify Your Email Address</h2>
          
          <p>Thank you for creating an account with WyZar! To complete your registration and start shopping, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2F5233; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2F5233; font-size: 12px;">${verificationUrl}</p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="color: #666; font-size: 12px; margin-bottom: 0;">
            If you didn't create an account with WyZar, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} WyZar. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error };
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'WyZar <noreply@wyzar.co.zw>',
    to: email,
    subject: 'Reset Your WyZar Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2F5233 0%, #4A7C59 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">WyZar</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2F5233; margin-top: 0;">Reset Your Password</h2>
          
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2F5233; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2F5233; font-size: 12px;">${resetUrl}</p>
          
          <p style="color: #666; font-size: 14px;"><strong>This link will expire in 1 hour.</strong></p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="color: #666; font-size: 12px; margin-bottom: 0;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} WyZar. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
}

// Send 2FA OTP email
export async function send2FAEmail(email: string, otp: string) {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'WyZar <noreply@wyzar.co.zw>',
    to: email,
    subject: 'Your WyZar Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2F5233 0%, #4A7C59 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">WyZar</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2F5233; margin-top: 0;">Your Verification Code</h2>
          
          <p>Use the following code to complete your sign-in:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f5f5f5; padding: 20px 40px; border-radius: 10px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2F5233;">${otp}</span>
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px;"><strong>This code will expire in 10 minutes.</strong></p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="color: #666; font-size: 12px; margin-bottom: 0;">
            If you didn't request this code, please secure your account immediately by changing your password.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} WyZar. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`2FA code sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending 2FA email:', error);
    return { success: false, error };
  }
}
