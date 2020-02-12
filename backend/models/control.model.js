module.exports = function (sequelize, Sequelize) {
    const Control = sequelize.define('control', {
        // attributes
        nom: {
            type: Sequelize.STRING,
            allowNull: false
        },
        operation: {
            type: Sequelize.STRING,
        },
        description: {
            type: Sequelize.TEXT,
        },
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return Control;
}

