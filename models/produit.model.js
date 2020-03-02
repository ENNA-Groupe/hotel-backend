module.exports = function (sequelize, Sequelize) {
    const Produit = sequelize.define('produit', {
        //cle
        categorieId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        
        // attributes
        nom: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT
            // allowNull defaults to true
        },
        uniteMesure: {
            type: Sequelize.STRING,
            allowNull: false
        },
        prixUnitaireVente: {
            type: Sequelize.INTEGER,
        },
        photo: {
            type: Sequelize.TEXT('big'),
        },
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
        name: {
            singular: 'product',
            plural: 'products',
          }
    });
    return Produit;
}

