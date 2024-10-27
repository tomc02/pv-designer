# Use the official Python image from the Docker Hub
FROM python:3.11

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y \
    gdal-bin \
    binutils \
    libproj-dev \
    libgdal-dev \
    gcc \
    libsqlite3-mod-spatialite \
    sqlite3 \
    && apt-get clean

# Set the working directory in the container
WORKDIR /pv_designer

# Copy the requirements file
COPY requirements.txt .
COPY pv_designer /pv_designer

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the project files
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["/bin/sh", "-c", "source ./load_config.sh && python", "manage.py", "runserver", "0.0.0.0:8000"]
