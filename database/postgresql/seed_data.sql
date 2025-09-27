-- Seed Data for PostgreSQL
-- Dữ liệu mẫu cho hệ thống quản lý sự kiện

-- Insert Categories
INSERT INTO categories (id, name, description, color, icon) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Công nghệ', 'Sự kiện về công nghệ, lập trình, AI', '#3B82F6', 'laptop'),
('550e8400-e29b-41d4-a716-446655440002', 'Giáo dục', 'Hội thảo, khóa học, workshop', '#10B981', 'book-open'),
('550e8400-e29b-41d4-a716-446655440003', 'Thể thao', 'Các sự kiện thể thao, fitness', '#F59E0B', 'dumbbell'),
('550e8400-e29b-41d4-a716-446655440004', 'Văn hóa', 'Triển lãm, biểu diễn, nghệ thuật', '#8B5CF6', 'palette'),
('550e8400-e29b-41d4-a716-446655440005', 'Kinh doanh', 'Networking, startup, đầu tư', '#EF4444', 'briefcase'),
('550e8400-e29b-41d4-a716-446655440006', 'Giải trí', 'Party, concert, game', '#EC4899', 'music');

-- Insert Users (password hash for 'password123')
INSERT INTO users (id, email, password_hash, name, role, phone, events_attended) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'admin@example.com', '$2b$10$rQZ8K9vX7mN2pL1qR5sT3uVwYzA4bC6dE8fG0hI2jK4lM6nO8pQ0rS2tU4vW6xY8zA', 'Nguyễn Văn Admin', 'admin', '0123456789', 15),
('650e8400-e29b-41d4-a716-446655440002', 'moderator@example.com', '$2b$10$rQZ8K9vX7mN2pL1qR5sT3uVwYzA4bC6dE8fG0hI2jK4lM6nO8pQ0rS2tU4vW6xY8zA', 'Trần Thị Moderator', 'moderator', '0987654321', 8),
('650e8400-e29b-41d4-a716-446655440003', 'user1@example.com', '$2b$10$rQZ8K9vX7mN2pL1qR5sT3uVwYzA4bC6dE8fG0hI2jK4lM6nO8pQ0rS2tU4vW6xY8zA', 'Lê Văn User', 'user', '0369852147', 5),
('650e8400-e29b-41d4-a716-446655440004', 'user2@example.com', '$2b$10$rQZ8K9vX7mN2pL1qR5sT3uVwYzA4bC6dE8fG0hI2jK4lM6nO8pQ0rS2tU4vW6xY8zA', 'Phạm Thị User', 'user', '0741852963', 3),
('650e8400-e29b-41d4-a716-446655440005', 'user3@example.com', '$2b$10$rQZ8K9vX7mN2pL1qR5sT3uVwYzA4bC6dE8fG0hI2jK4lM6nO8pQ0rS2tU4vW6xY8zA', 'Hoàng Văn User', 'user', '0852741963', 7);

-- Insert Events
INSERT INTO events (id, title, description, start_time, end_time, location, image_url, is_public, max_participants, created_by, category_id, status, average_rating, total_ratings) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'Workshop React.js 2024', 'Học React.js từ cơ bản đến nâng cao với các dự án thực tế', '2024-02-15 09:00:00+07', '2024-02-15 17:00:00+07', 'Tòa nhà A, Đại học Bách Khoa Hà Nội', 'https://example.com/images/react-workshop.jpg', true, 50, '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'approved', 4.5, 12),
('750e8400-e29b-41d4-a716-446655440002', 'Hội thảo AI & Machine Learning', 'Khám phá xu hướng AI và ứng dụng trong thực tế', '2024-02-20 14:00:00+07', '2024-02-20 18:00:00+07', 'Trung tâm Hội nghị Quốc gia', 'https://example.com/images/ai-workshop.jpg', true, 100, '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'approved', 4.8, 25),
('750e8400-e29b-41d4-a716-446655440003', 'Chạy bộ Marathon 2024', 'Cuộc thi chạy bộ marathon 42km quanh Hồ Tây', '2024-03-01 06:00:00+07', '2024-03-01 12:00:00+07', 'Công viên Hồ Tây, Hà Nội', 'https://example.com/images/marathon.jpg', true, 500, '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'approved', 4.2, 8),
('750e8400-e29b-41d4-a716-446655440004', 'Triển lãm Nghệ thuật Đương đại', 'Triển lãm các tác phẩm nghệ thuật đương đại của các nghệ sĩ trẻ', '2024-02-25 10:00:00+07', '2024-02-28 20:00:00+07', 'Bảo tàng Mỹ thuật Việt Nam', 'https://example.com/images/art-exhibition.jpg', true, 200, '650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'pending', 0, 0),
('750e8400-e29b-41d4-a716-446655440005', 'Startup Pitch Day', 'Ngày trình bày ý tưởng startup cho các nhà đầu tư', '2024-03-10 09:00:00+07', '2024-03-10 17:00:00+07', 'Văn phòng TechHub, Quận 1, TP.HCM', 'https://example.com/images/startup-pitch.jpg', true, 30, '650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'approved', 4.6, 15);

-- Insert Participants
INSERT INTO participants (user_id, event_id, qr_code, joined_at, checked_in, check_in_time) VALUES
('650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', 'QR_REACT_001', '2024-02-10 10:00:00+07', true, '2024-02-15 08:45:00+07'),
('650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', 'QR_REACT_002', '2024-02-11 14:30:00+07', true, '2024-02-15 08:50:00+07'),
('650e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440001', 'QR_REACT_003', '2024-02-12 09:15:00+07', false, NULL),
('650e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440001', 'QR_REACT_004', '2024-02-13 16:20:00+07', true, '2024-02-15 08:55:00+07'),
('650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002', 'QR_AI_001', '2024-02-15 11:00:00+07', true, '2024-02-20 13:45:00+07'),
('650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440002', 'QR_AI_002', '2024-02-16 15:30:00+07', true, '2024-02-20 13:50:00+07'),
('650e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440002', 'QR_AI_003', '2024-02-17 10:45:00+07', false, NULL),
('650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440003', 'QR_MARATHON_001', '2024-02-20 08:00:00+07', true, '2024-03-01 05:45:00+07'),
('650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440003', 'QR_MARATHON_002', '2024-02-21 12:30:00+07', true, '2024-03-01 05:50:00+07'),
('650e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440003', 'QR_MARATHON_003', '2024-02-22 14:15:00+07', false, NULL);

-- Insert Ratings
INSERT INTO ratings (user_id, event_id, rating, review, created_at) VALUES
('650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', 5, 'Workshop rất hay, giảng viên nhiệt tình và kiến thức bổ ích!', '2024-02-15 18:30:00+07'),
('650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', 4, 'Nội dung tốt nhưng thời gian hơi ngắn', '2024-02-15 19:00:00+07'),
('650e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440001', 5, 'Tuyệt vời! Học được nhiều điều mới', '2024-02-15 20:15:00+07'),
('650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002', 5, 'Hội thảo AI rất chất lượng, speaker giỏi', '2024-02-20 19:00:00+07'),
('650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440002', 5, 'Xuất sắc! Nhiều insight hay về AI', '2024-02-20 19:30:00+07'),
('650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440003', 4, 'Marathon tốt nhưng thời tiết hơi nóng', '2024-03-01 13:00:00+07'),
('650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440003', 4, 'Tổ chức tốt, route đẹp', '2024-03-01 13:30:00+07'),
('650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440005', 5, 'Pitch day rất chuyên nghiệp, nhiều startup hay', '2024-03-10 18:00:00+07'),
('650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440005', 4, 'Tốt, học được nhiều về startup ecosystem', '2024-03-10 18:30:00+07'),
('650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440005', 5, 'Xuất sắc! Có nhiều ý tưởng startup thú vị', '2024-03-10 19:00:00+07');

-- Insert Notifications
INSERT INTO notifications (user_id, title, message, type, related_event_id, created_at) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Sự kiện đã được duyệt', 'Sự kiện "Workshop React.js 2024" đã được phê duyệt', 'event_approved', '750e8400-e29b-41d4-a716-446655440001', '2024-02-10 10:00:00+07'),
('650e8400-e29b-41d4-a716-446655440002', 'Sự kiện đã được duyệt', 'Sự kiện "Hội thảo AI & Machine Learning" đã được phê duyệt', 'event_approved', '750e8400-e29b-41d4-a716-446655440002', '2024-02-15 11:00:00+07'),
('650e8400-e29b-41d4-a716-446655440003', 'Sự kiện đã được duyệt', 'Sự kiện "Chạy bộ Marathon 2024" đã được phê duyệt', 'event_approved', '750e8400-e29b-41d4-a716-446655440003', '2024-02-20 08:00:00+07'),
('650e8400-e29b-41d4-a716-446655440004', 'Sự kiện chờ duyệt', 'Sự kiện "Triển lãm Nghệ thuật Đương đại" đang chờ phê duyệt', 'event_pending', '750e8400-e29b-41d4-a716-446655440004', '2024-02-22 15:30:00+07'),
('650e8400-e29b-41d4-a716-446655440005', 'Sự kiện đã được duyệt', 'Sự kiện "Startup Pitch Day" đã được phê duyệt', 'event_approved', '750e8400-e29b-41d4-a716-446655440005', '2024-03-05 09:00:00+07');

-- Insert Event Images
INSERT INTO event_images (event_id, image_url, alt_text, is_primary) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'https://example.com/images/react-workshop-1.jpg', 'React Workshop Main Image', true),
('750e8400-e29b-41d4-a716-446655440001', 'https://example.com/images/react-workshop-2.jpg', 'React Workshop Gallery 1', false),
('750e8400-e29b-41d4-a716-446655440002', 'https://example.com/images/ai-workshop-1.jpg', 'AI Workshop Main Image', true),
('750e8400-e29b-41d4-a716-446655440003', 'https://example.com/images/marathon-1.jpg', 'Marathon Main Image', true),
('750e8400-e29b-41d4-a716-446655440003', 'https://example.com/images/marathon-2.jpg', 'Marathon Route Map', false),
('750e8400-e29b-41d4-a716-446655440004', 'https://example.com/images/art-exhibition-1.jpg', 'Art Exhibition Main Image', true),
('750e8400-e29b-41d4-a716-446655440005', 'https://example.com/images/startup-pitch-1.jpg', 'Startup Pitch Main Image', true);
