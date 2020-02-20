module.exports = function (sequelize, Sequelize) {
    const ProprieteChambre = sequelize.define('proprieteChambre', {
         //cle
         chambreId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        // attributes
        proprieteId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        isChecked: {
            type: Sequelize.BOOLEAN,
            default: '0'
        }
    }, {
        // options
    });
    return ProprieteChambre;
}