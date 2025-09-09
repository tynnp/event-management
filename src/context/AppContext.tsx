import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, Event, Comment, Rating } from '../types';

interface AppState {
  currentUser: User | null;
  users: User[];
  events: Event[];
  comments: Comment[];
  ratings: Rating[];
}

type AppAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER'; payload: User }
  | { type: 'UPDATE_PROFILE'; payload: Partial<User> }
  | { type: 'CREATE_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'JOIN_EVENT'; payload: { eventId: string; userId: string; qrCode: string } }
  | { type: 'CHECK_IN'; payload: { eventId: string; userId: string } }
  | { type: 'ADD_COMMENT'; payload: Comment }
  | { type: 'HIDE_COMMENT'; payload: string }
  | { type: 'ADD_RATING'; payload: Rating }
  | { type: 'APPROVE_EVENT'; payload: string }
  | { type: 'REJECT_EVENT'; payload: { eventId: string; reason: string } }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'UPDATE_USER_ROLE'; payload: { id: string; role: 'admin' | 'moderator' | 'user' } }
  | { type: 'TOGGLE_USER_LOCK'; payload: { id: string; isLocked: boolean } };

const initialState: AppState = {
  currentUser: null,
  users: [
    {
      id: '1',
      email: 'tynnp@hcmue.edu.vn',
      password: 'admin123',
      name: 'Nguyễn Ngọc Phú Tỷ',
      role: 'admin',
      phone: '0123456789',
      createdAt: '2024-01-01',
      eventsAttended: 25,
      badges: ['Người tiên phong', 'Quản lý xuất sắc']
    },
    {
      id: '2',
      email: 'mod@test.com',
      password: 'mod123',
      name: 'Cao Võ Tuấn Kiệt',
      role: 'moderator',
      phone: '0987654321',
      createdAt: '2024-01-15',
      eventsAttended: 18,
      badges: ['Kiểm duyệt tận tâm']
    },
    {
      id: '3',
      email: 'user@test.com',
      password: 'user123',
      name: 'Nguyễn Uyên Vy',
      role: 'user',
      phone: '0555666777',
      createdAt: '2024-02-01',
      eventsAttended: 12,
      badges: ['Tham gia tích cực']
    }
  ],
  events: [
    {
      id: '1',
      title: 'Hội thảo Công nghệ AI 2024',
      description: 'Khám phá xu hướng AI mới nhất và ứng dụng thực tế trong doanh nghiệp',
      startTime: '2024-03-15T09:00:00',
      endTime: '2024-03-15T17:00:00',
      location: 'Trung tâm Hội nghị Quốc gia, Hà Nội',
      isPublic: true,
      maxParticipants: 200,
      createdBy: '3',
      createdAt: '2024-02-01',
      status: 'approved',
      participants: [
        { userId: '1', joinedAt: '2024-02-05', qrCode: 'QR1', checkedIn: true, checkInTime: '2024-03-15T08:45:00' },
        { userId: '2', joinedAt: '2024-02-10', qrCode: 'QR2' }
      ],
      comments: [],
      ratings: [],
      averageRating: 0,
      category: 'Công nghệ'
    }
  ],
  comments: [],
  ratings: []
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, currentUser: action.payload };
    
    case 'LOGOUT':
      return { ...state, currentUser: null };
    
    case 'REGISTER':
      return {
        ...state,
        users: [...state.users, action.payload],
        currentUser: action.payload
      };
    
    case 'UPDATE_PROFILE':
      if (!state.currentUser) return state;
      const updatedUser = { ...state.currentUser, ...action.payload };
      return {
        ...state,
        currentUser: updatedUser,
        users: state.users.map(user =>
          user.id === state.currentUser!.id ? updatedUser : user
        )
      };
    
    case 'CREATE_EVENT':
      return {
        ...state,
        events: [...state.events, action.payload]
      };
    
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id ? action.payload : event
        )
      };
    
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload)
      };
    
    case 'JOIN_EVENT':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.eventId
            ? {
                ...event,
                participants: [
                  ...event.participants,
                  {
                    userId: action.payload.userId,
                    joinedAt: new Date().toISOString(),
                    qrCode: action.payload.qrCode
                  }
                ]
              }
            : event
        )
      };
    
    case 'CHECK_IN':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.eventId
            ? {
                ...event,
                participants: event.participants.map(participant =>
                  participant.userId === action.payload.userId
                    ? {
                        ...participant,
                        checkedIn: true,
                        checkInTime: new Date().toISOString()
                      }
                    : participant
                )
              }
            : event
        )
      };
    
    case 'ADD_COMMENT':
      return {
        ...state,
        comments: [...state.comments, action.payload]
      };
    
    case 'HIDE_COMMENT':
      return {
        ...state,
        comments: state.comments.map(comment =>
          comment.id === action.payload
            ? { ...comment, isHidden: true }
            : comment
        )
      };
    
    case 'ADD_RATING':
      const newRatings = [...state.ratings, action.payload];
      const eventRatings = newRatings.filter(r => r.eventId === action.payload.eventId);
      const averageRating = eventRatings.reduce((sum, r) => sum + r.rating, 0) / eventRatings.length;
      
      return {
        ...state,
        ratings: newRatings,
        events: state.events.map(event =>
          event.id === action.payload.eventId
            ? { ...event, averageRating }
            : event
        )
      };
    
    case 'APPROVE_EVENT':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload
            ? { ...event, status: 'approved' as const }
            : event
        )
      };
    
    case 'REJECT_EVENT':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.eventId
            ? {
                ...event,
                status: 'rejected' as const,
                rejectionReason: action.payload.reason
              }
            : event
        )
      };
    
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}