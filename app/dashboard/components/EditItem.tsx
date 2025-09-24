"use client";
import { useState, useRef, useEffect } from "react";

// Define the types
interface ItemRequest {
  itemName: string;
  category: string;
  description: string;
  price: number;
  stockQuantity: number;
  sellingPrice: number;
  supplier: string;
  sellingUnit: string;
  lengthType?: string;
  piecesPerBox?: number;
  images?: string[];
  variants: { [key: string]: string };
}

interface ItemResponse {
  id: number;
  itemName: string;
  category: string;
  description: string;
  price: number;
  stockQuantity: number;
  sellingPrice: number;
  supplier: string;
  sellingUnit: string;
  lengthType?: string;
  piecesPerBox?: number;
  imageUrls: string[];
  variants: { [key: string]: string };
}

// Edit Modal Component
export default function EditItem({ item, onClose, onUpdate }: { 
  item: ItemResponse; 
  onClose: () => void; 
  onUpdate: () => void;
}) {
  // Hardware categories common in Kenya
  const hardwareCategories = [
    'Building Materials',
    'Tools & Equipment',
    'Plumbing Supplies',
    'Electrical Supplies',
    'Paints & Coatings',
    'Hardware & Fasteners',
    'Safety Equipment',
    'Garden & Outdoor',
    'Chemicals & Adhesives',
    'Hardware Accessories',
    'Welding Materials'
  ];

  // Selling units
  const sellingUnits = [
    { value: 'pcs', label: 'Pieces' },
    { value: 'boxes', label: 'Boxes' },
    { value: 'length', label: 'Length' }
  ];

  // Variant templates for each category
  const variantTemplates = {
    'Building Materials': ['Size', 'Color', 'Material', 'Brand', 'Grade'],
    'Tools & Equipment': ['Type', 'Size', 'Power Source', 'Brand', 'Weight'],
    'Plumbing Supplies': ['Diameter', 'Material', 'Type', 'Length', 'Connection Type'],
    'Electrical Supplies': ['Voltage', 'Current Rating', 'Type', 'Color', 'Certification'],
    'Paints & Coatings': ['Color', 'Finish', 'Base', 'Volume', 'Drying Time'],
    'Hardware & Fasteners': ['Size', 'Material', 'Type', 'Length', 'Head Type'],
    'Safety Equipment': ['Size', 'Material', 'Type', 'Certification', 'Color'],
    'Garden & Outdoor': ['Size', 'Material', 'Type', 'Color', 'Weather Resistance'],
    'Chemicals & Adhesives': ['Type', 'Volume', 'Curing Time', 'Color', 'Application'],
    'Hardware Accessories': ['Size', 'Material', 'Type', 'Color', 'Brand'], 
    'Welding Materials': ['Size', 'Gauge', 'Type', 'Color', 'Brand']
  };

  // Form state - initialize with the item data
  const [formData, setFormData] = useState({
    itemName: item.itemName || '',
    category: item.category || '',
    description: item.description || '',
    price: item.price.toString() || '',
    stockQuantity: item.stockQuantity.toString() || '',
    SellingPrice: item.sellingPrice.toString() || '',
    supplier: item.supplier || '',
    sellingUnit: item.sellingUnit.toLowerCase() || 'pcs',
    lengthType: item.lengthType?.toLowerCase() || 'full',
    piecesPerBox: item.piecesPerBox?.toString() || '',
    variants: []
  });

  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [variantValues, setVariantValues] = useState<{ [key: string]: string }>(item.variants || {});
  const [uploadedImages, setUploadedImages] = useState<{ id: number; file: any; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize variants based on category
  useEffect(() => {
    if (item.category) {
      const category = item.category as keyof typeof variantTemplates;
      setSelectedVariants(variantTemplates[category] || []);
    }
  }, [item.category]);

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value as keyof typeof variantTemplates;
    setFormData({ ...formData, category, variants: [] });
    setSelectedVariants(variantTemplates[category] || []);
  };

  // Handle selling unit change
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sellingUnit = e.target.value;
    setFormData({ 
      ...formData, 
      sellingUnit,
      // Reset related fields when unit changes
      piecesPerBox: sellingUnit === 'boxes' ? formData.piecesPerBox : '',
      lengthType: sellingUnit === 'length' ? formData.lengthType : 'full'
    });
  };

  // Handle variant value change
  const handleVariantChange = (variant: string, value: string) => {
    setVariantValues({ ...variantValues, [variant]: value });
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: { id: number; file: File; name: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      newImages.push({
        id: Date.now() + i,
        file: file,
        name: file.name
      });
    }
    
    setUploadedImages(prev => [...prev, ...newImages]);
    
    // Reset the file input
    if (e.target) {
      e.target.value = '';
    }
  };

  // Handle image removal
  const handleRemoveImage = (id: number) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  // Trigger file input click
  const handleAddImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Convert variants from array to map format expected by backend
      const variantsMap: { [key: string]: string } = {};
      selectedVariants.forEach(variant => {
        if (variantValues[variant]) {
          variantsMap[variant] = variantValues[variant];
        }
      });

      // Prepare the data for API
      const itemData: ItemRequest = {
        itemName: formData.itemName,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        sellingPrice: parseFloat(formData.SellingPrice),
        supplier: formData.supplier,
        sellingUnit: formData.sellingUnit.toUpperCase(),
        lengthType: formData.sellingUnit === 'length' ? formData.lengthType.toUpperCase() : undefined,
        piecesPerBox: formData.sellingUnit === 'boxes' ? parseInt(formData.piecesPerBox) : undefined,
        images: uploadedImages.map(img => img.name),
        variants: variantsMap
      };

      // Send update to backend
      const response = await fetch(`http://localhost:8080/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      
      if (!response.ok) throw new Error('Failed to update item');
      
      console.log('Item updated successfully:', response);
      alert('Item updated successfully!');
      onUpdate(); // Refresh the items list
      onClose(); // Close the modal
      
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Edit Hardware Item</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              type="text"
              value={formData.itemName}
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>
          
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={handleCategoryChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            >
              <option value="">Select a category</option>
              {hardwareCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* Selling Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Unit</label>
            <select
              value={formData.sellingUnit}
              onChange={handleUnitChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            >
              {sellingUnits.map((unit) => (
                <option key={unit.value} value={unit.value}>{unit.label}</option>
              ))}
            </select>
          </div>
          
          {/* Additional fields based on selling unit */}
          {formData.sellingUnit === 'boxes' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pieces per Box</label>
              <input
                type="number"
                value={formData.piecesPerBox}
                onChange={(e) => setFormData({ ...formData, piecesPerBox: e.target.value })}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
          )}
          
          {formData.sellingUnit === 'length' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Length Type</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="full"
                    checked={formData.lengthType === 'full'}
                    onChange={(e) => setFormData({ ...formData, lengthType: e.target.value })}
                    className="text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="ml-2">Full Length</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="half"
                    checked={formData.lengthType === 'half'}
                    onChange={(e) => setFormData({ ...formData, lengthType: e.target.value })}
                    className="text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="ml-2">Half Length</span>
                </label>
              </div>
            </div>
          )}
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            ></textarea>
          </div>
          
          {/* Price and Stock Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (KES)</label>
              <input
                type="number"
                value={formData.SellingPrice}
                onChange={(e) => setFormData({ ...formData, SellingPrice: e.target.value })}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.sellingUnit === 'boxes' ? 'Number of Boxes' : 
                 formData.sellingUnit === 'length' ? 'Length Quantity' : 
                 'Stock Quantity'}
              </label>
              <input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buying Price (KES)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Item Images</label>
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              multiple
              accept="image/*"
              className="hidden"
              disabled={loading}
            />
            
            {/* Upload button */}
            <button
              type="button"
              onClick={handleAddImageClick}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-300 mb-4 disabled:opacity-50"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Upload Images
            </button>
            
            {/* Image list (no previews) */}
            {uploadedImages.length > 0 && (
              <div className="border rounded-md p-4 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Images:</h3>
                <ul className="space-y-2">
                  {uploadedImages.map((image) => (
                    <li key={image.id} className="flex items-center justify-between bg-white p-2 rounded-md border">
                      <span className="text-sm text-gray-600 truncate">{image.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(image.id)}
                        className="text-red-500 hover:text-red-700 ml-2 disabled:opacity-50"
                        title="Remove image"
                        disabled={loading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Variants */}
          {formData.category && (
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Item Variants</h2>
              <div className="space-y-3">
                {selectedVariants.map((variant) => (
                  <div key={variant}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{variant}</label>
                    <input
                      type="text"
                      value={variantValues[variant] || ''}
                      onChange={(e) => handleVariantChange(variant, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter ${variant.toLowerCase()}`}
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
