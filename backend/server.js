// Configuración y dependencias
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const JWT_SECRET = 'patasenlucha2024secretkey';

// Middleware
app.use(cors());
app.use(express.json());

// Configuración para manejar archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Permitir PDFs solo para comprobantes médicos
  if (file.fieldname === 'medical_proof') {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF o imágenes para comprobantes médicos'));
    }
  } 
  // Para otras imágenes, solo permitir imágenes
  else if (file.fieldname === 'images') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  } else {
    cb(new Error('Campo de archivo no esperado'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB por archivo
  },
  fileFilter: fileFilter
});

// Asegurarse de que la carpeta uploads existe y configurar el acceso estático
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Configuración de la base de datos
const pool = mysql.createPool({
    host: '209.74.88.106',
    user: 'patasenlucha_user',
    password: 'PatasEnLucha2025#DB',
    database: 'patasenlucha',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token inválido' });
    }
};

// Middleware para verificar rol de administrador
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    next();
};

// Rutas de autenticación
app.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Verificar si el usuario ya existe
        const [users] = await promisePool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar usuario
        const [result] = await promisePool.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar usuario' });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const [users] = await promisePool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const user = users[0];

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Generar token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
});

// Endpoint para subir imágenes
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido ninguna imagen' });
  }
  
  // Devolver la URL de la imagen
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Rutas públicas
app.get('/api/campaigns/public', async (req, res) => {
  try {
    console.log('Obteniendo campañas públicas...');
    const [rows] = await promisePool.query(`
      SELECT c.*, u.name as creator_name, GROUP_CONCAT(ci.image_url) as image_urls
      FROM campaigns c 
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN campaign_images ci ON c.id = ci.campaign_id
      WHERE c.status = 'approved'
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    console.log('Campañas obtenidas:', rows);

    // Procesar las URLs de las imágenes
    const campaigns = rows.map(campaign => ({
      ...campaign,
      image_urls: campaign.image_urls ? campaign.image_urls.split(',') : []
    }));

    console.log('Campañas procesadas:', campaigns);
    res.json(campaigns);
  } catch (error) {
    console.error('Error detallado al obtener campañas:', error);
    res.status(500).json({ message: 'Error al obtener las campañas', error: error.message });
  }
});

// Rutas protegidas
app.get('/api/campaigns', authenticateToken, async (req, res) => {
  try {
    console.log('Obteniendo todas las campañas...');
    const status = req.query.status;
    let query = `
      SELECT c.*, u.name as creator_name, GROUP_CONCAT(ci.image_url) as image_urls
      FROM campaigns c 
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN campaign_images ci ON c.id = ci.campaign_id
    `;

    if (status) {
      query += ` WHERE c.status = ? `;
    }

    query += ` GROUP BY c.id ORDER BY c.created_at DESC`;

    console.log('Query:', query);
    console.log('Status:', status);

    const [rows] = await promisePool.query(query, status ? [status] : []);
    console.log('Campañas obtenidas:', rows);

    // Procesar las URLs de las imágenes
    const campaigns = rows.map(campaign => ({
      ...campaign,
      image_urls: campaign.image_urls ? campaign.image_urls.split(',') : []
    }));

    console.log('Campañas procesadas:', campaigns);
    res.json(campaigns);
  } catch (error) {
    console.error('Error detallado al obtener campañas:', error);
    res.status(500).json({ message: 'Error al obtener las campañas', error: error.message });
  }
});

// Endpoint para obtener campañas pendientes
app.get('/api/campaigns/pending', authenticateToken, async (req, res) => {
  try {
    console.log('Obteniendo campañas pendientes...');
    const [rows] = await promisePool.query(`
      SELECT c.*, u.name as creator_name, GROUP_CONCAT(ci.image_url) as image_urls
      FROM campaigns c 
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN campaign_images ci ON c.id = ci.campaign_id
      WHERE c.status = 'pending'
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    // Procesar las URLs de las imágenes
    const campaigns = rows.map(campaign => ({
      ...campaign,
      image_urls: campaign.image_urls ? campaign.image_urls.split(',') : []
    }));

    res.json(campaigns);
  } catch (error) {
    console.error('Error al obtener campañas pendientes:', error);
    res.status(500).json({ message: 'Error al obtener las campañas pendientes' });
  }
});

// Endpoint para crear una campaña
app.post('/api/campaigns', authenticateToken, upload.fields([
  { name: 'images', maxCount: 3 },
  { name: 'medical_proof', maxCount: 1 }
]), async (req, res) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();

        const { title, description, goal_amount, proof_type, proof_description } = req.body;
        const userId = req.user.id;

        // Validar el tipo de comprobante
        const validProofTypes = ['factura', 'diagnostico', 'receta', 'informe'];
        if (!validProofTypes.includes(proof_type)) {
            throw new Error('Tipo de comprobante médico inválido');
        }

        // Insertar la campaña
        const [result] = await connection.query(
            'INSERT INTO campaigns (title, description, goal_amount, current_amount, user_id, status, proof_type, proof_description) VALUES (?, ?, ?, 0, ?, "pending", ?, ?)',
            [title, description, goal_amount, userId, proof_type, proof_description]
        );

        const campaignId = result.insertId;

        // Procesar las imágenes de la campaña si existen
        if (req.files && req.files['images']) {
            const imageValues = req.files['images'].map(file => [
                campaignId,
                `/uploads/${file.filename}`
            ]);

            await connection.query(
                'INSERT INTO campaign_images (campaign_id, image_url) VALUES ?',
                [imageValues]
            );
        }

        // Procesar el comprobante médico si existe
        if (req.files && req.files['medical_proof']) {
            const medicalProofFile = req.files['medical_proof'][0];
            const medicalProofUrl = `/uploads/${medicalProofFile.filename}`;
            
            await connection.query(
                'UPDATE campaigns SET medical_proof = ? WHERE id = ?',
                [medicalProofUrl, campaignId]
            );
        }

        await connection.commit();

        // Obtener la campaña recién creada con sus imágenes
        const [campaigns] = await connection.query(`
            SELECT c.*, u.name as creator_name, GROUP_CONCAT(ci.image_url) as image_urls
            FROM campaigns c 
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN campaign_images ci ON c.id = ci.campaign_id
            WHERE c.id = ?
            GROUP BY c.id
        `, [campaignId]);

        const campaign = campaigns[0];
        campaign.image_urls = campaign.image_urls ? campaign.image_urls.split(',') : [];

        res.status(201).json(campaign);
    } catch (error) {
        await connection.rollback();
        console.error('Error al crear la campaña:', error);
        res.status(500).json({ 
            message: 'Error al crear la campaña', 
            error: error.message 
        });
    } finally {
        connection.release();
    }
});

// Ruta para obtener una campaña específica
app.get('/api/campaigns/:id', async (req, res) => {
    try {
        const [campaigns] = await promisePool.query(
            `SELECT c.*, u.name as creator_name, GROUP_CONCAT(ci.image_url) as image_urls
             FROM campaigns c 
             LEFT JOIN users u ON c.user_id = u.id
             LEFT JOIN campaign_images ci ON c.id = ci.campaign_id
             WHERE c.id = ? AND (c.status = 'approved' OR ?)
             GROUP BY c.id`,
            [req.params.id, req.headers.authorization ? true : false]
        );

        if (campaigns.length === 0) {
            return res.status(404).json({ message: 'Campaña no encontrada' });
        }

        const campaign = {
            ...campaigns[0],
            image_urls: campaigns[0].image_urls ? campaigns[0].image_urls.split(',') : []
        };

        res.json(campaign);
    } catch (error) {
        console.error('Error al obtener la campaña:', error);
        res.status(500).json({ message: 'Error al obtener la campaña' });
    }
});

// Aprobar campaña
app.patch('/api/campaigns/:id/approve', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [result] = await promisePool.query(
            'UPDATE campaigns SET status = "approved" WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Campaña no encontrada' });
        }

        res.json({ message: 'Campaña aprobada exitosamente' });
    } catch (error) {
        console.error('Error al aprobar campaña:', error);
        res.status(500).json({ message: 'Error al aprobar la campaña' });
    }
});

// Rechazar campaña
app.patch('/api/campaigns/:id/reject', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [result] = await promisePool.query(
            'UPDATE campaigns SET status = "rejected" WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Campaña no encontrada' });
        }

        res.json({ message: 'Campaña rechazada exitosamente' });
    } catch (error) {
        console.error('Error al rechazar campaña:', error);
        res.status(500).json({ message: 'Error al rechazar la campaña' });
    }
});

// Eliminar una campaña (solo admin)
app.delete('/api/campaigns/:id', authenticateToken, async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    // Verificar si el usuario es admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    }

    const campaignId = req.params.id;
    await connection.beginTransaction();
    
    // Primero obtener las imágenes asociadas a la campaña
    const [images] = await connection.query('SELECT image_url FROM campaign_images WHERE campaign_id = ?', [campaignId]);
    
    // Eliminar los registros de imágenes de la base de datos
    await connection.query('DELETE FROM campaign_images WHERE campaign_id = ?', [campaignId]);
    
    // Eliminar la campaña
    const [result] = await connection.query('DELETE FROM campaigns WHERE id = ?', [campaignId]);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Campaña no encontrada' });
    }

    // Eliminar los archivos físicos de las imágenes
    for (const image of images) {
      const imagePath = path.join(__dirname, image.image_url.replace('/uploads/', 'uploads/'));
      try {
        await fs.promises.unlink(imagePath);
      } catch (error) {
        console.error('Error al eliminar archivo de imagen:', error);
        // Continuamos con las demás imágenes incluso si una falla
      }
    }

    await connection.commit();
    res.json({ message: 'Campaña eliminada exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar la campaña:', error);
    res.status(500).json({ message: 'Error al eliminar la campaña' });
  } finally {
    connection.release();
  }
});

// Ruta de prueba para la conexión a la base de datos
app.get('/api/test-db', async (req, res) => {
    try {
        const [result] = await promisePool.query('SELECT 1 as test');
        res.json({ 
            status: 'success', 
            message: 'Conexión a la base de datos exitosa',
            data: result[0]
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Error en la conexión a la base de datos',
            error: error.message 
        });
    }
});

// Endpoints para noticias
app.get('/api/news/public', async (req, res) => {
  try {
    const [rows] = await promisePool.query(`
      SELECT n.*, u.name as creator_name, GROUP_CONCAT(ni.image_url) as image_urls
      FROM news n 
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN news_images ni ON n.id = ni.news_id
      WHERE n.status = 'published'
      GROUP BY n.id
      ORDER BY n.created_at DESC
    `);

    const news = rows.map(item => ({
      ...item,
      image_urls: item.image_urls ? item.image_urls.split(',') : []
    }));

    res.json(news);
  } catch (error) {
    console.error('Error al obtener noticias:', error);
    res.status(500).json({ message: 'Error al obtener las noticias' });
  }
});

app.get('/api/news/:id', async (req, res) => {
  try {
    const [news] = await promisePool.query(`
      SELECT n.*, u.name as creator_name, GROUP_CONCAT(ni.image_url) as image_urls
      FROM news n 
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN news_images ni ON n.id = ni.news_id
      WHERE n.id = ?
      GROUP BY n.id
    `, [req.params.id]);

    if (news.length === 0) {
      return res.status(404).json({ message: 'Noticia no encontrada' });
    }

    const newsItem = {
      ...news[0],
      image_urls: news[0].image_urls ? news[0].image_urls.split(',') : []
    };

    res.json(newsItem);
  } catch (error) {
    console.error('Error al obtener la noticia:', error);
    res.status(500).json({ message: 'Error al obtener la noticia' });
  }
});

app.post('/api/news', authenticateToken, isAdmin, upload.array('images', 5), async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const { title, content } = req.body;
    const userId = req.user.id;

    console.log('Creando noticia:', { title, content, userId });
    console.log('Archivos recibidos:', req.files);

    const [result] = await connection.query(
      'INSERT INTO news (title, content, user_id, status) VALUES (?, ?, ?, "published")',
      [title, content, userId]
    );

    const newsId = result.insertId;
    console.log('Noticia creada con ID:', newsId);

    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map(file => {
        const imageUrl = `/uploads/${file.filename}`;
        console.log('Guardando imagen:', imageUrl);
        return [newsId, imageUrl];
      });

      await connection.query(
        'INSERT INTO news_images (news_id, image_url) VALUES ?',
        [imageValues]
      );
      console.log('Imágenes guardadas:', imageValues.length);
    }

    await connection.commit();
    console.log('Transacción completada');

    const [news] = await connection.query(`
      SELECT n.*, u.name as creator_name, GROUP_CONCAT(ni.image_url) as image_urls
      FROM news n 
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN news_images ni ON n.id = ni.news_id
      WHERE n.id = ?
      GROUP BY n.id
    `, [newsId]);

    const newsItem = {
      ...news[0],
      image_urls: news[0].image_urls ? news[0].image_urls.split(',') : []
    };

    console.log('Noticia creada exitosamente:', newsItem);
    res.status(201).json(newsItem);
  } catch (error) {
    await connection.rollback();
    console.error('Error detallado al crear la noticia:', error);
    res.status(500).json({ 
      message: 'Error al crear la noticia',
      error: error.message,
      details: error.stack
    });
  } finally {
    connection.release();
  }
});

app.delete('/api/news/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [result] = await promisePool.query('DELETE FROM news WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Noticia no encontrada' });
    }

    res.json({ message: 'Noticia eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar la noticia:', error);
    res.status(500).json({ message: 'Error al eliminar la noticia' });
  }
});

// Ruta para subir comprobante médico
app.post('/api/campaigns/:id/medical-proof', authenticateToken, upload.single('proof'), async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    const { id } = req.params;
    const { proofType, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Se requiere un archivo de comprobante médico' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    await connection.beginTransaction();

    // Insertar el comprobante médico
    const [result] = await connection.query(
      'INSERT INTO medical_proofs (campaign_id, proof_type, file_url, description) VALUES (?, ?, ?, ?)',
      [id, proofType, fileUrl, description]
    );

    await connection.commit();
    res.json({ 
      message: 'Comprobante médico subido exitosamente',
      proofId: result.insertId,
      fileUrl
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al subir comprobante médico:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  } finally {
    connection.release();
  }
});

// Ruta para obtener comprobantes médicos de una campaña
app.get('/api/campaigns/:id/medical-proofs', authenticateToken, async (req, res) => {
  try {
    const [proofs] = await promisePool.query(
      'SELECT * FROM medical_proofs WHERE campaign_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(proofs);
  } catch (error) {
    console.error('Error al obtener comprobantes médicos:', error);
    res.status(500).json({ message: 'Error al obtener los comprobantes médicos' });
  }
});

// Ruta para verificar comprobantes médicos (solo admin)
app.patch('/api/campaigns/:id/verify-medical-proof', authenticateToken, isAdmin, async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    const { id } = req.params;
    
    await connection.beginTransaction();

    // Actualizar el estado de verificación médica
    await connection.query(
      'UPDATE campaigns SET medical_proof_verified = TRUE WHERE id = ?',
      [id]
    );

    await connection.commit();
    res.json({ message: 'Verificación médica aprobada' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al verificar comprobante médico:', error);
    res.status(500).json({ message: 'Error al procesar la verificación' });
  } finally {
    connection.release();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
