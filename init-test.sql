-- init-test.sql

-- Grant all privileges on the test_db database to test_user
GRANT ALL PRIVILEGES ON DATABASE test_db TO test_user;

-- Connect to the test_db database
\c test_db

-- Create a test table
CREATE TABLE IF NOT EXISTS test_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Insert test data into the test table
INSERT INTO test_table (name) VALUES ('Test Data 1'), ('Test Data 2');