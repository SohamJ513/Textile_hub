import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId; // Made optional
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  isActive: boolean;
  helpfulCount: number;
  replies: Array<{
    userId: mongoose.Types.ObjectId;
    comment: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: false, // Made optional
    default: null
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
    default: ''
  },
  comment: {
    type: String,
    trim: true,
    required: [true, 'Comment is required'],
    minlength: [5, 'Comment must be at least 5 characters'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(v: string[]) {
        return v.length <= 5;
      },
      message: 'Maximum 5 images allowed'
    }
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  helpfulCount: {
    type: Number,
    default: 0,
    min: [0, 'Helpful count cannot be negative']
  },
  replies: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'Reply must be at least 2 characters'],
      maxlength: [500, 'Reply cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== INDEXES ====================
// Ensure one review per user per product (active reviews only)
ReviewSchema.index(
  { productId: 1, userId: 1 }, 
  { unique: true, partialFilterExpression: { isActive: true } }
);

// For product rating aggregation
ReviewSchema.index({ productId: 1, rating: 1 });
ReviewSchema.index({ productId: 1, isActive: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, isActive: 1, createdAt: -1 });
ReviewSchema.index({ isActive: 1, createdAt: -1 });

// For product review counts
ReviewSchema.index({ productId: 1, isActive: 1 });

// ==================== VIRTUAL PROPERTIES ====================
ReviewSchema.virtual('isOwnedByUser').get(function(this: any) {
  return this.userId;
});

ReviewSchema.virtual('hasReplies').get(function(this: any) {
  return this.replies && this.replies.length > 0;
});

ReviewSchema.virtual('replyCount').get(function(this: any) {
  return this.replies ? this.replies.length : 0;
});

ReviewSchema.virtual('ratingPercentage').get(function(this: any) {
  return (this.rating / 5) * 100;
});

// ==================== METHODS ====================
// Add reply method
ReviewSchema.methods.addReply = async function(this: any, userId: string, comment: string) {
  if (!this.replies) {
    this.replies = [];
  }
  
  this.replies.push({
    userId: new mongoose.Types.ObjectId(userId),
    comment: comment.trim(),
    createdAt: new Date()
  });
  
  return this.save();
};

// Mark as helpful method
ReviewSchema.methods.markHelpful = async function(this: any) {
  this.helpfulCount = (this.helpfulCount || 0) + 1;
  return this.save();
};

// Soft delete method
ReviewSchema.methods.softDelete = async function(this: any) {
  this.isActive = false;
  return this.save();
};

// ==================== STATIC METHODS ====================
// Get average rating for a product
ReviewSchema.statics.getAverageRating = async function(productId: string) {
  const result = await this.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
        isActive: true
      }
    },
    {
      $group: {
        _id: '$productId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    reviewCount: result[0].reviewCount
  } : {
    averageRating: 0,
    reviewCount: 0
  };
};

// Get rating breakdown for a product
ReviewSchema.statics.getRatingBreakdown = async function(productId: string) {
  const result = await this.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
        isActive: true
      }
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);
  
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  result.forEach((item: any) => {
    if (item._id >= 1 && item._id <= 5) {
      breakdown[item._id as keyof typeof breakdown] = item.count;
    }
  });
  
  return breakdown;
};

// Get user reviews with pagination
ReviewSchema.statics.getUserReviews = async function(
  userId: string,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;
  
  const [reviews, total] = await Promise.all([
    this.find({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true
    })
      .populate('productId', 'name images price category')
      .populate('orderId', 'orderNumber status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true
    })
  ]);
  
  return {
    reviews,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

// Get product reviews with pagination
ReviewSchema.statics.getProductReviews = async function(
  productId: string,
  page: number = 1,
  limit: number = 10,
  sort: string = 'newest'
) {
  const skip = (page - 1) * limit;
  
  let sortOption: any = { createdAt: -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };
  if (sort === 'highest') sortOption = { rating: -1 };
  if (sort === 'lowest') sortOption = { rating: 1 };
  if (sort === 'helpful') sortOption = { helpfulCount: -1 };
  
  const [reviews, total] = await Promise.all([
    this.find({
      productId: new mongoose.Types.ObjectId(productId),
      isActive: true
    })
      .populate('userId', 'name profileImage')
      .populate('replies.userId', 'name profileImage')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments({
      productId: new mongoose.Types.ObjectId(productId),
      isActive: true
    })
  ]);
  
  return {
    reviews,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

// ==================== PRE-SAVE MIDDLEWARE ====================
ReviewSchema.pre('save', function(this: any, next) {
  // Ensure comment is not empty
  if (this.comment && !this.comment.trim()) {
    next(new Error('Comment cannot be empty'));
  }
  
  // Trim comment
  if (this.comment) {
    this.comment = this.comment.trim();
  }
  
  // Trim title
  if (this.title) {
    this.title = this.title.trim();
  }
  
  // Ensure images array exists
  if (!this.images) {
    this.images = [];
  }
  
  // Ensure replies array exists
  if (!this.replies) {
    this.replies = [];
  }
  
  next();
});

// ==================== POST-SAVE MIDDLEWARE ====================
ReviewSchema.post('save', function(doc) {
  console.log(`Review saved for product ${doc.productId} by user ${doc.userId}`);
});

// ==================== POST-DELETE MIDDLEWARE ====================
ReviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    console.log(`Review deleted for product ${doc.productId}`);
  }
});

// ==================== TO JSON CONFIG ====================
ReviewSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    const result = ret as any;
    delete result.__v;
    return result;
  }
});

ReviewSchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    const result = ret as any;
    delete result.__v;
    return result;
  }
});

// ==================== MODEL CREATION ====================
// Check if model already exists to prevent overwriting
const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;