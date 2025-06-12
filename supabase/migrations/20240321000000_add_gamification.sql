-- Add gamification fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_date DATE DEFAULT CURRENT_DATE;

-- Create function to update streak
CREATE OR REPLACE FUNCTION update_streak()
RETURNS TRIGGER AS $$
BEGIN
    -- If last login was yesterday, increment streak
    IF OLD.last_login_date = CURRENT_DATE - INTERVAL '1 day' THEN
        NEW.streak := OLD.streak + 1;
    -- If last login was more than 1 day ago, reset streak
    ELSIF OLD.last_login_date < CURRENT_DATE - INTERVAL '1 day' THEN
        NEW.streak := 1;
    END IF;
    
    -- Update last login date
    NEW.last_login_date := CURRENT_DATE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update streak on login
CREATE TRIGGER update_streak_on_login
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD.last_login_date IS DISTINCT FROM NEW.last_login_date)
    EXECUTE FUNCTION update_streak();

-- Create function to calculate level based on XP
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(SQRT(xp / 100)) + 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to add XP to user
CREATE OR REPLACE FUNCTION add_xp(user_id UUID, xp_amount INTEGER)
RETURNS VOID AS $$
DECLARE
    current_xp INTEGER;
    new_xp INTEGER;
    new_level INTEGER;
BEGIN
    -- Get current XP
    SELECT xp INTO current_xp FROM profiles WHERE id = user_id;
    
    -- Calculate new XP and level
    new_xp := current_xp + xp_amount;
    new_level := calculate_level(new_xp);
    
    -- Update user's XP and level
    UPDATE profiles
    SET xp = new_xp,
        level = new_level
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql; 