export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  avatar_url?: string;
  role: 'admin' | 'moderator' | 'user';
  phone?: string;
  createdAt: string;
  eventsAttended: number;
  is_locked?: boolean;
  
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  image?: string;
  isPublic: boolean;
  maxParticipants?: number;
  createdBy: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  rejectionReason?: string;
  participants: Participant[];
  comments: Comment[];
  ratings: Rating[];
  averageRating: number;
  category: string;
}

export interface Participant {
  userId: string;
  joinedAt: string;
  qrCode: string;
  checkedIn?: boolean;
  checkInTime?: string;
}

export interface Comment {
  id: string;
  userId: string;
  eventId: string;
  content: string;
  createdAt: string;
  isHidden: boolean;
  parentId?: string; // ID của comment gốc nếu đây là reply
  replies?: Comment[]; // Danh sách các reply
  likes?: number;
  dislikes?: number;
  // Convenience flags for UI (derived on client)
  hasLiked?: boolean;
  hasDisliked?: boolean;
}

export interface Rating {
  id: string;
  userId: string;
  eventId: string;
  rating: number;
  review?: string;
  createdAt: string;
}