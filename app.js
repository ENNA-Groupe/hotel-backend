const server = require('http').createServer();
const io = require('socket.io')(server);
io.origins('*:*');
const Sequelize = require('sequelize');
const crypto = require('crypto');
const moment = require('moment');
const cron = require('node-cron');

//const sequelize = new Sequelize('ennagrou_hotel', 'ennagrou_aro', 'azertyui', {
//host: 'mysql1008.mochahost.com',
// host: 'localhost',
//dialect: 'mysql',
//logging: false
//});
const sequelize = new Sequelize('hotel', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});
const Op = Sequelize.Op;
//Models
const Operation = require('./models/operation.model')(sequelize, Sequelize);

const Fonction = require('./models/fonction.model')(sequelize, Sequelize);
const User = require('./models/user.model')(sequelize, Sequelize);
const Client = require('./models/client.model')(sequelize, Sequelize);
const Fournisseur = require('./models/fournisseur.model')(sequelize, Sequelize);

const Categorie = require('./models/categorie.model')(sequelize, Sequelize);
const Produit = require('./models/produit.model')(sequelize, Sequelize);
const Intrant = require('./models/intrant.model')(sequelize, Sequelize);
const Type = require('./models/type.model')(sequelize, Sequelize);
const Chambre = require('./models/chambre.model')(sequelize, Sequelize);
const Table = require('./models/table.model')(sequelize, Sequelize);

const Control = require('./models/control.model')(sequelize, Sequelize);
const ControlUser = require('./models/control-user.model')(sequelize, Sequelize);
const Propriete = require('./models/propriete.model')(sequelize, Sequelize);
const ProprieteChambre = require('./models/propriete-chambre.model')(sequelize, Sequelize);


const Entree = require('./models/entree.model')(sequelize, Sequelize);
const EntreeProduit = require('./models/entree-produit.model')(sequelize, Sequelize);
const Sortie = require('./models/sortie.model')(sequelize, Sequelize);
const SortieProduit = require('./models/sortie-produit.model')(sequelize, Sequelize);
const Consommation = require('./models/consommation.model')(sequelize, Sequelize);
const ConsommationProduit = require('./models/consommation-produit.model')(sequelize, Sequelize);
const Mesure = require('./models/mesure.model')(sequelize, Sequelize);

Consommation.belongsToMany(Produit, { through: ConsommationProduit });
Produit.belongsToMany(Consommation, { through: ConsommationProduit });
const Location = require('./models/location.model')(sequelize, Sequelize);
Client.hasOne(Location);
Chambre.hasOne(Location);
Location.belongsTo(Client);
Location.belongsTo(Chambre);
const LocationPropriete = require('./models/location-propriete.model')(sequelize, Sequelize);

//fonctions
function dateFormat(date) {
    let y = date.getFullYear();
    let m = date.getMonth() + 1;
    if (m < 10) m = "0" + m;
    let d = date.getDate();

    return y + '-' + m + '-' + d;
}

function heureFormat(date) {
    let h = date.getHours();
    let m = date.getMinutes();
    let s = date.getSeconds();

    return h + ':' + m + ':' + s;
}

function hash(password) {
    // Hashing user's salt and password with 1000 iterations, 64 length and sha512 digest 
    var salt = crypto.randomBytes(16).toString('hex');
    var password = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
    return { salt: salt, password: password };
};

function verif(password, hash, salt) {
    password = crypto.pbkdf2Sync(password,
        salt, 1000, 64, `sha512`).toString(`hex`);
    return hash === password;
};


//Initialisation sequelize
sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
    sequelize.sync({ force: false }).then(() => {
        // Now the `users` table in the database corresponds to the model definition
        console.log('table created succesfull')

    });
})
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });


// let nbreJours = moment("2019-12-04 10:08:05").fromNow();
// nbreJours = moment(nbreJours).format() 

function calculNbreJours() {
    Location.findAll({
        where: {
            stoppedAt: null,
            deletedAt: null,
            // where: sequelize.where(sequelize.fn('date', sequelize.col('updatedAt')), '<', today)
        }
    }).then(
        (res) => {
            // console.log(res);
            res.forEach(item => {
               let nbreJours = moment().diff(item.createdAt, "days");
                let montantTotal = nbreJours * item.prixUnitaire
                console.log(nbreJours);
                Location.update({nbreJours: nbreJours, montantTotal: montantTotal}, {
                    where: {
                        id: item.id
                    }
                });
            })
        }
    );
}


calculNbreJours();
cron.schedule('0 0 * * *', () => {
    console.log('Runing a job at 00:00');
    this.calculNbreJours();
}, {
    scheduled: true,
});

io.on('connection', socket => {
    Operation.findOne({ order: [['id', 'DESC']] }).then(
        res => {
            if (!res) {
                res = { id: 0 };
            }
            console.log(res.id);
            socket.lastId = res.id
        }

    );

    function registrer(model, idInTable, typeOperation, description) {
        return Operation.create({ userId: socket.id, model: model, idInTable: idInTable, typeOperation: typeOperation, description: description }).then(
            () => true
        );
    }

    function addStock(id, q) {
        let req = 'quantiteStock + ' + q;
        Intrant.update({ quantiteStock: sequelize.literal(req) }, {
            where: {
                id: id
            }
        }).then(() => {
            Intrant.findOne({
                where: { id: id }
            }).then(res => {
                registrer('Intrant', res.id, 'edit', socket.nom + ' a modifié les informations de l\' intrant ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    }

    function rmStock(id, q) {
        let req = 'quantiteStock - ' + q;
        Intrant.update({ quantiteStock: sequelize.literal(req) }, {
            where: {
                id: id
            }
        }).then(() => {
            Intrant.findOne({
                where: { id: data.id }
            }).then(res => {
                socket.emit('intrant:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Intrant', res.id, 'edit', socket.nom + ' a modifié les informations de l\' intrant ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    }

    function setStock(id, q) {
        Intrant.update({ quantiteStock: q }, {
            where: {
                id: id
            }
        }).then(() => {
            Intrant.findOne({
                where: { id: data.id }
            }).then(res => {
                socket.emit('intrant:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Intrant', res.id, 'edit', socket.nom + ' a modifié les informations de l\' intrant ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    }

    socket.on('hello', data => {
        console.log(data);
    });
    /**
     * LOGIN
     */
    socket.on('auth:login', data => {
        console.log(data);
        User.findOne({
            where: {
                identifiant: data.identifiant,
                deletedAt: null
            }
        }).then(user => {
            let res;
            if (user) {
                if (verif(data.password, user.password, user.salt)) {
                    socket.id = user.id;
                    socket.isAuth = true;
                    socket.nom = user.nom + ' ' + user.prenom;
                    user.isOnline = true;
                    res = { infos: { type: 'success', message: 'Vous etes connecté!' }, data: { isAuth: true, user: user } };
                    User.update({ isOnline: true }, {
                        where: {
                            id: socket.id
                        }
                    }).then(
                        id => io.emit('user:login', id)
                    );

                } else {
                    res = { infos: { type: 'danger', message: 'Mot de passe incorrect!' }, data: { isAuth: false } };
                }
            } else res = { infos: { type: 'danger', message: 'Identifiant inconnu!' }, data: { isAuth: false } };
            socket.emit('auth:login', res);
        })
    });

    socket.on('auth:change-password', password => {
        console.log(password);
        let key = hash(password);
        User.update({ password: key.password, salt: key.salt }, {
            where: {
                id: socket.id
            }
        }).then(
            () => {
                socket.emit('change-password', { infos: { type: 'success', message: 'Vous avez changé votre mot de passe!' }, data: true })
            }
        );
    });

    socket.on('auth:logout', () => {
        console.log(socket.id);
        User.update({ isOnline: false }, {
            where: {
                id: socket.id
            }
        }).then(
            (id) => {
                socket.isAuth = false;
                socket.emit('auth:logout', { infos: { type: 'success', message: 'Vous etes deconnecté!' }, data: true });
                io.emit('user:logout', id)
            }
        );
    });

    /**
     * Clouding
     */
    socket.on('cloud', () => {
        console.log(socket.lastId);
        Operation.findAll({
            where: {
                id: {
                    [Op.gt]: socket.lastId
                }
            }
        }).then(
            (operations) => {
                console.log('operations: ' + operations.length)
                let res = [];
                if (operations.length > 0) {
                    socket.lastId = operations[(operations.length - 1)].id;
                    operations.forEach(
                        operation => {
                            let model = operation.model;
                            switch (model) {
                                case 'Fonction':
                                    User.findOne({
                                        where: id = operation.id
                                    }).then(
                                        (item) => {
                                            console.log(item);
                                            res.push({ operation: operation, data: item });
                                        }
                                    );
                                    break;
                            }

                        }
                    );
                }
                socket.emit('cloud', res);

            }
        )
    });

    /**
     * FONCTION METHODE
     */
    //get All
    socket.on('fonction:all', data => {
        console.log(data);
        Fonction.findAll({
            where: {
                deletedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('fonction:all', { data: res });
        });
    });


    //get deleteditems
    socket.on('fonction:trash', data => {
        console.log(data);
        Fonction.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('fonction:trash', { data: res });
        });
    });

    //add item
    socket.on('fonction:add', data => {
        console.log(data);
        Fonction.create(data).then(res => {
            socket.emit('fonction:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Fonction', res.id, 'add', socket.nom + ' a ajouté la fonction' + res.nom).then(
                () => socket.broadcast.emit('newData')
            );
        });
    });

    //edit item
    socket.on('fonction:edit', data => {
        console.log(data);
        Fonction.update(data, {
            where: {
                id: data.id
            }
        }).then(() => {
            Fonction.findOne({
                where: { id: data.id }
            }).then(res => {
                socket.emit('fonction:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Fonction', res.id, 'edit', socket.nom + ' a modifié les informations de la fonction' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('fonction:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        Fonction.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            Fonction.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('fonction:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Fonction', res.id, 'delete', socket.nom + ' a supprimé  la fonction ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });

        });
    });

    //restore item
    socket.on('fonction:restore', id => {
        console.log(id);
        Fonction.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            Fonction.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('fonction:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Fonction', res.id, 'restore', socket.nom + ' a restauré la fonction ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });


    /**
     * USER METHODS
     */

    //get All
    socket.on('user:all', data => {
        console.log(data);
        User.findAll({
            where: {
                deletedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('user:all', { data: res });
        });
    });


    //get deleteditems
    socket.on('user:trash', data => {
        console.log(data);
        User.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('user:trash', { data: res });
        });
    });

    socket.on('user:activites', data => {
        console.log(data);
        Operation.findAll({
            order: [
                ['id', 'DESC']
            ],
            where: {
                userId: data.userId
            },
            limit: 10,
            offset: data.lastId
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('user:activites', { data: res });
        });
    });
    //add item
    socket.on('user:add', data => {
        console.log(data);
        let key = hash('password');
        data.password = key.password;
        data.salt = key.salt;
        User.create(data).then(res => {
            socket.emit('user:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Fonction', socket.id, 'add', socket.nom + ' a ajouté l\'utilisateur ' + res.nom + ' ' + res.prenom).then(
                () => {
                    socket.broadcast.emit('newData');
                    Control.findAll({
                        where: {
                            deletedAt: null
                        }
                    }).then(ctrl => {
                        ctrl.forEach((item) => {
                            ControlUser.create({ userId: res.id, controlId: item.id });
                        });
                    });
                }
            );

        });
    });

    //edit item
    socket.on('user:edit', data => {
        console.log(data);
        User.update(data, {
            where: {
                id: data.id
            }
        }).then(() => {
            User.findOne({
                where: { id: data.id }
            }).then(res => {
                socket.emit('user:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('User', res.id, 'edit', socket.nom + ' a modifié les informations de l\'utilisateur ' + res.nom + ' ' + res.prenom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('user:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        User.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            User.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('user:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('User', res.id, 'delete', socket.nom + ' a supprimé  l\'utilisateur ' + res.nom + ' ' + res.prenom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //restore item
    socket.on('user:restore', id => {
        console.log(id);
        User.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            User.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('user:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('User', res.id, 'restore', socket.nom + ' a restauré les informations de l\'utilisateur ' + res.nom + ' ' + res.prenom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    /**
        * client METHODE
        */
    //get All
    socket.on('client:all', data => {
        console.log(data);
        Client.findAll({
            where: {
                deletedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('client:all', { data: res });
        });
    });


    //get deleteditems
    socket.on('client:trash', data => {
        console.log(data);
        Client.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('client:trash', { data: res });
        });
    });

    //add item
    socket.on('client:add', data => {
        console.log(data);
        Client.create(data).then(res => {
            socket.emit('client:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Client', res.id, 'add', socket.nom + ' a ajouté le client' + res.nom).then(
                () => socket.broadcast.emit('newData')
            );
        });
    });

    //edit item
    socket.on('client:edit', data => {
        console.log(data);
        Client.update(data, {
            where: {
                id: data.id
            }
        }).then(() => {
            Client.findOne({
                where: { id: data.id }
            }).then(res => {
                socket.emit('client:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Client', res.id, 'edit', socket.nom + ' a modifié les informations du client' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('client:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        Client.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            Client.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('client:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Client', res.id, 'delete', socket.nom + ' a supprimé  le client ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });

        });
    });

    //restore item
    socket.on('client:restore', id => {
        console.log(id);
        Client.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            Client.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('client:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Client', res.id, 'restore', socket.nom + ' a restauré le client ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    /**
     * MESURE METHODE
     */
    //get All
    socket.on('mesure:all', data => {
        console.log(data);
        Mesure.findAll({
            where: {
                deletedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('mesure:all', { data: res });
        });
    });


    //get deleteditems
    socket.on('mesure:trash', data => {
        console.log(data);
        Mesure.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('mesure:trash', { data: res });
        });
    });

    //add item
    socket.on('mesure:add', data => {
        console.log(data);
        Mesure.create(data).then(res => {
            socket.emit('mesure:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Mesure', res.id, 'add', socket.nom + ' a ajouté la Mesure ' + res.nom).then(
                () => socket.broadcast.emit('newData')
            );
        });
    });

    //edit item
    socket.on('mesure:edit', data => {
        console.log(data);
        Mesure.update(data, {
            where: {
                id: data.id
            }
        }).then(() => {
            Mesure.findOne({
                where: { id: data.id }
            }).then(res => {
                socket.emit('mesure:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Mesure', res.id, 'edit', socket.nom + ' a modifié les informations de la Mesure ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('mesure:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        Mesure.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            Mesure.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('mesure:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Mesure', res.id, 'delete', socket.nom + ' a supprimé  la Mesure ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });

        });
    });

    //restore item
    socket.on('mesure:restore', id => {
        console.log(id);
        Mesure.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            Mesure.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('mesure:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Mesure', res.id, 'restore', socket.nom + ' a restauré la mesure ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    /**
     * CATEGORIE METHODE
     */
    //get All
    socket.on('categorie:all', data => {
        console.log(data);
        Categorie.findAll({
            where: {
                deletedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('categorie:all', { data: res });
        });
    });


    //get deleteditems
    socket.on('categorie:trash', data => {
        console.log(data);
        Categorie.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('categorie:trash', { data: res });
        });
    });

    //add item
    socket.on('categorie:add', data => {
        console.log(data);
        Categorie.create(data).then(res => {
            socket.emit('categorie:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Categorie', res.id, 'add', socket.nom + ' a ajouté la categorie ' + res.nom).then(
                () => socket.broadcast.emit('newData')
            );
        });
    });

    //edit item
    socket.on('categorie:edit', data => {
        console.log(data);
        Categorie.update(data, {
            where: {
                id: data.id
            }
        }).then(() => {
            Categorie.findOne({
                where: { id: data.id }
            }).then(res => {
                socket.emit('categorie:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Categorie', res.id, 'edit', socket.nom + ' a modifié les informations de la categorie ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('categorie:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        Categorie.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            Categorie.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('categorie:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Categorie', res.id, 'delete', socket.nom + ' a supprimé  la categorie ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });

        });
    });

    //restore item
    socket.on('categorie:restore', id => {
        console.log(id);
        Categorie.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            Categorie.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('categorie:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Categorie', res.id, 'restore', socket.nom + ' a restauré la categorie ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });


    /**
    * PRODUIT METHODE
    */
    //get All
    socket.on('produit:all', data => {
        console.log(data);
        Produit.findAll({
            where: {
                deletedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('produit:all', { data: res });
        });
    });


    //get deleteditems
    socket.on('produit:trash', data => {
        console.log(data);
        Produit.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('produit:trash', { data: res });
        });
    });

    //add item
    socket.on('produit:add', data => {
        console.log(data);
        data.quantiteStock = 0;
        Produit.create(data).then(res => {
            socket.emit('produit:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Produit', res.id, 'add', socket.nom + ' a ajouté la produit ' + res.nom).then(
                () => socket.broadcast.emit('newData')
            );
        });
    });

    //edit item
    socket.on('produit:edit', data => {
        console.log(data);
        Produit.update(data, {
            where: {
                id: data.id
            }
        }).then(() => {
            produit.findOne({
                where: { id: data.id }
            }).then(res => {
                socket.emit('produit:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Produit', res.id, 'edit', socket.nom + ' a modifié les informations de la produit ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('produit:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        Produit.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            Produit.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('produit:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Produit', res.id, 'delete', socket.nom + ' a supprimé  la produit ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });

        });
    });

    //restore item
    socket.on('produit:restore', id => {
        console.log(id);
        Produit.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            Produit.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('produit:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Produit', res.id, 'restore', socket.nom + ' a restauré la produit ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });
    /**
    * TYPE METHODE
    */
    //get All
    socket.on('type:all', data => {
        console.log(data);
        Type.findAll({
            where: {
                deletedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('type:all', { data: res });
        });
    });


    //get deleteditems
    socket.on('type:trash', data => {
        console.log(data);
        Type.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('type:trash', { data: res });
        });
    });

    //add item
    socket.on('type:add', data => {
        console.log(data);
        Type.create(data).then(res => {
            socket.emit('type:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Type', res.id, 'add', socket.nom + ' a ajouté le type de chambre ' + res.nom).then(
                () => socket.broadcast.emit('newData')
            );
        });
    });

    //edit item
    socket.on('type:edit', data => {
        console.log(data);
        Type.update(data, {
            where: {
                id: data.id
            }
        }).then(() => {
            Type.findOne({
                where: { id: data.id }
            }).then(res => {
                socket.emit('type:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Type', res.id, 'edit', socket.nom + ' a modifié les informations de le type de chambre ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('type:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        Type.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            Type.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('type:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Type', res.id, 'delete', socket.nom + ' a supprimé  le type e chambre ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });

        });
    });

    //restore item
    socket.on('type:restore', id => {
        console.log(id);
        Type.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            Type.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('type:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Type', res.id, 'restore', socket.nom + ' a restauré le type de chambre ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    /**
    * CHAMBRE METHODE
    */
    //get All
    socket.on('chambre:all', data => {
        console.log(data);
        Chambre.findAll({
            where: {
                deletedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('chambre:all', { data: res });
        });
    });

    socket.on('chambre:activites', data => {
        console.log(data);
        // Location.findAll({
        //     order: [
        //         ['id', 'DESC']
        //     ],
        //     where: {
        //        chambreId: data.chambreId
        //     },
        //     limit: 10,
        //     offset: data.lastId
        // }).then(res => {
        //     // console.log("All res:", JSON.stringify(res, null, 4));
        //     socket.emit('chambre:activites', { data: res });
        // });
    });
    //get deleteditems
    socket.on('chambre:trash', data => {
        console.log(data);
        Chambre.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('chambre:trash', { data: res });
        });
    });

    //add item
    socket.on('chambre:add', data => {
        console.log(data);
        Chambre.create(data).then(res => {
            socket.emit('chambre:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Chambre', res.id, 'add', socket.nom + ' a ajouté la chambre ' + res.numero).then(
                () => socket.broadcast.emit('newData')
            );
        });
    });

    //edit item
    socket.on('chambre:edit', data => {
        console.log(data);
        Chambre.update(data, {
            where: {
                id: data.id
            }
        }).then(() => {
            Chambre.findOne({
                where: { id: data.id }
            }).then(res => {
                socket.emit('chambre:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Chambre', res.id, 'edit', socket.nom + ' a modifié les informations de la chambre ' + res.numero).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('chambre:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        Chambre.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            Chambre.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('chambre:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Chambre', res.id, 'delete', socket.nom + ' a supprimé  le Chambre e chambre ' + res.numero).then(
                    () => socket.broadcast.emit('newData')
                );
            });

        });
    });

    //restore item
    socket.on('chambre:restore', id => {
        console.log(id);
        Chambre.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            Chambre.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('chambre:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Chambre', res.id, 'restore', socket.nom + ' a restauré la chambre ' + res.numero).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    /**
     * TABLE METHODE
     */
    //get All
    socket.on('table:all', data => {
        console.log(data);
        Table.findAll({
            where: {
                deletedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('table:all', { data: res });
        });
    });


    //get deleteditems
    socket.on('table:trash', data => {
        console.log(data);
        Table.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('table:trash', { data: res });
        });
    });

    //add item
    socket.on('table:add', data => {
        console.log(data);
        Table.create(data).then(res => {
            socket.emit('table:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Table', res.id, 'add', socket.nom + ' a ajouté la table ' + res.nom).then(
                () => socket.broadcast.emit('newData')
            );
        });
    });

    //edit item
    socket.on('table:edit', data => {
        console.log(data);
        Table.update(data, {
            where: {
                id: data.id
            }
        }).then(() => {
            Table.findOne({
                where: { id: data.id }
            }).then(res => {
                socket.emit('table:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Table', res.id, 'edit', socket.nom + ' a modifié les informations de la table ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('table:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        Table.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            Table.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('table:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Table', res.id, 'delete', socket.nom + ' a supprimé  la table ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });

        });
    });

    //restore item
    socket.on('table:restore', id => {
        console.log(id);
        Table.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            Table.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('table:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Table', res.id, 'restore', socket.nom + ' a restauré la table ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });


    /**
    * INTRANT METHODE
    */
    //get All
    socket.on('intrant:all', data => {
        console.log(data);
        Intrant.findAll({
            where: {
                deletedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('intrant:all', { data: res });
        });
    });


    //get deleteditems
    socket.on('intrant:trash', data => {
        console.log(data);
        Intrant.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('intrant:trash', { data: res });
        });
    });

    //add item
    socket.on('intrant:add', data => {
        console.log(data);
        Intrant.create(data).then(res => {
            socket.emit('intrant:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Intrant', res.id, 'add', socket.nom + ' a ajouté l\' intrant ' + res.nom).then(
                () => socket.broadcast.emit('newData')
            );
        });
    });

    //edit item
    socket.on('intrant:edit', data => {
        console.log(data);
        Intrant.update(data, {
            where: {
                id: data.id
            }
        }).then(() => {
            Intrant.findOne({
                where: { id: data.id }
            }).then(res => {
                socket.emit('intrant:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Intrant', res.id, 'edit', socket.nom + ' a modifié les informations de l\' intrant ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('intrant:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        Intrant.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            Intrant.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('intrant:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Intrant', res.id, 'delete', socket.nom + ' a supprimé l\' intrant ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });

        });
    });

    //restore item
    socket.on('intrant:restore', id => {
        console.log(id);
        Intrant.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            Intrant.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('intrant:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Intrant', res.id, 'restore', socket.nom + ' a restauré l\' intrant ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    /**
   * Propriete METHODE
   */
    //get All
    socket.on('propriete:all', data => {
        console.log(data);
        Propriete.findAll({
            where: {
                deletedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('propriete:all', { data: res });
        });
    });

    socket.on('propriete:chambre', data => {
        console.log(data);
        ProprieteChambre.findAll({
            where: {
                chambreId: data
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('propriete:chambre', { data: res });
        });
    });

    socket.on('propriete:save', data => {
        console.log(data);
        data.forEach(
            item => {
                if (item.id) {
                    ProprieteChambre.update({ isChecked: item.isChecked }, {
                        where: {
                            chambreId: item.chambreId,
                            proprieteId: item.proprieteId
                        }
                    });
                } else {
                    ProprieteChambre.create(item);
                }
            }
        );
        socket.emit('propriete:save', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: true })
    });
    //get deleteditems
    socket.on('propriete:trash', data => {
        console.log(data);
        Propriete.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('propriete:trash', { data: res });
        });
    });

    //add item
    socket.on('propriete:add', data => {
        console.log(data);
        Propriete.create(data).then(res => {
            socket.emit('propriete:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Intrant', res.id, 'add', socket.nom + ' a ajouté la propriété ' + res.nom).then(
                () => socket.broadcast.emit('newData')
            );
        });
    });

    //edit item
    socket.on('propriete:edit', data => {
        console.log(data);
        Propriete.update(data, {
            where: {
                id: data.id
            }
        }).then(() => {
            Propriete.findOne({
                where: { id: data.id }
            }).then(res => {
                socket.emit('propriete:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Intrant', res.id, 'edit', socket.nom + ' a modifié les informations de la propriété ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('propriete:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        Propriete.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            Propriete.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('propriete:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Intrant', res.id, 'delete', socket.nom + ' a supprimé la propriété ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });

        });
    });

    //restore item
    socket.on('propriete:restore', id => {
        console.log(id);
        Propriete.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            Propriete.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('propriete:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Intrant', res.id, 'restore', socket.nom + ' a restauré la propriété ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });


    /**
     * Control METHODE
     */
    //get All
    socket.on('control:all', data => {
        console.log(data);
        Control.findAll({
            where: {
                deletedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('control:all', { data: res });
        });
    });

    socket.on('control:user', data => {
        console.log(data);
        ControlUser.findAll({
            where: {
                userId: data
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('control:user', { data: res });
        });
    });

    socket.on('control:save', data => {
        console.log(data);
        data.forEach(
            item => {
                if (item.id) {
                    ControlUser.update({ isChecked: item.isChecked }, {
                        where: {
                            userId: item.userId,
                            controlId: item.controlId
                        }
                    });
                } else {
                    ControlUser.create(item);
                }
            }
        );
        socket.emit('control:save', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: true })
    });

    //get deleteditems
    socket.on('control:trash', data => {
        console.log(data);
        Control.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('control:trash', { data: res });
        });
    });

    //add item
    socket.on('control:add', data => {
        console.log(data);
        Control.create(data).then(res => {
            socket.emit('control:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Control', res.id, 'add', socket.nom + ' a ajouté la control ' + res.nom).then(
                () => socket.broadcast.emit('newData')
            );
        });
    });

    //edit item
    socket.on('control:edit', data => {
        console.log(data);
        Control.update(data, {
            where: {
                id: data.id
            }
        }).then(() => {
            Control.findOne({
                where: { id: data.id }
            }).then(res => {
                socket.emit('control:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Control', res.id, 'edit', socket.nom + ' a modifié les informations de la control ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('control:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        Control.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            Control.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('control:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Control', res.id, 'delete', socket.nom + ' a supprimé  la control ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });

        });
    });

    //restore item
    socket.on('control:restore', id => {
        console.log(id);
        Control.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            Control.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('control:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Control', res.id, 'restore', socket.nom + ' a restauré le control ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });



    //get All
    socket.on('fournisseur:all', data => {
        console.log(data);
        Fournisseur.findAll({
            where: {
                deletedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('fournisseur:all', { data: res });
        });
    });


    //get deleteditems
    socket.on('fournisseur:trash', data => {
        console.log(data);
        Fournisseur.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('fournisseur:trash', { data: res });
        });
    });

    //add item
    socket.on('fournisseur:add', data => {
        console.log(data);
        Fournisseur.create(data).then(res => {
            socket.emit('fournisseur:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Fournisseur', res.id, 'add', socket.nom + ' a ajouté la fournisseur' + res.nom).then(
                () => socket.broadcast.emit('newData')
            );
        });
    });

    //edit item
    socket.on('fournisseur:edit', data => {
        console.log(data);
        Fournisseur.update(data, {
            where: {
                id: data.id
            }
        }).then(() => {
            Fournisseur.findOne({
                where: { id: data.id }
            }).then(res => {
                socket.emit('fournisseur:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Fournisseur', res.id, 'edit', socket.nom + ' a modifié les informations de la fournisseur' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('fournisseur:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        Fournisseur.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            Fournisseur.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('fournisseur:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Fournisseur', res.id, 'delete', socket.nom + ' a supprimé  la fournisseur ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });

        });
    });

    //restore item
    socket.on('fonction:restore', id => {
        console.log(id);
        Fonction.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            Fonction.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('fonction:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Fonction', res.id, 'restore', socket.nom + ' a restauré la fonction ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });



    /**
     * ENTREE
     */

    //get All
    socket.on('entree:all', data => {
        console.log(data);
        Entree.findAll({
            order: [
                ['id', 'DESC']
            ],
            where: {
                deletedAt: null
            },
            limit: 10,
            offset: data
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('entree:all', { data: res });
        });
    });

    socket.on('entree:produits', data => {
        console.log(data);
        EntreeProduit.findAll({
            where: {
                entreeId: data,
                deletedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('entree:produits', { data: res });
        });
    });


    //get deleteditems
    socket.on('entree:trash', data => {
        console.log(data);
        Entree.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('entree:trash', { data: res });
        });
    });

    //add item
    socket.on('entree:add', data => {
        console.log(data);
        Entree.create(data.entree).then(res => {
            data.produits.forEach(prod => {
                prod.entreeId = res.id;
                EntreeProduit.create(prod).then(
                    (x) => {
                        addStock(prod.produitId, prod.quantite);
                    }
                );
            });
            socket.emit('entree:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Entree', res.id, 'add', socket.nom + ' a ajouté l\' entree ' + res.nom).then(
                () => socket.broadcast.emit('newData')
            );
        });
    });

    //edit item
    socket.on('entree:edit', data => {
        console.log(data);
        Entree.update(data.entree, {
            where: {
                id: data.entree.id
            }
        }).then(() => {

            Entree.findOne({
                where: { id: data.entree.id, deletedAt: null }
            }).then(res => {
                EntreeProduit.findAll({
                    where: { entreeId: data.entree.id, deletedAt: null }
                }).then(
                    (elems) => {
                        data.produits.forEach(prod => {
                            if (!prod.id) {
                                prod.entreeId = res.id;
                                EntreeProduit.create(prod).then(
                                    (x) => {
                                        addStock(prod.produitId, prod.quantite);
                                    }
                                );
                            } else {
                                let entity = elems.find(elem => elem.produitId === prod.produitId);
                                if (entity) {
                                    EntreeProduit.update(prod, {
                                        where: { produitId: prod.produitId, entreeId: prod.entreeId }
                                    }).then(
                                        (x) => {
                                            addStock(prod.produitId, prod.quantite - entity.quantite);
                                        }
                                    );
                                } else {
                                    let now = new Date();
                                    now = dateFormat(now) + ' ' + heureFormat(now);
                                    EntreeProduit.update({ deletedAt: now }, {
                                        where: { produitId: entity.produitId, entreeId: entity.entreeId }
                                    }).then(
                                        (x) => {
                                            addStock(entity.produitId, -entity.quantite);
                                        }
                                    );
                                }

                            }
                        });
                    }
                );
                socket.emit('entree:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Entree', res.id, 'edit', socket.nom + ' a modifié les informations de l\' entree ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('entree:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        Entree.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            EntreeProduit.findAll({ where: { entreeId: data.id, deletedAt: null } }.then(
                (elems) => {
                    elems.forEach(
                        elem => {
                            let now = new Date();
                            now = dateFormat(now) + ' ' + heureFormat(now);
                            EntreeProduit.update({ deletedAt: now }, {
                                where: { produitId: elem.produitId, entreeId: elem.entreeId }
                            }).then(
                                (x) => {
                                    addStock(elem.produitId, -elem.quantite);
                                }
                            );
                        }
                    );
                })
            );
            Entree.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('entree:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Entree', res.id, 'delete', socket.nom + ' a supprimé l\' entree ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });

        });
    });

    //restore item
    socket.on('entree:restore', id => {
        console.log(id);
        Entree.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            Entree.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('entree:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Entree', res.id, 'restore', socket.nom + ' a restauré l\'entree ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    /**
    * ENTREE
    */

    //get All
    socket.on('sortie:all', data => {
        console.log(data);
        Sortie.findAll({
            order: [
                ['id', 'DESC']
            ],
            where: {
                deletedAt: null
            },
            limit: 10,
            offset: data
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('sortie:all', { data: res });
        });
    });

    socket.on('sortie:produits', data => {
        console.log(data);
        SortieProduit.findAll({
            where: {
                sortieId: data,
                deletedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('sortie:produits', { data: res });
        });
    });


    //get deleteditems
    socket.on('sortie:trash', data => {
        console.log(data);
        Sortie.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('sortie:trash', { data: res });
        });
    });

    //add item
    socket.on('sortie:add', data => {
        console.log(data);
        Sortie.create(data.sortie).then(res => {
            data.produits.forEach(prod => {
                prod.sortieId = res.id;
                SortieProduit.create(prod).then(
                    (x) => {
                        addStock(prod.produitId, -prod.quantite);
                    }
                );
            });
            socket.emit('sortie:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Sortie', res.id, 'add', socket.nom + ' a ajouté la sortie ' + res.nom).then(
                () => socket.broadcast.emit('newData')
            );
        });
    });

    //edit item
    socket.on('sortie:edit', data => {
        console.log(data);
        Sortie.update(data.sortie, {
            where: {
                id: data.sortie.id
            }
        }).then(() => {

            Sortie.findOne({
                where: { id: data.sortie.id, deletedAt: null }
            }).then(res => {
                SortieProduit.findAll({
                    where: { sortieId: data.sortie.id, deletedAt: null }
                }).then(
                    (elems) => {
                        data.produits.forEach(prod => {
                            if (!prod.id) {
                                prod.sortieId = res.id;
                                SortieProduit.create(prod).then(
                                    (x) => {
                                        addStock(prod.produitId, -prod.quantite);
                                    }
                                );
                            } else {
                                let entity = elems.find(elem => elem.produitId === prod.produitId);
                                if (entity) {
                                    SortieProduit.update(prod, {
                                        where: { produitId: prod.produitId, sortieId: prod.sortieId }
                                    }).then(
                                        (x) => {
                                            addStock(prod.produitId, entity.quantite - prod.quantite);
                                        }
                                    );
                                } else {
                                    let now = new Date();
                                    now = dateFormat(now) + ' ' + heureFormat(now);
                                    SortieProduit.update({ deletedAt: now }, {
                                        where: { produitId: entity.produitId, sortieId: entity.sortieId }
                                    }).then(
                                        (x) => {
                                            addStock(entity.produitId, entity.quantite);
                                        }
                                    );
                                }

                            }
                        });
                    }
                );
                socket.emit('sortie:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Sortie', res.id, 'edit', socket.nom + ' a modifié les informations de la sortie ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('sortie:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        Sortie.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            SortieProduit.findAll({ where: { sortieId: data.id, deletedAt: null } }.then(
                (elems) => {
                    elems.forEach(
                        elem => {
                            let now = new Date();
                            now = dateFormat(now) + ' ' + heureFormat(now);
                            SortieProduit.update({ deletedAt: now }, {
                                where: { produitId: elem.produitId, sortieId: elem.sortieId }
                            }).then(
                                (x) => {
                                    addStock(elem.produitId, -elem.quantite);
                                }
                            );
                        }
                    );
                })
            );
            Sortie.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('sortie:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Sortie', res.id, 'delete', socket.nom + ' a supprimé la sortie ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });

        });
    });

    //restore item
    socket.on('sortie:restore', id => {
        console.log(id);
        Sortie.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            Sortie.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('sortie:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Sortie', res.id, 'restore', socket.nom + ' a restauré la sortie ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    /**
    * ENTREE
    */

    //get All
    socket.on('consommation:all', data => {
        console.log(data);
        Consommation.findAll({
            where: {
                deletedAt: null,
                stoppedAt: null
            },
            include: [{
                model: Produit,
                through: {
                    attributes: ['prixUnitaire', 'quantite'],
                    where: {
                        deletedAt: null
                    }
                }
            }]
        }).then(res => {
            socket.emit('consommation:all', { data: res });
        });
    });

    socket.on('consommation:produits', data => {
        console.log(data);
        ConsommationProduit.findAll({
            where: {
                consommationId: data,
                deletedAt: null,
                stoppedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('consommation:produits', { data: res });
        });
    });

    socket.on('consommation:addProduit', data => {
        console.log(data);
        let req1 = 'quantite + ' + data.quantite;
        ConsommationProduit.update({ quantite: sequelize.literal(req1) }, {
            where: {
                consommationId: data.consommationId,
                productId: data.productId
            }
        }).then(
            (res1) => {
                // addStock(data.productId, -data.quantite);
                let factureTotale = data.quantite * data.prixUnitaire;
                let req2 = 'factureTotale + ' + factureTotale;
                Consommation.update({ factureTotale: sequelize.literal(req2) }, {
                    where: {
                        id: data.consommationId
                    }
                }).then(
                    (res2) => {
                        Consommation.findOne({
                            where: { id: data.consommationId, deletedAt: null, stoppedAt: null },
                            include: [{
                                model: Produit,
                                through: {
                                    attributes: ['prixUnitaire', 'quantite'],
                                    where: {
                                        deletedAt: null
                                    }
                                }
                            }]
                        }).then(res3 => {
                            socket.emit('consommation:addProduit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res3 })
                        });
                    }
                );
            }
        );
    });

    socket.on('consommation:newProduit', data => {
        console.log(data);
        Consommation.update({ factureTotale: data.consommation.factureTotale },
            {
                where: {
                    id: data.consommation.consommationId
                }
            }).then(res => {
                data.produits.forEach(prod => {
                    prod.consommationId = res.id;
                    ConsommationProduit.findOne(
                        {
                            where: {
                                consommationId: prod.consommationId,
                                productId: prod.productId,
                                deletedAt: null
                            }
                        }
                    ).then(
                        (res2) => {
                            if (res2) {
                                let req1 = 'quantite + ' + prod.quantite;
                                ConsommationProduit.update({ quantite: sequelize.literal(req1) }, {
                                    where: {
                                        consommationId: prod.consommationId,
                                        productId: prod.productId
                                    }
                                })
                            } else {
                                ConsommationProduit.create(prod);
                            }
                        }
                    )

                });
                Consommation.findOne({
                    where: { id: res.id, deletedAt: null, stoppedAt: null },
                    include: [{
                        model: Produit,
                        through: {
                            attributes: ['prixUnitaire', 'quantite'],
                            where: {
                                deletedAt: null
                            }
                        }
                    }]
                }).then(res3 => {
                    socket.emit('consommation:newProduit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res3 })
                });
                // socket.emit('consommation:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                // registrer('Consommation', res.id, 'add', socket.nom + ' a ajouté la consommation ' + res.nom).then(
                //     () => socket.broadcast.emit('newData')
                // );
            });
    });

    socket.on('consommation:client', data => {
        console.log(data);
        Consommation.update({ clientId: data.clientId }, {
            where: {
                id: data.consommationId
            }
        }).then(
            (res2) => {
                Consommation.findOne({
                    where: { id: data.consommationId, deletedAt: null, stoppedAt: null },
                    include: [{
                        model: Produit,
                        through: {
                            attributes: ['prixUnitaire', 'quantite'],
                            where: {
                                deletedAt: null
                            }
                        }
                    }]
                }).then(res3 => {
                    socket.emit('consommation:client', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res3 })
                });
            }
        );
    });

    socket.on('consommation:removeProduit', data => {
        console.log(data);
        let req1 = 'quantite - ' + data.quantite;
        ConsommationProduit.update({ quantite: sequelize.literal(req1) }, {
            where: {
                consommationId: data.consommationId,
                productId: data.productId
            }
        }).then(
            (res1) => {
                // addStock(data.productId, -data.quantite);
                let factureTotale = data.quantite * data.prixUnitaire;
                let req2 = 'factureTotale - ' + factureTotale;
                Consommation.update({ factureTotale: sequelize.literal(req2) }, {
                    where: {
                        id: data.consommationId
                    }
                }).then(
                    (res2) => {
                        Consommation.findOne({
                            where: { id: data.consommationId, deletedAt: null, stoppedAt: null },
                            include: [{
                                model: Produit,
                                through: {
                                    attributes: ['prixUnitaire', 'quantite'],
                                    where: {
                                        deletedAt: null
                                    }
                                }
                            }]
                        }).then(res3 => {
                            socket.emit('consommation:removeProduit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res3 })
                        });
                    }
                );
            }
        );
    });

    socket.on('consommation:deleteProduit', data => {
        console.log(data);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        ConsommationProduit.update({ deletedAt: now }, {
            where: {
                consommationId: data.consommationId,
                productId: data.productId
            }
        }).then(
            (res1) => {
                // addStock(data.productId, -data.quantite);
                let factureTotale = data.quantite * data.prixUnitaire;
                let req2 = 'factureTotale - ' + factureTotale;
                Consommation.update({ factureTotale: sequelize.literal(req2) }, {
                    where: {
                        id: data.consommationId
                    }
                }).then(
                    (res2) => {
                        Consommation.findOne({
                            where: { id: data.consommationId, deletedAt: null, stoppedAt: null },
                            include: [{
                                model: Produit,
                                through: {
                                    attributes: ['prixUnitaire', 'quantite'],
                                    where: {
                                        deletedAt: null
                                    }
                                }
                            }]
                        }).then(res3 => {
                            socket.emit('consommation:deleteProduit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res3 })
                        });
                    }
                );
            }
        );
    });

    socket.on('consommation:end', data => {
        console.log(data);
        // let now = new Date();
        // now = dateFormat(now) + ' ' + heureFormat(now);
        let now = null;
        Consommation.update({ stoppedAt: now }, {
            where: {
                id: data.consommationId
            }
        }).then(
            (res2) => {
                Consommation.findOne({
                    where: { id: data.consommationId, deletedAt: null },
                    include: [{
                        model: Produit,
                        through: {
                            attributes: ['prixUnitaire', 'quantite'],
                            where: {
                                deletedAt: null
                            }
                        }
                    }]
                }).then(res3 => {
                    socket.emit('consommation:end', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res3 })
                });
            }
        );
    });

    //get deleteditems
    socket.on('consommation:trash', data => {
        console.log(data);
        Consommation.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('consommation:trash', { data: res });
        });
    });

    //add item
    socket.on('consommation:add', data => {
        console.log(data);
        Consommation.create(data.consommation).then(res => {
            data.produits.forEach(prod => {
                prod.consommationId = res.id;
                ConsommationProduit.create(prod);
            });
            Consommation.findOne({
                where: { id: res.id, deletedAt: null, stoppedAt: null },
                include: [{
                    model: Produit,
                    through: {
                        attributes: ['prixUnitaire', 'quantite'],
                        where: {
                            deletedAt: null
                        }
                    }
                }]
            }).then(res3 => {
                socket.emit('consommation:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res3 })
            });
            socket.emit('consommation:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Consommation', res.id, 'add', socket.nom + ' a ajouté la consommation ' + res.nom).then(
                () => socket.broadcast.emit('newData')
            );
        });
    });

    //edit item
    socket.on('consommation:edit', data => {
        console.log(data);
        Consommation.update(data.consommation, {
            where: {
                id: data.consommation.id
            }
        }).then(() => {

            Consommation.findOne({
                where: { id: data.consommation.id, deletedAt: null }
            }).then(res => {
                ConsommationProduit.findAll({
                    where: { consommationId: data.consommation.id, deletedAt: null }
                }).then(
                    (elems) => {
                        data.produits.forEach(prod => {
                            if (!prod.id) {
                                prod.consommationId = res.id;
                                ConsommationProduit.create(prod).then(
                                    (x) => {
                                        addStock(prod.produitId, -prod.quantite);
                                    }
                                );
                            } else {
                                let entity = elems.find(elem => elem.produitId === prod.produitId);
                                if (entity) {
                                    ConsommationProduit.update(prod, {
                                        where: { produitId: prod.produitId, consommationId: prod.consommationId }
                                    }).then(
                                        (x) => {
                                            addStock(prod.produitId, entity.quantite - prod.quantite);
                                        }
                                    );
                                } else {
                                    let now = new Date();
                                    now = dateFormat(now) + ' ' + heureFormat(now);
                                    ConsommationProduit.update({ deletedAt: now }, {
                                        where: { produitId: entity.produitId, consommationId: entity.consommationId }
                                    }).then(
                                        (x) => {
                                            addStock(entity.produitId, entity.quantite);
                                        }
                                    );
                                }

                            }
                        });
                    }
                );
                socket.emit('consommation:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Consommation', res.id, 'edit', socket.nom + ' a modifié les informations de la consommation ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('consommation:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        Consommation.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            ConsommationProduit.findAll({ where: { consommationId: data.id, deletedAt: null } }.then(
                (elems) => {
                    elems.forEach(
                        elem => {
                            let now = new Date();
                            now = dateFormat(now) + ' ' + heureFormat(now);
                            ConsommationProduit.update({ deletedAt: now }, {
                                where: { produitId: elem.produitId, consommationId: elem.consommationId }
                            }).then(
                                (x) => {
                                    addStock(elem.produitId, -elem.quantite);
                                }
                            );
                        }
                    );
                })
            );
            Consommation.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('consommation:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Consommation', res.id, 'delete', socket.nom + ' a supprimé la consommation ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });

        });
    });

    //restore item
    socket.on('consommation:restore', id => {
        console.log(id);
        Consommation.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            Consommation.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('consommation:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Consommation', res.id, 'restore', socket.nom + ' a restauré la consommation ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    /**
     * LOCATION
     */

    socket.on('location:all', data => {
        console.log(data);
        Location.findAll({
            where: {
                deletedAt: null
            },
            //     include: [{
            //         model: Client,
            //         where: {
            //             deletedAt: null
            //         }
            //     },
            //     {
            //         model: Chambre,
            //         where: {
            //             deletedAt: null
            //         }
            //     }
            // ]
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('location:all', { data: res });
        });
    });


    //get deleteditems
    socket.on('location:trash', data => {
        console.log(data);
        Location.findAll({
            where: {
                deletedAt: {
                    [Op.ne]: null
                }
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('location:trash', { data: res });
        });
    });

    socket.on('location:proprietes', data => {
        console.log(data);
        LocationPropriete.findAll({
            where: {
                locationId: data.locationId
            }
        }).then(
            res => {
                socket.emit('location:proprietes', { data: res });
            }
        );
    });

    //add item
    socket.on('location:add', data => {
        console.log(data);
        data.nbreJours = 0;
        data.montantTotal = data.prixJournalier;
        Location.create(data.location).then(res => {
            socket.emit('location:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Location', res.id, 'add', socket.nom + ' a ajouté la location' + res.nom).then(
                () => socket.broadcast.emit('newData')
            );
            data.options.forEach(
                option => LocationPropriete.create({
                    proprieteId: option.id,
                    locationId: res.id,
                    coutAdditionnel: option.coutAdditionnel,
                    isChecked: option.isChecked
                })
            );
        });
    });

    //edit item
    socket.on('location:edit', data => {
        console.log(data);
        Location.update(data, {
            where: {
                id: data.id
            }
        }).then(() => {
            Location.findOne({
                where: { id: data.id }
            }).then(res => {
                socket.emit('location:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Location', res.id, 'edit', socket.nom + ' a modifié les informations de la location' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });

    //delete item
    socket.on('location:delete', id => {
        console.log(id);
        let now = new Date();
        now = dateFormat(now) + ' ' + heureFormat(now);
        Location.update({ deletedAt: now }, {
            where: {
                id: id
            }
        }).then(() => {
            Location.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('location:delete', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Location', res.id, 'delete', socket.nom + ' a supprimé  la location ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });

        });
    });

    //restore item
    socket.on('location:restore', id => {
        console.log(id);
        Location.update({ deletedAt: null }, {
            where: {
                id: id
            }
        }).then(() => {
            Location.findOne({
                where: { id: id }
            }).then(res => {
                socket.emit('location:restore', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
                registrer('Location', res.id, 'restore', socket.nom + ' a restauré la location ' + res.nom).then(
                    () => socket.broadcast.emit('newData')
                );
            });
        });
    });


    /**
     * DECONNEXION
     */

    socket.on('disconnect', () => {
        if (socket.isAuth) User.update({ isOnline: false }, { where: { id: socket.id } });
        console.log(socket.nom + ' est parti!')
    });

});

server.listen(3000, () => {
    console.log('server listen on port 3000');
});