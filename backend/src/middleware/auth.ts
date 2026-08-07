import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

// ==================== TYPES ====================
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// ==================== AUTH MIDDLEWARE ====================
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. No token provided.' 
      });
    }

    // Check if token is in correct format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token format. Expected: Bearer <token>' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. Invalid token format.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as DecodedToken;
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId).select('isActive role email name');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'User no longer exists.' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        error: 'Account is deactivated. Please contact support.' 
      });
    }

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token. Please log in again.' 
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired. Please log in again.' 
      });
    }

    if (error instanceof jwt.NotBeforeError) {
      return res.status(401).json({ 
        success: false,
        error: 'Token not active yet. Please wait.' 
      });
    }

    // Generic error
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false,
      error: 'Authentication failed. Please try again.' 
    });
  }
};

// ==================== ROLE MIDDLEWARE ====================
export const roleMiddleware = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Check if user exists
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          error: 'User not authenticated.' 
        });
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false,
          error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
          yourRole: req.user.role
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(403).json({ 
        success: false,
        error: 'Authorization failed. Please try again.' 
      });
    }
  };
};

// ==================== OPTIONAL AUTH MIDDLEWARE ====================
export const optionalAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as DecodedToken;
      
      const user = await User.findById(decoded.userId).select('isActive role email name');
      if (user && user.isActive) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };
      }
    }
    next();
  } catch (error) {
    // Silently fail - user remains unauthenticated
    next();
  }
};

// ==================== PERMISSION MIDDLEWARE ====================
export const permissionMiddleware = (resource: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // This is a placeholder for a more sophisticated permission system
      // You can expand this to check against a permissions table
      
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          error: 'User not authenticated.' 
        });
      }

      // Admin has all permissions
      if (req.user.role === 'admin') {
        return next();
      }

      // Suppliers can manage their own products
      if (req.user.role === 'supplier' && resource === 'product' && ['create', 'update', 'delete'].includes(action)) {
        // Check if the product belongs to this supplier
        const productId = req.params.id || req.body.productId;
        if (productId) {
          const Product = require('../models/Product').default;
          const product = await Product.findById(productId);
          if (product && product.supplierId.toString() === req.user.userId) {
            return next();
          }
        } else {
          // Creating new product - allow
          return next();
        }
      }

      // Buyers can manage their own orders
      if (req.user.role === 'buyer' && resource === 'order' && ['view', 'cancel'].includes(action)) {
        const orderId = req.params.id || req.body.orderId;
        if (orderId) {
          const Order = require('../models/Order').default;
          const order = await Order.findById(orderId);
          if (order && order.buyerId.toString() === req.user.userId) {
            return next();
          }
        }
      }

      return res.status(403).json({ 
        success: false,
        error: `You don't have permission to ${action} ${resource}` 
      });
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(403).json({ 
        success: false,
        error: 'Authorization failed. Please try again.' 
      });
    }
  };
};

// ==================== RATE LIMIT MIDDLEWARE ====================
// Simple in-memory rate limiter (for demonstration)
const rateLimitStore = new Map<string, { count: number, resetTime: number }>();

export const rateLimitMiddleware = (windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `rate:${ip}`;
    
    const now = Date.now();
    const record = rateLimitStore.get(key);
    
    if (!record) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({ 
        success: false,
        error: 'Too many requests. Please try again later.' 
      });
    }
    
    record.count++;
    rateLimitStore.set(key, record);
    next();
  };
};

// ==================== HELPER FUNCTIONS ====================
export const generateToken = (userId: string, email: string, role: string): string => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): DecodedToken | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret') as DecodedToken;
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch (error) {
    return null;
  }
};

// ==================== EXPORTS ====================
export default {
  authMiddleware,
  roleMiddleware,
  optionalAuthMiddleware,
  permissionMiddleware,
  rateLimitMiddleware,
  generateToken,
  verifyToken,
  decodeToken
};