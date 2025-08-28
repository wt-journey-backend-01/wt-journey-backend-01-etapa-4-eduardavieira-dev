const usuariosRepository = require('../repositories/usuariosRepository');
const Bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errorHandler');
const { registerSchema, loginSchema } = require('../utils/userValidations');
const { z } = require('zod');

const SECRET = process.env.JWT_SECRET || 'secret';

const login = async (req, res, next) => {
    try {
        const result = loginSchema.safeParse(req.body);
        if (!result.success) {
            throw new AppError(400, 'Dados inválidos', result.error.errors.map(e => e.message));
        }

        const { email, senha } = result.data;

        const usuario = await usuariosRepository.findUserByEmail(email);
        if (!usuario) {
            throw new AppError(401, 'Credenciais inválidas');
        }

        const senhaValida = await Bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            throw new AppError(401, 'Credenciais inválidas');
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
            access_token: token
        });

    } catch (error) {
        return next(error);
    }
};

const register = async (req, res, next) => {
    try {
        // Verifica se o corpo da requisição está vazio
        if (!req.body || Object.keys(req.body).length === 0) {
            throw new AppError(400, 'Dados inválidos', ['Corpo da requisição não pode ser vazio']);
        }

        const result = registerSchema.safeParse(req.body);
        if (!result.success) {
            const errors = [];
            
            // Verifica campos extras
            if (result.error.errors.some(e => e.code === 'unrecognized_keys')) {
                const extraFields = result.error.errors
                    .find(e => e.code === 'unrecognized_keys')
                    .keys;
                errors.push(`Campos não permitidos: ${extraFields.join(', ')}`);
            } else {
                // Processa outros erros de validação
                const formattedErrors = result.error.format();
                if (formattedErrors.nome?._errors) {
                    errors.push(...formattedErrors.nome._errors);
                }
                if (formattedErrors.email?._errors) {
                    errors.push(...formattedErrors.email._errors);
                }
                if (formattedErrors.senha?._errors) {
                    errors.push(...formattedErrors.senha._errors);
                }
            }
            
            throw new AppError(400, 'Dados inválidos', errors);
        }

        const { nome, email, senha } = result.data;

        const usuarioExistente = await usuariosRepository.findUserByEmail(email);
        if (usuarioExistente) {
            throw new AppError(400, 'Email já cadastrado');
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