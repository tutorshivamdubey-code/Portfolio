require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_admin_key_123'; // In production, use env variable

// Rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 login requests per windowMs
  message: { error: "Too many login attempts, please try again later" }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Large limit for base64 images
app.use(express.static(path.join(__dirname))); // Serve frontend files

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access Denied: No Token Provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Access Denied: Invalid Token" });
    req.user = user;
    next();
  });
}

/* ============================
   AUTH ENDPOINTS
   ============================ */

app.post('/api/login', loginLimiter, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password required" });

  try {
    const dbRes = await db.query(`SELECT value FROM "config" WHERE key = 'admin_password'`);
    if (dbRes.rows.length === 0) return res.status(500).json({ error: "Database error" });

    const isValid = bcrypt.compareSync(password, dbRes.rows[0].value);
    if (!isValid) return res.status(401).json({ error: "Incorrect password" });

    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post('/api/update-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: "Missing fields" });

  try {
    const dbRes = await db.query(`SELECT value FROM "config" WHERE key = 'admin_password'`);
    if (dbRes.rows.length === 0) return res.status(500).json({ error: "Database error" });

    if (!bcrypt.compareSync(oldPassword, dbRes.rows[0].value)) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    await db.query(`UPDATE "config" SET value = $1 WHERE key = 'admin_password'`, [hash]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update password" });
  }
});

/* ============================
   API ENDPOINTS
   ============================ */

app.get('/api/data', async (req, res) => {
  try {
    const [textContent, gallery, testimonials, dynamicSections] = await Promise.all([
      db.query(`SELECT * FROM "textContent"`),
      db.query(`SELECT * FROM "gallery" ORDER BY order_idx ASC`),
      db.query(`SELECT * FROM "testimonials" ORDER BY timestamp DESC`),
      db.query(`SELECT * FROM "dynamicSections" ORDER BY order_idx ASC`)
    ]);

    const contentObj = {};
    textContent.rows.forEach(row => { contentObj[row.key] = row.value; });

    res.json({
      content: contentObj,
      gallery: gallery.rows,
      testimonials: testimonials.rows,
      dynamicSections: dynamicSections.rows
    });
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// 2. BULK UPDATE TEXT CONTENT
app.post('/api/content', authenticateToken, async (req, res) => {
  const data = req.body; // Expects object: { key1: val1, key2: val2 }
  
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of Object.entries(data)) {
      await client.query(
        `INSERT INTO "textContent" (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, value]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Content update error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 3. GALLERY UPSERT (Add or Update photo)
// 3. GALLERY UPSERT (Add or Update photo)
app.post('/api/gallery', authenticateToken, async (req, res) => {
  const { id, src, order_idx } = req.body;
  try {
    await db.query(`INSERT INTO "gallery" (id, src, order_idx) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET src = EXCLUDED.src, order_idx = EXCLUDED.order_idx`, [id, src, order_idx || 0]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GALLERY DELETE
app.delete('/api/gallery/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(`DELETE FROM "gallery" WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. TESTIMONIALS UPSERT
app.post('/api/testimonials', async (req, res) => {
  const { id, name, student, grade, subject, rating, feedback, timestamp } = req.body;
  try {
    await db.query(`INSERT INTO "testimonials" (id, name, student, grade, subject, rating, feedback, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO UPDATE SET feedback = EXCLUDED.feedback`, [id, name, student, grade, subject, rating, feedback, timestamp]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5b. TESTIMONIALS DELETE
app.delete('/api/testimonials/:id', authenticateToken, async (req, res) => {
  try {
    await db.query(`DELETE FROM "testimonials" WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5c. TESTIMONIALS EDIT
app.put('/api/testimonials/:id', authenticateToken, async (req, res) => {
  const { feedback } = req.body;
  try {
    await db.query(`UPDATE "testimonials" SET feedback = $1 WHERE id = $2`, [feedback, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. DYNAMIC SECTION UPSERT
app.post('/api/dynamic', authenticateToken, async (req, res) => {
  const { id, category, htmlContent, order_idx } = req.body;
  try {
    await db.query(`INSERT INTO "dynamicSections" (id, category, "htmlContent", order_idx) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET "htmlContent" = EXCLUDED."htmlContent", order_idx = EXCLUDED.order_idx`, [id, category, htmlContent, order_idx || 0]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. DYNAMIC SECTION DELETE
app.delete('/api/dynamic/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(`DELETE FROM "dynamicSections" WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
