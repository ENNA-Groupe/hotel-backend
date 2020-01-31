module.exports = function (sequelize, Sequelize) {
    const Categorie = sequelize.define('categorie', {
        // attributes
        nom: {
            type: Sequelize.STRING,
            allowNull: false
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
    return Categorie;
}

