import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'buyer' | 'supplier';
  name: string;
  businessName?: string;
  businessType?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  onboardingCompleted: boolean;
  onboardingData?: {
    businessType?: string;
    industry?: string;
    categories?: string[];
    fabricTypes?: string[];
    orderQuantity?: string;
    budgetRange?: string;
    preferredColors?: string[];
    annualPurchaseVolume?: string;
  };
  emailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLogin?: Date;
  isActive: boolean;
  profileImage?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastLogin(): Promise<IUser>;
  completeOnboarding(onboardingData: any): Promise<IUser>;
}

const UserSchema = new Schema({
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true, // This creates the index - remove duplicate below
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: { 
    type: String, 
    enum: {
      values: ['buyer', 'supplier'],
      message: '{VALUE} is not a valid role'
    },
    required: [true, 'Role is required']
  },
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  businessName: { 
    type: String, 
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  businessType: {
    type: String,
    enum: {
      values: ['manufacturer', 'wholesaler', 'retailer', 'distributor', 'exporter', 'importer', 'other'],
      message: '{VALUE} is not a valid business type'
    }
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-]{10,}$/, 'Please provide a valid phone number']
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true }
  },
  onboardingCompleted: { 
    type: Boolean, 
    default: false 
  },
  onboardingData: {
    businessType: { 
      type: String,
      enum: ['manufacturer', 'wholesaler', 'retailer', 'distributor', 'exporter', 'importer', 'other']
    },
    industry: { type: String, trim: true },
    categories: [{ type: String, trim: true }],
    fabricTypes: [{ type: String, trim: true }],
    orderQuantity: {
      type: String,
      enum: ['small (1-100 units)', 'medium (101-1000 units)', 'large (1001-10000 units)', 'bulk (10000+ units)']
    },
    budgetRange: {
      type: String,
      enum: ['under $500', '$500 - $2000', '$2000 - $5000', '$5000 - $10000', '$10000+']
    },
    preferredColors: [{ type: String, trim: true }],
    annualPurchaseVolume: {
      type: String,
      enum: ['under $10,000', '$10,000 - $50,000', '$50,000 - $100,000', '$100,000 - $500,000', '$500,000+']
    }
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    select: false
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileImage: {
    type: String,
    trim: true
  }
}, { 
  timestamps: true 
});

// ==================== INDEXES ====================
// Remove duplicate email index - email is already indexed via unique: true
// Only keep these additional indexes
UserSchema.index({ role: 1, createdAt: -1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ 'address.city': 1 });
UserSchema.index({ 'address.country': 1 });

// ==================== COMPOUND INDEXES ====================
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });

// ==================== VIRTUAL PROPERTIES ====================
UserSchema.virtual('fullName').get(function(this: any) {
  return this.name;
});

UserSchema.virtual('displayName').get(function(this: any) {
  return this.businessName || this.name;
});

UserSchema.virtual('isBuyer').get(function(this: any) {
  return this.role === 'buyer';
});

UserSchema.virtual('isSupplier').get(function(this: any) {
  return this.role === 'supplier';
});

// ==================== METHODS ====================
// Compare password method
UserSchema.methods.comparePassword = async function(this: any, candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Update last login
UserSchema.methods.updateLastLogin = async function(this: any): Promise<IUser> {
  this.lastLogin = new Date();
  return this.save();
};

// Mark onboarding as complete
UserSchema.methods.completeOnboarding = async function(this: any, onboardingData: any): Promise<IUser> {
  this.onboardingCompleted = true;
  this.onboardingData = { ...this.onboardingData, ...onboardingData };
  return this.save();
};

// ==================== STATIC METHODS ====================
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

UserSchema.statics.findByRole = function(role: string) {
  return this.find({ role, isActive: true });
};

UserSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        }
      }
    }
  ]);
};

// ==================== PRE-SAVE MIDDLEWARE ====================
// Hash password before saving
UserSchema.pre('save', async function(this: any, next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Ensure email is lowercase
UserSchema.pre('save', function(this: any, next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// ==================== POST-SAVE MIDDLEWARE ====================
UserSchema.post('save', function(doc) {
  console.log(`User ${doc.email} saved successfully`);
});

// ==================== TO JSON CONFIG ====================
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    const result = ret as any;
    delete result.password;
    delete result.__v;
    delete result.verificationToken;
    delete result.resetPasswordToken;
    delete result.resetPasswordExpires;
    return result;
  }
});

UserSchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    const result = ret as any;
    delete result.password;
    delete result.__v;
    delete result.verificationToken;
    delete result.resetPasswordToken;
    delete result.resetPasswordExpires;
    return result;
  }
});

export default mongoose.model<IUser>('User', UserSchema);