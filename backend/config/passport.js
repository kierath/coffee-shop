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
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        // Check if a user with this email already exists (local OR Google)
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        let user;
        if (result.rows.length === 0) {
          // No user found, create one (no password)
          const insert = await pool.query(
            'INSERT INTO users (name, email, password, provider) VALUES ($1, $2, $3, $4) RETURNING id, name, email, provider',
            [name, email, null, 'google']
          );
          user = insert.rows[0];
        } else {
          // Existing user found (local or Google)
          user = result.rows[0];
        }

        return done(null, user);
      } catch (err) {
        console.error('Google login error:', err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
