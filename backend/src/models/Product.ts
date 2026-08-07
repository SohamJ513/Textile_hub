import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  category: string;
  fabricType: string;
  colors: string[];
  specifications: Map<string, string>;
  price: number;
  stock: number;
  images: string[];
  supplierId: mongoose.Types.ObjectId;
  featured?: boolean;
  rating?: number;
  reviews?: number;
  tags?: string[];
  isActive?: boolean;
  inStock: boolean;
  isFeatured: boolean;
  reduceStock(quantity: number): Promise<IProduct>;
  increaseStock(quantity: number): Promise<IProduct>;
}

const ProductSchema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: { 
    type: String, 
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },
  fabricType: { 
    type: String, 
    required: [true, 'Fabric type is required'],
    trim: true,
    index: true
  },
  colors: { 
    type: [String], 
    default: [],
    validate: {
      validator: function(v: string[]) {
        return v.length <= 10;
      },
      message: 'Cannot have more than 10 colors'
    }
  },
  specifications: { 
    type: Map, 
    of: String,
    default: new Map()
  },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(v: number) {
        return v >= 0;
      },
      message: 'Price must be a positive number'
    }
  },
  stock: { 
    type: Number, 
    required: [true, 'Stock is required'],
    default: 0,
    min: [0, 'Stock cannot be negative'],
    validate: {
      validator: function(v: number) {
        return Number.isInteger(v);
      },
      message: 'Stock must be a whole number'
    }
  },
  images: { 
    type: [String], 
    default: [],
    validate: {
      validator: function(v: string[]) {
        return v.length <= 10;
      },
      message: 'Cannot have more than 10 images'
    }
  },
  supplierId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Supplier ID is required'],
    index: true
  },
  featured: { 
    type: Boolean, 
    default: false,
    index: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
    set: function(v: number) {
      return Math.round(v * 10) / 10; // Round to 1 decimal place
    }
  },
  reviews: {
    type: Number,
    min: 0,
    default: 0
  },
  tags: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, { 
  timestamps: true 
});

// ==================== INDEXES ====================
// Text search index for better search performance
ProductSchema.index({ 
  name: 'text', 
  description: 'text', 
  category: 'text',
  fabricType: 'text'
}, {
  weights: {
    name: 10,
    category: 5,
    fabricType: 3,
    description: 1
  }
});

// Compound indexes for common queries
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ fabricType: 1, price: 1 });
ProductSchema.index({ supplierId: 1, createdAt: -1 });
ProductSchema.index({ featured: 1, createdAt: -1 });
ProductSchema.index({ isActive: 1, createdAt: -1 });
ProductSchema.index({ rating: -1 }); // For sorting by rating

// ==================== VIRTUAL PROPERTIES ====================
ProductSchema.virtual('inStock').get(function(this: any) {
  return this.stock > 0;
});

ProductSchema.virtual('isFeatured').get(function(this: any) {
  return this.featured;
});

ProductSchema.virtual('averageRating').get(function(this: any) {
  return this.rating || 0;
});

ProductSchema.virtual('reviewCount').get(function(this: any) {
  return this.reviews || 0;
});

// ==================== METHODS ====================
ProductSchema.methods.reduceStock = async function(this: any, quantity: number): Promise<IProduct> {
  if (this.stock < quantity) {
    throw new Error(`Insufficient stock. Available: ${this.stock}, Requested: ${quantity}`);
  }
  this.stock -= quantity;
  return this.save();
};

ProductSchema.methods.increaseStock = async function(this: any, quantity: number): Promise<IProduct> {
  this.stock += quantity;
  return this.save();
};

ProductSchema.methods.updateRating = async function(this: any): Promise<IProduct> {
  const Review = mongoose.model('Review');
  const result = await Review.aggregate([
    {
      $match: {
        productId: this._id,
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

  if (result.length > 0) {
    this.rating = Math.round(result[0].averageRating * 10) / 10;
    this.reviews = result[0].reviewCount;
  } else {
    this.rating = 0;
    this.reviews = 0;
  }
  
  return this.save();
};

// ==================== STATIC METHODS ====================
ProductSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, isActive: true });
};

ProductSchema.statics.findFeatured = function(limit: number = 10) {
  return this.find({ featured: true, isActive: true })
    .limit(limit)
    .sort({ createdAt: -1 });
};

ProductSchema.statics.searchProducts = function(searchTerm: string) {
  return this.find(
    { $text: { $search: searchTerm }, isActive: true },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } });
};

ProductSchema.statics.findTopRated = function(limit: number = 10) {
  return this.find({ isActive: true, rating: { $gt: 0 } })
    .sort({ rating: -1, reviews: -1 })
    .limit(limit);
};

// ==================== MIDDLEWARE ====================
// Update timestamps on save
ProductSchema.pre('save', function(this: any, next) {
  this.updatedAt = new Date();
  next();
});

// Ensure price and stock are numbers
ProductSchema.pre('save', function(this: any, next) {
  if (this.price) this.price = Number(this.price);
  if (this.stock) this.stock = Number(this.stock);
  next();
});

// ==================== TO JSON CONFIG ====================
ProductSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    const result = ret as any;
    delete result.__v;
    return result;
  }
});

ProductSchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    const result = ret as any;
    delete result.__v;
    return result;
  }
});

export default mongoose.model<IProduct>('Product', ProductSchema);