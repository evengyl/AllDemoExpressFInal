const { Op } = require('sequelize');
const db = require('../models');
const { NotFoundErrorResponse, ErrorResponse } = require('../response-schemas/error-schema');
const { SuccessArrayResponse, SuccessObjectResponse } = require('../response-schemas/succes-schema');


const subjectController = {

    // Actions principals
    getAll: async (req, res) => {
        const { offset, limit } = req.pagination;

        const { rows, count } = await db.Subject.findAndCountAll({
            distinct: true,                   // Fix le probleme de count (Permet de ne pas compter les ligne d'un INNER JOIN)
            offset,
            limit,
            // include: db.Category           // Many to Many avec toutes les infos (donc la table intermediaire)
            include: [{                        // Many to Many customisé
                model: db.Category,
                through: { attributes: [] },  // -> Permet de selectionner les infos de la table intermediaire
            }, {
                model: db.Member,
                attributes: ['id', 'pseudo'],
            }],
            attributes: {
                exclude: ['memberId']
            }
        });
        res.json(new SuccessArrayResponse(rows, count));
    },

    getOne: async (req, res) => {
        const id = parseInt(req.params.id);

        const subject = await db.Subject.findByPk(id, {
            include: [{
                model: db.Category,
                through: { attributes: [] }
            }, {
                model: db.Member,
                attributes: ['id', 'pseudo']
            }],
            attributes: {
                exclude: ['memberId']
            }
        });

        if (!subject) {
            return res.status(404).json(new NotFoundErrorResponse('Subject not found'));
        }

        res.json(new SuccessObjectResponse(subject));
    },

    add: async (req, res) => {
        // Récuperation des donnée à ajouter en DB
        const data = req.validatedData;

        // Récuperation des données liée au login
        data.memberId = req.user.id;

        // Ajout d'une transaction
        // -> Sécurité pour s'assuré que toutes les opérations DB soit réalisé ou aucunne
        const transaction = await db.sequelize.transaction();

        try {
            // Ajout d'un nouveau sujet
            const newSubject = await db.Subject.create(data, { transaction });

            // Ajout des categories via l'id (si elle est présente en DB)
            await newSubject.addCategory(data.categories, { transaction });

            // Validation des modifications dans la DB
            await transaction.commit();

            // Envoi du sujet créé
            res.json(new SuccessObjectResponse(newSubject));
        }
        catch (error) {
            // Retour à l'etat (avant les modifications)
            await transaction.rollback();

            // Propagation de l'erreur
            throw error;
        }
    },

    update: async (req, res) => {
        const id = parseInt(req.params.id);
        const memberId = req.user.id;
        const data = req.validatedData;

        const subject = await db.Subject.findByPk(id);
        if (!subject) {
            return res.status(404).json(new NotFoundErrorResponse('Subject not found'));
        }

        const transaction = await db.sequelize.transaction();

        const [nbRow, updatedData] = await db.Subject.update(data, {
            where: {
                [Op.and]: [
                    { id },         // Id de l'element 
                    { memberId }    // Id du membre qui a créer le sujet
                ]
            },
            returning: true, // Permet d'obtenir 'updatedData' (Only MSSQL & PostgreSQL)
            transaction
        });

        if (nbRow !== 1) {
            await transaction.rollback();
            return res.status(400).json(new ErrorResponse('Error during update'));
        }

        await transaction.commit();
        res.json(new SuccessObjectResponse(updatedData));
    },

    delete: async (req, res) => {
        const id = parseInt(req.params.id);
        const { id: memberId, isAdmin } = req.user;

        const target = await db.Subject.findByPk(id);
        if (!target) {
            return res.status(404).json(new NotFoundErrorResponse('Subject not found'));
        }

        if (target.memberId !== memberId && !isAdmin) {
            return res.sendStatus(403);
        }

        // ↓ Alternative pour supprimer l'element
        // Etant donnée que l'instance est connu, il possible d'utiliser la méthode destroy
        // => await target.destroy({transaction});

        const transaction = await db.sequelize.transaction();

        const nbRow = await db.Subject.destroy({
            where: { id },
            transaction
        });

        if (nbRow !== 1) {
            await transaction.rollback();
            return res.status(404).json(new NotFoundErrorResponse('Subject not found'));
        }

        await transaction.commit();
        res.sendStatus(204);
    },

    // Manipulation des categories
    addCategories: async (req, res) => {
        const id = parseInt(req.params.id);
        const memberId = req.user.id;
        const data = req.validatedData;

        // Récuperation du sujet
        const subject = await db.Subject.findByPk(id, {
            include: {
                model: db.Category,
                through: { attributes: [] }
            }
        });

        // Si non trouvé -> 404
        if (!subject) {
            return res.status(404).json(new NotFoundErrorResponse('Subject not found'));
        }

        // Si on n'est pas auteur du sujet -> 403
        if (subject.memberId !== memberId) {
            return res.sendStatus(403);
        }

        // Si la catégorie existe déjà, renvoyer une erreur 400
        const hasDuplicate = subject.categories
            .map(c => c.id)
            .find(id => data.categories.includes(id));

        if (hasDuplicate) {
            return res.status(400).json(new ErrorResponse('La catégorie existe deja !'));
        }

        // Ajout de la categorie avec la méthode généré automatiquement par sequelize
        await subject.addCategory(data.categories);

        // Version au singulier et au pluriel possible :
        // -> subject.addCategories(data.categories);

        // Récuperation des données après les mise à jours
        const subjectAfter = await db.Subject.findByPk(id, {
            include: [{
                model: db.Category,
                through: { attributes: [] }
            }, {
                model: db.Member,
                attributes: ['id', 'pseudo']
            }]
        });

        res.json(new SuccessObjectResponse(subjectAfter));
    },

    removeCategories: async (req, res) => {
        const id = parseInt(req.params.id);
        const data = req.validatedData;
        const memberId = req.user.id;

        // Récuperation du sujet
        const subject = await db.Subject.findByPk(id);

        // Si non trouvé -> 404
        if (!subject) {
            return res.status(404).json(new NotFoundErrorResponse('Subject not found'));
        }

        // Si on n'est pas auteur du sujet -> 403
        if (subject.memberId !== memberId) {
            return res.sendStatus(403);
        }

        // Ajout de la categorie avec la méthode généré automatiquement par sequelize
        await subject.removeCategory(data.categories);

        // Version au singulier et au pluriel possible :
        // -> subject.removeCategories(data.categories);

        res.json(new SuccessObjectResponse(subject));
    },

    // Manipulation des messages
    getAllMessage: async (req, res) => {
        const subjectId = parseInt(req.params.id);
        const { offset, limit } = req.pagination;

        const subject = await db.Subject.findByPk(subjectId);
        if (!subject) {
            return res.status(404).json(new NotFoundErrorResponse('Subject not found'));
        }

        const { rows, count } = await db.Message.findAndCountAll({
            attributes: {
                exclude: ['subjectId', 'memberId']
            },
            where: { subjectId },
            order: [['createdAt', 'DESC']],
            include: [{
                model: db.Member,
                attributes: ['id', 'pseudo']
            }],
            offset,
            limit
        });

        res.json(new SuccessArrayResponse(rows, count));
    },

    addMessage: async (req, res) => {
        const subjectId = parseInt(req.params.id);
        const data = req.validatedData;

        // Ajout du memberId dans les données via le JWT
        data.memberId = req.user.id;

        const subject = await db.Subject.findByPk(subjectId);
        if (!subject) {
            return res.status(404).json(new NotFoundErrorResponse('Subject not found'));
        }

        const transaction = await db.sequelize.transaction();
        try {
            const newMessage = await subject.createMessage(data, { transaction });
            await transaction.commit();

            const message = await db.Message.findByPk( newMessage.id,{
                attributes: {
                    exclude: ['subjectId', 'memberId']
                },
                include: [{
                    model: db.Member,
                    attributes: ['id', 'pseudo']
                }]
            });

            res.json(new SuccessObjectResponse(message));
        }
        catch (error) {
            transaction.rollback();
            throw error;
        }
    }
};

module.exports = subjectController;