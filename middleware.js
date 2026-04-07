import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'aurum-secret-key-change-in-prod';
export const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        // If no token, we can just proceed without user (for public routes) or fail
        // But since this middleware is meant for protected routes, we fail.
        // However, for mixed use, we could make it optional.
        // For now, let's assume it protects the route.
        return res.status(401).json({ error: 'Acceso denegado: Token no proporcionado.' });
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ error: 'Token inválido o expirado.' });
        req.user = user;
        next();
    });
};
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ error: 'No autenticado.' });
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Acceso prohibido: Rol insuficiente.' });
        }
        next();
    };
};
