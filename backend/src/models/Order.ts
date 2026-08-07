import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  buyerId: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
    productName?: string;
    productImage?: string;
  }>;
  total: number;
  subtotal?: number;
  tax?: number;
  shippingCost?: number;
  discount?: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    note?: string;
  }>;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
    email?: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  orderNumber: string;
  notes?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  refundedAt?: Date;
  orderDate: Date;
  calculateTotal(): number;
  cancel(): Promise<IOrder>;
  markDelivered(): Promise<IOrder>;
  updatePaymentStatus(status: string): Promise<IOrder>;
  updateStatus(status: string, note?: string): Promise<IOrder>;
  addTracking(trackingNumber: string, carrier: string): Promise<IOrder>;
}

const OrderSchema = new Schema({
  buyerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Buyer ID is required']
  },
  supplierId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Supplier ID is required']
  },
  items: [{
    productId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Product', 
      required: [true, 'Product ID is required']
    },
    quantity: { 
      type: Number, 
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    price: { 
      type: Number, 
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    productName: {
      type: String,
      trim: true
    },
    productImage: {
      type: String,
      trim: true
    }
  }],
  total: { 
    type: Number, 
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative'],
    default: 0
  },
  subtotal: {
    type: Number,
    min: [0, 'Subtotal cannot be negative'],
    default: 0
  },
  tax: {
    type: Number,
    min: [0, 'Tax cannot be negative'],
    default: 0
  },
  shippingCost: {
    type: Number,
    min: [0, 'Shipping cost cannot be negative'],
    default: 0
  },
  discount: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    default: 0
  },
  status: { 
    type: String, 
    enum: {
      values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      message: '{VALUE} is not a valid order status'
    },
    default: 'pending'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Note cannot exceed 200 characters']
    }
  }],
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'paid', 'failed', 'refunded'],
      message: '{VALUE} is not a valid payment status'
    },
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ['credit_card', 'debit_card', 'bank_transfer', 'cash', 'other'],
      message: '{VALUE} is not a valid payment method'
    },
    required: false,
    default: 'cash'
  },
  shippingAddress: {
    street: { 
      type: String, 
      required: [true, 'Street is required'],
      trim: true
    },
    city: { 
      type: String, 
      required: [true, 'City is required'],
      trim: true
    },
    state: { 
      type: String, 
      required: [true, 'State is required'],
      trim: true
    },
    zipCode: { 
      type: String, 
      required: [true, 'Zip code is required'],
      trim: true
    },
    country: { 
      type: String, 
      required: [true, 'Country is required'],
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    }
  },
  billingAddress: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true }
  },
  orderNumber: { 
    type: String, 
    unique: true,
    required: [true, 'Order number is required']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  trackingNumber: {
    type: String,
    trim: true
  },
  carrier: {
    type: String,
    trim: true
  },
  estimatedDelivery: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  refundedAt: {
    type: Date
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// ==================== INDEXES ====================
// Remove duplicate index - only keep one definition
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ supplierId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'shippingAddress.city': 1 });
OrderSchema.index({ 'shippingAddress.country': 1 });
OrderSchema.index({ buyerId: 1, status: 1 });
OrderSchema.index({ supplierId: 1, status: 1 });
OrderSchema.index({ status: 1, paymentStatus: 1 });
OrderSchema.index({ orderDate: -1 });

// ==================== VIRTUAL PROPERTIES ====================
// FIX: Safely handle undefined items
OrderSchema.virtual('itemCount').get(function(this: any) {
  if (!this.items || !Array.isArray(this.items)) return 0;
  return this.items.reduce((total: number, item: any) => total + (item.quantity || 0), 0);
});

OrderSchema.virtual('isPaid').get(function(this: any) {
  return this.paymentStatus === 'paid';
});

OrderSchema.virtual('isDelivered').get(function(this: any) {
  return this.status === 'delivered';
});

OrderSchema.virtual('isCancelled').get(function(this: any) {
  return this.status === 'cancelled';
});

OrderSchema.virtual('canBeCancelled').get(function(this: any) {
  return ['pending', 'processing'].includes(this.status) && this.paymentStatus !== 'paid';
});

OrderSchema.virtual('daysSinceOrder').get(function(this: any) {
  if (!this.orderDate) return 0;
  return Math.floor((Date.now() - this.orderDate.getTime()) / (1000 * 60 * 60 * 24));
});

OrderSchema.virtual('totalItems').get(function(this: any) {
  if (!this.items || !Array.isArray(this.items)) return 0;
  return this.items.length;
});

OrderSchema.virtual('isProcessing').get(function(this: any) {
  return this.status === 'processing';
});

OrderSchema.virtual('isShipped').get(function(this: any) {
  return this.status === 'shipped';
});

// FIX: Safe total order value calculation
OrderSchema.virtual('orderValue').get(function(this: any) {
  if (!this.items || !Array.isArray(this.items)) return 0;
  return this.items.reduce((sum: number, item: any) => {
    return sum + ((item.price || 0) * (item.quantity || 0));
  }, 0);
});

// ==================== METHODS ====================
// Update status with history
OrderSchema.methods.updateStatus = async function(this: any, status: string, note?: string): Promise<IOrder> {
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  if (this.status === 'delivered' && status !== 'refunded') {
    throw new Error('Delivered orders can only be refunded');
  }
  if (this.status === 'cancelled') {
    throw new Error('Cancelled orders cannot be updated');
  }

  this.status = status;
  this.statusHistory.push({
    status,
    timestamp: new Date(),
    note: note || ''
  });

  if (status === 'delivered') {
    this.deliveredAt = new Date();
  } else if (status === 'cancelled') {
    this.cancelledAt = new Date();
  } else if (status === 'refunded') {
    this.refundedAt = new Date();
  }

  return this.save();
};

// Cancel order
OrderSchema.methods.cancel = async function(this: any): Promise<IOrder> {
  if (!this.canBeCancelled) {
    throw new Error('Order cannot be cancelled at this stage');
  }
  return this.updateStatus('cancelled', 'Order cancelled by buyer');
};

// Mark as delivered
OrderSchema.methods.markDelivered = async function(this: any): Promise<IOrder> {
  if (this.status !== 'shipped') {
    throw new Error('Order must be shipped before marking as delivered');
  }
  return this.updateStatus('delivered', 'Order delivered to customer');
};

// Update payment status
OrderSchema.methods.updatePaymentStatus = async function(this: any, status: string): Promise<IOrder> {
  const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid payment status. Must be one of: ${validStatuses.join(', ')}`);
  }
  this.paymentStatus = status;
  if (status === 'refunded') {
    this.refundedAt = new Date();
  }
  return this.save();
};

// Calculate total - FIX: Handle undefined items safely
OrderSchema.methods.calculateTotal = function(this: any): number {
  if (!this.items || !Array.isArray(this.items)) {
    this.subtotal = 0;
    this.total = 0;
    return 0;
  }
  
  const subtotal = this.items.reduce((sum: number, item: any) => {
    return sum + ((item.price || 0) * (item.quantity || 0));
  }, 0);
  
  this.subtotal = subtotal;
  this.total = subtotal + (this.tax || 0) + (this.shippingCost || 0) - (this.discount || 0);
  return this.total;
};

// Add tracking info
OrderSchema.methods.addTracking = async function(this: any, trackingNumber: string, carrier: string): Promise<IOrder> {
  this.trackingNumber = trackingNumber;
  this.carrier = carrier;
  return this.updateStatus('shipped', `Shipped via ${carrier}. Tracking: ${trackingNumber}`);
};

// ==================== STATIC METHODS ====================
OrderSchema.statics.findByBuyer = function(buyerId: string) {
  return this.find({ buyerId })
    .populate('items.productId')
    .sort({ createdAt: -1 });
};

OrderSchema.statics.findBySupplier = function(supplierId: string) {
  return this.find({ supplierId })
    .populate('items.productId')
    .populate('buyerId', 'name email')
    .sort({ createdAt: -1 });
};

OrderSchema.statics.findByStatus = function(status: string) {
  return this.find({ status })
    .populate('buyerId', 'name email')
    .populate('supplierId', 'name businessName')
    .sort({ createdAt: -1 });
};

OrderSchema.statics.findPendingOrders = function() {
  return this.find({ status: 'pending' })
    .populate('buyerId', 'name email')
    .populate('supplierId', 'name businessName')
    .sort({ createdAt: 1 });
};

OrderSchema.statics.findRecentOrders = function(days: number = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.find({ createdAt: { $gte: date } })
    .populate('buyerId', 'name email')
    .populate('supplierId', 'name businessName')
    .sort({ createdAt: -1 });
};

OrderSchema.statics.getOrderStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageValue: { $avg: '$total' }
      }
    }
  ]);
};

OrderSchema.statics.getMonthlyRevenue = function(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['delivered', 'shipped'] }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        orderCount: { $sum: 1 },
        averageValue: { $avg: '$total' }
      }
    }
  ]);
};

OrderSchema.statics.getSupplierStats = function(supplierId: string) {
  return this.aggregate([
    {
      $match: { supplierId: new mongoose.Types.ObjectId(supplierId) }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$total' }
      }
    }
  ]);
};

// ==================== PRE-SAVE MIDDLEWARE ====================
OrderSchema.pre('save', function(this: any, next) {
  if (this.isModified('items') || this.isModified('tax') || this.isModified('shippingCost') || this.isModified('discount')) {
    this.calculateTotal();
  }
  
  if (!this.orderDate) {
    this.orderDate = new Date();
  }

  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status || 'pending',
      timestamp: new Date(),
      note: 'Order created'
    });
  }
  
  next();
});

// Validate items before saving
OrderSchema.pre('save', function(this: any, next) {
  if (!this.items || this.items.length === 0) {
    next(new Error('Order must have at least one item'));
  }
  next();
});

// ==================== POST-SAVE MIDDLEWARE ====================
OrderSchema.post('save', function(doc) {
  console.log(`Order ${doc.orderNumber} saved successfully`);
});

// ==================== TO JSON CONFIG ====================
OrderSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    const result = ret as any;
    delete result.__v;
    return result;
  }
});

OrderSchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    const result = ret as any;
    delete result.__v;
    return result;
  }
});

// ==================== MODEL CREATION ====================
// Check if model already exists to prevent overwriting
const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;