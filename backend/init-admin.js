const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const adminUser = {
    name: 'Admin',
    email: 'admin@patasenlucha.com',
    password: 'adminPatas2024', // Nueva contraseña
    role: 'admin'
};

async function initializeAdmin() {
    try {
        // Crear conexión a la base de datos
        const connection = await mysql.createConnection({
            host: '209.74.88.106',
            user: 'patasenlucha_user',
            password: 'PatasEnLucha2025#DB',
            database: 'patasenlucha'
        });

        console.log('Conectado a la base de datos...');

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(adminUser.password, 10);

        // Insertar o actualizar el usuario admin
        const [result] = await connection.execute(
            `INSERT INTO users (name, email, password, role) 
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             name = VALUES(name),
             password = VALUES(password),
             role = VALUES(role)`,
            [adminUser.name, adminUser.email, hashedPassword, adminUser.role]
        );

        console.log('Usuario administrador creado/actualizado exitosamente');
        console.log('Email:', adminUser.email);
        console.log('Contraseña:', adminUser.password);
        console.log('Por favor, cambia la contraseña después del primer inicio de sesión');

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Error al inicializar el usuario administrador:', error);
        process.exit(1);
    }
}

initializeAdmin();
