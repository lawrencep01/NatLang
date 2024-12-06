FROM python:3.9-slim

WORKDIR /Natlang/backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt from backend/ directory in the build context
COPY backend/requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Copy the entire backend/ directory contents
COPY backend/ ./

# Expose port (optional, as ports are mapped in docker-compose)
EXPOSE 8080

# Run pytest
CMD ["pytest"]