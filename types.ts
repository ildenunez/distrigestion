
export enum OrderStatus {
  UNREVIEWED = 'Sin revisar',
  RTC = 'RTC',
  CLIENT_NOTICE = 'Cliente Avisa',
  PREPARING = 'En preparacion',
  SCHEDULED = 'Agendado'
}

export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  OPERADOR = 'operador'
}

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  name: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface GroupMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Truck {
  id: string;
  number: string;
  name: string;
  phone?: string;
}

export interface Store {
  id: string;
  name: string;
  code: string;
  created_at?: string;
}

export interface Order {
  id: string;               
  status: OrderStatus;      
  serviceDate: string;      
  totalAmount: number;      
  pendingPayment: number;   
  zipCode: string;          
  city: string;             
  province?: string;        
  address: string;          
  notes: string;            
  phone1: string;           
  phone2: string;           
  truckId?: string;
  store?: string;
  updatedAt?: string;
  updatedBy?: string;       
}

export interface OrderStats {
  totalOrders: number;
  totalPendingAmount: number;
  totalPortfolioValue: number; 
  averageAmount: number;
  pendingCount: number;
}

export interface AIAnalysisResult {
  summary: string;
  suggestions: string[];
  trends: string;
}
