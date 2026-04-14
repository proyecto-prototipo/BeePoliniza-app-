
export enum UserRole {
  FARMER = 'AGRICULTOR',
  BEEKEEPER = 'APICULTOR',
  ADMIN = 'ADMIN'
}

export interface ServiceOffer {
  id: string;
  provider: string;
  hiveCount: number;
  price: number;
  cropType: string;
  region: string;
  efficiencyScore: number;
  status: 'active' | 'pending' | 'completed';
  healthScore?: number;
}

export interface Contract {
  id: string;
  partner: string;
  date: string;
  status: string;
  total: number;
  role: UserRole;
}

export interface HiveData {
  id: string;
  location: [number, number];
  temp: number;
  humidity: number;
  activity: 'Alta' | 'Media' | 'Baja';
  health: 'Excelent' | 'Warning' | 'Critical';
}

// mapMocks.ts

export const HIVES_MOCK = [
    { 
      id: 'H-001', 
      location: [65, 30], // [X%, Y%] relativo al contenedor del mapa
      temp: 34.2, 
      humidity: 55, 
      health: 'Excelent', 
      activity: 'Alta',
      lastUpdate: 'Hace 5 min'
    },
    { 
      id: 'H-002', 
      location: [58, 38], 
      temp: 35.5, 
      humidity: 48, 
      health: 'Warning', 
      activity: 'Media',
      lastUpdate: 'Hace 2 min'
    },
    { 
      id: 'H-003', 
      location: [72, 45], 
      temp: 33.9, 
      humidity: 60, 
      health: 'Excelent', 
      activity: 'Alta',
      lastUpdate: 'Hace 10 min'
    },
    { 
      id: 'H-004', // Esta será la crítica de tu prototipo
      location: [55, 52], 
      temp: 35.5, 
      humidity: 46, 
      health: 'Critical', 
      activity: 'Baja',
      lastUpdate: 'En tiempo real'
    },
    { 
      id: 'H-005', 
      location: [68, 60], 
      temp: 34.8, 
      humidity: 52, 
      health: 'Excelent', 
      activity: 'Alta',
      lastUpdate: 'Hace 7 min'
    },
  ];

  
