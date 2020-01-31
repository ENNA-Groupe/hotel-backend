module.exports = function (sequelize, Sequelize) {
    const Fonction = sequelize.define('fonction', {
        // attributes
        nom: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT,
        },
        niveau: {
            type: Sequelize.BOOLEAN,
            allowNull: false
        },
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return Fonction;
}

