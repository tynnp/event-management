-- Seed Data for PostgreSQL
-- Dữ liệu mẫu cho hệ thống quản lý sự kiện

-- Insert Categories
INSERT INTO categories (name, description, color, icon) VALUES
('Công nghệ', 'Sự kiện về công nghệ, lập trình, AI', '#3B82F6', 'laptop'),
('Giáo dục', 'Hội thảo, khóa học, workshop', '#10B981', 'book-open'),
('Thể thao', 'Các sự kiện thể thao, fitness', '#F59E0B', 'dumbbell'),
('Văn hóa', 'Triển lãm, biểu diễn, nghệ thuật', '#8B5CF6', 'palette'),
('Kinh doanh', 'Networking, startup, đầu tư', '#EF4444', 'briefcase'),
('Giải trí', 'Party, concert, game', '#EC4899', 'music');

-- Insert Users (password hash for 'Fit@public@2025')
INSERT INTO users (email, password_hash, name, role, phone) VALUES
('tynnp.dhsp@gmail.com', '$2b$10$rprcbsQSwIDUt4ryChquu.4.YzzN4E3cri/tv0yW6XuKz2ta3VviC', 'Nguyễn Ngọc Phú Tỷ', 'admin', '0364147912'),
('uyenv.ngn@gmail.com', '$2b$10$rprcbsQSwIDUt4ryChquu.4.YzzN4E3cri/tv0yW6XuKz2ta3VviC', 'Nguyễn Uyên Vy', 'admin', '0838218767'),
('kiettuanvocao2005@gmail.com', '$2b$10$rprcbsQSwIDUt4ryChquu.4.YzzN4E3cri/tv0yW6XuKz2ta3VviC', 'Cao Võ Tuấn Kiệt', 'admin', '0359975958');