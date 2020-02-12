module.exports = function (sequelize, Sequelize) {
    const Fournisseur = sequelize.define('fournisseur', {
        // attributes
        nom: {
            type: Sequelize.STRING,
            allowNull: false
        },
        contact: {
            type: Sequelize.TEXT,
        },
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return Fournisseur;
}