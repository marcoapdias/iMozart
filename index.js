const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'imozart',
  password: 'admin',
  port: 5432
});

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

app.get('/', (req, res) => {
  res.render('index', { message: '' });
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hashedPassword]);
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.render('index', { message: 'Error registering user' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        req.session.userId = user.id;
        res.redirect('/welcome');
      } else {
        res.render('index', { message: 'Invalid email or password' });
      }
    } else {
      res.render('index', { message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error(err);
    res.render('index', { message: 'Error logging in' });
  }
});

app.get('/welcome', (req, res) => {
  if (req.session.userId) {
    res.render('welcome', { name: 'iMozart' });
  } else {
    res.redirect('/');
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
