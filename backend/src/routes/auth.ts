import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { authMiddleware, AuthRequest, generateToken, rateLimitMiddleware } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// ==================== VALIDATION RULES ====================
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number')
    .trim()
    .custom((value) => {
      console.log('✅ Password validation - length:', value.length);
      return true;
    }),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('role')
    .optional()
    .isIn(['buyer', 'supplier'])
    .withMessage('Role must be either buyer or supplier'),
  body('businessName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Business name cannot exceed 100 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .trim()
    .custom((value) => {
      console.log('✅ Login password validation - length:', value.length);
      return true;
    }),
  body('role')
    .optional()
    .isIn(['buyer', 'supplier'])
    .withMessage('Role must be either buyer or supplier')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('businessName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Business name cannot exceed 100 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s-]{10,}$/)
    .withMessage('Please provide a valid phone number'),
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object')
];

// ==================== HELPER FUNCTIONS ====================
const formatValidationErrors = (errors: any[]) => {
  return errors.map(err => ({
    field: err.path || err.param || 'unknown',
    message: err.msg
  }));
};

// ==================== DEBUG USER ENDPOINT ====================
router.post('/debug-user', async (req: express.Request, res: express.Response) => {
  try {
    const { email } = req.body;
    
    console.log('=== DEBUG USER ===');
    console.log('Email:', email);
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: 'Email is required' 
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    console.log('User found:', user.email);
    console.log('Stored hash (full):', user.password);
    console.log('Hash length:', user.password.length);
    console.log('Hash starts with $2a$10$?', user.password.startsWith('$2a$10$'));
    
    const testPasswords = [
      'SecurePass123',
      'securePass123',
      'SECUREPASS123',
      'SecurePass123 '
    ];
    
    const results: any = {};
    for (const testPw of testPasswords) {
      const isValid = await bcrypt.compare(testPw, user.password);
      results[testPw] = isValid;
      console.log(`"${testPw}" matches?`, isValid);
    }
    
    res.json({
      success: true,
      email: user.email,
      storedHash: user.password,
      storedHashLength: user.password.length,
      testResults: results
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Debug failed' 
    });
  }
});

// ==================== DIAGNOSTIC ENDPOINT ====================
router.post('/diagnostic', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;
    
    console.log('=== DIAGNOSTIC ===');
    console.log('Email:', email);
    console.log('Password:', password);
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    console.log('User found:', user.email);
    console.log('Stored hash (full):', user.password);
    console.log('Stored hash length:', user.password.length);
    console.log('Stored hash starts with $2a$10$?', user.password.startsWith('$2a$10$'));
    
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Direct compare result:', isValid);
    
    const newHash = await bcrypt.hash(password, 10);
    console.log('New hash of same password:', newHash);
    
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const minLength = password.length >= 6;
    
    console.log('Password requirements:');
    console.log('  - Has letter:', hasLetter);
    console.log('  - Has number:', hasNumber);
    console.log('  - Min length:', minLength);
    
    const isValidWithNewHash = await bcrypt.compare(password, newHash);
    console.log('Compare with new hash:', isValidWithNewHash);
    
    res.json({
      success: true,
      diagnostic: {
        userExists: true,
        email: user.email,
        storedHashLength: user.password.length,
        storedHashPrefix: user.password.substring(0, 20) + '...',
        directCompare: isValid,
        newHash: newHash,
        newHashCompare: isValidWithNewHash,
        passwordRequirements: {
          hasLetter,
          hasNumber,
          minLength,
          meetsRequirements: hasLetter && hasNumber && minLength
        }
      }
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Diagnostic failed' 
    });
  }
});

// ==================== TEST HASH ENDPOINT ====================
router.post('/test-hash', async (req: express.Request, res: express.Response) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    console.log('=== TEST HASH ===');
    console.log('Original password:', password);
    console.log('Password length:', password.length);
    
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash:', hash);
    console.log('Hash length:', hash.length);
    
    const isValid = await bcrypt.compare(password, hash);
    console.log('Comparison result:', isValid);
    
    res.json({
      success: true,
      originalPassword: password,
      hash: hash,
      hashLength: hash.length,
      isValid: isValid,
      passwordLength: password.length,
      passwordIncludesSpecial: /[^a-zA-Z0-9]/.test(password)
    });
  } catch (error) {
    console.error('Test hash error:', error);
    res.status(500).json({ error: 'Test failed' });
  }
});

// ==================== REGISTER ====================
router.post('/register', 
  rateLimitMiddleware(15 * 60 * 1000, 5),
  registerValidation,
  async (req: express.Request, res: express.Response) => {
    try {
      console.log('=== REGISTER ATTEMPT ===');
      console.log('📧 Email:', req.body.email);
      console.log('👤 Role:', req.body.role || 'buyer (default)');
      console.log('🔑 Raw password:', req.body.password);
      console.log('🔑 Raw password length:', req.body.password?.length || 0);
      
      // Trim password
      const trimmedPassword = req.body.password ? req.body.password.trim() : '';
      console.log('🔑 Trimmed password:', trimmedPassword);
      console.log('🔑 Trimmed password length:', trimmedPassword.length);
      console.log('🔑 Trimmed password char codes:', [...trimmedPassword].map(c => c.charCodeAt(0)));

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({ 
          success: false,
          errors: formatValidationErrors(errors.array())
        });
      }

      const { email, name, role, businessName, phone, address } = req.body;

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        console.log('❌ User already exists:', email);
        return res.status(400).json({ 
          success: false,
          error: 'User already exists with this email' 
        });
      }

      // CRITICAL FIX: Pass raw password - User model's pre-save hook will hash it
      console.log('🔄 Creating user (password will be hashed by Mongoose pre-save)...');
      
      const user = new User({
        email: email.toLowerCase(),
        password: trimmedPassword, // RAW password - NOT hashed
        name: name.trim(),
        role: role || 'buyer',
        businessName: businessName ? businessName.trim() : '',
        phone: phone || '',
        address: address || {},
        onboardingCompleted: false,
        emailVerified: false,
        isActive: true
      });

      await user.save();
      console.log('✅ User registered successfully:', user.email);
      console.log('✅ Password hash stored (by Mongoose):', user.password);
      console.log('='.repeat(40));

      const token = generateToken(user._id.toString(), user.email, user.role);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessName: user.businessName,
          phone: user.phone,
          address: user.address,
          onboardingCompleted: user.onboardingCompleted,
          emailVerified: user.emailVerified
        }
      });
    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error. Please try again later.' 
      });
    }
  }
);

// ==================== LOGIN ====================
router.post('/login',
  rateLimitMiddleware(15 * 60 * 1000, 10),
  loginValidation,
  async (req: express.Request, res: express.Response) => {
    try {
      console.log('=== LOGIN ATTEMPT ===');
      console.log('📧 Email:', req.body.email);
      console.log('🔑 Role provided:', req.body.role || 'none');
      console.log('🔑 Raw password:', req.body.password);
      console.log('🔑 Raw password length:', req.body.password?.length || 0);
      
      const trimmedPassword = req.body.password ? req.body.password.trim() : '';
      console.log('🔑 Trimmed password:', trimmedPassword);
      console.log('🔑 Trimmed password length:', trimmedPassword.length);
      console.log('🔑 Trimmed password char codes:', [...trimmedPassword].map(c => c.charCodeAt(0)));

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({ 
          success: false,
          errors: formatValidationErrors(errors.array())
        });
      }

      const { email, role } = req.body;

      console.log('🔍 Looking for user in database...');
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      
      if (!user) {
        console.log('❌ User not found:', email);
        return res.status(401).json({ 
          success: false,
          error: 'Invalid credentials' 
        });
      }

      console.log('✅ User found:', user.email);
      console.log('👤 Role in DB:', user.role);
      console.log('🟢 Active:', user.isActive);
      console.log('🔐 Password hash in DB (full):', user.password);
      console.log('🔐 Hash length:', user.password.length);

      if (!user.isActive) {
        console.log('❌ Account deactivated:', user.email);
        return res.status(401).json({ 
          success: false,
          error: 'Account is deactivated. Please contact support.' 
        });
      }

      if (role && user.role !== role) {
        console.log('❌ Role mismatch! Provided:', role, 'DB:', user.role);
        return res.status(401).json({ 
          success: false,
          error: `No ${role} account found with this email` 
        });
      }

      console.log('🔐 Comparing passwords...');
      console.log('  - Trimmed password:', trimmedPassword);
      console.log('  - Password type:', typeof trimmedPassword);
      console.log('  - Password length:', trimmedPassword.length);
      
      const isValid = await bcrypt.compare(trimmedPassword, user.password);
      console.log('✅ Password valid:', isValid ? 'YES' : 'NO');
      
      if (!isValid) {
        console.log('❌ Invalid password for:', user.email);
        console.log('  - Password includes special chars?', /[^a-zA-Z0-9]/.test(trimmedPassword));
        console.log('  - Password includes spaces?', /\s/.test(trimmedPassword));
        return res.status(401).json({ 
          success: false,
          error: 'Invalid credentials' 
        });
      }

      console.log('🔄 Updating last login...');
      user.lastLogin = new Date();
      await user.save();

      console.log('🎫 Generating token...');
      const token = generateToken(user._id.toString(), user.email, user.role);

      console.log('✅ LOGIN SUCCESS for:', user.email);
      console.log('='.repeat(40));

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessName: user.businessName,
          phone: user.phone,
          address: user.address,
          onboardingCompleted: user.onboardingCompleted,
          onboardingData: user.onboardingData,
          emailVerified: user.emailVerified,
          profileImage: user.profileImage
        }
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error. Please try again later.' 
      });
    }
  }
);

// ==================== GET CURRENT USER ====================
router.get('/me', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    console.log('=== GET USER ===');
    console.log('User ID:', req.user?.userId);
    
    const user = await User.findById(req.user?.userId);
    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    console.log('✅ User found:', user.email);
    console.log('='.repeat(40));

    const userDoc = user as any;
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessName: user.businessName,
      businessType: user.businessType,
      phone: user.phone,
      address: user.address,
      onboardingCompleted: user.onboardingCompleted,
      onboardingData: user.onboardingData,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      profileImage: user.profileImage,
      lastLogin: user.lastLogin,
      createdAt: userDoc.createdAt || userDoc._id.getTimestamp?.() || new Date(),
      updatedAt: userDoc.updatedAt || userDoc._id.getTimestamp?.() || new Date()
    };

    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error. Please try again later.' 
    });
  }
});

// ==================== UPDATE PROFILE ====================
router.put('/profile', 
  authMiddleware, 
  updateProfileValidation,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: formatValidationErrors(errors.array())
        });
      }

      const { name, businessName, phone, address, businessType } = req.body;
      
      const user = await User.findById(req.user?.userId);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      if (name) user.name = name.trim();
      if (businessName !== undefined) user.businessName = businessName ? businessName.trim() : '';
      if (phone !== undefined) user.phone = phone || '';
      if (address) user.address = { ...user.address, ...address };
      if (businessType) user.businessType = businessType;

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessName: user.businessName,
          businessType: user.businessType,
          phone: user.phone,
          address: user.address,
          onboardingCompleted: user.onboardingCompleted
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error. Please try again later.' 
      });
    }
  }
);

// ==================== COMPLETE ONBOARDING ====================
router.post('/onboarding', 
  authMiddleware,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const onboardingData = req.body;
      
      const user = await User.findById(req.user?.userId);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      const requiredFields = ['businessType', 'industry'];
      for (const field of requiredFields) {
        if (!onboardingData[field]) {
          return res.status(400).json({ 
            success: false,
            error: `${field} is required for onboarding` 
          });
        }
      }

      user.onboardingCompleted = true;
      user.onboardingData = {
        ...user.onboardingData,
        ...onboardingData
      };
      await user.save();

      res.json({
        success: true,
        message: 'Onboarding completed successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          onboardingCompleted: user.onboardingCompleted,
          onboardingData: user.onboardingData
        }
      });
    } catch (error) {
      console.error('Onboarding error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error. Please try again later.' 
      });
    }
  }
);

// ==================== LOGOUT ====================
router.post('/logout', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error. Please try again later.' 
    });
  }
});

// ==================== CHANGE PASSWORD ====================
router.post('/change-password',
  authMiddleware,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
      .withMessage('New password must contain at least one letter and one number')
      .trim()
  ],
  async (req: AuthRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: formatValidationErrors(errors.array())
        });
      }

      const { currentPassword, newPassword } = req.body;
      
      const trimmedCurrentPassword = currentPassword ? currentPassword.trim() : '';
      const trimmedNewPassword = newPassword ? newPassword.trim() : '';
      
      const user = await User.findById(req.user?.userId).select('+password');
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Compare with existing hash
      const isValid = await bcrypt.compare(trimmedCurrentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ 
          success: false,
          error: 'Current password is incorrect' 
        });
      }

      // FIX: Pass raw password - User model's pre-save will hash it
      user.password = trimmedNewPassword; // RAW password - NOT hashed
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error. Please try again later.' 
      });
    }
  }
);

// ==================== FORGOT PASSWORD ====================
router.post('/forgot-password',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .trim()
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: formatValidationErrors(errors.array())
        });
      }

      const { email } = req.body;
      
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.json({
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link'
        });
      }

      const resetToken = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1h' }
      );

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000);
      await user.save();

      console.log(`Reset token for ${email}: ${resetToken}`);

      res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error. Please try again later.' 
      });
    }
  }
);

// ==================== RESET PASSWORD ====================
router.post('/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
      .withMessage('New password must contain at least one letter and one number')
      .trim()
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: formatValidationErrors(errors.array())
        });
      }

      const { token, newPassword } = req.body;

      const trimmedNewPassword = newPassword ? newPassword.trim() : '';

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string, email: string };
      } catch (error) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid or expired reset token' 
        });
      }

      const user = await User.findOne({
        _id: decoded.userId,
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      });

      if (!user) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid or expired reset token' 
        });
      }

      // FIX: Pass raw password - User model's pre-save will hash it
      user.password = trimmedNewPassword; // RAW password - NOT hashed
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error. Please try again later.' 
      });
    }
  }
);

// ==================== REFRESH TOKEN ====================
router.post('/refresh-token', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'User not authenticated' 
      });
    }

    const token = generateToken(req.user.userId, req.user.email, req.user.role);

    res.json({
      success: true,
      token
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error. Please try again later.' 
    });
  }
});

// ==================== VERIFY EMAIL ====================
router.post('/verify-email',
  [
    body('token')
      .notEmpty()
      .withMessage('Verification token is required')
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: formatValidationErrors(errors.array())
        });
      }

      const { token } = req.body;

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
      } catch (error) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid or expired verification token' 
        });
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      user.emailVerified = true;
      user.verificationToken = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error. Please try again later.' 
      });
    }
  }
);

export default router;