module.exports = function (sequelize, Sequelize) {
    const Chambre = sequelize.define('chambre', {
         //cle
         typeId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        
        // attributes
        numero: {
            type: Sequelize.STRING,
            allowNull: false
        },
         // attributes
         prixJournalier: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        isEmpty: {
            type: Sequelize.BOOLEAN
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
    return Chambre;
}

