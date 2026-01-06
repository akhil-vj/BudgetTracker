-- Create a function to check if email exists in auth.users
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM auth.users WHERE email = LOWER(email_to_check)
  );
END;
$$;

-- Grant execute permission to anon users (so they can check before signup)
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon, authenticated;
