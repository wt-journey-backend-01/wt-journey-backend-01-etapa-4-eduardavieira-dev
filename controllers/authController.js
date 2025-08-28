const usuariosRepository = require('../repositories/usuariosRepository');
const Bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errorHandler');

const SECRET = process.env.JWT_SECRET || 'secret';

const login = async (req, res, next) => {
    try {
        const { email, senha } = req.body;

        const usuario = await usuariosRepository.findUserByEmail(email);
        if (!usuario) {
            throw new AppError(401, 'Email inválido');
        }

        const senhaValida = await Bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            throw new AppError(401, 'Senha inválida');
        }

        const token = jwt.sign({ id: usuario.id }, SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000,
            path: '/',
        });

        return res.status(200).json({
            message: "Usuario logado com sucesso",
            token: token,
        });

    } catch (error) {
        return next(error);
    }
};

const register = async (req, res, next) => {
    try {
        const { nome, email, senha } = req.body;

        const usuarioExistente = await usuariosRepository.findUserByEmail(email);
        if (usuarioExistente) {
            throw new AppError(409, 'Email já cadastrado');
        }

        const salt = await Bcrypt.genSalt(10);
        const senhaHash = await Bcrypt.hash(senha, salt);
        await usuariosRepository.createUser({ nome, email, senha: senhaHash });

        return res.status(201).json({
            message: "Usuario cadastrado com sucesso",
        });

    } catch (error) {
        return next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const usuario = await usuariosRepository.findUserById(id);
        if (!usuario) {
            throw new AppError(404, 'Usuario não encontrado');
        }

        const deleted = await usuariosRepository.deleteUser(id);
        if (!deleted) {
            throw new AppError(500, 'Erro ao deletar usuario');
        }

        return res.status(204).send();

    } catch (error) {
        return next(error);
    }
};


const logout = async (req, res, next) => {
    try {
        res.clearCookie('token', { path: '/' });
        return res.status(200).json({
            message: "Usuario deslogado com sucesso",
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    login,
    register,
    deleteUser,
    logout
};