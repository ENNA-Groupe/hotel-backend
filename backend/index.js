const server = require('http').createServer();
const io = require('socket.io')(server);
const Sequelize = require('sequelize');
const crypto = require('crypto');
const sequelize = new Sequelize('hotel', 'root', '', {
    host: '192.168.1.70',
    // host: 'localhost',
    dialect: 'mysql',
    logging: false
});
const Op = Sequelize.Op;
//Models
const Operation = require('./models/operation.model')(sequelize, Sequelize);
const Fonction = require('./models/fonction.model')(sequelize, Sequelize);
const User = require('./models/user.model')(sequelize, Sequelize);
const Categorie = require('./models/categorie.model')(sequelize, Sequelize);
const Produit = require('./models/produit.model')(sequelize, Sequelize);
const Intrant = require('./models/intrant.model')(sequelize, Sequelize);
const Type = require('./models/type.model')(sequelize, Sequelize);
const Chambre = require('./models/chambre.model')(sequelize, Sequelize);
const Control = require('./models/control.model')(sequelize, Sequelize);
const ControlUser = require('./models/control-user.model')(sequelize, Sequelize);
const Propriete = require('./models/propriete.model')(sequelize, Sequelize);
const Table = require('./models/table.model')(sequelize, Sequelize);
const Fournisseur = require('./models/fournisseur.model')(sequelize, Sequelize);
const Entree = require('./models/entree.model')(sequelize, Sequelize);
const EntreeProduit = require('./models/entree-produit.model')(sequelize, Sequelize);

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
                where: { id: data.id }
            }).then(res => {
                socket.emit('intrant:edit', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
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
                       ctrl.forEach((item)=>{
                           ControlUser.create({userId: res.id, controlId: item.id});
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
                ControlUser.update({isChecked: item.isChecked},{
                    where: {
                        userId: item.userId,
                        controlId: item.controlId
                    }
                });
            }
        );
       socket.emit('control:save', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: true})
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
                registrer('Control', res.id, 'restore', socket.nom + ' a restauré le control ' + res.nom ).then(
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
            where: {
                deletedAt: null
            }
        }).then(res => {
            // console.log("All res:", JSON.stringify(res, null, 4));
            socket.emit('entree:all', { data: res });
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
        Entree.create(data).then(res => {
            socket.emit('entree:add', { infos: { type: 'success', message: 'Operation effectuée avec success' }, data: res });
            registrer('Entree', res.id, 'add', socket.nom + ' a ajouté l\' entree ' + res.nom).then(
                () => socket.broadcast.emit('newData')
            );
        });
    });

    //edit item
    socket.on('entree:edit', data => {
        console.log(data);
        Entree.update(data, {
            where: {
                id: data.id
            }
        }).then(() => {
            Entree.findOne({
                where: { id: data.id }
            }).then(res => {
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