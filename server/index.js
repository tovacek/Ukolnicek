
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'sql.dimzone.cz',
  user: process.env.DB_USER || 'tvacek',
  password: process.env.DB_PASSWORD || 'AdminBarsys',
  database: process.env.DB_NAME || 'tvacek', 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  // Add timeouts to fail faster if network is blocked
  connectTimeout: 10000, 
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

const pool = mysql.createPool(dbConfig);

// --- CONNECTION TEST ---
// This runs immediately when server starts to verify DB access
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ ÚSPĚŠNĚ PŘIPOJENO K DATABÁZI:', dbConfig.host);
        connection.release();
    } catch (err) {
        console.error('❌ CHYBA PŘIPOJENÍ K DATABÁZI:');
        console.error('   Zpráva:', err.message);
        console.error('   Kód:', err.code);
        console.error('---');
        console.error('TIP: Zkontrolujte, zda máte na hostingu povolen "Vzdálený přístup (Remote MySQL)" pro vaši IP adresu.');
        console.error('TIP: Ověřte správnost hesla a názvu databáze.');
    }
})();

// --- Helpers ---
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- AUTHENTICATION MIDDLEWARE ---
// Middleware to get familyId from headers
const getFamilyId = (req) => {
    // In a real app, you would verify a JWT token here.
    // For this demo, we trust the header sent by the frontend.
    return req.headers['x-family-id'];
};

// --- AUTH ENDPOINTS ---

app.post('/api/register', async (req, res) => {
    const { email, password, familyName } = req.body;
    const familyId = generateId();
    const parentId = generateId();

    const newParent = {
        id: parentId,
        familyId,
        email,
        name: familyName || 'Rodič', // Default name, user can change later
        role: 'PARENT',
        password, // In production, this MUST be hashed (e.g., bcrypt)
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${parentId}`
    };

    try {
        await pool.query('INSERT INTO users SET ?', [newParent]);
        res.json({ success: true, familyId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registrace se nezdařila (email pravděpodobně existuje).' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND password = ? AND role = "PARENT"', [email, password]);
        
        if (rows.length > 0) {
            const user = rows[0];
            res.json({ success: true, familyId: user.familyId });
        } else {
            res.status(401).json({ error: 'Nesprávný email nebo heslo.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// --- USERS ---
app.get('/api/users', async (req, res) => {
  const familyId = getFamilyId(req);
  if (!familyId) return res.status(403).json({ error: 'Missing family ID' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE familyId = ?', [familyId]);
    const users = rows.map(u => ({
      ...u,
      allowanceSettings: u.allowanceSettings ? (typeof u.allowanceSettings === 'string' ? JSON.parse(u.allowanceSettings) : u.allowanceSettings) : undefined
    }));
    res.json(users);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  // Assume familyId comes in body for creation or inferred from context
  // For adding a child, we rely on the logged-in parent's context usually, 
  // but here we passed familyId in the body from AppContext.
  const user = { ...req.body, id: req.body.id || generateId() };
  
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
  const familyId = getFamilyId(req);
  if (!familyId) return res.status(403).json({ error: 'Missing family ID' });

  try {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE familyId = ?', [familyId]);
    const tasks = rows.map(t => ({ 
        ...t, 
        isRecurring: !!t.isRecurring,
        date: typeof t.date === 'string' ? t.date.split('T')[0] : new Date(t.date).toISOString().split('T')[0]
    }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  const task = { ...req.body, id: req.body.id || generateId() };
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
  const familyId = getFamilyId(req);
  if (!familyId) return res.status(403).json({ error: 'Missing family ID' });

  try {
    const [rows] = await pool.query('SELECT * FROM payout_history WHERE familyId = ? ORDER BY date DESC', [familyId]);
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
  const familyId = getFamilyId(req);
  if (!familyId) return res.status(403).json({ error: 'Missing family ID' });

  try {
    const [rows] = await pool.query('SELECT * FROM goals WHERE familyId = ?', [familyId]);
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
});
