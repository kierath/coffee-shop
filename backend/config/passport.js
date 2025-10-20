const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../config/db');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        // Check if user exists
        let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user;

        if (result.rows.length === 0) {
          // If the password field is NOT NULL in the DB, use a dummy hash
          const dummyPassword = 'google_oauth_user';
          const insert = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, dummyPassword]
          );
          user = insert.rows[0];
        } else {
          user = result.rows[0];

          // Update name if it's missing or different
          if (!user.name || user.name !== name) {
            const update = await pool.query(
              'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email',
              [name, user.id]
            );
            user = update.rows[0];
          }
        }

        done(null, user);
      } catch (err) {
        console.error('❌ Passport GoogleStrategy error:', err);
        done(err, null);
      }
    }
  )
);

// Serialize and deserialize user (required for passport)
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});
