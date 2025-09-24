'use client';

import React, { useEffect, useState } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
interface EmployeeDTO {
  employee: Employee;
  due: boolean;
  duePeriods?: number;   // optional, because older backend responses might not have it
  totalDue?: number;
}
interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  salaryType: 'Daily' | 'Weekly' | 'Monthly';  // for UI label
  paymentPlan: 'DAILY' | 'WEEKLY' | 'MONTHLY'; // for logic
  status: 'Active' | 'On Leave';
  lastPaidDate: string | null;
  due?: boolean;
  duePeriods?: number;   // number of overdue periods
  totalDue?: number;     // total overdue amount
}


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [viewing, setViewing] = useState<Employee | null>(null);

  const departments = ['Sales', 'Finance', 'Retail', 'Marketing', 'Operations', 'HR'];
async function paySalary(id: number) {
  if (!confirm("Pay this employee now?")) return;

  const res = await fetch(`${API_URL}/employees/${id}/pay`, { method: 'POST' });
  if (!res.ok) throw new Error('Payment failed');

  const data: EmployeeDTO = await res.json();

  setEmployees(prev =>
  prev.map(e => e.id === id ? { 
    ...data.employee, 
    due: data.due,
    duePeriods: data.duePeriods,
    totalDue: data.totalDue
  } : e)
);
}
  /** ---- READ ---- */
 const fetchEmployees = async () => {
  setLoading(true);
  setError(null);
  try {
    const url = new URL(`${API_URL}/employees`);
    if (query) url.searchParams.append('search', query);
    if (departmentFilter) url.searchParams.append('department', departmentFilter);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Failed to fetch employees: ${res.status}`);
    }

    const data = await res.json();

    // Map safely: check that employee exists
  const mapped = (data.content ?? [])
  .filter((item: EmployeeDTO) => item && item.employee)
  .map((item: EmployeeDTO) => ({
    ...item.employee,
    due: item.due ?? false,
    duePeriods: item.duePeriods ?? 0,
    totalDue: item.totalDue ?? 0,
    name: item.employee.name || 'Unknown',
  }));

    setEmployees(mapped);
  } catch (err) {
    console.error('Fetch failed:', err);
    setError(err instanceof Error ? err.message : 'Failed to fetch employees');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchEmployees();
  }, [query, departmentFilter]);

  /** ---- CREATE / UPDATE ---- */
  const saveEmployee = async (employee: Partial<Employee>) => {
    setError(null);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing
        ? `${API_URL}/employees/${editing.id}`
        : `${API_URL}/employees`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee),
      });

      if (!response.ok) {
        throw new Error(`Failed to save employee: ${response.status}`);
      }

      setShowForm(false);
      setEditing(null);
      await fetchEmployees();
    } catch (err) {
      console.error('Save failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to save employee');
    }
  };

  /** ---- DELETE ---- */
  const deleteEmployee = async (id: number) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    setError(null);
    try {
      const response = await fetch(`${API_URL}/employees/${id}`, { 
        method: 'DELETE' 
      });

      if (!response.ok) {
        throw new Error(`Failed to delete employee: ${response.status}`);
      }

      await fetchEmployees();
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
    }
  };

  /** ---- VIEW ---- */
  const viewEmployee = (employee: Employee) => {
    setViewing(employee);
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between mb-6 items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
          <p className="text-gray-600">Manage your staff and personnel</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add Employee
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees..."
            className="border p-2 w-full rounded pl-9 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-2 left-2" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading employees...</span>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Employee', 'Contact', 'Position', 'Department', 'ksh-Salary', 'Status', 'Actions']
                  .map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 flex items-center gap-2">
                      <div className="h-10 w-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                        {e.name.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{e.name}</div>
                        <div className="text-xs text-gray-500">#{e.id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-gray-700">
                        <EnvelopeIcon className="h-4 w-4 mr-1" /> {e.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <PhoneIcon className="h-4 w-4 mr-1" /> {e.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{e.position}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{e.department}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
  {e.salary.toLocaleString()}

  {e.due ? (
    <>
      <button
        onClick={() => paySalary(e.id)}
        className="px-3 py-1 text-white bg-green-600 hover:bg-green-700 rounded"
      >
        Pay
      </button>
      <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        Due {e.duePeriods} {e.salaryType.toLowerCase()}(s) - ksh{e.totalDue?.toLocaleString()}
      </span>
    </>
  ) : (
    <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      Paid
    </span>
  )}
</td>

                    <td className="px-4 py-3">
  <span
    className={`px-2 py-1 rounded-full text-xs font-semibold ${
      e.status === 'Active'
        ? 'bg-green-100 text-green-700'
        : 'bg-yellow-100 text-yellow-700'
    }`}
  >
    {e.status}
  </span>

</td>
                    <td className="px-4 py-3 text-sm">
       
                      <button
                        onClick={() => viewEmployee(e)}
                        className="text-green-600 hover:text-green-800 hover:underline mr-3 transition-colors"
                        title="View Employee"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          setEditing(e);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline mr-3 transition-colors"
                        title="Edit Employee"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteEmployee(e.id)}
                        className="text-red-600 hover:text-red-800 hover:underline transition-colors"
                        title="Delete Employee"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <EmployeeForm
          employee={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={saveEmployee}
          departments={departments}
        />
      )}

      {/* View Modal */}
      {viewing && (
        <ViewEmployeeModal
          employee={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
}

/** Modal for Add/Edit */
function EmployeeForm({
  employee,
  onClose,
  onSave,
  departments,
}: {
  employee: Employee | null;
  onClose: () => void;
  onSave: (e: Partial<Employee>) => void;
  departments: string[];
}) {
  const [form, setForm] = React.useState<Partial<Employee>>(
    employee || {
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      salary: 0,
      salaryType: 'Monthly',    // default
      status: 'Active',
    }
  );

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name?.trim()) newErrors.name = 'Name is required';
    if (!form.email?.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.phone?.trim()) newErrors.phone = 'Phone is required';
    if (!form.position?.trim()) newErrors.position = 'Position is required';
    if (!form.department?.trim()) newErrors.department = 'Department is required';
    if (!form.salary || form.salary <= 0) newErrors.salary = 'Salary must be greater than 0';
    if (!form.salaryType) newErrors.salaryType = 'Salary type is required';  // validate

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof Employee, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) onSave(form);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">
          {employee ? 'Edit Employee' : 'Add Employee'}
        </h2>

        <form onSubmit={handleSubmit}>
          {['name', 'email', 'phone', 'position'].map((field) => (
            <div key={field} className="mb-3">
              <input
                value={(form as any)[field] || ''}
                onChange={(e) => handleChange(field as keyof Employee, e.target.value)}
                placeholder={field[0].toUpperCase() + field.slice(1)}
                className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 ${
                  errors[field] ? 'border-red-500' : ''
                }`}
              />
              {errors[field] && (
                <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
              )}
            </div>
          ))}

          {/* Department */}
          <div className="mb-3">
            <select
              value={form.department || ''}
              onChange={(e) => handleChange('department', e.target.value)}
              className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 ${
                errors.department ? 'border-red-500' : ''
              }`}
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {errors.department && (
              <p className="text-red-500 text-xs mt-1">{errors.department}</p>
            )}
          </div>

          {/* Salary amount */}
          <div className="mb-3 flex gap-2">
            <label className="block text-gray-500 text-sm mb-1">Salary</label>
           <input
  type="number"
  value={form.salary === undefined || form.salary === null ? '' : form.salary}
  onChange={(e) =>
    handleChange('salary', e.target.value === '' ? undefined : parseFloat(e.target.value))
  }
  placeholder="Salary"
  className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 ${
    errors.salary ? 'border-red-500' : ''
  }`}
  min="0"
  step="0.01"
/>
            {/* Salary Type */}
            <select
              value={form.salaryType || ''}
              onChange={(e) => handleChange('salaryType', e.target.value)}
              className={`border p-2 rounded focus:ring-2 focus:ring-blue-500 ${
                errors.salaryType ? 'border-red-500' : ''
              }`}
            >
              <option value="">Type</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>
          {errors.salary && (
            <p className="text-red-500 text-xs mt-1">{errors.salary}</p>
          )}
          {errors.salaryType && (
            <p className="text-red-500 text-xs mt-1">{errors.salaryType}</p>
          )}

          {/* Status */}
          <div className="mb-4">
            <select
              value={form.status || 'Active'}
              onChange={(e) => handleChange('status', e.target.value)}
              className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {employee ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


/** Modal for Viewing Employee Details */
function ViewEmployeeModal({
  employee,
  onClose,
  onEdit,
}: {
  employee: Employee;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Employee Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-2xl">
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{employee.name}</h3>
            <p className="text-gray-600">#{employee.id}</p>
          </div>
        </div>

        <div className="space-y-3">
          <DetailItem label="Email" value={employee.email} icon={<EnvelopeIcon className="h-4 w-4" />} />
          <DetailItem label="Phone" value={employee.phone} icon={<PhoneIcon className="h-4 w-4" />} />
          <DetailItem label="Position" value={employee.position} />
          <DetailItem label="Department" value={employee.department} />
          <DetailItem label="Salary" value={`$${employee.salary.toLocaleString()}`} />
          <DetailItem 
            label="Status" 
            value={
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                employee.status === 'Active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {employee.status}
              </span>
            } 
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

/** Reusable component for detail items in view modal */
function DetailItem({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="font-medium text-gray-600 flex items-center gap-2">
        {icon}
        {label}:
      </span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}