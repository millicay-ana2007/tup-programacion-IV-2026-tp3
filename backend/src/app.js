app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON inválido' });
  }
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});