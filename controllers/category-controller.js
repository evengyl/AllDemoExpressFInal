const db = require('../models');
const { NotFoundErrorResponse, ErrorResponse } = require('../response-schemas/error-schema');
const { SuccessObjectResponse, SuccessArrayResponse } = require('../response-schemas/succes-schema');

const categoryController = {

    getAll: async (req, res) => {
        const data = await db.Category.findAndCountAll({
            order: [['name', 'ASC']],
            offset: req.pagination.offset,
            limit: req.pagination.limit
        });

        res.json(new SuccessArrayResponse(data.rows, data.count));
    },

    getById: async (req, res) => {
        const id = parseInt(req.params.id);

        const category = await db.Category.findOne({
            where: { id: id }
        });

        if (!category) {
            return res.status(404).json(new NotFoundErrorResponse('Category not found'));
        }
        res.json(new SuccessObjectResponse(category));
    },

    add: async (req, res) => {
        const data = req.validatedData;

        const newCategory = await db.Category.create(data);
        res.json(new SuccessObjectResponse(newCategory));
    },

    update: async (req, res) => {
        const id = parseInt(req.params.id);
        const data = req.validatedData;

        const resultUpdate = await db.Category.update(data, {
            where: { id },   // Ecriture simplifié -> { id: id }
            returning: true
        });

        // Nombre de row modifier
        const nbRow = resultUpdate[0];
        if (nbRow !== 1) {
            return res.status(400).json(new ErrorResponse('Error during update'));
        }

        // Tableau avec les valeurs mise à jours (Ne fonctionne pas sur MySQL / MariaDB)
        const updatedData = resultUpdate[1];
        res.status(200).json(new SuccessObjectResponse(updatedData[0]));
    },

    delete: async (req, res) => {
        const id = parseInt(req.params.id);

        const nbRow = await db.Category.destroy({
            where: { id }
        });

        if (nbRow !== 1) {
            return res.status(404).json(new NotFoundErrorResponse('Category not found'));
        }
        res.sendStatus(204);
    }
};

module.exports = categoryController;