-- Migration to add the 'arbitro' role to the system.
-- This script has been updated to target the 'user_profiles' table.

-- 1. Drop the existing role constraint from the user_profiles table.
-- Note: The original constraint name might be different. This script assumes it is 'user_profiles_role_check' or 'profiles_role_check'.
-- Please verify the correct constraint name in your database schema if this step fails.
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_role_check;


-- 2. Add the new role constraint including 'arbitro'.
-- This re-establishes the constraint with the updated list of roles.
ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('superAdmin', 'capitan', 'invitado', 'arbitro'));