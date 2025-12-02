// app/dashboard/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  ShieldCheckIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  KeyIcon,
  EyeSlashIcon,
  
} from '@heroicons/react/24/outline';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  lastLogin: string;
  createdAt: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0
  });

  const roles = ['ADMIN', 'MANAGER', 'SALES', 'SUPPORT'];
  const statuses = ['ACTIVE', 'INACTIVE'];

  // Fetch users
  const fetchUsers = async (page = 0, search = '') => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: '10',
        ...(search && { search })
      });

      const response = await fetch(`http://localhost:8080/api/users?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.content);
      setPagination({
        currentPage: data.number,
        totalPages: data.totalPages,
        totalElements: data.totalElements
      });
    } catch (err) {
      setError('Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Search handler
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(0, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Create or Update User
  const saveUser = async (userData: unknown) => {
    try {
      const url = editingUser 
        ? `http://localhost:8080/api/users/${editingUser.id}`
        : 'http://localhost:8080/api/users';
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) throw new Error('Failed to save user may exit try another email');

      setShowModal(false);
      setEditingUser(null);
      fetchUsers(pagination.currentPage, searchTerm);
    } catch (err) {
      setError('Failed to save user');
      console.error('Error saving user:', err);
    }
  };

  // Delete User
  const deleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete user');

      fetchUsers(pagination.currentPage, searchTerm);
    } catch (err) {
      setError('Failed to delete user');
      console.error('Error deleting user:', err);
    }
  };

  // Update Status
  const updateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/users/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      fetchUsers(pagination.currentPage, searchTerm);
    } catch (err) {
      setError('Failed to update status');
      console.error('Error updating status:', err);
    }
  };

  // User Form Component


const UserForm = () => {
  const [formData, setFormData] = useState({
    name: editingUser?.name || '',
    email: editingUser?.email || '',
    role: editingUser?.role || 'SALES',
    status: editingUser?.status || 'ACTIVE',
    phone: editingUser?.phone || '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const roles = ['SALES', 'MANAGER', 'ADMIN', 'INVENTORY'];
  const statuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!isValidEmail(formData.email)) errors.email = 'Please enter a valid email';
    
    // Password validation only for new users
    if (!editingUser) {
      if (!formData.password.trim()) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (passwordStrength <= 2) {
        errors.password = 'Please use a stronger password';
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      
      // Show first error in toast
      const firstError = Object.values(errors)[0];
      window.showToast(firstError, 'error');
      return;
    }
    
    // Clear errors and submit
    setFormErrors({});
    saveUser(formData);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({...formData, password: value});
    checkPasswordStrength(value);
    
    // Clear password error when user starts typing
    if (formErrors.password) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
  };

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({...formData, password});
    checkPasswordStrength(password);
    
    // Clear password error
    if (formErrors.password) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return 'Empty';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  };

  // Clear error when field is focused
  const handleInputFocus = (fieldName: string) => {
    if (formErrors[fieldName]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {editingUser ? 'Update user information' : 'Create a new user account'}
            </p>
          </div>
          <button 
            onClick={() => setShowModal(false)} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name*
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                onFocus={() => handleInputFocus('name')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="John Doe"
              />
              {formErrors.name && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {formErrors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address*
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                onFocus={() => handleInputFocus('email')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="john@example.com"
              />
              {formErrors.email && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {formErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {!editingUser && (
              <div className={`space-y-3 p-4 rounded-lg border ${
                formErrors.password ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <KeyIcon className="h-5 w-5 text-blue-500" />
                  <h4 className="font-medium text-gray-900">Password Settings</h4>
                </div>
                
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Password*</label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Generate Strong
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handlePasswordChange}
                    onFocus={() => handleInputFocus('password')}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 transition-colors ${
                      formErrors.password ? 'border-red-300' : 'border-gray-300'
                    } bg-white`}
                    placeholder="Enter a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {formErrors.password && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formErrors.password}
                  </p>
                )}

                {formData.password && !formErrors.password && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Password strength:</span>
                      <span className={`font-medium ${
                        passwordStrength <= 2 ? 'text-red-600' :
                        passwordStrength === 3 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div className={`flex items-center ${formData.password.length >= 8 ? 'text-green-600 font-medium' : ''}`}>
                        <span className={`w-4 h-4 flex items-center justify-center mr-1 ${formData.password.length >= 8 ? 'text-green-500' : 'text-gray-300'}`}>
                          {formData.password.length >= 8 ? '✓' : '○'}
                        </span>
                        8+ characters
                      </div>
                      <div className={`flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-600 font-medium' : ''}`}>
                        <span className={`w-4 h-4 flex items-center justify-center mr-1 ${/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-gray-300'}`}>
                          {/[A-Z]/.test(formData.password) ? '✓' : '○'}
                        </span>
                        Uppercase letter
                      </div>
                      <div className={`flex items-center ${/[0-9]/.test(formData.password) ? 'text-green-600 font-medium' : ''}`}>
                        <span className={`w-4 h-4 flex items-center justify-center mr-1 ${/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-gray-300'}`}>
                          {/[0-9]/.test(formData.password) ? '✓' : '○'}
                        </span>
                        Number
                      </div>
                      <div className={`flex items-center ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-600 font-medium' : ''}`}>
                        <span className={`w-4 h-4 flex items-center justify-center mr-1 ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-500' : 'text-gray-300'}`}>
                          {/[^A-Za-z0-9]/.test(formData.password) ? '✓' : '○'}
                        </span>
                        Special character
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                  <p className="flex items-start gap-1">
                    <span className="mt-0.5">🔒</span>
                    <span>Password must meet all criteria for a strong rating</span>
                  </p>
                </div>
              </div>
            )}

            {editingUser && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-blue-800">Password Notice</span>
                </div>
                <p className="text-sm text-blue-700">
                  Leave the password field empty to keep the current password. 
                  To change the password, the user must reset it through their account settings.
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-gray-100 p-6 flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm hover:shadow"
            >
              {editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};





  // User Detail View
  const UserDetail = () => {
    if (!viewingUser) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">User Details</h3>
            <button onClick={() => setViewingUser(null)} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-xl">
                {viewingUser.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-lg font-semibold">{viewingUser.name}</h4>
                <p className="text-gray-600">{viewingUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Role:</span>
                <p>{viewingUser.role}</p>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <p className={`inline-flex px-2 py-1 text-xs rounded-full ${
                  viewingUser.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {viewingUser.status}
                </p>
              </div>
              <div>
                <span className="font-medium">Phone:</span>
                <p>{viewingUser.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium">Last Login:</span>
                <p>{viewingUser.lastLogin ? new Date(viewingUser.lastLogin).toLocaleString() : 'Never'}</p>
              </div>
              <div className="col-span-2">
                <span className="font-medium">Member Since:</span>
                <p>{new Date(viewingUser.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600">Manage system users and permissions</p>
        </div>
        <button 
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add User
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">System Users</h2>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-2 px-4 block w-full leading-5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                placeholder="Search users..."
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {user.name.charAt(0)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShieldCheckIcon className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-sm text-gray-900">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {user.status}
                        </span>
                        <button
                          onClick={() => updateStatus(user.id, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                          className={`p-1 rounded ${
                            user.status === 'ACTIVE' 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setViewingUser(user)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingUser(user);
                            setShowModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Edit User"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete User"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-700">
              Showing {users.length} of {pagination.totalElements} users
            </p>
            <div className="flex space-x-2">
              <button 
                onClick={() => fetchUsers(pagination.currentPage - 1, searchTerm)}
                disabled={pagination.currentPage === 0}
                className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {pagination.currentPage + 1} of {pagination.totalPages}
              </span>
              <button 
                onClick={() => fetchUsers(pagination.currentPage + 1, searchTerm)}
                disabled={pagination.currentPage >= pagination.totalPages - 1}
                className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && <UserForm />}
      {viewingUser && <UserDetail />}
    </div>
  );
}