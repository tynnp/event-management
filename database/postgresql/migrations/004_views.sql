-- Migration 004: Views
-- Tạo các views cho thống kê và báo cáo

-- View thống kê sự kiện
CREATE OR REPLACE VIEW event_statistics AS
SELECT 
    e.id,
    e.title,
    e.status,
    e.start_time,
    e.end_time,
    e.max_participants,
    COUNT(p.id) as current_participants,
    e.average_rating,
    e.total_ratings,
    u.name as creator_name,
    c.name as category_name
FROM events e
LEFT JOIN participants p ON e.id = p.event_id
LEFT JOIN users u ON e.created_by = u.id
LEFT JOIN categories c ON e.category_id = c.id
GROUP BY e.id, e.title, e.status, e.start_time, e.end_time, e.max_participants, 
         e.average_rating, e.total_ratings, u.name, c.name;

-- View thống kê người dùng
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.events_attended,
    COUNT(DISTINCT e.id) as events_created,
    COUNT(DISTINCT p.event_id) as events_joined,
    COUNT(DISTINCT r.id) as ratings_given,
    u.created_at,
    u.last_login
FROM users u
LEFT JOIN events e ON u.id = e.created_by
LEFT JOIN participants p ON u.id = p.user_id
LEFT JOIN ratings r ON u.id = r.user_id
GROUP BY u.id, u.name, u.email, u.role, u.events_attended, u.created_at, u.last_login;

-- View sự kiện sắp diễn ra
CREATE OR REPLACE VIEW upcoming_events AS
SELECT 
    e.id,
    e.title,
    e.description,
    e.start_time,
    e.end_time,
    e.location,
    e.image_url,
    e.is_public,
    e.max_participants,
    e.status,
    e.average_rating,
    COUNT(p.id) as current_participants,
    u.name as creator_name,
    c.name as category_name,
    c.color as category_color
FROM events e
LEFT JOIN participants p ON e.id = p.event_id
LEFT JOIN users u ON e.created_by = u.id
LEFT JOIN categories c ON e.category_id = c.id
WHERE e.start_time > CURRENT_TIMESTAMP 
    AND e.status = 'approved'
GROUP BY e.id, e.title, e.description, e.start_time, e.end_time, e.location, 
         e.image_url, e.is_public, e.max_participants, e.status, e.average_rating,
         u.name, c.name, c.color
ORDER BY e.start_time ASC;

-- View sự kiện phổ biến
CREATE OR REPLACE VIEW popular_events AS
SELECT 
    e.id,
    e.title,
    e.description,
    e.start_time,
    e.end_time,
    e.location,
    e.image_url,
    e.average_rating,
    e.total_ratings,
    COUNT(p.id) as participant_count,
    u.name as creator_name,
    c.name as category_name
FROM events e
LEFT JOIN participants p ON e.id = p.event_id
LEFT JOIN users u ON e.created_by = u.id
LEFT JOIN categories c ON e.category_id = c.id
WHERE e.status = 'approved'
GROUP BY e.id, e.title, e.description, e.start_time, e.end_time, e.location, 
         e.image_url, e.average_rating, e.total_ratings, u.name, c.name
HAVING COUNT(p.id) > 0 OR e.average_rating > 0
ORDER BY 
    (e.average_rating * 0.7 + (COUNT(p.id) * 0.3)) DESC,
    e.total_ratings DESC;

-- View thống kê theo danh mục
CREATE OR REPLACE VIEW category_statistics AS
SELECT 
    c.id,
    c.name,
    c.description,
    c.color,
    COUNT(e.id) as total_events,
    COUNT(CASE WHEN e.status = 'approved' THEN 1 END) as approved_events,
    COUNT(CASE WHEN e.status = 'pending' THEN 1 END) as pending_events,
    AVG(e.average_rating) as avg_rating,
    SUM(COUNT(p.id)) OVER (PARTITION BY c.id) as total_participants
FROM categories c
LEFT JOIN events e ON c.id = e.category_id
LEFT JOIN participants p ON e.id = p.event_id
GROUP BY c.id, c.name, c.description, c.color
ORDER BY total_events DESC;
