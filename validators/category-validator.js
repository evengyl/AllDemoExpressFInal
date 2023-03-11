const yup = require('yup');

const categoryValidator = yup.object().shape({
    name: yup.string().trim().required().max(50)
});

module.exports = {
    categoryValidator
};
