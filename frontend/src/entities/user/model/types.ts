export interface UserProfile {
  avatarUrl?: string;
  bio?: string;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: number;
  profile?: UserProfile;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
}
