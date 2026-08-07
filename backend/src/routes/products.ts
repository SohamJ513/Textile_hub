import express from 'express';
import Product from '../models/Product';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// ==================== VALIDATION RULES ====================
const productValidation = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Product name cannot exceed 100 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .trim(),
  body('fabricType')
    .notEmpty()
    .withMessage('Fabric type is required')
    .trim(),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .isNumeric()
    .withMessage('Stock must be a number')
    .isInt({ min: 0 })
    .withMessage('Stock must be a whole number'),
  body('colors')
    .optional()
    .isArray()
    .withMessage('Colors must be an array'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('specifications')
    .optional()
    .isObject()
    .withMessage('Specifications must be an object')
];

// ==================== HELPER FUNCTIONS ====================
const formatValidationErrors = (errors: any[]) => {
  return errors.map(err => ({
    field: err.path || err.param || 'unknown',
    message: err.msg
  }));
};

// ==================== GET ALL PRODUCTS ====================
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const { 
      category, 
      fabricType, 
      search, 
      minPrice, 
      maxPrice, 
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 50,
      page = 1,
      inStock,
      supplierId,
      colors
    } = req.query;
    
    const filter: any = {};
    
    // Basic filters
    if (category) filter.category = category;
    if (fabricType) filter.fabricType = fabricType;
    if (featured === 'true') filter.featured = true;
    if (supplierId) filter.supplierId = supplierId;
    if (inStock === 'true') filter.stock = { $gt: 0 };
    
    // Search filter (text search)
    if (search) {
      filter.$text = { $search: search as string };
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice as string);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice as string);
    }
    
    // Colors filter
    if (colors) {
      const colorArray = (colors as string).split(',');
      filter.colors = { $in: colorArray };
    }
    
    // Build sort
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;
    
    // Pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query
    let query = Product.find(filter);
    
    // If searching, use text search score for sorting
    if (search) {
      // Use lean() to avoid TypeScript issues with select
      const products = await query
        .populate('supplierId', 'name businessName businessType')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();
      
      const total = await Product.countDocuments(filter);
      
      // Convert products to include inStock
      const productsJson = products.map(product => ({
        ...product,
        inStock: (product as any).stock > 0
      }));
      
      return res.json({
        success: true,
        products: productsJson,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });
    }
    
    const products = await query
      .populate('supplierId', 'name businessName businessType')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);
    
    const total = await Product.countDocuments(filter);
    
    // Convert products to JSON with virtuals
    const productsJson = products.map(product => {
      const json = product.toJSON();
      return {
        ...json,
        inStock: product.stock > 0
      };
    });
    
    res.json({
      success: true,
      products: productsJson,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error. Please try again later.' 
    });
  }
});

// ==================== GET FEATURED PRODUCTS ====================
router.get('/featured', async (req: express.Request, res: express.Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
    
    const products = await Product.find({ 
      featured: true, 
      isActive: true,
      stock: { $gt: 0 }
    })
      .populate('supplierId', 'name businessName')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    const productsJson = products.map(product => ({
      ...product.toJSON(),
      inStock: product.stock > 0
    }));
    
    res.json({
      success: true,
      products: productsJson
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error. Please try again later.' 
    });
  }
});

// ==================== GET PRODUCT BY ID ====================
router.get('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('supplierId', 'name businessName businessType email phone');
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    
    const productJson = {
      ...product.toJSON(),
      inStock: product.stock > 0
    };
    
    res.json({
      success: true,
      product: productJson
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error. Please try again later.' 
    });
  }
});

// ==================== CREATE PRODUCT ====================
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['supplier']),
  productValidation,
  async (req: AuthRequest, res: express.Response) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: formatValidationErrors(errors.array())
        });
      }

      const productData = {
        ...req.body,
        supplierId: req.user?.userId,
        isActive: true
      };
      
      const product = new Product(productData);
      await product.save();
      
      const populatedProduct = await Product.findById(product._id)
        .populate('supplierId', 'name businessName');
      
      const productJson = populatedProduct ? {
        ...populatedProduct.toJSON(),
        inStock: populatedProduct.stock > 0
      } : null;
      
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product: productJson
      });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error. Please try again later.' 
      });
    }
  }
);

// ==================== UPDATE PRODUCT ====================
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['supplier']),
  productValidation,
  async (req: AuthRequest, res: express.Response) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: formatValidationErrors(errors.array())
        });
      }

      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ 
          success: false,
          error: 'Product not found' 
        });
      }
      
      // Check ownership
      if (product.supplierId.toString() !== req.user?.userId) {
        return res.status(403).json({ 
          success: false,
          error: 'You can only update your own products' 
        });
      }
      
      // Prevent updating supplierId
      delete req.body.supplierId;
      
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('supplierId', 'name businessName');
      
      const productJson = updatedProduct ? {
        ...updatedProduct.toJSON(),
        inStock: updatedProduct.stock > 0
      } : null;
      
      res.json({
        success: true,
        message: 'Product updated successfully',
        product: productJson
      });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error. Please try again later.' 
      });
    }
  }
);

// ==================== DELETE PRODUCT ====================
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['supplier']),
  async (req: AuthRequest, res: express.Response) => {
    try {
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ 
          success: false,
          error: 'Product not found' 
        });
      }
      
      // Check ownership
      if (product.supplierId.toString() !== req.user?.userId) {
        return res.status(403).json({ 
          success: false,
          error: 'You can only delete your own products' 
        });
      }
      
      // Soft delete by setting isActive to false
      product.isActive = false;
      await product.save();
      
      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error. Please try again later.' 
      });
    }
  }
);

// ==================== HARD DELETE PRODUCT ====================
router.delete(
  '/:id/permanent',
  authMiddleware,
  roleMiddleware(['supplier']),
  async (req: AuthRequest, res: express.Response) => {
    try {
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ 
          success: false,
          error: 'Product not found' 
        });
      }
      
      // Check ownership
      if (product.supplierId.toString() !== req.user?.userId) {
        return res.status(403).json({ 
          success: false,
          error: 'You can only delete your own products' 
        });
      }
      
      await product.deleteOne();
      
      res.json({
        success: true,
        message: 'Product permanently deleted'
      });
    } catch (error) {
      console.error('Hard delete product error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error. Please try again later.' 
      });
    }
  }
);

// ==================== UPDATE PRODUCT STOCK ====================
router.patch(
  '/:id/stock',
  authMiddleware,
  roleMiddleware(['supplier']),
  [
    body('stock')
      .isInt({ min: 0 })
      .withMessage('Stock must be a positive whole number')
  ],
  async (req: AuthRequest, res: express.Response) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: formatValidationErrors(errors.array())
        });
      }

      const { stock } = req.body;
      
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ 
          success: false,
          error: 'Product not found' 
        });
      }
      
      // Check ownership
      if (product.supplierId.toString() !== req.user?.userId) {
        return res.status(403).json({ 
          success: false,
          error: 'You can only update your own products' 
        });
      }
      
      product.stock = stock;
      await product.save();
      
      res.json({
        success: true,
        message: 'Product stock updated successfully',
        product: {
          id: product._id,
          name: product.name,
          stock: product.stock,
          inStock: product.stock > 0
        }
      });
    } catch (error) {
      console.error('Update stock error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error. Please try again later.' 
      });
    }
  }
);

// ==================== TOGGLE FEATURED ====================
router.patch(
  '/:id/featured',
  authMiddleware,
  roleMiddleware(['supplier']),
  async (req: AuthRequest, res: express.Response) => {
    try {
      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ 
          success: false,
          error: 'Product not found' 
        });
      }
      
      // Check ownership
      if (product.supplierId.toString() !== req.user?.userId) {
        return res.status(403).json({ 
          success: false,
          error: 'You can only update your own products' 
        });
      }
      
      product.featured = !product.featured;
      await product.save();
      
      res.json({
        success: true,
        message: `Product ${product.featured ? 'featured' : 'unfeatured'} successfully`,
        product: {
          id: product._id,
          name: product.name,
          featured: product.featured,
          inStock: product.stock > 0
        }
      });
    } catch (error) {
      console.error('Toggle featured error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error. Please try again later.' 
      });
    }
  }
);

// ==================== GET PRODUCTS BY SUPPLIER ====================
router.get(
  '/supplier/:supplierId',
  async (req: express.Request, res: express.Response) => {
    try {
      const { supplierId } = req.params;
      const { isActive, featured } = req.query;
      
      const filter: any = { supplierId };
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (featured !== undefined) filter.featured = featured === 'true';
      
      const products = await Product.find(filter)
        .populate('supplierId', 'name businessName')
        .sort({ createdAt: -1 });
      
      const productsJson = products.map(product => ({
        ...product.toJSON(),
        inStock: product.stock > 0
      }));
      
      res.json({
        success: true,
        count: products.length,
        products: productsJson
      });
    } catch (error) {
      console.error('Get supplier products error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Server error. Please try again later.' 
      });
    }
  }
);

// ==================== SEARCH PRODUCTS ====================
router.get('/search', async (req: express.Request, res: express.Response) => {
  try {
    const { q, category, fabricType, minPrice, maxPrice } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const filter: any = {
      $text: { $search: q as string },
      isActive: true
    };
    
    if (category) filter.category = category;
    if (fabricType) filter.fabricType = fabricType;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice as string);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice as string);
    }
    
    // Use lean() to avoid TypeScript issues
    const products = await Product.find(filter)
      .populate('supplierId', 'name businessName')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    const productsJson = products.map(product => ({
      ...product,
      inStock: (product as any).stock > 0
    }));
    
    res.json({
      success: true,
      query: q,
      count: products.length,
      products: productsJson
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error. Please try again later.' 
    });
  }
});

// ==================== GET PRODUCT CATEGORIES ====================
router.get('/categories/list', async (req: express.Request, res: express.Response) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    const fabricTypes = await Product.distinct('fabricType', { isActive: true });
    
    res.json({
      success: true,
      categories: categories.sort(),
      fabricTypes: fabricTypes.sort()
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error. Please try again later.' 
    });
  }
});

export default router;