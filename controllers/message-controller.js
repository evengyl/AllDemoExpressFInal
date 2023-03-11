const { Op } = require('sequelize');
const db = require('../models');
const { NotFoundErrorResponse, ErrorResponse } = require('../response-schemas/error-schema');
const { SuccessObjectResponse } = require('../response-schemas/succes-schema');


const messageController = {

    getById: async (req, res) => {
        const id = parseInt(req.params.id);

        const message = await db.Message.findByPk(id, {
            include: {
                model: db.Member,
                attributes: ['id', 'pseudo']
            },
            attributes: {
                exclude: ['memberId']
            }
        });
        if (!message) {
            return res.status(404).json(new NotFoundErrorResponse('Message not found'));
        }

        res.json(new SuccessObjectResponse(message));
    },

    update: async (req, res) => {
        const id = parseInt(req.params.id);
        const data = req.validatedData;
        const memberId = req.user.id;



        const [nbRow, updatedData] = await db.Message.update(data, {
            where: {
                [Op.and]: [
                    { id },
                    { memberId }
                ]
            },
            returning: true
        });

        if (nbRow !== 1) {
            return res.status(400).json(new ErrorResponse('Error during update'));
        }

        res.json(new SuccessObjectResponse(updatedData));
    },

    delete: async (req, res) => {
        const id = parseInt(req.params.id);
        const { id: memberId, isAdmin } = req.user;

        const target = await db.Message.findByPk(id);

        if (!target) {
            return res.status(404).json(new NotFoundErrorResponse('message not found'));
        }

        if (!(target.memberId === memberId || isAdmin)) {
            return res.sendStatus(403);
        }

        // Bien joué Ayan! 
        await target.destroy();

        res.sendStatus(204);
    }
};

module.exports = messageController;