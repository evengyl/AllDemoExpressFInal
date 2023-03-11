const yup = require('yup');

const messageValidator = yup.object().shape({
    content: yup.string().trim().required().min(1).max(1_000)
});

module.exports = {
    messageValidator
};
