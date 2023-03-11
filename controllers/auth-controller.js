const db = require('../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { ErrorResponse } = require('../response-schemas/error-schema');
const { generateJWT } = require('../utils/jwt-utils');

const tokenGenerator = (member) => {
    return generateJWT({
        id: member.id,
        pseudo: member.pseudo,
        isAdmin: member.isAdmin
    });
};

const authController = {

    register: async (req, res) => {
        // Recuperation des données
        const { pseudo, email } = req.validatedData;

        // Hashage du mot de passe à l'aide de "bcrypt"
        const password = await bcrypt.hash(req.validatedData.password, 10);

        // Création du compte en base de données
        const member = await db.Member.create({ pseudo, email, password });

        // Génération d'un « Json Web Token »
        const token = await tokenGenerator(member);

        // Envoi du token
        res.json(token);
    },

    login: async (req, res) => {
        // Recuperation des données
        const { identifier, password } = req.validatedData;

        // Récuperation du compte "member" à l'aide du pseudo ou de l'email
        const member = await db.Member.findOne({
            where: {    // Condition avec un OU en SQL
                [Op.or]: [
                    {   // Test du pseudo avec une egalité stricte (implicite)
                        pseudo: identifier
                    },
                    {   // Test de l'email avec l'operateur EQUALS
                        email: { [Op.eq]: identifier.toLowerCase() }
                    }
                ]
            }
        });

        // Erreur 422, si le member n'existe pas (pseudo ou email invalide)
        if (!member) {
            return res.status(422).json(new ErrorResponse('Bad credential', 422));
        }

        // Si le member existe: Vérification du password via "bcrypt"
        const isValid = await bcrypt.compare(password, member.password);

        // Erreur 422, si le mot de passe ne correspond pas au hashage
        if (!isValid) {
            return res.status(422).json(new ErrorResponse('Bad credential', 422));
        }

        // Génération d'un « Json Web Token »
        const token = await tokenGenerator(member);

        // Envoi du token
        res.json(token);
    },

    refresh: async (req, res) => {
        // Récuperation de l'id du membre
        const { id: memberId } = req.user;

        // Récuperation du compte "member" à l'aide de l'id du token
        const member = await db.Member.findByPk(memberId);

        // Génération d'un « Json Web Token »
        const token = await tokenGenerator(member);

        // Envoi du token
        res.json(token);
    }
};

module.exports = authController;