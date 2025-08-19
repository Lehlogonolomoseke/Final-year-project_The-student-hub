FROM php:8.1-apache

# Install system packages and PHP extensions for MySQL and PostgreSQL
RUN apt-get update && \
    apt-get install -y \
        libpq-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        libzip-dev \
        postgresql-client \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        mysqli \
        pdo \
        pdo_mysql \
        pgsql \
        pdo_pgsql \
        gd \
        zip \
    && rm -rf /var/lib/apt/lists/*

# Verify PostgreSQL extensions are installed
RUN php -m | grep -E "(pgsql|pdo_pgsql)" || (echo "PostgreSQL extensions not found!" && exit 1)

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy all PHP files from host to container
COPY . .

# Set correct permissions for Apache
RUN chown -R www-data:www-data /var/www/html

# Update Apache config to allow .htaccess overrides
RUN echo '<Directory /var/www/html>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' > /etc/apache2/conf-available/override.conf && \
    a2enconf override

# Expose port 80
EXPOSE 80