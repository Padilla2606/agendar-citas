import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'citas-secret-key-change-in-production';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
