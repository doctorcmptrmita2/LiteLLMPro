# CF-X Router Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Create non-root user
RUN useradd --create-home --shell /bin/bash cfx

# Copy installed packages from builder
COPY --from=builder /root/.local /home/cfx/.local

# Make sure scripts in .local are usable
ENV PATH=/home/cfx/.local/bin:$PATH

# Copy application code
COPY --chown=cfx:cfx . .

# Switch to non-root user
USER cfx

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
