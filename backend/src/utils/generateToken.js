const jwt = require('jsonwebtoken');

// Signs a JWT containing only the user's id and role. Keep the payload
// minimal — anything else needed should be fetched fresh from the DB
// via req.user in the auth middleware, not trusted from the token.
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = generateToken;
