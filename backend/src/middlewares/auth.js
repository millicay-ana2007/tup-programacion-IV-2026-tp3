import passport from 'passport';

export const requireAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: 'No autorizado: token inválido o expirado' });
    }
    req.user = user;
    next();
  })(req, res, next);
};