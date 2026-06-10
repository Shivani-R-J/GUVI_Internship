FROM php:8.1-apache

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    libzip-dev \
    unzip \
    git \
    libssl-dev \
    pkg-config \
    libcurl4-openssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install native PHP extensions for MySQL
RUN docker-php-ext-install pdo pdo_mysql mysqli zip

# Install Redis and MongoDB extensions via PECL
RUN pecl install redis mongodb \
    && docker-php-ext-enable redis mongodb

# Enable Apache URL rewriting
RUN a2enmod rewrite

# Install Composer globally
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set the working directory
WORKDIR /var/www/html

# Copy all project files into the container
COPY . /var/www/html/

# Install Composer dependencies (Predis, MongoDB)
RUN composer install --no-dev --optimize-autoloader

# Change Apache Document Root so the site loads directly without needing /internship-task in the URL
ENV APACHE_DOCUMENT_ROOT /var/www/html/internship-task
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Expose port 80
EXPOSE 80
