const messageController = require('../controllers/message-controller');
const authentificateJwt = require('../middlewares/authentificate-jwt');
const bodyValidation = require('../middlewares/body-validation-middleware');
const { messageValidator } = require('../validators/message-validator');


const messageRouter = require('express').Router();

// Routing pour les acces utilisateur
// - Récuperation des données avec les méthodes GET
// - Modification et suppresion pour les personnes identifiées 

messageRouter.route('/:id([0-9]+)')
    .get(messageController.getById)
    .put(authentificateJwt(), bodyValidation(messageValidator), messageController.update)
    .delete(authentificateJwt(), messageController.delete);

module.exports = messageRouter;