const router = require('express').Router();
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const USER_TYPES = ['Parent', 'Student', 'School'];
const CATEGORIES = ['Scholarship', 'Concert', 'Admission', 'General Query'];
const STATUSES = ['New', 'In Progress', 'Resolved'];

// PUBLIC: submit inquiry
router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const email = String(b.email || '').trim().toLowerCase();
    const phone = String(b.phone || '').trim();
    const message = String(b.message || '').trim();
    const errors = {};

    if (!USER_TYPES.includes(b.user_type)) errors.user_type = 'Select a valid user type';
    if (!CATEGORIES.includes(b.category)) errors.category = 'Select a valid category';
    if (name.length < 2 || name.length > 120) errors.name = 'Name must be 2-120 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email';
    if (!/^[+]?[0-9\s-]{7,15}$/.test(phone)) errors.phone = 'Enter a valid phone number';
    if (message.length < 5 || message.length > 2000) errors.message = 'Message must be 5-2000 characters';

    if (Object.keys(errors).length) return res.status(400).json({ error: 'Validation failed', errors });

    const { rows } = await pool.query(
      `INSERT INTO inquiries (user_type, category, name, email, phone, message)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, created_at`,
      [b.user_type, b.category, name, email, phone, message]
    );
    res.status(201).json({ message: 'Inquiry submitted', inquiry: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: counts by status
router.get('/stats', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT status, COUNT(*)::int AS count FROM inquiries GROUP BY status');
    const out = { total: 0, New: 0, 'In Progress': 0, Resolved: 0 };
    rows.forEach((r) => { out[r.status] = r.count; out.total += r.count; });
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: list with filters + search + pagination
router.get('/', requireAuth, async (req, res) => {
  try {
    const { category, user_type, status, search } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const where = [];
    const params = [];
    if (CATEGORIES.includes(category)) { params.push(category); where.push(`category = $${params.length}`); }
    if (USER_TYPES.includes(user_type)) { params.push(user_type); where.push(`user_type = $${params.length}`); }
    if (STATUSES.includes(status)) { params.push(status); where.push(`status = $${params.length}`); }
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      where.push(`(name ILIKE $${params.length} OR phone ILIKE $${params.length})`);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const count = await pool.query(`SELECT COUNT(*)::int AS total FROM inquiries ${clause}`, params);
    const list = await pool.query(
      `SELECT id, name, phone, email, user_type, category, message, status, created_at
       FROM inquiries ${clause}
       ORDER BY created_at DESC
       LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params
    );
    res.json({ data: list.rows, total: count.rows[0].total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: update status
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const { rows } = await pool.query('UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING *', [
      status,
      parseInt(req.params.id),
    ]);
    if (!rows[0]) return res.status(404).json({ error: 'Inquiry not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
