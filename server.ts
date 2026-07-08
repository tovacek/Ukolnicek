import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import pg from 'pg';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
const isPostgres = !!(databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')));

console.log(`[Database] Engine auto-detection: ${isPostgres ? 'PostgreSQL (Supabase)' : 'MySQL/TiDB'}`);

// SQL query and schema dialect adapter for running MySQL syntax seamlessly on PostgreSQL (Supabase)
function convertSql(sql: string): string {
  if (!isPostgres) return sql;
  
  // 1. Replace backticks with double quotes for table and column names
  let converted = sql.replace(/`/g, '"');
  
  // 2. Strip MySQL-specific storage engine, charset, and collation configuration
  converted = converted.replace(/ENGINE\s*=\s*InnoDB/gi, '');
  converted = converted.replace(/DEFAULT\s*CHARSET\s*=\s*\w+/gi, '');
  converted = converted.replace(/COLLATE\s*=\s*[\w_]+/gi, '');
  
  // 3. Replace MySQL TINYINT with PostgreSQL compatible INT
  converted = converted.replace(/TINYINT\(\d+\)/gi, 'INT');
  converted = converted.replace(/TINYINT/gi, 'INT');

  // 4. Translate MySQL "?" placeholders to PostgreSQL "$1", "$2", "$3", etc.
  let index = 1;
  converted = converted.replace(/\?/g, () => `$${index++}`);
  
  return converted;
}

// Helper to get database connection configuration pointing ONLY to TiDB Cloud and 'test' database (when not using PG)
function getDbConfig() {
  // Default values pointing to your TiDB Cloud 'test' database
  let host = 'gateway01.eu-central-1.prod.aws.tidbcloud.com';
  let user = '2gtxXNLHAdaS4rc.root';
  let password = 'Qz62yWzHH8Ii7KIP';
  let database = 'test';
  let port = 4000;
  
  if (databaseUrl && !isPostgres) {
    try {
      const parsed = new URL(databaseUrl);
      host = parsed.hostname;
      port = parsed.port ? parseInt(parsed.port) : 4000;
      user = decodeURIComponent(parsed.username);
      password = decodeURIComponent(parsed.password);
      // Force database to 'test' to avoid permission issues when creating custom databases
      database = 'test';
      console.log(`Parsed Database URL: host=${host}, port=${port}, database=${database}, user=${user}`);
    } catch (err: any) {
      console.error('Failed to parse DATABASE_URL, using default TiDB connection:', err.message);
    }
  }

  // Always enable SSL with min TLS 1.2 for secure TiDB connections
  const sslConfig = { minVersion: 'TLSv1.2', rejectUnauthorized: true };

  return { host, user, password, database, port, ssl: sslConfig };
}

// The unified pool object matching the MySQL promise pool signature
let pool: any;

if (isPostgres) {
  const pgPool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Necessary for connection to Supabase in serverless/cloud environments
    }
  });

  pool = {
    async query(sql: string, params: any[] = []) {
      const convertedSql = convertSql(sql);
      try {
        const res = await pgPool.query(convertedSql, params);
        return [res.rows, null];
      } catch (err: any) {
        console.error(`PostgreSQL Query Error: ${err.message}\nOriginal SQL: ${sql}\nConverted SQL: ${convertedSql}`);
        throw err;
      }
    },
    async getConnection() {
      const client = await pgPool.connect();
      return {
        async query(sql: string, params: any[] = []) {
          const convertedSql = convertSql(sql);
          try {
            const res = await client.query(convertedSql, params);
            return [res.rows, null];
          } catch (err: any) {
            console.error(`PostgreSQL Transaction Query Error: ${err.message}\nOriginal SQL: ${sql}\nConverted SQL: ${convertedSql}`);
            throw err;
          }
        },
        async beginTransaction() {
          await client.query('BEGIN');
        },
        async commit() {
          await client.query('COMMIT');
        },
        async rollback() {
          await client.query('ROLLBACK');
        },
        release() {
          client.release();
        }
      };
    }
  };
} else {
  const config = getDbConfig();
  const mysqlPool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    port: config.port,
    ssl: config.ssl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    connectTimeout: 5000
  });

  pool = {
    async query(sql: string, params: any[] = []) {
      return await mysqlPool.query(sql, params);
    },
    async getConnection() {
      const conn = await mysqlPool.getConnection();
      return {
        async query(sql: string, params: any[] = []) {
          return await conn.query(sql, params);
        },
        async beginTransaction() {
          await conn.beginTransaction();
        },
        async commit() {
          await conn.commit();
        },
        async rollback() {
          await conn.rollback();
        },
        release() {
          conn.release();
        }
      };
    }
  };
}

// A robust lazy bootstrapping mechanism to ensure tables are created once upon first API usage
let tablesBootstrapped = false;
let bootstrapPromise: Promise<void> | null = null;

async function ensureTables() {
  if (tablesBootstrapped) return;
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    try {
      console.log(`Ensuring tables exist in ${isPostgres ? 'Supabase/PostgreSQL' : 'TiDB/MySQL'} database...`);
      // 1. users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ukolnicek_users (
          id VARCHAR(50) PRIMARY KEY,
          family_id VARCHAR(50) NULL,
          email VARCHAR(255) NULL,
          name VARCHAR(100) NULL,
          role VARCHAR(50) NULL,
          avatar_url VARCHAR(255) NULL,
          points INT DEFAULT 0,
          balance INT DEFAULT 0,
          password VARCHAR(255) NULL,
          pin VARCHAR(50) DEFAULT '',
          family_name VARCHAR(255) NULL,
          allowance_settings TEXT NULL,
          last_login_reward_date VARCHAR(50) NULL,
          last_allowance_date VARCHAR(50) NULL,
          birth_year INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 2. tasks table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ukolnicek_tasks (
          id VARCHAR(50) PRIMARY KEY,
          family_id VARCHAR(50) NULL,
          title VARCHAR(255) NULL,
          description TEXT NULL,
          reward_points INT DEFAULT 0,
          reward_money INT DEFAULT 0,
          assigned_to_id VARCHAR(50) NULL,
          date VARCHAR(50) NULL,
          status VARCHAR(50) NULL,
          proof_image_url VARCHAR(255) NULL,
          feedback TEXT NULL,
          created_by VARCHAR(50) NULL,
          is_recurring TINYINT(1) DEFAULT 0,
          recurring_frequency VARCHAR(50) NULL,
          penalty INT DEFAULT 5
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 3. payout_history table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ukolnicek_payout_history (
          id VARCHAR(50) PRIMARY KEY,
          family_id VARCHAR(50) NULL,
          child_id VARCHAR(50) NULL,
          amount INT NOT NULL DEFAULT 0,
          date VARCHAR(100) NULL,
          note TEXT NULL,
          type VARCHAR(50) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 4. goals table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ukolnicek_goals (
          id VARCHAR(50) PRIMARY KEY,
          family_id VARCHAR(50) NULL,
          child_id VARCHAR(50) NULL,
          title VARCHAR(255) NULL,
          target_amount INT NOT NULL DEFAULT 0,
          image_url VARCHAR(255) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 5. calendar_events table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ukolnicek_calendar_events (
          id VARCHAR(50) PRIMARY KEY,
          family_id VARCHAR(50) NULL,
          child_id VARCHAR(50) NULL,
          title VARCHAR(255) NULL,
          day_index INT NOT NULL DEFAULT 0,
          time VARCHAR(50) NULL,
          color VARCHAR(50) NULL,
          is_recurring TINYINT(1) DEFAULT 1,
          specific_date VARCHAR(50) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 6. notifications table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ukolnicek_notifications (
          id VARCHAR(50) PRIMARY KEY,
          family_id VARCHAR(50) NULL,
          recipient_id VARCHAR(50) NULL,
          message TEXT NULL,
          type VARCHAR(50) NULL,
          is_read TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      tablesBootstrapped = true;
      console.log('Database tables verified/bootstrapped successfully with ukolnicek_ prefix.');
    } catch (err: any) {
      console.error('Database tables bootstrapping failed:', err.message);
      bootstrapPromise = null; // Allow retry on next request
    }
  })();

  return bootstrapPromise;
}

// Request middleware to ensure tables exist before handling API operations
app.use(async (req, res, next) => {
  if (req.path === '/api/health') {
    return next();
  }
  try {
    await ensureTables();
    next();
  } catch (err: any) {
    console.error('Database bootstrap failed in middleware:', err);
    next(); // Proceed anyway, routes will handle the DB connection error gracefully
  }
});

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'MySQL' });
});

// Fetch all family data
app.get('/api/data', async (req, res) => {
  const { familyId } = req.query;
  if (!familyId) {
    return res.status(400).json({ error: 'familyId is required' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM ukolnicek_users WHERE family_id = ?', [familyId]);
    const [tasks] = await pool.query('SELECT * FROM ukolnicek_tasks WHERE family_id = ?', [familyId]);
    const [payoutHistory] = await pool.query('SELECT * FROM ukolnicek_payout_history WHERE family_id = ? ORDER BY date DESC', [familyId]);
    const [goals] = await pool.query('SELECT * FROM ukolnicek_goals WHERE family_id = ?', [familyId]);
    const [calendarEvents] = await pool.query('SELECT * FROM ukolnicek_calendar_events WHERE family_id = ?', [familyId]);
    const [notifications] = await pool.query('SELECT * FROM ukolnicek_notifications WHERE family_id = ? ORDER BY created_at DESC', [familyId]);

    // Map rows to exact TypeScript types expected by the client application
    const mappedUsers = (users as any[]).map(u => ({
      id: u.id,
      familyId: u.family_id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatarUrl: u.avatar_url,
      points: u.points,
      balance: u.balance,
      password: u.password,
      pin: u.pin || '',
      familyName: u.family_name,
      allowanceSettings: u.allowance_settings ? JSON.parse(u.allowance_settings) : undefined,
      lastLoginRewardDate: u.last_login_reward_date,
      lastAllowanceDate: u.last_allowance_date,
      createdAt: u.created_at,
      birthYear: u.birth_year
    }));

    const mappedTasks = (tasks as any[]).map(t => ({
      id: t.id,
      familyId: t.family_id,
      title: t.title,
      description: t.description,
      rewardPoints: t.reward_points,
      rewardMoney: t.reward_money,
      assignedToId: t.assigned_to_id,
      date: t.date,
      status: t.status,
      proofImageUrl: t.proof_image_url,
      feedback: t.feedback,
      createdBy: t.created_by,
      isRecurring: !!t.is_recurring,
      recurringFrequency: t.recurring_frequency,
      penalty: t.penalty
    }));

    const mappedPayoutHistory = (payoutHistory as any[]).map(p => ({
      id: p.id,
      familyId: p.family_id,
      childId: p.child_id,
      amount: p.amount,
      date: p.date,
      note: p.note,
      type: p.type || 'PARENT'
    }));

    const mappedGoals = (goals as any[]).map(g => ({
      id: g.id,
      familyId: g.family_id,
      childId: g.child_id,
      title: g.title,
      targetAmount: g.target_amount,
      imageUrl: g.image_url
    }));

    const mappedCalendarEvents = (calendarEvents as any[]).map(e => ({
      id: e.id,
      familyId: e.family_id,
      childId: e.child_id,
      title: e.title,
      dayIndex: e.day_index,
      time: e.time,
      color: e.color,
      isRecurring: !!e.is_recurring,
      specificDate: e.specific_date
    }));

    const mappedNotifications = (notifications as any[]).map(n => ({
      id: n.id,
      familyId: n.family_id,
      recipientId: n.recipient_id,
      message: n.message,
      type: n.type,
      isRead: !!n.is_read,
      createdAt: n.created_at
    }));

    res.json({
      users: mappedUsers,
      tasks: mappedTasks,
      payoutHistory: mappedPayoutHistory,
      goals: mappedGoals,
      calendarEvents: mappedCalendarEvents,
      notifications: mappedNotifications
    });
  } catch (err: any) {
    console.error('Error loading family data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Authenticate Family (Parent Login)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows]: any = await pool.query(
      'SELECT family_id FROM ukolnicek_users WHERE email = ? AND password = ? AND role = "PARENT" LIMIT 1',
      [email, password]
    );
    if (rows.length > 0) {
      res.json({ success: true, familyId: rows[0].family_id });
    } else {
      res.json({ success: false, error: 'Nesprávný email nebo heslo.' });
    }
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Register Family
app.post('/api/auth/register', async (req, res) => {
  const { email, password, familyName } = req.body;
  try {
    const [existing]: any = await pool.query('SELECT id FROM ukolnicek_users WHERE email = ? LIMIT 1', [email]);
    if (existing.length > 0) {
      return res.json({ success: false, error: 'Email již existuje.' });
    }

    const familyId = Math.random().toString(36).substr(2, 9);
    const parentId = Math.random().toString(36).substr(2, 9);

    await pool.query(
      'INSERT INTO ukolnicek_users (id, family_id, email, name, role, password, pin, family_name, avatar_url, points, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [parentId, familyId, email, 'Rodič', 'PARENT', password, '', familyName, '', 0, 0]
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add Child
app.post('/api/users', async (req, res) => {
  const { id, familyId, name, role, avatarUrl, points, balance, pin, birthYear } = req.body;
  try {
    await pool.query(
      'INSERT INTO ukolnicek_users (id, family_id, name, role, avatar_url, points, balance, pin, birth_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, familyId, name, role, avatarUrl || '', points || 0, balance || 0, pin || '', birthYear || null]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error adding child:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Child properties (name, avatar, pin, birthYear)
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, avatarUrl, pin, birthYear } = req.body;
  try {
    await pool.query(
      'UPDATE ukolnicek_users SET name = ?, avatar_url = ?, pin = ?, birth_year = ? WHERE id = ?',
      [name, avatarUrl || '', pin || '', birthYear || null, id]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error updating child:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Child
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM ukolnicek_users WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting child:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update PIN
app.put('/api/users/:id/pin', async (req, res) => {
  const { id } = req.params;
  const { pin } = req.body;
  try {
    await pool.query('UPDATE ukolnicek_users SET pin = ? WHERE id = ?', [pin, id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error updating PIN:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Family Profile / Parent Info
app.put('/api/users/:id/profile', async (req, res) => {
  const { id } = req.params;
  const { familyName, email, password } = req.body;
  try {
    if (password) {
      await pool.query(
        'UPDATE ukolnicek_users SET family_name = ?, email = ?, password = ? WHERE id = ?',
        [familyName, email, password, id]
      );
    } else {
      await pool.query(
        'UPDATE ukolnicek_users SET family_name = ?, email = ? WHERE id = ?',
        [familyName, email, id]
      );
    }

    // Proactively sync family_name across all other members under this family_id
    const [userRows]: any = await pool.query('SELECT family_id FROM ukolnicek_users WHERE id = ?', [id]);
    if (userRows.length > 0) {
      await pool.query('UPDATE ukolnicek_users SET family_name = ? WHERE family_id = ?', [familyName, userRows[0].family_id]);
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: err.message });
  }
});

// Set Child Allowance
app.put('/api/users/:id/allowance', async (req, res) => {
  const { id } = req.params;
  const { allowanceSettings } = req.body;
  try {
    const serialized = allowanceSettings ? JSON.stringify(allowanceSettings) : null;
    await pool.query('UPDATE ukolnicek_users SET allowance_settings = ? WHERE id = ?', [serialized, id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error setting allowance:', err);
    res.status(500).json({ error: err.message });
  }
});

// Process Allowance Payment
app.post('/api/users/:id/allowance-pay', async (req, res) => {
  const { id } = req.params;
  const { balance, lastAllowanceDate, notification } = req.body;
  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('UPDATE ukolnicek_users SET balance = ?, last_allowance_date = ? WHERE id = ?', [balance, lastAllowanceDate, id]);
      if (notification) {
        await connection.query(
          'INSERT INTO ukolnicek_notifications (id, family_id, recipient_id, message, type, is_read) VALUES (?, ?, ?, ?, ?, ?)',
          [notification.id, notification.familyId, notification.recipientId, notification.message, notification.type, notification.isRead ? 1 : 0]
        );
      }
      await connection.commit();
      res.json({ success: true });
    } catch (transactionErr) {
      await connection.rollback();
      throw transactionErr;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    console.error('Error paying allowance:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add Points/Balance manually
app.post('/api/users/:id/points', async (req, res) => {
  const { id } = req.params;
  const { points, money } = req.body;
  try {
    await pool.query(
      'UPDATE ukolnicek_users SET points = points + ?, balance = balance + ? WHERE id = ?',
      [points || 0, money || 0, id]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error adding points:', err);
    res.status(500).json({ error: err.message });
  }
});

// Process Payout (Withdraw entire balance)
app.post('/api/users/:id/payout', async (req, res) => {
  const { id } = req.params;
  const { record } = req.body;
  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        'INSERT INTO ukolnicek_payout_history (id, family_id, child_id, amount, date, note, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [record.id, record.familyId, record.childId, record.amount, record.date, record.note || '', record.type || 'PARENT']
      );
      await connection.query('UPDATE ukolnicek_users SET balance = 0 WHERE id = ?', [id]);
      await connection.commit();
      res.json({ success: true });
    } catch (transactionErr) {
      await connection.rollback();
      throw transactionErr;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    console.error('Payout processing failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create Child Withdrawal (Deduct specific amount)
app.post('/api/users/:id/withdrawal', async (req, res) => {
  const { id } = req.params;
  const { record, amount } = req.body;
  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [userRows]: any = await connection.query('SELECT balance FROM ukolnicek_users WHERE id = ?', [id]);
      if (userRows.length === 0 || userRows[0].balance < amount) {
        await connection.rollback();
        return res.status(400).json({ error: 'Nedostatečný zůstatek.' });
      }
      await connection.query(
        'INSERT INTO ukolnicek_payout_history (id, family_id, child_id, amount, date, note, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [record.id, record.familyId, record.childId, record.amount, record.date, record.note || '', record.type || 'CHILD']
      );
      await connection.query('UPDATE ukolnicek_users SET balance = balance - ? WHERE id = ?', [amount, id]);
      await connection.commit();
      res.json({ success: true });
    } catch (transactionErr) {
      await connection.rollback();
      throw transactionErr;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    console.error('Withdrawal failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Convert Points to CZK and insert a history task
app.post('/api/users/:id/convert-points', async (req, res) => {
  const { id } = req.params;
  const { pointsToConvert, moneyToAdd, exchangeTask } = req.body;
  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('UPDATE ukolnicek_users SET points = points - ?, balance = balance + ? WHERE id = ?', [pointsToConvert, moneyToAdd, id]);
      await connection.query(
        'INSERT INTO ukolnicek_tasks (id, family_id, title, description, reward_points, reward_money, assigned_to_id, date, status, created_by, is_recurring, penalty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          exchangeTask.id,
          exchangeTask.familyId,
          exchangeTask.title,
          exchangeTask.description,
          exchangeTask.rewardPoints,
          exchangeTask.rewardMoney,
          exchangeTask.assignedToId,
          exchangeTask.date,
          exchangeTask.status,
          exchangeTask.createdBy,
          0,
          5
        ]
      );
      await connection.commit();
      res.json({ success: true });
    } catch (transactionErr) {
      await connection.rollback();
      throw transactionErr;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    console.error('Points conversion failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Claim Daily login reward
app.post('/api/users/:id/daily-reward', async (req, res) => {
  const { id } = req.params;
  const { points, dateStr } = req.body;
  try {
    await pool.query(
      'UPDATE ukolnicek_users SET points = points + ?, last_login_reward_date = ? WHERE id = ?',
      [points, dateStr, id]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error('Daily reward failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add Task
app.post('/api/tasks', async (req, res) => {
  const { id, familyId, title, description, rewardPoints, rewardMoney, assignedToId, date, status, createdBy, isRecurring, recurringFrequency, penalty } = req.body;
  try {
    await pool.query(
      'INSERT INTO ukolnicek_tasks (id, family_id, title, description, reward_points, reward_money, assigned_to_id, date, status, created_by, is_recurring, recurring_frequency, penalty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, familyId, title, description || '', rewardPoints || 0, rewardMoney || 0, assignedToId, date, status, createdBy, isRecurring ? 1 : 0, recurringFrequency || null, penalty || 5]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error adding task:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Task (Dynamic fields)
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  try {
    const fields: string[] = [];
    const values: any[] = [];
    
    const mapping = {
      title: 'title',
      description: 'description',
      rewardPoints: 'reward_points',
      rewardMoney: 'reward_money',
      assignedToId: 'assigned_to_id',
      date: 'date',
      status: 'status',
      proofImageUrl: 'proof_image_url',
      feedback: 'feedback',
      createdBy: 'created_by',
      isRecurring: 'is_recurring',
      recurringFrequency: 'recurring_frequency',
      penalty: 'penalty'
    };

    for (const [key, dbCol] of Object.entries(mapping)) {
      if (body[key] !== undefined) {
        fields.push(`${dbCol} = ?`);
        if (key === 'isRecurring') {
          values.push(body[key] ? 1 : 0);
        } else {
          values.push(body[key]);
        }
      }
    }

    if (fields.length === 0) {
      return res.json({ success: true, message: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE ukolnicek_tasks SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Task
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM ukolnicek_tasks WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add Goal
app.post('/api/goals', async (req, res) => {
  const { id, familyId, childId, title, targetAmount, imageUrl } = req.body;
  try {
    await pool.query(
      'INSERT INTO ukolnicek_goals (id, family_id, child_id, title, target_amount, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [id, familyId, childId, title, targetAmount, imageUrl || '']
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error adding goal:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Goal
app.put('/api/goals/:id', async (req, res) => {
  const { id } = req.params;
  const { title, targetAmount, imageUrl } = req.body;
  try {
    const fields: string[] = [];
    const values: any[] = [];
    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (targetAmount !== undefined) { fields.push('target_amount = ?'); values.push(targetAmount); }
    if (imageUrl !== undefined) { fields.push('image_url = ?'); values.push(imageUrl); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE ukolnicek_goals SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error updating goal:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Goal
app.delete('/api/goals/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM ukolnicek_goals WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting goal:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add Calendar Event
app.post('/api/calendar', async (req, res) => {
  const { id, familyId, childId, title, dayIndex, time, color, isRecurring, specificDate } = req.body;
  try {
    await pool.query(
      'INSERT INTO ukolnicek_calendar_events (id, family_id, child_id, title, day_index, time, color, is_recurring, specific_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, familyId, childId, title, dayIndex, time, color, isRecurring ? 1 : 0, specificDate || null]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error adding calendar event:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Calendar Event
app.delete('/api/calendar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM ukolnicek_calendar_events WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting calendar event:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add Notification
app.post('/api/notifications', async (req, res) => {
  const { id, familyId, recipientId, message, type, isRead } = req.body;
  try {
    await pool.query(
      'INSERT INTO ukolnicek_notifications (id, family_id, recipient_id, message, type, is_read) VALUES (?, ?, ?, ?, ?, ?)',
      [id, familyId, recipientId, message, type, isRead ? 1 : 0]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error adding notification:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mark Notification as Read
app.put('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE ukolnicek_notifications SET is_read = 1 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error marking notification read:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
