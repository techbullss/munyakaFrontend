// types/equipment.ts
export interface Equipment {
  id: number;
  name: string;
  category: string;
  description: string;
  dailyRate: number;
  quantity: number;
  available: number;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  image?: string;
}

export interface Rental {
  id: number;
  equipmentId: number;
  equipmentName: string;
  customerName: string;
  customerPhone: string;
  quantity: number;
  rentalDate: string;
  returnDate: string;
  totalCost: number;
  status: 'Active' | 'Completed' | 'Overdue';
  deposit: number;
  depositReturned: boolean;
}

export interface EquipmentCategory {
  id: number;
  name: string;
  description: string;
}