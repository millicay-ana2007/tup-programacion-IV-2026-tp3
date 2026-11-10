import passport from 'passport';
import passportJwt from 'passport-jwt';
import { pool } from './db.js';

const { Strategy: JwtStrategy, ExtractJwt } = passportJwt;

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const [rows] = await pool.query(
          'SELECT id, nombre, email FROM usuarios WHERE id = ?',
          [payload.id]
        );
        return done(null, rows[0] || false);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);