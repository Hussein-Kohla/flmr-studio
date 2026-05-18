export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  status: 'active' | 'inactive' | 'lead';
  totalProjects: number;
  totalSpent: number;
  createdAt: string;
  lastProject: string;
  notes: string;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  description: string;
  status: 'planning' | 'in-progress' | 'review' | 'completed' | 'cancelled';
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  assignedTo: string;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  tags: string[];
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  clientId?: string;
  projectId?: string;
  date: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'cancelled';
  paymentMethod: 'cash' | 'bank_transfer' | 'credit_card' | 'check';
  reference?: string;
}

export interface RecurringTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  nextDue: string;
  status: 'active' | 'paused' | 'cancelled';
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  type: 'meeting' | 'deadline' | 'reminder' | 'milestone';
  date: string;
  time?: string;
  endTime?: string;
  projectId?: string;
  clientId?: string;
  createdAt: string;
  reminders: number[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  avatar?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeProjects: number;
  pendingTasks: number;
  newClientsThisMonth: number;
  revenueChange: number;
  expenseChange: number;
  projectChange: number;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
