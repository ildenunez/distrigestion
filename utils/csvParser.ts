
import { Order, OrderStatus } from "../types";
import { getProvinceFromZip } from "./provinceHelper";

const convertToISODate = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
};

export const parseCSV = (text: string): Order[] => {
  const delimiter = text.includes(';') ? ';' : ',';
  const lines = text.split('\n');
  
  if (lines.length <= 1) return [];

  const orders: Order[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
    
    const rawZip = cols[25] || '';
    const paddedZip = rawZip.length === 4 ? `0${rawZip}` : rawZip;

    const order: Order = {
      id: cols[3] || `ID-${i}`,
      status: mapStatus(cols[4]),
      serviceDate: convertToISODate(cols[7] || ''),
      totalAmount: parseFloat(cols[17]?.replace(',', '.') || '0') || 0, // Columna 18
      pendingPayment: parseFloat(cols[19]?.replace(',', '.') || '0') || 0, // Columna 20
      zipCode: paddedZip,
      province: getProvinceFromZip(paddedZip),
      city: cols[26] || '',
      address: cols[34] || '',
      notes: cols[33] || '',
      phone1: cols[36] || '',
      phone2: cols[37] || ''
    };

    orders.push(order);
  }

  return orders;
};

const mapStatus = (val: string = ''): OrderStatus => {
  const s = val.toLowerCase().trim();
  
  if (s === 'rtc') return OrderStatus.RTC;
  if (s.includes('cliente avisa')) return OrderStatus.CLIENT_NOTICE;
  if (s.includes('prep')) return OrderStatus.PREPARING;
  if (s.includes('agen')) return OrderStatus.SCHEDULED;
  if (s.includes('pend') || s === '') return OrderStatus.UNREVIEWED;
  
  return OrderStatus.UNREVIEWED;
};

export const generateSampleCSV = (): string => {
  const headers = Array(40).fill(0).map((_, i) => `COL${i+1}`).join(',');
  const row1 = Array(40).fill("");
  row1[3] = "25092535";      
  row1[4] = "Cliente Avisa"; 
  row1[7] = "01/12/2025";   
  row1[17] = "200,00";       // Columna 18: Importe Total
  row1[19] = "150,00";       // Columna 20: Pte Cobro
  row1[25] = "28001";        
  row1[26] = "Madrid";      
  row1[33] = "N";           
  row1[34] = "Calle Ejemplo 1"; 
  row1[36] = "600000001";

  const row2 = [...row1];
  row2[3] = "26000223";
  row2[4] = "RTC";
  row2[17] = "500,00";
  row2[19] = "500,00";
  row2[25] = "08001";
  row2[7] = "15/12/2025";
  
  return `${headers}\n${row1.join(',')}\n${row2.join(',')}`;
};
