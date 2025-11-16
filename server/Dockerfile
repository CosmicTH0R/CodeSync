# Dockerfile for secure code execution sandbox
FROM ubuntu:22.04

# Install compilers and runtimes
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    gcc \
    python3 \
    python3-pip \
    openjdk-17-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for execution
RUN useradd -m -s /bin/bash executor

# Create working directory
WORKDIR /tmp/execution

# Set permissions
RUN chown -R executor:executor /tmp/execution

# Switch to non-root user
USER executor

# Default to bash
CMD ["/bin/bash"]
