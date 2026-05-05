import 'dotenv/config';
import User from '../users/model.js';

const userRoles = process.env.USER_ROLES;

export const isAuthenticated = () => async (req, reply) => {
  try {
    await req.jwtVerify(); 
    const user = await User.findOne({ email: req.user.email });
    
    if (!user) {
      return reply.status(401).send({ message: 'User tidak terdaftar' });
    }
  } catch (err) {
    return reply.status(401).send({ message: 'Token tidak valid' });
  }
};

export const isAdmin = () => async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(401).send('Access Denied / Forbidden');
  }
};

export const hasRole = (role) => async (req, res) => {
  if (!req.user || userRoles.indexOf(role) >= userRoles.indexOf(req.user.role)) {
    res.status(401).send('Access Denied / Forbidden');
  }
};
