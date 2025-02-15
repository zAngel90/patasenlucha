-- Crear tabla para comprobantes médicos si no existe
CREATE TABLE IF NOT EXISTS medical_proofs (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL,
    proof_type VARCHAR(50) NOT NULL, -- 'factura', 'diagnostico', 'receta', 'informe'
    file_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    INDEX idx_medical_proofs_campaign (campaign_id)
);

-- Procedimiento para agregar columnas si no existen
DELIMITER //

DROP PROCEDURE IF EXISTS add_columns_if_not_exists//

CREATE PROCEDURE add_columns_if_not_exists()
BEGIN
    -- Verificar y agregar medical_proof
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'campaigns'
        AND COLUMN_NAME = 'medical_proof'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE campaigns ADD COLUMN medical_proof TEXT;
    END IF;

    -- Verificar y agregar proof_type
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'campaigns'
        AND COLUMN_NAME = 'proof_type'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE campaigns ADD COLUMN proof_type ENUM('factura', 'diagnostico', 'receta', 'informe');
    END IF;

    -- Verificar y agregar proof_description
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'campaigns'
        AND COLUMN_NAME = 'proof_description'
        AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE campaigns ADD COLUMN proof_description TEXT;
    END IF;
END//

DELIMITER ;

-- Ejecutar el procedimiento
CALL add_columns_if_not_exists();

-- Limpiar
DROP PROCEDURE IF EXISTS add_columns_if_not_exists;

-- Actualizar las campañas existentes con valores por defecto solo si proof_type es NULL
UPDATE campaigns 
SET proof_type = 'diagnostico',
    proof_description = 'Comprobante médico pendiente de actualización'
WHERE proof_type IS NULL;
