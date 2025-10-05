-- Migration 003: Triggers and Functions
-- Tạo các triggers và functions cho hệ thống

-- Function để cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers cho updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at 
    BEFORE UPDATE ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function để cập nhật average_rating
CREATE OR REPLACE FUNCTION update_event_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE events 
        SET 
            average_rating = (
                SELECT COALESCE(AVG(rating), 0) 
                FROM ratings 
                WHERE event_id = NEW.event_id
            ),
            total_ratings = (
                SELECT COUNT(*) 
                FROM ratings 
                WHERE event_id = NEW.event_id
            )
        WHERE id = NEW.event_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE events 
        SET 
            average_rating = (
                SELECT COALESCE(AVG(rating), 0) 
                FROM ratings 
                WHERE event_id = OLD.event_id
            ),
            total_ratings = (
                SELECT COUNT(*) 
                FROM ratings 
                WHERE event_id = OLD.event_id
            )
        WHERE id = OLD.event_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger cho average_rating
CREATE TRIGGER update_event_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_event_rating();

-- Function để cập nhật events_attended
CREATE OR REPLACE FUNCTION update_user_events_attended()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.checked_in = FALSE AND NEW.checked_in = TRUE THEN
        UPDATE users 
        SET events_attended = events_attended + 1 
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger cho events_attended
CREATE TRIGGER update_user_events_attended_trigger
    AFTER UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_user_events_attended();
