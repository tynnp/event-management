import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { User, Event, Comment, Rating } from '../types';

interface AppState {
  currentUser: User | null;
  users: User[];
  events: Event[];
  comments: Comment[];
  ratings: Rating[];
  token: string | null;
}

type AppAction =
  | { type: 'LOGIN'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER'; payload: User }
  | { type: 'CHANGE_PASSWORD'; payload: { email: string; newPassword: string } }
  | { type: 'UPDATE_PROFILE'; payload: Partial<User> }
  | { type: "UPDATE_AVATAR"; payload: { email: string; avatar: string } }
  | { type: 'CREATE_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'JOIN_EVENT'; payload: { eventId: string; userId: string; qrCode: string } }
  | { type: 'CHECK_IN'; payload: { eventId: string; userId: string } }
  | { type: 'ADD_COMMENT'; payload: Comment }
  | { type: 'HIDE_COMMENT'; payload: string }
  | { type: 'UNHIDE_COMMENT'; payload: string }
  | { type: 'DELETE_COMMENT'; payload: string }
  | { type: 'ADD_RATING'; payload: Rating }
  | { type: 'APPROVE_EVENT'; payload: string }
  | { type: 'REJECT_EVENT'; payload: { eventId: string; reason: string } }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'UPDATE_USER_ROLE'; payload: { id: string; role: 'admin' | 'moderator' | 'user' } }
  | { type: 'TOGGLE_USER_LOCK'; payload: { id: string; is_locked: boolean } }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'FETCH_USERS'; payload: User[] };

const initialState: AppState = {
  currentUser: null,
  users: [],
  events: [],
  comments: [],
  ratings: [],
  token: null,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, currentUser: action.payload.user, token: action.payload.token };

    case 'LOGOUT':
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      return { ...state, currentUser: null, token: null };

    case 'REGISTER':
      return {
        ...state,
        users: [...state.users, action.payload],
        currentUser: action.payload,
      };
    case 'CHANGE_PASSWORD':
      return {
        ...state,
        users: state.users.map((u) =>
          u.email === action.payload.email
            ? { ...u, password: action.payload.newPassword }
            : u
        ),
        currentUser:
          state.currentUser?.email === action.payload.email
            ? { ...state.currentUser, password: action.payload.newPassword }
            : state.currentUser,
      };
    case "UPDATE_AVATAR":
      return {
        ...state,
        users: state.users.map((u) =>
          u.email === action.payload.email
            ? { ...u, avatar: action.payload.avatar }
            : u
        ),
        currentUser:
          state.currentUser?.email === action.payload.email
            ? { ...state.currentUser, avatar_url: action.payload.avatar }
            : state.currentUser,
      };

    case 'UPDATE_PROFILE':
      if (!state.currentUser) return state;
      const updatedUser = { ...state.currentUser, ...action.payload };
      return {
        ...state,
        currentUser: updatedUser,
        users: state.users.map((user) =>
          user.id === state.currentUser!.id ? updatedUser : user
        ),
      };

    case 'CREATE_EVENT':
      return {
        ...state,
        events: [...state.events, action.payload],
      };

    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.id ? action.payload : event
        ),
      };

    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter((event) => event.id !== action.payload),
      };

    case 'JOIN_EVENT':
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.eventId
            ? {
              ...event,
              participants: [
                ...event.participants,
                {
                  userId: action.payload.userId,
                  joinedAt: new Date().toISOString(),
                  qrCode: action.payload.qrCode,
                },
              ],
            }
            : event
        ),
      };

    case 'CHECK_IN':
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.eventId
            ? {
              ...event,
              participants: event.participants.map((participant) =>
                participant.userId === action.payload.userId
                  ? {
                    ...participant,
                    checkedIn: true,
                    checkInTime: new Date().toISOString(),
                  }
                  : participant
              ),
            }
            : event
        ),
      };

    case 'ADD_COMMENT':
      return {
        ...state,
        comments: [...state.comments, action.payload],
      };

    case 'HIDE_COMMENT':
      return {
        ...state,
        comments: state.comments.map((comment) =>
          comment.id === action.payload
            ? { ...comment, isHidden: true }
            : comment
        ),
      };

    case 'UNHIDE_COMMENT':
      return {
        ...state,
        comments: state.comments.map((comment) =>
          comment.id === action.payload
            ? { ...comment, isHidden: false }
            : comment
        ),
      };

    case 'DELETE_COMMENT':
      return {
        ...state,
        comments: state.comments.filter((comment) => comment.id !== action.payload),
      };

    case 'ADD_RATING':
      const newRatings = [...state.ratings, action.payload];
      const eventRatings = newRatings.filter((r) => r.eventId === action.payload.eventId);
      const averageRating = eventRatings.reduce((sum, r) => sum + r.rating, 0) / eventRatings.length;
      return {
        ...state,
        ratings: newRatings,
        events: state.events.map((event) =>
          event.id === action.payload.eventId
            ? { ...event, averageRating }
            : event
        ),
      };

    case 'APPROVE_EVENT':
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload
            ? { ...event, status: 'approved' as const }
            : event
        ),
      };

    case 'REJECT_EVENT':
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.eventId
            ? {
              ...event,
              status: 'rejected' as const,
              rejectionReason: action.payload.reason,
            }
            : event
        ),
      };

    case 'SET_USERS':
      return { ...state, users: action.payload };
    case "FETCH_USERS": {
      return { ...state, users: action.payload };
    }

    case 'UPDATE_USER_ROLE':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id
            ? { ...user, role: action.payload.role }
            : user
        ),
        currentUser:
          state.currentUser?.id === action.payload.id
            ? { ...state.currentUser, role: action.payload.role }
            : state.currentUser,
      };

    case "TOGGLE_USER_LOCK":
      return {
        ...state,
        users: state.users.map(u =>
          u.id === action.payload.id ? { ...u, is_locked: action.payload.is_locked } : u
        ),
      };

    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("currentUser");

    if (savedToken && savedUser) {
      dispatch({
        type: "LOGIN",
        payload: { user: JSON.parse(savedUser), token: savedToken },
      });
    }
  }, []);

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