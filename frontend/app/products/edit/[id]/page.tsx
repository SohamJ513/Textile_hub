'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ChevronLeftIcon,
  PlusIcon,
  XMarkIcon,
  PhotoIcon,
  TagIcon,
  CurrencyDollarIcon,
  CubeIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    fabricType: '',
    colors: [] as string[],
    specifications: {} as Record<string, string>,
    price: '',
    stock: '',
    images: [] as string[],
    featured: false,
    isActive: true,
  });
  const [newColor, setNewColor] = useState('');
  const [newImage, setNewImage] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [activeSection, setActiveSection] = useState('basic');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (parsed.role !== 'supplier') {
        router.push('/');
        return;
      }
      if (productId) {
        fetchProduct(productId);
      }
    } else {
      router.push('/login');
    }
  }, [router, productId]);

  const fetchProduct = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      const product = response.data.product;
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        fabricType: product.fabricType || '',
        colors: product.colors || [],
        specifications: product.specifications || {},
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        images: product.images || [],
        featured: product.featured || false,
        isActive: product.isActive !== false,
      });
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast.error(error.response?.data?.error || 'Failed to load product');
      router.push('/supplier/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.checked,
    });
  };

  const addColor = () => {
    if (newColor.trim() && !formData.colors.includes(newColor.trim())) {
      setFormData({
        ...formData,
        colors: [...formData.colors, newColor.trim()],
      });
      setNewColor('');
    }
  };

  const removeColor = (color: string) => {
    setFormData({
      ...formData,
      colors: formData.colors.filter((c) => c !== color),
    });
  };

  const addImage = () => {
    if (newImage.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, newImage.trim()],
      });
      setNewImage('');
    }
  };

  const removeImage = (image: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter((i) => i !== image),
    });
  };

  const addSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setFormData({
        ...formData,
        specifications: {
          ...formData.specifications,
          [specKey.trim()]: specValue.trim(),
        },
      });
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpecification = (key: string) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[key];
    setFormData({
      ...formData,
      specifications: newSpecs,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.description) {
      toast.error('Description is required');
      return;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return;
    }
    if (!formData.fabricType) {
      toast.error('Fabric type is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      toast.error('Stock must be 0 or greater');
      return;
    }

    try {
      setSubmitting(true);
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      };

      await api.put(`/products/${productId}`, productData);
      toast.success('Product updated successfully! 🎉');
      router.push('/supplier/products');
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.response?.data?.error || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: DocumentTextIcon },
    { id: 'pricing', label: 'Pricing & Stock', icon: CurrencyDollarIcon },
    { id: 'colors', label: 'Colors', icon: PaintBrushIcon },
    { id: 'images', label: 'Images', icon: PhotoIcon },
    { id: 'specs', label: 'Specifications', icon: Cog6ToothIcon },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-16 bg-textile-cream">
          <div className="flex flex-col items-center gap-4">
            <div className="loading-spinner"></div>
            <p className="text-textile-brown/60">Loading product...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen bg-textile-cream bg-textile-pattern bg-pattern">
        <div className="container-custom py-8 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-textile">
                Edit Product
              </h1>
              <p className="text-textile-brown/70 mt-1">Update your product listing</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/supplier/products"
                className="btn-textile-secondary text-sm inline-flex items-center gap-2"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Back to Products
              </Link>
            </div>
          </motion.div>

          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <span className={`badge ${formData.isActive ? 'badge-success' : 'badge-danger'} text-base`}>
              {formData.isActive ? (
                <><CheckCircleIcon className="w-4 h-4 inline mr-1" /> Active</>
              ) : (
                <><XCircleIcon className="w-4 h-4 inline mr-1" /> Inactive</>
              )}
            </span>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card-textile overflow-hidden"
          >
            {/* Section Navigation */}
            <div className="border-b-2 border-textile-gold/20 px-6 overflow-x-auto">
              <div className="flex gap-1 py-2 min-w-max">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white shadow-md'
                        : 'text-textile-brown hover:bg-textile-gold/10'
                    }`}
                  >
                    <section.icon className="w-4 h-4" />
                    {section.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Basic Info Section */}
                {activeSection === 'basic' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-semibold text-textile-brown flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-textile-indigo" />
                      Basic Information
                    </h2>

                    <div>
                      <label htmlFor="name" className="input-label">Product Name *</label>
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="e.g., Premium Cotton Fabric"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="input-label">Description *</label>
                      <textarea
                        id="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Describe your product in detail..."
                        required
                      />
                      <p className="input-help">Provide detailed information about your product</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="category" className="input-label">Category *</label>
                        <select
                          id="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="input-field"
                          required
                        >
                          <option value="">Select a category</option>
                          <option value="Cotton">Cotton</option>
                          <option value="Silk">Silk</option>
                          <option value="Linen">Linen</option>
                          <option value="Wool">Wool</option>
                          <option value="Denim">Denim</option>
                          <option value="Satin">Satin</option>
                          <option value="Velvet">Velvet</option>
                          <option value="Jute">Jute</option>
                          <option value="Polyester">Polyester</option>
                          <option value="Nylon">Nylon</option>
                          <option value="Rayon">Rayon</option>
                          <option value="Spandex">Spandex</option>
                          <option value="Bamboo">Bamboo</option>
                          <option value="Hemp">Hemp</option>
                          <option value="Organic Cotton">Organic Cotton</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="fabricType" className="input-label">Fabric Type *</label>
                        <input
                          id="fabricType"
                          type="text"
                          value={formData.fabricType}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="e.g., Pure Cotton, Silk Satin"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Pricing & Stock Section */}
                {activeSection === 'pricing' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-semibold text-textile-brown flex items-center gap-2">
                      <CurrencyDollarIcon className="w-5 h-5 text-textile-indigo" />
                      Pricing & Stock
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="price" className="input-label">Price ($) *</label>
                        <input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="stock" className="input-label">Stock Quantity *</label>
                        <input
                          id="stock"
                          type="number"
                          min="0"
                          value={formData.stock}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="0"
                          required
                        />
                        <p className="input-help">Set to 0 for out of stock</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          id="featured"
                          type="checkbox"
                          checked={formData.featured}
                          onChange={handleCheckboxChange}
                          className="w-4 h-4 text-textile-gold border-textile-gold/30 rounded focus:ring-textile-gold"
                        />
                        <label htmlFor="featured" className="text-sm font-medium text-textile-brown">
                          ⭐ Feature this product (appears on homepage)
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          id="isActive"
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={handleCheckboxChange}
                          className="w-4 h-4 text-textile-gold border-textile-gold/30 rounded focus:ring-textile-gold"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-textile-brown">
                          Product is active (visible to customers)
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Colors Section */}
                {activeSection === 'colors' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-semibold text-textile-brown flex items-center gap-2">
                      <PaintBrushIcon className="w-5 h-5 text-textile-indigo" />
                      Available Colors
                    </h2>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="input-field flex-1"
                        placeholder="Add a color (e.g., Red)"
                        onKeyDown={(e) => e.key === 'Enter' && addColor()}
                      />
                      <button
                        type="button"
                        onClick={addColor}
                        className="btn-textile-primary inline-flex items-center gap-1"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Add
                      </button>
                    </div>

                    {formData.colors.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-textile-warm/30 rounded-xl border-2 border-textile-gold/10">
                        {formData.colors.map((color) => (
                          <span
                            key={color}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full text-sm border-2 border-textile-gold/10"
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-textile-gold/20"
                              style={{ backgroundColor: color.toLowerCase() }}
                            />
                            {color}
                            <button
                              type="button"
                              onClick={() => removeColor(color)}
                              className="text-textile-brown/40 hover:text-textile-terracotta transition-colors"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="input-help">Add all available colors for your product</p>
                  </motion.div>
                )}

                {/* Images Section */}
                {activeSection === 'images' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-semibold text-textile-brown flex items-center gap-2">
                      <PhotoIcon className="w-5 h-5 text-textile-indigo" />
                      Product Images
                    </h2>

                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newImage}
                        onChange={(e) => setNewImage(e.target.value)}
                        className="input-field flex-1"
                        placeholder="Image URL (e.g., https://example.com/image.jpg)"
                        onKeyDown={(e) => e.key === 'Enter' && addImage()}
                      />
                      <button
                        type="button"
                        onClick={addImage}
                        className="btn-textile-primary inline-flex items-center gap-1"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Add
                      </button>
                    </div>

                    {formData.images.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {formData.images.map((image) => (
                          <div key={image} className="relative group">
                            <img
                              src={image}
                              alt="Product"
                              className="w-full h-24 object-cover rounded-lg border-2 border-textile-gold/10 group-hover:border-textile-gold/30 transition-all duration-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(image)}
                              className="absolute top-1 right-1 bg-textile-terracotta text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-textile-warm/30 rounded-xl border-2 border-dashed border-textile-gold/20">
                        <PhotoIcon className="w-12 h-12 text-textile-brown/20 mx-auto mb-2" />
                        <p className="text-textile-brown/40">No images added yet</p>
                      </div>
                    )}
                    <p className="input-help">Add product images to showcase your product</p>
                  </motion.div>
                )}

                {/* Specifications Section */}
                {activeSection === 'specs' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-semibold text-textile-brown flex items-center gap-2">
                      <Cog6ToothIcon className="w-5 h-5 text-textile-indigo" />
                      Specifications
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={specKey}
                        onChange={(e) => setSpecKey(e.target.value)}
                        className="input-field flex-1"
                        placeholder="Property (e.g., Weight)"
                        onKeyDown={(e) => e.key === 'Enter' && addSpecification()}
                      />
                      <input
                        type="text"
                        value={specValue}
                        onChange={(e) => setSpecValue(e.target.value)}
                        className="input-field flex-1"
                        placeholder="Value (e.g., 150 GSM)"
                        onKeyDown={(e) => e.key === 'Enter' && addSpecification()}
                      />
                      <button
                        type="button"
                        onClick={addSpecification}
                        className="btn-textile-primary inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Add
                      </button>
                    </div>

                    {Object.keys(formData.specifications).length > 0 ? (
                      <div className="bg-textile-warm/30 rounded-xl p-3 space-y-1 border-2 border-textile-gold/10">
                        {Object.entries(formData.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center text-sm p-2 hover:bg-white/50 rounded-lg transition-colors">
                            <span>
                              <span className="font-medium text-textile-brown">{key}:</span>
                              <span className="text-textile-brown/70 ml-2">{value}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSpecification(key)}
                              className="text-textile-brown/40 hover:text-textile-terracotta transition-colors"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-textile-warm/30 rounded-xl border-2 border-dashed border-textile-gold/20">
                        <Cog6ToothIcon className="w-12 h-12 text-textile-brown/20 mx-auto mb-2" />
                        <p className="text-textile-brown/40">No specifications added yet</p>
                      </div>
                    )}
                    <p className="input-help">Add product specifications like weight, material, dimensions, etc.</p>
                  </motion.div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="border-t-2 border-textile-gold/20 pt-6 mt-6 flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-textile-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
                <Link
                  href="/supplier/products"
                  className="btn-textile-secondary text-center inline-flex items-center justify-center gap-2"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </motion.div>

          {/* Decorative Thread Pattern */}
          <div className="mt-8 pt-6 border-t-2 border-textile-gold/20">
            <div className="flex justify-center gap-1">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-gradient-to-r from-textile-gold/30 to-textile-amber/30"
                  style={{ animationDelay: `${i * 0.1}s` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}