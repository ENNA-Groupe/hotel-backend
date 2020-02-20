module.exports = function (sequelize, Sequelize) {
    const ConsommationProduit = sequelize.define('consommationProduit', {
         //cle
        consommationId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        produitId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        quantite: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
         // attributes
         prixTotal: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return ConsommationProduit;
}