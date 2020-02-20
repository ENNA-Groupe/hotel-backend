module.exports = function (sequelize, Sequelize) {
    const Sortie = sequelize.define('sortie', {
        //cle
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        // attributes
        deletedAt: {
            type: Sequelize.DATE,
        }
    }, {
        // options
    });
    return Sortie;
}