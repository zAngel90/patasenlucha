-- Crear tabla para imágenes de campañas
CREATE TABLE IF NOT EXISTS campaign_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Migrar datos existentes
INSERT INTO campaign_images (campaign_id, image_url)
SELECT id, image_url FROM campaigns WHERE image_url IS NOT NULL;

-- Eliminar columna image_url de la tabla campaigns
ALTER TABLE campaigns DROP COLUMN image_url;
