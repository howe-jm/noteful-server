require('dotenv').config();

function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_KEY;
  const authToken = req.get('Authorization');
  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }
  next();
}

module.exports = validateBearerToken;
