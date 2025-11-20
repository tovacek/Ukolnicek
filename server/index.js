
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'sql.dimzone.cz',
  user: process.env.DB_USER || 'tvacek',
  password: process.env.DB_PASSWORD || 'AdminBarsys',
  // Assuming the database name matches the username on this hosting, 
  // or use 'ukolnicek' if you created it manually.
  database: process.env.DB_NAME || 'tvacek', 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Ensure dates are returned as strings/JS Date objects correctly
  dateStrings: true 
});

// --- Helpers ---
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- USERS ---
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    const users = rows.map(u => ({
      ...u,
      // Handle boolean conversion from TINYINT
      // Handle JSON parsing for settings
      allowanceSettings: u.allowanceSettings ? (typeof u.allowanceSettings === 'string' ? JSON.parse(u.allowanceSettings) : u.allowanceSettings) : undefined
    }));
    res.json(users);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const user = { ...req.body, id: req.body.id || generateId() };
  // Ensure allowanceSettings is stringified for storage
  const dbUser = {
      ...user,
      allowanceSettings: user.allowanceSettings ? JSON.stringify(user.allowanceSettings) : null
  };
  
  try {
    await pool.query('INSERT INTO users SET ?', [dbUser]);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  
  if (updates.allowanceSettings !== undefined) {
    updates.allowanceSettings = updates.allowanceSettings ? JSON.stringify(updates.allowanceSettings) : null;
  }
  
  try {
    await pool.query('UPDATE users SET ? WHERE id = ?', [updates, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TASKS ---
app.get('/api/tasks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tasks');
    const tasks = rows.map(t => ({ 
        ...t, 
        isRecurring: !!t.isRecurring,
        // Ensure date comes back as YYYY-MM-DD string
        date: typeof t.date === 'string' ? t.date.split('T')[0] : new Date(t.date).toISOString().split('T')[0]
    }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  const task = { ...req.body, id: req.body.id || generateId() };
  // Convert boolean to tinyint for MySQL if needed, though mysql2 usually handles it
  const dbTask = {
      ...task,
      isRecurring: task.isRecurring ? 1 : 0
  };
  
  try {
    await pool.query('INSERT INTO tasks SET ?', [dbTask]);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  const updates = { ...req.body };
  if (updates.isRecurring !== undefined) {
      updates.isRecurring = updates.isRecurring ? 1 : 0;
  }

  try {
    await pool.query('UPDATE tasks SET ? WHERE id = ?', [updates, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PAYOUTS ---
app.get('/api/payouts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payout_history ORDER BY date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payouts', async (req, res) => {
  const record = { ...req.body, id: generateId() };
  try {
    await pool.query('INSERT INTO payout_history SET ?', [record]);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GOALS ---
app.get('/api/goals', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM goals');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/goals', async (req, res) => {
  const goal = { ...req.body, id: req.body.id || generateId() };
  try {
    await pool.query('INSERT INTO goals SET ?', [goal]);
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/goals/:id', async (req, res) => {
  try {
    await pool.query('UPDATE goals SET ? WHERE id = ?', [req.body, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/goals/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM goals WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Connected to database at sql.dimzone.cz');
});
