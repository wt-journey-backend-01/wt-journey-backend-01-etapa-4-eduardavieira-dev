const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errorHandler');
const usuariosRepository = require('../repositories/usuariosRepository');

const SECRET = process.env.JWT_SECRET || 'secret';

const authMiddleware = async (req, res, next) => {
    try {
        const cookieToken = req.cookies?.token;
        const authHeader = req.headers['authorization'];
        const headerToken = authHeader && authHeader.split(' ')[1];

        const token = cookieToken || headerToken;

        if (!token) {
            throw new AppError(401, 'Token não fornecido');
        }

        // Verifica se o token é válido
        jwt.verify(token, SECRET, async (err, decoded) => {
            if (err) {
                return next(new AppError(401, 'Token inválido'));
            }

            try {
                // Busca os dados completos do usuário
                const usuario = await usuariosRepository.findUserById(decoded.id);

                if (!usuario) {
                    return next(new AppError(401, 'Usuário não encontrado'));
                }

                // Adiciona os dados do usuário à requisição (exceto a senha)
                req.user = {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email
                };

                next();
            } catch (error) {
                return next(new AppError(500, 'Erro ao validar usuário'));
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = authMiddleware;