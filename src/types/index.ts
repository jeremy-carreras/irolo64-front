export interface Department {
  id: string;
  code: string;
  name: string;
  ownerName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WaterReading {
  id: string;
  departmentId: string;
  readingDate: string;
  meterReading: number;
  notes?: string;
  createdAt: string;
  consumption?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface AuthContext {
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
