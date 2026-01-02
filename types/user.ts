export interface Car {
  id: string;
  brand: string;
  model: string;
  year: string;
  icon: string;
}

export interface UserProfile {
  id: string;
  username: string;
  createdAt: number;
  photoUrl?: string;
  region?: string;
  cars: Car[];
}
