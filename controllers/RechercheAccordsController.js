var colors = require('colors'); // juste pour le développement
var fs = require('fs'); // juste pour le développement

var _ = require('underscore');
var bodyParser = require('body-parser');
var sql = require('mssql');
var config = require('../config_mssql').config;

var recordset_Tx = []; // var. globale


module.exports = function(app) {
    

    app.get('/RechercheAccords', function(req, res) {

        /// Au chargement de la page, récupération des data pour alimenter liste déroulante des taux
        getTypeTaux(function(recordset) {
            recordset_Tx = recordset;
        });
    

        
        if(!_.isEmpty(req.query)) { /// Récupération des IDs pour afficher le bon accord

            //console.log("AccordReversionId : " + req.query.AccRevID); //TEST
            getAccords(function(recordset) {
                var newRecordset = [];
                newRecordset = FormatData(recordset); /// <-- Fonction pour formater les données comme on veut pour affichage ds vue
                //console.log(colors.bgWhite.blue(JSON.stringify(newRecordset))); //TEST au 06/03/17
                res.render('RechercheAccords', { dataAccords: newRecordset, listeTypeTaux: recordset_Tx, etbId: req.query.EtbId });
                
            }, req.query);

        } else { /// Chargement de la page sans recherche préalable : On charge la liste de tous les accords par défaut

            getDataOnLoad(function(recordsets) {
                var newRecordset = [];
                newRecordset = FormatData(recordsets[0]); /// <-- Fonction pour formater les données comme on veut pour affichage ds vue
                //console.log(colors.bgWhite.magenta(JSON.stringify(Newrecordset))); //TEST
                res.render('RechercheAccords', { dataAccords: newRecordset, listeTypeTaux: recordsets[1] });
            })

        }



    });



    
    // create application/x-www-form-urlencoded parser 
    var urlencodedParser = bodyParser.urlencoded({ extended: false });

    app.post('/RechercheAccords', urlencodedParser, function(req, res){
        if (!req.body) return res.sendStatus(400);
        console.log(req.body.SaisieRecherche); //TEST
    
        getDataPropositionsRecherche(function(recordsets) {
            //console.log(colors.bgWhite.magenta(JSON.stringify(recordsets))); //TEST
            //res.send({ propositionsRech_Grp: recordsets[0], propositionsRech_Etb: recordsets[1] });
            /// On va remplir le template avec les données (recordsets), puis on renvoie le html final du template rempli
            res.render('templates/autocompleteRecherche', { layout: false, propositionsRech_Grp: recordsets[0], propositionsRech_Etb: recordsets[1] }, function(err, html) {                
                res.send(html);                
            });
            
        }, req.body.SaisieRecherche);

        //res.end();
    });


};



function getTypeTaux(callback) {
    requete = "SELECT TypeTauxReversionId, Libelle FROM Reversion.TypeTauxReversion";

    var conn = new sql.Connection(config); 
    conn.connect().then(function() {
        
        var request = new sql.Request(conn);
        
        request
        .query(requete)
        .then(function(recordset) {
            callback(recordset);
            conn.close();
        })
        .catch(function(err) {
            console.log(colors.bgBlue.white('Erreur au niveau du Request : ' + err));
        });

    }).catch(function(err) {
        console.log(colors.bgBlue.white('Erreur au niveau de la connection : ' + err));
    });
}



function getDataOnLoad(callback) {
    config.parseJSON = true; // Pour que le recordset soit au format JSON

    var requete = "" +
        "SELECT " +
            "AcRv.AccordReversionId, AcRv.AnneeReversion, AcRv.DestinataireReversementEtablissementId, AcRv.GroupementId, Gr.[LIBELLE GROUPEMENT] As LibelleGroupement, " +
            "AcRv.PeriodeDebut, AcRv.PeriodeFin, AcRv.Taux, AcRv.TauxAvecEDI, " +
            "AcRv.DestinataireRaisonSociale, AcRv.DestinataireContact, AcRv.DestinataireAd1, AcRv.DestinataireAd2, " +
            "AcRv.DestinataireAd3, AcRv.DestinataireCP, AcRv.DestinataireVille, " +
            "AcRv.Desactive, TxRv.TypeTauxReversionId, TxRv.Libelle, ARvE.EtablissementId, ARvE.RaisonSociale, ARvE.CC, ARvE.Ad1, ARvE.Ad2, ARvE.Ad3, ARvE.CP, ARvE.Ville " +
        "FROM   Reversion.AccordReversion As AcRv INNER JOIN " +
            "Reversion.AccordReversionEtablissement as ARvE ON AcRv.AccordReversionId = ARvE.AccordReversionId INNER JOIN " +
            "Reversion.TypeTauxReversion As TxRv ON AcRv.TypeTauxReversionId = TxRv.TypeTauxReversionId INNER JOIN " +
            "Etablissement.dbo.GROUPEMENT As Gr ON AcRv.GroupementId = Gr.IDGroupement " +
        "ORDER BY AccordReversionId, PeriodeDebut desc, RaisonSociale;";
        /// 2eme requete pour liste déroulante sur choix Taux
        requete += "SELECT TypeTauxReversionId, Libelle FROM Reversion.TypeTauxReversion";

    //new sql.connect(config).then(function() { //V1
    var connection1 = new sql.Connection(config); //V2    
    connection1.connect().then(function() {//V2
        
        //var request = new sql.Request(); //V1
        var request = new sql.Request(connection1); //V2
        request.multiple = true; // On autorise les requetes multiples

        request
        .query(requete)
        .then(function(recordsets) {
            callback(recordsets);

            connection1.close(); //V2
        })
        .catch(function(err) {
            console.log(colors.bgRed.white('Erreur au niveau du Request : ' + err));
        });

    }).catch(function(err) {
        console.log(colors.bgRed.white('Erreur au niveau de la connection : ' + err));
    });

}



function FormatData(recordset) {
    var tabData = [];
    var flagIsGroup = null;
    var tab_EtblInGroup = [];

    recordset.forEach(function(item){
        if (item.GroupementId != 96 && flagIsGroup != item.AccordReversionId) { /// S'il s'agit d'un groupe
            flagIsGroup = item.AccordReversionId;
            var newdata = {};
        
            newdata.IsGroupe = true;
            newdata.LibelleGroupement = item.LibelleGroupement;
            newdata.AccordReversionId = item.AccordReversionId;
            newdata.AnneeReversion = item.AnneeReversion;
            newdata.DestinataireReversementEtablissementId = item.DestinataireReversementEtablissementId;
            newdata.PeriodeDebut = item.PeriodeDebut;
            newdata.PeriodeFin = item.PeriodeFin;
            newdata.Taux = item.Taux;
            newdata.TypeTauxReversionId = item.TypeTauxReversionId;
            newdata.Libelle = item.Libelle;
            newdata.DestinataireRaisonSociale = item.DestinataireRaisonSociale;
            newdata.DestinataireContact = item.DestinataireContact;
            newdata.DestinataireAd1 = (item.DestinataireAd1 != null ? item.DestinataireAd1 : "-");
            newdata.DestinataireAd2 = (item.DestinataireAd2 != null ? item.DestinataireAd2 : "-");
            newdata.DestinataireAd3 = (item.DestinataireAd3 != null ? item.DestinataireAd3 : "-");
            newdata.DestinataireCP = item.DestinataireCP;
            newdata.DestinataireVille = item.DestinataireVille;
            newdata.Desactive = item.Desactive;
            newdata.ListeEtbInGroup = [];

            tabData.push(newdata);
        } 

        if (item.GroupementId != 96 && flagIsGroup == item.AccordReversionId) { /// S'il s'agit d'un établissement dans un groupe

            var newEtbInGroup = {};
            newEtbInGroup.AccordReversionId = item.AccordReversionId;
            newEtbInGroup.EtablissementId = item.EtablissementId;
            newEtbInGroup.RaisonSociale = item.RaisonSociale;
            newEtbInGroup.CC = item.CC;
            newEtbInGroup.Ad1 = (item.Ad1 != null ? item.Ad1 : "");
            newEtbInGroup.Ad2 = (item.Ad2 != null ? item.Ad2 : "");
            newEtbInGroup.Ad3 = (item.Ad3 != null ? item.Ad3 : "");
            newEtbInGroup.CP = item.CP;
            newEtbInGroup.Ville = item.Ville;
            newEtbInGroup.TauxAvecEDI = (item.TauxAvecEDI === 0 ? "" : item.TauxAvecEDI);

            tab_EtblInGroup.push(newEtbInGroup);
        } 

        if (item.GroupementId == 96) {    /// S'il s'agit juste d'un établissement
            flagIsGroup = null;
            var newdata = {};

            newdata.IsGroupe = false;
            newdata.LibelleGroupement = null;
            newdata.AccordReversionId = item.AccordReversionId;
            newdata.AnneeReversion = item.AnneeReversion;
            newdata.DestinataireReversementEtablissementId = item.DestinataireReversementEtablissementId;
            newdata.RaisonSociale = item.RaisonSociale;
            newdata.PeriodeDebut = item.PeriodeDebut;
            newdata.PeriodeFin = item.PeriodeFin;
            newdata.Taux = item.Taux;
            newdata.TauxAvecEDI = (item.TauxAvecEDI === 0 ? "" : item.TauxAvecEDI);
            newdata.TypeTauxReversionId = item.TypeTauxReversionId;
            newdata.Libelle = item.Libelle;
            newdata.DestinataireRaisonSociale = item.DestinataireRaisonSociale;
            newdata.DestinataireContact = item.DestinataireContact;
            newdata.DestinataireAd1 = (item.DestinataireAd1 != null ? item.DestinataireAd1 : "-");
            newdata.DestinataireAd2 = (item.DestinataireAd2 != null ? item.DestinataireAd2 : "-");
            newdata.DestinataireAd3 = (item.DestinataireAd3 != null ? item.DestinataireAd3 : "-");
            newdata.DestinataireCP = item.DestinataireCP;
            newdata.DestinataireVille = item.DestinataireVille;
            newdata.Desactive = item.Desactive;
            newdata.EtablissementId = item.EtablissementId;
            newdata.RaisonSociale = item.RaisonSociale;
            newdata.CC = item.CC;
            newdata.Ad1 = (item.Ad1 != null ? item.Ad1 : "");
            newdata.Ad2 = (item.Ad2 != null ? item.Ad2 : "");
            newdata.Ad3 = (item.Ad3 != null ? item.Ad3 : "");
            newdata.CP = item.CP;
            newdata.Ville = item.Ville;

            tabData.push(newdata);
        }

    });


    //console.log(colors.bgMagenta.black(JSON.stringify(tab_EtblInGroup))); //TEST
    /// 1. On regroupe par 'AccordReversionId' les données correspondant aux établissements au sein d'un groupement 
    var GroupBy_Accord = _.groupBy(tab_EtblInGroup, 'AccordReversionId'); // Fonctionne
    //console.log(colors.bgYellow.black(JSON.stringify(GroupBy_Accord))); //TEST
    
    /// 2. On boucle dessus...
    for(var i in GroupBy_Accord) {
        //console.log(i + " | " + GroupBy_Accord[i]); //TEST
        /// 3. On rapproche les données entre lignes Groupes et celles correspondant aux etablissements ds un groupe via "AccordReversionId" 
        var GRP = _.findWhere(tabData, {"AccordReversionId": parseInt(i)});
        GRP.ListeEtbInGroup = GroupBy_Accord[i];
        //console.log(colors.bgRed.black(JSON.stringify(GRP))); //TEST
    }

    /* Pour TEST */
    //console.log(colors.bgYellow.black(JSON.stringify(tabData)));
    /*fs.writeFile('TEST.json', JSON.stringify(tabData), function (err) { 
        if (err) return console.log(err);
    });*/
    /* Fin TEST */
    

    return tabData;
}



function getDataPropositionsRecherche(callback, saisieRecherche) {
    config.parseJSON = true; // Pour que le recordset soit au format JSON
    
    /// 1ere requete pour rechercher sur nom de groupement
    var requete = "" +
    "SELECT " +
        "AcRv.AccordReversionId, AcRv.DestinataireReversementEtablissementId, Gr.[LIBELLE GROUPEMENT] As LibelleGroupement, AcRv.PeriodeDebut, AcRv.PeriodeFin, AcRv.DestinataireContact, AcRv.Desactive " +
    "FROM " +
        "Reversion.AccordReversion As AcRv " +
        "INNER JOIN Etablissement.dbo.GROUPEMENT As Gr ON AcRv.GroupementId = Gr.IDGroupement " +
    "WHERE " +
        "GroupementId != 96 and " +
        "Gr.[LIBELLE GROUPEMENT] like '%" + saisieRecherche + "%';";
    /// 2eme requete pour rechercher sur les champs relatifs aux établissements
    requete += "" +
    "SELECT " +
        "AcRv.AccordReversionId, AcRv.DestinataireReversementEtablissementId, AcRv.GroupementId, Gr.[LIBELLE GROUPEMENT] As LibelleGroupement, AcRv.PeriodeDebut, AcRv.PeriodeFin, AcRv.DestinataireContact, AcRv.Desactive, ARvE.EtablissementId, ARvE.RaisonSociale, ARvE.CC, ARvE.Ad1, ARvE.Ad2, ARvE.Ad3, ARvE.CP, ARvE.Ville " +
    "FROM " +           
        "Reversion.AccordReversion As AcRv INNER JOIN " +
        "Reversion.AccordReversionEtablissement as ARvE ON AcRv.AccordReversionId = ARvE.AccordReversionId  INNER JOIN " +
        "Etablissement.dbo.GROUPEMENT As Gr ON AcRv.GroupementId = Gr.IDGroupement " +
    "WHERE " +
        "RaisonSociale like '%" + saisieRecherche + "%' or " +
        "CC  like '%" + saisieRecherche + "%' or " +
        "Ad1 like '%" + saisieRecherche + "%' or " +
        "Ad2 like '%" + saisieRecherche + "%' or " +
        "Ad3 like '%" + saisieRecherche + "%' or " +
        "CP like '%" + saisieRecherche + "%' or " +
        "Ville like '%" + saisieRecherche + "%' " +
    "ORDER BY RaisonSociale;";


    var connection2 = new sql.Connection(config); 
    connection2.connect().then(function() {
    
        var request = new sql.Request(connection2);  
        request.multiple = true; // On autorise les requetes multiples

        request
        .query(requete)
        .then(function(recordsets) {
            callback(recordsets);
            connection2.close();
        })
        .catch(function(err) {
            console.log(colors.bgGreen.white('Erreur au niveau du Request : ' + err));
        });

    }).catch(function(err) {
        console.log(colors.bgGreen.white('Erreur au niveau de la connection : ' + err));
    });


}




function getAccords(callback, queries) {
    config.parseJSON = true; // Pour que le recordset soit au format JSON

    var requete = "" +
        "SELECT " +
            "AcRv.AccordReversionId, AcRv.AnneeReversion, AcRv.DestinataireReversementEtablissementId, AcRv.GroupementId, Gr.[LIBELLE GROUPEMENT] As LibelleGroupement, " +
            "AcRv.PeriodeDebut, AcRv.PeriodeFin, AcRv.Taux, AcRv.TauxAvecEDI, " +
            "AcRv.DestinataireRaisonSociale, AcRv.DestinataireContact, AcRv.DestinataireAd1, AcRv.DestinataireAd2, " +
            "AcRv.DestinataireAd3, AcRv.DestinataireCP, AcRv.DestinataireVille, " +
            "AcRv.Desactive, TxRv.TypeTauxReversionId, TxRv.Libelle, ARvE.EtablissementId, ARvE.RaisonSociale, ARvE.CC, ARvE.Ad1, ARvE.Ad2, ARvE.Ad3, ARvE.CP, ARvE.Ville " +
        "FROM   Reversion.AccordReversion As AcRv INNER JOIN " +
            "Reversion.AccordReversionEtablissement as ARvE ON AcRv.AccordReversionId = ARvE.AccordReversionId INNER JOIN " +
            "Reversion.TypeTauxReversion As TxRv ON AcRv.TypeTauxReversionId = TxRv.TypeTauxReversionId INNER JOIN " +
            "Etablissement.dbo.GROUPEMENT As Gr ON AcRv.GroupementId = Gr.IDGroupement " +
        "WHERE  AcRv.AccordReversionId =" + queries.AccRevID + " " +
        "ORDER BY AccordReversionId, PeriodeDebut desc, RaisonSociale;";


    var conn = new sql.Connection(config);   
    conn.connect().then(function() {
       
        var request = new sql.Request(conn);

        request
        .query(requete)
        .then(function(recordset) {
            callback(recordset);

            conn.close();
        })
        .catch(function(err) {
            console.log(colors.bgYellow.black('Erreur au niveau du Request : ' + err));
        });

    }).catch(function(err) {
        console.log(colors.bgYellow.black('Erreur au niveau de la connection : ' + err));
    });

}