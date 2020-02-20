module.exports = function (sequelize, Sequelize) {
    const Propriete = sequelize.define('propriete', {
        // attributes
        nom: {
            type: Sequelize.STRING,
            allowNull: false
        },
        model: {
            type: Sequelize.STRING
        },
        coutAdditionnel: {
            type: Sequelize.INTEGER
        },
        description: {
            type: Sequelize.TEXT
        },
        deletedAt: {
            type: Sequelize.DATE
        }
    }, {
        // options
    });
    return Propriete;
}

