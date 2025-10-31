"use client";
import { useState, useRef, useEffect } from "react";
import EditItem from "../components/EditItem";

// API types and service
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

const API_BASE_URL = 'http://localhost:8080/api';

const inventoryApi = {
  // Get all items
  getItems: async (): Promise<ItemResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/items`);
    if (!response.ok) throw new Error('Failed to fetch items');
    return response.json();
  },

  // Get item by ID
  getItem: async (id: number): Promise<ItemResponse> => {
    const response = await fetch(`${API_BASE_URL}/items/${id}`);
    if (!response.ok) throw new Error('Failed to fetch item');
    return response.json();
  },

  // Create new item
  createItem: async (item: ItemRequest): Promise<ItemResponse> => {
    const response = await fetch(`${API_BASE_URL}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to create item');
    return response.json();
  },

  // Update item
  updateItem: async (id: number, item: ItemRequest): Promise<ItemResponse> => {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to update item');
    return response.json();
  },

  // Delete item
  deleteItem: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete item');
  },

  // Search items
  searchItems: async (keyword: string): Promise<ItemResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/items/search?keyword=${encodeURIComponent(keyword)}`);
    if (!response.ok) throw new Error('Failed to search items');
    return response.json();
  },

  // Get available variants for category
  getAvailableVariants: async (category: string): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/items/variants/${encodeURIComponent(category)}`);
    if (!response.ok) throw new Error('Failed to get available variants');
    return response.json();
  },
};

// HardwareItemModal Component


// Main Inventory Component
export default function InventoryComponent() {
 const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemResponse | null>(null);
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Load items on component mount
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/items');
      if (!response.ok) throw new Error('Failed to fetch items');
      const itemsData = await response.json();
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading items:', error);
      alert('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/items/search?keyword=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error('Failed to search items');
      const searchResults = await response.json();
      setItems(searchResults);
    } catch (error) {
      console.error('Error searching items:', error);
      alert('Failed to search items');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/items/${id}`);
      if (!response.ok) throw new Error('Failed to fetch item');
      const item = await response.json();
      setSelectedItem(item);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error('Error fetching item:', error);
      alert('Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  // Handle restock button click
  const handleRestock = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/items/${id}`);
      if (!response.ok) throw new Error('Failed to fetch item');
      const item = await response.json();
      setSelectedItem(item);
      setIsRestockModalOpen(true);
    } catch (error) {
      console.error('Error fetching item:', error);
      alert('Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete button click
  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/items/${id}`);
      if (!response.ok) throw new Error('Failed to fetch item');
      const item = await response.json();
      setSelectedItem(item);
      setIsDeleteModalOpen(true);
    } catch (error) {
      console.error('Error fetching item:', error);
      alert('Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600">Track and manage your inventory</p>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Search inventory..." 
              className="px-4 py-2 border rounded-md w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Search
            </button>
          </div>
          <button 
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            onClick={() => setIsModalOpen(true)}
          >
            Add New Item
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buying Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 text-xs">#{item.id}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                        <div className="text-sm text-gray-500">{item.supplier}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.stockQuantity} {item.sellingUnit.toLowerCase()}
                    {item.piecesPerBox && ` (${item.piecesPerBox} pcs/box)`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">KES {item.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">KES {item.sellingPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.stockQuantity > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEdit(item.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      {/* Restock Button */}
                      <button
                        onClick={() => handleRestock(item.id)}
                        className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-100"
                        title="Restock"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No items found. Add your first item to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        {/* Add Item Modal */}
        {isModalOpen && (
          <HardwareItemModal
            onClose={() => setIsModalOpen(false)}
          />
        )}
        {/* Edit Modal */}
        {isEditModalOpen && selectedItem && (
          <EditItem
            item={selectedItem}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedItem(null);
            }}
            onUpdate={loadItems}
          />
        )}
         {isRestockModalOpen && selectedItem && (
          <RestockModal 
            item={selectedItem}
            onClose={() => {
              setIsRestockModalOpen(false);
              setSelectedItem(null);
            }}
            onUpdate={loadItems}
          />
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && selectedItem && (
          <DeleteModal 
            item={selectedItem}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedItem(null);
            }}
            onUpdate={loadItems}
          />
        )}
      </div>
    </>
  );
  function RestockModal({ item, onClose, onUpdate }: { 
  item: ItemResponse; 
  onClose: () => void; 
  onUpdate: () => void;
}) {
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Calculate new stock quantity
      const newStockQuantity = item.stockQuantity + quantity;
      
      // Prepare the data for API
      const itemData: ItemRequest = {
        itemName: item.itemName,
        category: item.category,
        description: item.description,
        price: item.price,
        stockQuantity: newStockQuantity,
        sellingPrice: item.sellingPrice,
        supplier: item.supplier,
        sellingUnit: item.sellingUnit,
        lengthType: item.lengthType,
        piecesPerBox: item.piecesPerBox,
        images: item.imageUrls,
        variants: item.variants
      };

      // Send update to backend
      const response = await fetch(`http://localhost:8080/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      
      if (!response.ok) throw new Error('Failed to restock item');
      
      console.log('Item restocked successfully');
      alert(`Successfully added ${quantity} units to stock!`);
      onUpdate(); // Refresh the items list
      onClose(); // Close the modal
      
    } catch (error) {
      console.error('Error restocking item:', error);
      alert('Failed to restock item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Restock Item</h2>
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
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800">{item.itemName}</h3>
            <p className="text-sm text-blue-600">Current Stock: {item.stockQuantity} {item.sellingUnit.toLowerCase()}</p>
            {item.piecesPerBox && (
              <p className="text-sm text-blue-600">Pieces per Box: {item.piecesPerBox}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity to Add
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any notes about this restock..."
              disabled={loading}
            ></textarea>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">
              New stock will be: <span className="font-semibold">{item.stockQuantity + quantity}</span>
            </p>
          </div>
          
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
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              disabled={loading || quantity <= 0}
            >
              {loading ? 'Processing...' : 'Restock Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function DeleteModal({ item, onClose, onUpdate }: { 
  item: ItemResponse; 
  onClose: () => void; 
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Send delete request to backend
      const response = await fetch(`http://localhost:8080/api/items/${item.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete item');
      
      console.log('Item deleted successfully');
      alert('Item deleted successfully!');
      onUpdate(); // Refresh the items list
      onClose(); // Close the modal
      
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isConfirmed = confirmationText === item.itemName;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Delete Item</h2>
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
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-red-50 p-4 rounded-md">
            <h3 className="font-medium text-red-800">Warning: This action cannot be undone</h3>
            <p className="text-sm text-red-600 mt-1">
              You are about to permanently delete this item from your inventory.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-gray-800">{item.itemName}</h3>
            <p className="text-sm text-gray-600">Category: {item.category}</p>
            <p className="text-sm text-gray-600">Current Stock: {item.stockQuantity}</p>
            <p className="text-sm text-gray-600">Supplier: {item.supplier}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="font-bold">"{item.itemName}"</span> to confirm deletion
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
              placeholder={`Enter "${item.itemName}" to confirm`}
            />
          </div>
          
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
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              disabled={loading || !isConfirmed}
            >
              {loading ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function HardwareItemModal({ onClose }: { onClose: () => void }) {
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

  // Form state
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    description: '',
    price: '',
    stockQuantity: '',
    SellingPrice: '',
    supplier: '',
    sellingUnit: 'pcs',
    lengthType: 'full', // For items sold by length
    piecesPerBox: '', // For items sold in boxes
    variants: []
  });

  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [variantValues, setVariantValues] = useState<{ [key: string]: string }>({});
  const [uploadedImages, setUploadedImages] = useState<{ id: number; file: any; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle category change
  const handleCategoryChange = (e: { target: { value: string; }; }) => {
    const category = e.target.value as keyof typeof variantTemplates;
    setFormData({ ...formData, category, variants: [] });
    setSelectedVariants(variantTemplates[category] || []);
    setVariantValues({});
  };

  // Handle selling unit change
  const handleUnitChange = (e: { target: { value: any; }; }) => {
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
  const handleImageUpload = (e: { target: { files: any; value: string; }; }) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: { id: number; file: any; name: any; }[] = [];
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
    e.target.value = '';
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

      // Send to backend
      const response = await inventoryApi.createItem(itemData);
      
      console.log('Item created successfully:', response);
      alert('Item submitted successfully!');
      onClose();
      await loadItems(); // Refresh the items list
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create item. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Add New Hardware Item</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
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
            ></textarea>
          </div>
          
          {/* Price and Stock Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Selling Price (KES)
  </label>
  <input
    type="number"
    value={formData.SellingPrice}
    onChange={(e) =>
      setFormData({ ...formData, SellingPrice: e.target.value })
    }
    min="0"
    step="0.01"
    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
      formData.price && parseFloat(formData.SellingPrice) < parseFloat(formData.price) * 1.2
        ? "border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:ring-blue-500"
    }`}
    required
  />

  {formData.price &&
    parseFloat(formData.SellingPrice) < parseFloat(formData.price) * 1.2 && (
      <p className="text-red-600 text-sm mt-1">
        Selling price must be at least <b>20% higher</b> than the buying price.
      </p>
    )}
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
            />
            
            {/* Upload button */}
            <button
              type="button"
              onClick={handleAddImageClick}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-300 mb-4"
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
                        className="text-red-500 hover:text-red-700 ml-2"
                        title="Remove image"
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
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
}