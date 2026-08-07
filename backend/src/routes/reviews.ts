import express from 'express';
import Review from '../models/Review';
import Product from '../models/Product';
import Order from '../models/Order';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';

const router = express.Router();

// ==================== HELPER FUNCTIONS ====================
const formatValidationErrors = (errors: any[]) => {
  return errors.map(err => ({
    field: err.path || err.param || 'unknown',
    message: err.msg
  }));
};

// ==================== UPDATE PRODUCT RATING ====================
const updateProductRating = async (productId: string) => {
  try {
    const result = await Review.aggregate([
      {
        $match: {
          productId: new Types.ObjectId(productId),
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
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(result[0].averageRating * 10) / 10,
        reviews: result[0].reviewCount
      });
    } else {
      // No active reviews, reset ratings
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        reviews: 0
      });
    }
  } catch (error) {
    console.error('Error updating product rating:', error);
    // Don't throw, just log the error
  }
};

// ==================== CREATE REVIEW ====================
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['buyer']),
  [
    body('productId')
      .notEmpty()
      .withMessage('Product ID is required')
      .isMongoId()
      .withMessage('Invalid product ID format'),
    body('orderId')
      .optional()
      .isMongoId()
      .withMessage('Invalid order ID format'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Title cannot exceed 100 characters'),
    body('comment')
      .notEmpty()
      .withMessage('Comment is required')
      .trim()
      .isLength({ min: 5, max: 1000 })
      .withMessage('Comment must be between 5 and 1000 characters'),
    body('images')
      .optional()
      .isArray()
      .withMessage('Images must be an array')
      .isArray({ max: 5 })
      .withMessage('Maximum 5 images allowed')
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

      const { productId, orderId, rating, title, comment, images } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      // If orderId is provided, verify purchase
      if (orderId) {
        const order = await Order.findOne({
          _id: new Types.ObjectId(orderId),
          buyerId: new Types.ObjectId(userId),
          status: { $in: ['delivered', 'shipped'] }
        });

        if (!order) {
          return res.status(403).json({
            success: false,
            error: 'You can only review products you have purchased'
          });
        }

        // Check if product exists in order (safe check)
        const productInOrder = order.items && order.items.some(
          (item: any) => item.productId && item.productId.toString() === productId
        );

        if (!productInOrder) {
          return res.status(400).json({
            success: false,
            error: 'This product was not in your order'
          });
        }
      }

      // Check if user already reviewed this product
      const existingReview = await Review.findOne({
        productId: new Types.ObjectId(productId),
        userId: new Types.ObjectId(userId),
        isActive: true
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          error: 'You have already reviewed this product'
        });
      }

      // Create review
      const review = new Review({
        productId: new Types.ObjectId(productId),
        userId: new Types.ObjectId(userId),
        orderId: orderId ? new Types.ObjectId(orderId) : null,
        rating,
        title: title || '',
        comment: comment.trim(),
        images: images || [],
        isVerifiedPurchase: !!orderId,
        isActive: true,
        helpfulCount: 0,
        replies: []
      });

      await review.save();

      // Update product rating
      await updateProductRating(productId);

      // Populate the review with user and product details
      const populatedReview = await Review.findById(review._id)
        .populate('userId', 'name profileImage')
        .populate('productId', 'name images price');

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        review: populatedReview
      });
    } catch (error: any) {
      console.error('Error creating review:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Server error. Please try again later.'
      });
    }
  }
);

// ==================== GET PRODUCT REVIEWS ====================
router.get('/product/:productId', async (req: express.Request, res: express.Response) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    if (!Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 10, 50);
    const skip = (pageNum - 1) * limitNum;

    // Build sort
    let sortOption: any = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'highest') sortOption = { rating: -1 };
    if (sort === 'lowest') sortOption = { rating: 1 };
    if (sort === 'helpful') sortOption = { helpfulCount: -1 };

    const [reviews, total, ratingSummary] = await Promise.all([
      Review.find({
        productId: new Types.ObjectId(productId),
        isActive: true
      })
        .populate('userId', 'name profileImage')
        .populate('replies.userId', 'name profileImage')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments({
        productId: new Types.ObjectId(productId),
        isActive: true
      }),
      Review.aggregate([
        {
          $match: {
            productId: new Types.ObjectId(productId),
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
      ])
    ]);

    // Build rating breakdown safely
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingSummary.forEach((item: any) => {
      if (item._id >= 1 && item._id <= 5) {
        ratingBreakdown[item._id as keyof typeof ratingBreakdown] = item.count;
      }
    });

    res.json({
      success: true,
      reviews: reviews || [],
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      ratingBreakdown
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error. Please try again later.'
    });
  }
});

// ==================== GET USER REVIEWS ====================
router.get('/user', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const reviews = await Review.find({
      userId: new Types.ObjectId(userId),
      isActive: true
    })
      .populate('productId', 'name images price category')
      .populate('orderId', 'orderNumber status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Safely transform reviews - ensure all fields exist
    const safeReviews = reviews.map((review: any) => {
      // Ensure productId exists
      if (!review.productId) {
        review.productId = { name: 'Product not found', images: [], price: 0 };
      }
      // Ensure orderId exists if needed
      if (!review.orderId) {
        review.orderId = null;
      }
      return review;
    });

    res.json({
      success: true,
      count: safeReviews.length,
      reviews: safeReviews
    });
  } catch (error: any) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error. Please try again later.'
    });
  }
});

// ==================== GET SINGLE REVIEW ====================
router.get('/:id', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid review ID format'
      });
    }

    const review = await Review.findById(id)
      .populate('userId', 'name profileImage')
      .populate('productId', 'name images price category description')
      .populate('orderId', 'orderNumber status createdAt')
      .populate('replies.userId', 'name profileImage')
      .lean();

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    res.json({
      success: true,
      review
    });
  } catch (error: any) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error. Please try again later.'
    });
  }
});

// ==================== MARK REVIEW HELPFUL ====================
router.patch(
  '/:id/helpful',
  authMiddleware,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid review ID format'
        });
      }

      const review = await Review.findById(id);
      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found'
        });
      }

      review.helpfulCount = (review.helpfulCount || 0) + 1;
      await review.save();

      res.json({
        success: true,
        message: 'Marked as helpful',
        helpfulCount: review.helpfulCount
      });
    } catch (error: any) {
      console.error('Error marking helpful:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Server error. Please try again later.'
      });
    }
  }
);

// ==================== ADD REPLY TO REVIEW ====================
router.patch(
  '/:id/reply',
  authMiddleware,
  roleMiddleware(['supplier']),
  [
    body('comment')
      .notEmpty()
      .withMessage('Reply comment is required')
      .trim()
      .isLength({ min: 2, max: 500 })
      .withMessage('Reply must be between 2 and 500 characters')
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

      const { id } = req.params;
      const userId = req.user?.userId;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid review ID format'
        });
      }

      const review = await Review.findById(id);
      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found'
        });
      }

      // Check if supplier owns the product
      const product = await Product.findById(review.productId);
      if (!product || product.supplierId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only reply to reviews for your products'
        });
      }

      // Add reply
      review.replies = review.replies || [];
      review.replies.push({
        userId: new Types.ObjectId(userId),
        comment: req.body.comment.trim(),
        createdAt: new Date()
      });

      await review.save();

      const updatedReview = await Review.findById(review._id)
        .populate('userId', 'name profileImage')
        .populate('replies.userId', 'name profileImage');

      res.json({
        success: true,
        message: 'Reply added successfully',
        review: updatedReview
      });
    } catch (error: any) {
      console.error('Error adding reply:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Server error. Please try again later.'
      });
    }
  }
);

// ==================== UPDATE REVIEW ====================
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['buyer']),
  [
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Title cannot exceed 100 characters'),
    body('comment')
      .optional()
      .trim()
      .isLength({ min: 5, max: 1000 })
      .withMessage('Comment must be between 5 and 1000 characters'),
    body('images')
      .optional()
      .isArray()
      .withMessage('Images must be an array')
      .isArray({ max: 5 })
      .withMessage('Maximum 5 images allowed')
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

      const { id } = req.params;
      const userId = req.user?.userId;
      const { rating, title, comment, images } = req.body;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid review ID format'
        });
      }

      const review = await Review.findById(id);
      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found'
        });
      }

      // Check ownership
      if (review.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only update your own reviews'
        });
      }

      // Update fields
      if (rating) review.rating = rating;
      if (title !== undefined) review.title = title;
      if (comment) review.comment = comment.trim();
      if (images) review.images = images;

      await review.save();

      // Update product rating
      await updateProductRating(review.productId.toString());

      const updatedReview = await Review.findById(review._id)
        .populate('userId', 'name profileImage')
        .populate('productId', 'name images price');

      res.json({
        success: true,
        message: 'Review updated successfully',
        review: updatedReview
      });
    } catch (error: any) {
      console.error('Error updating review:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Server error. Please try again later.'
      });
    }
  }
);

// ==================== DELETE REVIEW ====================
router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid review ID format'
        });
      }

      const review = await Review.findById(id);
      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found'
        });
      }

      // Check if user owns the review
      if (review.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete your own reviews'
        });
      }

      // Soft delete
      review.isActive = false;
      await review.save();

      // Update product rating
      await updateProductRating(review.productId.toString());

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting review:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Server error. Please try again later.'
      });
    }
  }
);

// ==================== GET PRODUCT RATING SUMMARY ====================
router.get('/summary/:productId', async (req: express.Request, res: express.Response) => {
  try {
    const { productId } = req.params;

    if (!Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(productId)
      .select('rating reviews');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const ratingDistribution = await Review.aggregate([
      {
        $match: {
          productId: new Types.ObjectId(productId),
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

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingDistribution.forEach((item: any) => {
      if (item._id >= 1 && item._id <= 5) {
        distribution[item._id as keyof typeof distribution] = item.count;
      }
    });

    res.json({
      success: true,
      averageRating: product.rating || 0,
      totalReviews: product.reviews || 0,
      distribution
    });
  } catch (error: any) {
    console.error('Error fetching rating summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error. Please try again later.'
    });
  }
});

export default router;