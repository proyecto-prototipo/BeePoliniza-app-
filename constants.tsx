
import { UserRole, ServiceOffer, Contract, HiveData } from './types';

export const OFFERS: ServiceOffer[] = [
  { id: '1', provider: 'Apiarios del Sol', hiveCount: 50, price: 1200, cropType: 'Almendros', region: 'Valle Central', efficiencyScore: 94, status: 'active' },
  { id: '2', provider: 'Miel Pura S.A.', hiveCount: 30, price: 800, cropType: 'Palta Hass', region: 'La Ligua', efficiencyScore: 88, status: 'active' },
  { id: '3', provider: 'Santuario de Abejas', hiveCount: 100, price: 2500, cropType: 'Arándanos', region: 'Maule', efficiencyScore: 97, status: 'active' },
  { id: '4', provider: 'Colmenares Pro', hiveCount: 20, price: 500, cropType: 'Cerezos', region: 'Curicó', efficiencyScore: 91, status: 'active' },
];

export const CONTRACTS: Contract[] = [
  { id: 'C-2024-001', partner: 'Fundo Los Olivos', date: '2024-03-15', status: 'Activo', total: 4500, role: UserRole.FARMER },
  { id: 'C-2024-002', partner: 'Cooperativa Agrícola Norte', date: '2023-11-20', status: 'Finalizado', total: 3200, role: UserRole.FARMER },
];

export const HIVES_MOCK: HiveData[] = [
  { id: 'H-001', location: [40, 60], temp: 35.2, humidity: 45, activity: 'Alta', health: 'Excelent' },
  { id: 'H-002', location: [45, 65], temp: 34.8, humidity: 48, activity: 'Alta', health: 'Excelent' },
  { id: 'H-003', location: [35, 55], temp: 36.1, humidity: 42, activity: 'Media', health: 'Warning' },
  { id: 'H-004', location: [50, 70], temp: 35.5, humidity: 46, activity: 'Baja', health: 'Critical' },
];
