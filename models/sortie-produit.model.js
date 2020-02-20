module.exports = function (sequelize, Sequelize) {
    const SortieProduit = sequelize.define('sortieProduit', {
         //cle
         sortieId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        produitId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        quantite: {
            type: Sequelize.INTEGER
        },
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return SortieProduit;
}