const bcrypt = require('bcryptjs');

const password = 'PatasEnLucha2025#';
bcrypt.hash(password, 10).then(hash => {
    console.log('Contraseña hasheada:', hash);
});
