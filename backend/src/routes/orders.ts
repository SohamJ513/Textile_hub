import express from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import { Types } from 'mongoose';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// ==================== VALIDATION RULES ====================
const orderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),
  body('items.*.productId')
    .notEmpty()
    .withMessage('Each item must have a productId'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item must have a quantity of at least 1'),
  body('shippingAddress')
    .isObject()
    .withMessage('Shipping address is required'),
  body('shippingAddress.street')
    .notEmpty()
    .withMessage('Street is required'),
  body('shippingAddress.city')
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.state')
    .notEmpty()
    .withMessage('State is required'),
  body('shippingAddress.zipCode')
    .notEmpty()
    .withMessage('Zip code is required'),
  body('shippingAddress.country')
    .notEmpty()
    .withMessage('Country is required'),
  body('shippingAddress.phone')
    .notEmpty()
    .withMessage('Phone number is required')
];

// ==================== HELPER FUNCTIONS ====================
const formatValidationErrors = (errors: any[]) => {
  return errors.map(err => ({
    field: err.path || err.param || 'unknown',
    message: err.msg
  }));
};

// Define the order item interface
interface OrderItem {
  productId: Types.ObjectId;
  quantity: number;
  price: number;
  productName?: string;
  productImage?: string;
}

// Helper to safely get ID from populated object
const getIdFromPopulated = (obj: any): string | undefined => {
  if (!obj) return undefined;
  if (typeof obj === 'string') return obj;
  if (obj._id) return obj._id.toString();
  if (obj.id) return obj.id.toString();
  return undefined;
};

// ==================== CREATE ORDER ====================
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['buyer']),
  orderValidation,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: formatValidationErrors(errors.array())
        });
      }

      const { items, shippingAddress, notes, paymentMethod } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      let total = 0;
      let subtotal = 0;
      const orderItems: OrderItem[] = [];
      let supplierId: Types.ObjectId | null = null;

      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            error: `Product ${item.productId} not found`
          });
        }

        if (!product.isActive) {
          return res.status(400).json({
            success: false,
            error: `Product ${product.name} is no longer available`
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
          });
        }

        if (!supplierId) {
          supplierId = product.supplierId as Types.ObjectId;
        }

        if (supplierId.toString() !== product.supplierId.toString()) {
          return res.status(400).json({
            success: false,
            error: 'All products must be from the same supplier. Please place separate orders for different suppliers.'
          });
        }

        const itemTotal = product.price * item.quantity;
        orderItems.push({
          productId: product._id as Types.ObjectId,
          quantity: item.quantity,
          price: product.price,
          productName: product.name,
          productImage: product.images && product.images.length > 0 ? product.images[0] : undefined
        });

        subtotal += itemTotal;
        total += itemTotal;
        product.stock -= item.quantity;
        await product.save();
      }

      const tax = total * 0.1;
      const shippingCost = total > 100 ? 0 : 10;
      const grandTotal = total + tax + shippingCost;

      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const orderNumber = `ORD-${timestamp}-${random}`;

      const order = new Order({
        buyerId: new Types.ObjectId(userId),
        supplierId: supplierId || new Types.ObjectId(userId),
        items: orderItems,
        subtotal: subtotal,
        total: grandTotal,
        tax: tax,
        shippingCost: shippingCost,
        shippingAddress: shippingAddress,
        orderNumber: orderNumber,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: paymentMethod || 'cash',
        notes: notes || '',
        orderDate: new Date(),
        statusHistory: [{
          status: 'pending',
          timestamp: new Date(),
          note: 'Order placed successfully'
        }]
      });

      await order.save();

      const populatedOrder = await Order.findById(order._id)
        .populate('items.productId')
        .populate('buyerId', 'name email phone')
        .populate('supplierId', 'name businessName email phone');

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order: populatedOrder
      });
    } catch (error: any) {
      console.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Server error. Please try again later.'
      });
    }
  }
);

// ==================== GET BUYER ORDERS ====================
router.get('/buyer', authMiddleware, roleMiddleware(['buyer']), async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;
    const { status, limit = 50, page = 1 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const filter: any = {
      buyerId: new Types.ObjectId(userId)
    };

    if (status) filter.status = status;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.productId')
        .populate('supplierId', 'name businessName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter)
    ]);

    // Safely transform orders - ensure items is always an array
    const safeOrders = orders.map((order: any) => {
      order.items = order.items || [];
      order.items = order.items.map((item: any) => ({
        ...item,
        productName: item.productName || item.productId?.name || 'Product',
        productImage: item.productImage || item.productId?.images?.[0] || ''
      }));
      return order;
    });

    res.json({
      success: true,
      count: safeOrders.length,
      orders: safeOrders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching buyer orders:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error. Please try again later.'
    });
  }
});

// ==================== GET SUPPLIER ORDERS ====================
router.get('/supplier', authMiddleware, roleMiddleware(['supplier']), async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;
    const { status, limit = 50, page = 1 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const filter: any = {
      supplierId: new Types.ObjectId(userId)
    };

    if (status) filter.status = status;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.productId')
        .populate('buyerId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter)
    ]);

    // Safely transform orders
    const safeOrders = orders.map((order: any) => {
      order.items = order.items || [];
      order.items = order.items.map((item: any) => ({
        ...item,
        productName: item.productName || item.productId?.name || 'Product',
        productImage: item.productImage || item.productId?.images?.[0] || ''
      }));
      return order;
    });

    res.json({
      success: true,
      count: safeOrders.length,
      orders: safeOrders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching supplier orders:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error. Please try again later.'
    });
  }
});

// ==================== GET ALL ORDERS ====================
router.get('/all', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const { limit = 50, page = 1 } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find()
        .populate('items.productId')
        .populate('buyerId', 'name email')
        .populate('supplierId', 'name businessName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments()
    ]);

    // Safely transform orders
    const safeOrders = orders.map((order: any) => {
      order.items = order.items || [];
      return order;
    });

    res.json({
      success: true,
      count: safeOrders.length,
      orders: safeOrders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error. Please try again later.'
    });
  }
});

// ==================== GET SINGLE ORDER (FIXED) ====================
router.get('/:id', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }

    const order = await Order.findById(id)
      .populate('items.productId')
      .populate('buyerId', 'name email phone')
      .populate('supplierId', 'name businessName email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // FIX: Extract IDs correctly from populated objects
    // First, check if buyerId and supplierId are populated objects or plain ObjectIds
    let buyerId: string | undefined;
    let supplierId: string | undefined;

    // Handle buyerId - could be populated object or ObjectId
    if (order.buyerId) {
      if (typeof order.buyerId === 'object' && '_id' in order.buyerId) {
        buyerId = order.buyerId._id.toString();
      } else if (typeof order.buyerId === 'object' && 'id' in order.buyerId) {
        buyerId = order.buyerId.id?.toString();
      } else if (typeof order.buyerId === 'string') {
        buyerId = order.buyerId;
      } else if (order.buyerId?.toString) {
        buyerId = order.buyerId.toString();
      }
    }

    // Handle supplierId - could be populated object or ObjectId
    if (order.supplierId) {
      if (typeof order.supplierId === 'object' && '_id' in order.supplierId) {
        supplierId = order.supplierId._id.toString();
      } else if (typeof order.supplierId === 'object' && 'id' in order.supplierId) {
        supplierId = order.supplierId.id?.toString();
      } else if (typeof order.supplierId === 'string') {
        supplierId = order.supplierId;
      } else if (order.supplierId?.toString) {
        supplierId = order.supplierId.toString();
      }
    }

    // Check if user is authorized
    const isAuthorized = buyerId === userId || supplierId === userId;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to view this order'
      });
    }

    // Safely transform order - ensure items is always an array
    const orderObj = order.toObject ? order.toObject() : order;
    const safeOrder = {
      ...orderObj,
      items: orderObj.items || []
    };

    res.json({
      success: true,
      order: safeOrder
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error. Please try again later.'
    });
  }
});

// ==================== UPDATE ORDER STATUS ====================
router.patch(
  '/:id/status',
  authMiddleware,
  roleMiddleware(['supplier']),
  [
    body('status')
      .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
      .withMessage('Invalid status'),
    body('note')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Note cannot exceed 200 characters'),
    body('trackingNumber')
      .optional()
      .trim(),
    body('carrier')
      .optional()
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

      const { id } = req.params;
      const { status, note, trackingNumber, carrier } = req.body;
      const userId = req.user?.userId;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
      }

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      if (order.supplierId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only update your own orders'
        });
      }

      // Prevent invalid status transitions
      if (order.status === 'delivered' && status !== 'refunded') {
        return res.status(400).json({
          success: false,
          error: 'Delivered orders can only be refunded'
        });
      }
      if (order.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          error: 'Cancelled orders cannot be updated'
        });
      }

      // Use the updateStatus method with history tracking
      let updatedOrder;
      if (status === 'shipped' && trackingNumber && carrier) {
        updatedOrder = await order.addTracking(trackingNumber, carrier);
      } else {
        updatedOrder = await order.updateStatus(status, note || '');
      }

      // Populate the updated order
      await updatedOrder.populate('items.productId');
      await updatedOrder.populate('buyerId', 'name email');
      await updatedOrder.populate('supplierId', 'name email businessName');

      res.json({
        success: true,
        message: `Order status updated to '${status}'`,
        order: updatedOrder
      });
    } catch (error: any) {
      console.error('Error updating order status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Server error. Please try again later.'
      });
    }
  }
);

// ==================== CANCEL ORDER ====================
router.patch(
  '/:id/cancel',
  authMiddleware,
  roleMiddleware(['buyer']),
  async (req: AuthRequest, res: express.Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
      }

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      if (order.buyerId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only cancel your own orders'
        });
      }

      const cancelledOrder = await order.cancel();

      // Restore stock
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }

      res.json({
        success: true,
        message: 'Order cancelled successfully',
        order: cancelledOrder
      });
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Server error. Please try again later.'
      });
    }
  }
);

// ==================== GET ORDER SUMMARY ====================
router.get('/summary/stats', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    let query = {};
    if (userRole === 'buyer') {
      query = { buyerId: new Types.ObjectId(userId) };
    } else if (userRole === 'supplier') {
      query = { supplierId: new Types.ObjectId(userId) };
    }

    const orders = await Order.find(query).lean();

    const summary = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + (order.total || 0), 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + (order.total || 0), 0) / orders.length : 0,
      statusBreakdown: {
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
        refunded: orders.filter(o => o.status === 'refunded').length
      },
      paymentBreakdown: {
        pending: orders.filter(o => o.paymentStatus === 'pending').length,
        paid: orders.filter(o => o.paymentStatus === 'paid').length,
        failed: orders.filter(o => o.paymentStatus === 'failed').length,
        refunded: orders.filter(o => o.paymentStatus === 'refunded').length
      }
    };

    res.json({
      success: true,
      summary
    });
  } catch (error: any) {
    console.error('Error fetching order summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error. Please try again later.'
    });
  }
});

// ==================== UPDATE PAYMENT STATUS ====================
router.patch(
  '/:id/payment',
  authMiddleware,
  roleMiddleware(['buyer', 'supplier']),
  [
    body('paymentStatus')
      .isIn(['pending', 'paid', 'failed', 'refunded'])
      .withMessage('Invalid payment status')
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
      const { paymentStatus } = req.body;
      const userId = req.user?.userId;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
      }

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      // Check authorization
      if (order.buyerId.toString() !== userId && order.supplierId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to update this order'
        });
      }

      await order.updatePaymentStatus(paymentStatus);

      res.json({
        success: true,
        message: `Payment status updated to '${paymentStatus}'`,
        order
      });
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Server error. Please try again later.'
      });
    }
  }
);

// ==================== ADD TRACKING INFO ====================
router.patch(
  '/:id/tracking',
  authMiddleware,
  roleMiddleware(['supplier']),
  [
    body('trackingNumber')
      .notEmpty()
      .withMessage('Tracking number is required'),
    body('carrier')
      .notEmpty()
      .withMessage('Carrier is required')
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
      const { trackingNumber, carrier } = req.body;
      const userId = req.user?.userId;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
      }

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      if (order.supplierId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only update your own orders'
        });
      }

      if (order.status === 'delivered' || order.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          error: `Cannot add tracking to order with status '${order.status}'`
        });
      }

      const updatedOrder = await order.addTracking(trackingNumber, carrier);

      res.json({
        success: true,
        message: 'Tracking information added successfully',
        order: updatedOrder
      });
    } catch (error: any) {
      console.error('Error adding tracking:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Server error. Please try again later.'
      });
    }
  }
);

export default router;