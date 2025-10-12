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
      createdAt: '2025-01-01',
      eventsAttended: 25,
    },
    {
      id: '2',
      email: 'kietcvt@hcmue.edu.vn',
      password: 'mod123',
      name: 'Cao Võ Tuấn Kiệt',
      role: 'moderator',
      phone: '0987654321',
      createdAt: '2025-01-15',
      eventsAttended: 18,
    },
    {
      id: '3',
      email: 'vynu@hcmue.edu.vn',
      password: 'user123',
      name: 'Nguyễn Uyên Vy',
      role: 'user',
      phone: '0555666777',
      createdAt: '2025-02-01',
      eventsAttended: 12,
    },
    {
      id: '4',
      email: 'tinbm@hcmue.edu.vn',
      password: 'user123',
      name: 'Bùi Minh Tín',
      role: 'user',
      phone: '0999888777',
      createdAt: '2025-02-20',
      eventsAttended: 5,
    },
  ],
  events: [
    // Past events (before 2025-09-13)
    {
      id: 'p1',
      title: 'Hội thảo Giới thiệu CLB 2025',
      description: 'Giới thiệu về CLB và kế hoạch năm mới.',
      startTime: '2025-01-20T09:00:00',
      endTime: '2025-01-20T12:00:00',
      location: 'Hội trường A',
      isPublic: true,
      maxParticipants: 100,
      createdBy: '2',
      createdAt: '2025-01-01',
      status: 'approved',
      participants: [
        { userId: '1', joinedAt: '2025-01-05', qrCode: 'QRp1', checkedIn: true, checkInTime: '2025-01-20T08:50:00' },
        { userId: '3', joinedAt: '2025-01-10', qrCode: 'QRp2', checkedIn: true, checkInTime: '2025-01-20T09:00:00' },
      ],
      comments: [
        { id: 'cp1', userId: '1', eventId: 'p1', content: 'Buổi giới thiệu rất hay!', createdAt: '2025-01-20T10:00:00', isHidden: false },
        { id: 'cp2', userId: '3', eventId: 'p1', content: 'Hào hứng với kế hoạch mới.', createdAt: '2025-01-20T11:00:00', isHidden: false },
      ],
      ratings: [
        { id: 'rp1', userId: '1', eventId: 'p1', rating: 5, review: 'Tuyệt vời', createdAt: '2025-01-20T12:30:00' },
        { id: 'rp2', userId: '3', eventId: 'p1', rating: 4, review: 'Tốt', createdAt: '2025-01-20T13:00:00' },
      ],
      averageRating: 4.5,
      category: 'Giới thiệu',
    },
    {
      id: 'p2',
      title: 'Workshop Lập trình Cơ bản',
      description: 'Học lập trình cơ bản cho tân sinh viên.',
      startTime: '2025-02-15T14:00:00',
      endTime: '2025-02-15T17:00:00',
      location: 'Phòng Lab 101',
      isPublic: true,
      maxParticipants: 50,
      createdBy: '2',
      createdAt: '2025-01-20',
      status: 'approved',
      participants: [
        { userId: '3', joinedAt: '2025-01-25', qrCode: 'QRp3', checkedIn: true, checkInTime: '2025-02-15T13:55:00' },
        { userId: '4', joinedAt: '2025-01-30', qrCode: 'QRp4', checkedIn: true, checkInTime: '2025-02-15T14:00:00' },
      ],
      comments: [
        { id: 'cp3', userId: '3', eventId: 'p2', content: 'Dễ hiểu cho người mới.', createdAt: '2025-02-15T15:00:00', isHidden: false },
      ],
      ratings: [
        { id: 'rp3', userId: '3', eventId: 'p2', rating: 4, review: 'Hữu ích', createdAt: '2025-02-15T17:30:00' },
      ],
      averageRating: 4.0,
      category: 'Workshop',
    },
    {
      id: 'p3',
      title: 'Cuộc thi Ý tưởng Công nghệ',
      description: 'Thi ý tưởng dự án công nghệ.',
      startTime: '2025-03-10T09:00:00',
      endTime: '2025-03-10T16:00:00',
      location: 'Hội trường B',
      isPublic: false,
      maxParticipants: 30,
      createdBy: '2',
      createdAt: '2025-02-01',
      status: 'approved',
      participants: [
        { userId: '1', joinedAt: '2025-02-05', qrCode: 'QRp5', checkedIn: true, checkInTime: '2025-03-10T08:50:00' },
      ],
      comments: [
        { id: 'cp4', userId: '1', eventId: 'p3', content: 'Nhiều ý tưởng sáng tạo.', createdAt: '2025-03-10T10:00:00', isHidden: false },
      ],
      ratings: [
        { id: 'rp4', userId: '1', eventId: 'p3', rating: 5, review: 'Sáng tạo', createdAt: '2025-03-10T16:30:00' },
      ],
      averageRating: 5.0,
      category: 'Cuộc thi',
    },
    {
      id: 'p4',
      title: 'Buổi giao lưu Alumni',
      description: 'Giao lưu với cựu thành viên CLB.',
      startTime: '2025-04-20T18:00:00',
      endTime: '2025-04-20T21:00:00',
      location: 'Quán cà phê XYZ',
      isPublic: true,
      maxParticipants: 40,
      createdBy: '2',
      createdAt: '2025-03-15',
      status: 'approved',
      participants: [
        { userId: '3', joinedAt: '2025-03-20', qrCode: 'QRp6', checkedIn: true, checkInTime: '2025-04-20T17:55:00' },
        { userId: '4', joinedAt: '2025-03-25', qrCode: 'QRp7' },
      ],
      comments: [
        { id: 'cp5', userId: '3', eventId: 'p4', content: 'Kinh nghiệm quý báu.', createdAt: '2025-04-20T19:00:00', isHidden: false },
        { id: 'cp6', userId: '4', eventId: 'p4', content: 'Mạng lưới tốt.', createdAt: '2025-04-20T20:00:00', isHidden: false },
      ],
      ratings: [
        { id: 'rp5', userId: '3', eventId: 'p4', rating: 5, review: 'Hữu ích', createdAt: '2025-04-20T21:30:00' },
      ],
      averageRating: 5.0,
      category: 'Giao lưu',
    },
    {
      id: 'p5',
      title: 'Khóa học Web Development',
      description: 'Học phát triển web cơ bản.',
      startTime: '2025-05-05T14:00:00',
      endTime: '2025-05-05T17:00:00',
      location: 'Phòng Lab 202',
      isPublic: false,
      maxParticipants: 35,
      createdBy: '2',
      createdAt: '2025-04-01',
      status: 'cancelled',
      participants: [],
      comments: [], // No comments since cancelled
      ratings: [],
      averageRating: 0,
      category: 'Khóa học',
    },
    {
      id: 'p6',
      title: 'Hội thảo Cloud Computing',
      description: 'Tìm hiểu về điện toán đám mây.',
      startTime: '2025-06-15T09:00:00',
      endTime: '2025-06-15T12:00:00',
      location: 'Trung tâm Hội nghị',
      isPublic: true,
      maxParticipants: 150,
      createdBy: '2',
      createdAt: '2025-05-01',
      status: 'approved',
      participants: [
        { userId: '1', joinedAt: '2025-05-05', qrCode: 'QRp8', checkedIn: true, checkInTime: '2025-06-15T08:50:00' },
        { userId: '3', joinedAt: '2025-05-10', qrCode: 'QRp9', checkedIn: true, checkInTime: '2025-06-15T09:00:00' },
      ],
      comments: [
        { id: 'cp7', userId: '1', eventId: 'p6', content: 'Nội dung sâu sắc.', createdAt: '2025-06-15T10:00:00', isHidden: false },
      ],
      ratings: [
        { id: 'rp6', userId: '1', eventId: 'p6', rating: 4, review: 'Tốt', createdAt: '2025-06-15T12:30:00' },
        { id: 'rp7', userId: '3', eventId: 'p6', rating: 5, review: 'Xuất sắc', createdAt: '2025-06-15T13:00:00' },
      ],
      averageRating: 4.5,
      category: 'Công nghệ',
    },
    {
      id: 'p7',
      title: 'Ngày hội Thể thao CLB',
      description: 'Hoạt động thể thao gắn kết.',
      startTime: '2025-07-10T08:00:00',
      endTime: '2025-07-10T18:00:00',
      location: 'Sân vận động',
      isPublic: true,
      maxParticipants: 80,
      createdBy: '2',
      createdAt: '2025-06-01',
      status: 'rejected',
      rejectionReason: 'Thiếu ngân sách',
      participants: [{ userId: '4', joinedAt: '2025-06-05', qrCode: 'QRp10' }],
      comments: [], // No comments since rejected
      ratings: [],
      averageRating: 0,
      category: 'Ngoại khóa',
    },
    {
      id: 'p8',
      title: 'Workshop Data Science',
      description: 'Giới thiệu về khoa học dữ liệu.',
      startTime: '2025-08-20T14:00:00',
      endTime: '2025-08-20T17:00:00',
      location: 'Phòng Lab 301',
      isPublic: true,
      maxParticipants: 60,
      createdBy: '2',
      createdAt: '2025-07-15',
      status: 'approved',
      participants: [
        { userId: '3', joinedAt: '2025-07-20', qrCode: 'QRp11', checkedIn: true, checkInTime: '2025-08-20T13:55:00' },
      ],
      comments: [
        { id: 'cp8', userId: '3', eventId: 'p8', content: 'Dữ liệu thú vị.', createdAt: '2025-08-20T15:00:00', isHidden: false },
      ],
      ratings: [
        { id: 'rp8', userId: '3', eventId: 'p8', rating: 4, review: 'Hữu ích', createdAt: '2025-08-20T17:30:00' },
      ],
      averageRating: 4.0,
      category: 'Workshop',
    },
    // Upcoming events (after 2025-09-13)
    {
      id: '1',
      title: 'Hội thảo Công nghệ AI 2025',
      description: 'Khám phá xu hướng AI mới nhất và ứng dụng thực tế trong doanh nghiệp',
      startTime: '2025-09-15T09:00:00',
      endTime: '2025-09-15T17:00:00',
      location: 'Trung tâm Hội nghị Quốc gia, Hà Nội',
      isPublic: true,
      maxParticipants: 200,
      createdBy: '2',
      createdAt: '2025-09-01',
      status: 'approved',
      participants: [
        { userId: '1', joinedAt: '2025-09-05', qrCode: 'QR1', checkedIn: false },
        { userId: '3', joinedAt: '2025-09-10', qrCode: 'QR2', checkedIn: false },
        { userId: '4', joinedAt: '2025-09-11', qrCode: 'QR3' },
      ],
      comments: [
        { id: 'c1', userId: '3', eventId: '1', content: 'Rất mong chờ!', createdAt: '2025-09-12T10:00:00', isHidden: false },
      ],
      ratings: [],
      averageRating: 0,
      category: 'Công nghệ',
    },
    {
      id: '2',
      title: 'Cuộc thi Lập trình CLB',
      description: 'Thi đấu lập trình giữa các thành viên CLB.',
      startTime: '2025-10-10T13:30:00',
      endTime: '2025-10-10T17:00:00',
      location: 'Phòng Lab 101',
      isPublic: false,
      maxParticipants: 50,
      createdBy: '2',
      createdAt: '2025-09-13',
      status: 'pending',
      participants: [{ userId: '3', joinedAt: '2025-09-20', qrCode: 'QR4' }],
      comments: [], // No comments since pending
      ratings: [],
      averageRating: 0,
      category: 'Cuộc thi',
    },
    {
      id: '3',
      title: 'Workshop Thiết kế UI/UX',
      description: 'Buổi học về trải nghiệm người dùng trong thiết kế phần mềm.',
      startTime: '2025-11-05T14:00:00',
      endTime: '2025-11-05T17:00:00',
      location: 'Hội trường B',
      isPublic: true,
      maxParticipants: 100,
      createdBy: '2',
      createdAt: '2025-10-01',
      status: 'approved',
      participants: [
        { userId: '1', joinedAt: '2025-10-10', qrCode: 'QR5', checkedIn: false },
        { userId: '3', joinedAt: '2025-10-12', qrCode: 'QR6', checkedIn: false },
      ],
      comments: [
        { id: 'c4', userId: '1', eventId: '3', content: 'Sẵn sàng học hỏi.', createdAt: '2025-10-15T09:00:00', isHidden: false },
      ],
      ratings: [],
      averageRating: 0,
      category: 'Workshop',
    },
    {
      id: '4',
      title: 'Chuyến đi dã ngoại CLB',
      description: 'Hoạt động ngoại khóa gắn kết thành viên.',
      startTime: '2025-12-20T08:00:00',
      endTime: '2025-12-20T18:00:00',
      location: 'Khu du lịch Suối Tiên',
      isPublic: true,
      maxParticipants: 60,
      createdBy: '2',
      createdAt: '2025-11-15',
      status: 'rejected',
      rejectionReason: 'Nội dung chưa phù hợp',
      participants: [{ userId: '4', joinedAt: '2025-11-25', qrCode: 'QR7' }],
      comments: [], // No comments since rejected
      ratings: [],
      averageRating: 0,
      category: 'Ngoại khóa',
    },
    {
      id: '5',
      title: 'Buổi giao lưu doanh nghiệp',
      description: 'Kết nối sinh viên và doanh nghiệp CNTT.',
      startTime: '2026-01-10T09:00:00',
      endTime: '2026-01-10T11:30:00',
      location: 'Hội trường A',
      isPublic: true,
      maxParticipants: 150,
      createdBy: '2',
      createdAt: '2025-12-01',
      status: 'approved',
      participants: [
        { userId: '1', joinedAt: '2025-12-05', qrCode: 'QR8', checkedIn: false },
        { userId: '3', joinedAt: '2025-12-06', qrCode: 'QR9', checkedIn: false },
      ],
      comments: [
        { id: 'c7', userId: '1', eventId: '5', content: 'Cơ hội tốt.', createdAt: '2025-12-10T09:00:00', isHidden: false },
      ],
      ratings: [],
      averageRating: 0,
      category: 'Giao lưu',
    },
    {
      id: '6',
      title: 'Khóa học Python cơ bản',
      description: 'Khóa học lập trình Python cho người mới bắt đầu.',
      startTime: '2026-02-01T19:00:00',
      endTime: '2026-02-01T21:00:00',
      location: 'Phòng Lab 202',
      isPublic: false,
      maxParticipants: 40,
      createdBy: '2',
      createdAt: '2025-12-10',
      status: 'cancelled',
      participants: [],
      comments: [], // No comments since cancelled
      ratings: [],
      averageRating: 0,
      category: 'Khóa học',
    },
    {
      id: '7',
      title: 'Hội thảo Blockchain và Tương Lai',
      description: 'Tìm hiểu về công nghệ blockchain và ứng dụng trong tài chính.',
      startTime: '2026-03-20T10:00:00',
      endTime: '2026-03-20T16:00:00',
      location: 'Trung tâm Hội nghị TP.HCM',
      isPublic: true,
      maxParticipants: 250,
      createdBy: '2',
      createdAt: '2026-01-01',
      status: 'pending',
      participants: [
        { userId: '3', joinedAt: '2026-01-05', qrCode: 'QR10' },
        { userId: '4', joinedAt: '2026-01-06', qrCode: 'QR11' },
      ],
      comments: [], // No comments since pending
      ratings: [],
      averageRating: 0,
      category: 'Công nghệ',
    },
    {
      id: '8',
      title: 'Ngày hội tuyển dụng CNTT 2026',
      description: 'Kết nối sinh viên với các công ty công nghệ hàng đầu.',
      startTime: '2026-04-15T09:00:00',
      endTime: '2026-04-15T17:00:00',
      location: 'Trường ĐH Công nghệ Thông tin',
      isPublic: true,
      maxParticipants: 300,
      createdBy: '2',
      createdAt: '2026-02-01',
      status: 'approved',
      participants: [
        { userId: '1', joinedAt: '2026-02-05', qrCode: 'QR12', checkedIn: false },
        { userId: '3', joinedAt: '2026-02-06', qrCode: 'QR13' },
      ],
      comments: [
        { id: 'c11', userId: '1', eventId: '8', content: 'Chuẩn bị CV!', createdAt: '2026-02-10T09:00:00', isHidden: false },
      ],
      ratings: [],
      averageRating: 0,
      category: 'Tuyển dụng',
    },
    {
      id: '9',
      title: 'Hackathon AI 2026',
      description: 'Cuộc thi phát triển ứng dụng AI trong 48 giờ.',
      startTime: '2026-05-01T08:00:00',
      endTime: '2026-05-03T20:00:00',
      location: 'Phòng Lab 301',
      isPublic: false,
      maxParticipants: 80,
      createdBy: '2',
      createdAt: '2026-03-01',
      status: 'pending',
      participants: [
        { userId: '3', joinedAt: '2026-03-05', qrCode: 'QR14' },
      ],
      comments: [], // No comments since pending
      ratings: [],
      averageRating: 0,
      category: 'Cuộc thi',
    },
    {
      id: '10',
      title: 'Workshop Phát triển Game 2D',
      description: 'Học cách phát triển game 2D sử dụng Unity.',
      startTime: '2026-06-10T14:00:00',
      endTime: '2026-06-10T17:00:00',
      location: 'Phòng Lab 102',
      isPublic: true,
      maxParticipants: 50,
      createdBy: '2',
      createdAt: '2026-04-01',
      status: 'approved',
      participants: [
        { userId: '1', joinedAt: '2026-04-05', qrCode: 'QR15', checkedIn: false },
        { userId: '4', joinedAt: '2026-04-06', qrCode: 'QR16' },
      ],
      comments: [
        { id: 'c14', userId: '1', eventId: '10', content: 'Thú vị lắm!', createdAt: '2026-04-10T09:00:00', isHidden: false },
      ],
      ratings: [],
      averageRating: 0,
      category: 'Workshop',
    },
    {
      id: '11',
      title: 'Seminar An ninh mạng 2026',
      description: 'Tìm hiểu về các mối đe dọa an ninh mạng và cách phòng tránh.',
      startTime: '2026-07-15T09:00:00',
      endTime: '2026-07-15T12:00:00',
      location: 'Hội trường C',
      isPublic: true,
      maxParticipants: 120,
      createdBy: '2',
      createdAt: '2026-05-01',
      status: 'approved',
      participants: [
        { userId: '1', joinedAt: '2026-05-05', qrCode: 'QR17', checkedIn: false },
        { userId: '3', joinedAt: '2026-05-06', qrCode: 'QR18' },
      ],
      comments: [
        { id: 'c16', userId: '1', eventId: '11', content: 'Cần thiết cho mọi người.', createdAt: '2026-05-10T09:00:00', isHidden: false },
      ],
      ratings: [],
      averageRating: 0,
      category: 'Công nghệ',
    },
    {
      id: '12',
      title: 'Khóa học Machine Learning',
      description: 'Khóa học cơ bản về học máy và ứng dụng thực tế.',
      startTime: '2026-08-10T18:30:00',
      endTime: '2026-08-10T20:30:00',
      location: 'Phòng Lab 201',
      isPublic: false,
      maxParticipants: 30,
      createdBy: '2',
      createdAt: '2026-06-01',
      status: 'pending',
      participants: [
        { userId: '3', joinedAt: '2026-06-05', qrCode: 'QR19' },
        { userId: '4', joinedAt: '2026-06-06', qrCode: 'QR20' },
      ],
      comments: [], // No comments since pending
      ratings: [],
      averageRating: 0,
      category: 'Khóa học',
    },
    {
      id: '13',
      title: 'Hội thảo Metaverse 2026',
      description: 'Khám phá thế giới ảo và tương lai.',
      startTime: '2026-09-20T10:00:00',
      endTime: '2026-09-20T16:00:00',
      location: 'Trung tâm Hội nghị',
      isPublic: true,
      maxParticipants: 200,
      createdBy: '2',
      createdAt: '2026-07-01',
      status: 'approved',
      participants: [
        { userId: '1', joinedAt: '2026-07-05', qrCode: 'QR21', checkedIn: false },
      ],
      comments: [
        { id: 'c19', userId: '1', eventId: '13', content: 'Tương lai gần.', createdAt: '2026-07-10T09:00:00', isHidden: false },
      ],
      ratings: [],
      averageRating: 0,
      category: 'Công nghệ',
    },
    {
      id: '14',
      title: 'Cuộc thi Robotics',
      description: 'Thi đấu robot tự chế.',
      startTime: '2026-10-15T09:00:00',
      endTime: '2026-10-15T17:00:00',
      location: 'Sân vận động',
      isPublic: false,
      maxParticipants: 40,
      createdBy: '2',
      createdAt: '2026-08-01',
      status: 'approved',
      participants: [
        { userId: '3', joinedAt: '2026-08-05', qrCode: 'QR22' },
      ],
      comments: [
        { id: 'c20', userId: '3', eventId: '14', content: 'Chuẩn bị robot.', createdAt: '2026-08-10T09:00:00', isHidden: false },
      ],
      ratings: [],
      averageRating: 0,
      category: 'Cuộc thi',
    },
    {
      id: '15',
      title: 'Workshop AR/VR',
      description: 'Phát triển ứng dụng thực tế ảo.',
      startTime: '2026-11-10T14:00:00',
      endTime: '2026-11-10T17:00:00',
      location: 'Phòng Lab 102',
      isPublic: true,
      maxParticipants: 50,
      createdBy: '2',
      createdAt: '2026-09-01',
      status: 'pending',
      participants: [
        { userId: '4', joinedAt: '2026-09-05', qrCode: 'QR23' },
      ],
      comments: [], // No comments since pending
      ratings: [],
      averageRating: 0,
      category: 'Workshop',
    },
  ],
  comments: [],
  ratings: [],
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
            ? { ...state.currentUser, avatar: action.payload.avatar }
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