var express = require('express');
var dateFormat = require('dateformat');
var listHistoGrpController = require('./controllers/ListeHistoriqueGroupementsController'); // Custom module
var RechAccordsController = require('./controllers/RechercheAccordsController'); // Custom module

var app = express();

/// Pour rendre les fonctionnalités de 'dateformat' accessibles dans ttes les pages .ejs, sous forme d'une variable locale
app.locals.dateFormat = dateFormat;

//set up template engine
app.set('view engine', 'ejs');

//static files 

app.use(express.static('./public'));


listHistoGrpController(app); /// Pour la page 'Historique des groupes'

RechAccordsController(app); /// pour la page de recherche des accords

// On écoute le port
app.listen(3000);
console.log('On écoute le port 3000'); //TEST 
