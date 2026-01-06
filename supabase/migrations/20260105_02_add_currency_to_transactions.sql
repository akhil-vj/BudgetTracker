-- Add currency column to transactions table
-- This stores the currency the transaction amount was entered in
-- Enables proper multi-currency support with display-only conversion

ALTER TABLE transactions 
ADD COLUMN currency VARCHAR(10) DEFAULT 'INR';

-- Create index for currency filtering if needed
CREATE INDEX idx_transactions_currency ON transactions(user_id, currency);
