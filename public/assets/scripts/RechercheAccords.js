var Modif_LgnEtb = -1;
var Modif_LgnGroup_GroupSection = -1;
var Modif_LgnGroup_EtbSection = -1;

var InfosLgnModifiee = {
    NumeroAccord: null,
    IsGroupe: false,
    IDetablissement: null,
    IDgroupe: null,
    IDgroupeEtablismt: null,
    DestinataireReversion: {NomPrenom: "", Adresse1: "", Adresse2: "", Adresse3: "", CP: "", Ville: ""},
    PeriodeDebut: "",
    PeriodeFin: "",
    TypeTauxReversion: "",
    TauxReversion: null, //Optionnel (pour établ. de grp)
    TauxReversionAdd: null, //Optionnel
    ExclusionFnrs: [{}], //Tableau d'objet 'FnrExclu' définit ci-desssous. Objet ds le tableau optionnel : Par défaut --> Vide   
    EtablissementsGroupe: [{}] //Tableau d'objet 'EtablissementGroupe' définit ci-desssous. Objet ds le tableau optionnel : Par défaut --> Vide 
};

var FnrExclu = {
    idfnr:00000, 
    dateDebut:00/00/0000, 
    dateFin: 00/00/0000
};

var EtablissementGroupe = {
    DestinataireReversion: {NomPrenom: "", Adresse1: "", Adresse2: "", Adresse3: "", CP: "", Ville: ""}, //optionnel (pas toujours rempli)
    TauxReversionAdd: null //Optionnel
};

var lastSaisie = null;


$(function () {


    /*/// TEST : 02/03/17
    $.get( "TEST.txt", function( data ) {
        //$( ".result" ).html( data );
        //alert( "Load was performed." );

        alert(data);
    }, 'text');*/

    /// Pour avoir l'entete flottante
    CreateEnteteFlottante();

    /*
    CreateRappelLignesGroupe(); /// TEST
    */

    ///--- Moteur de recherche ---///
    var SaisieAddAccord = null;
    $('#SearchEtabl').on('keyup paste cut dragend focus', function() {
        SaisieAddAccord = $.trim($(this).val());
        if(SaisieAddAccord.length > 1) {

            //console.log('SaisieAddAccord : ' + SaisieAddAccord + ' | lastSaisie : ' + lastSaisie); //TEST
            if(SaisieAddAccord != lastSaisie) { /// pour éviter appel ajax inutile
                AddAccordQuery(SaisieAddAccord);
            } else if(SaisieAddAccord == lastSaisie && $('#AC_content').html() != '') {
                $('#Autocomplete.Hidden').removeClass('Hidden');
            }
            lastSaisie = SaisieAddAccord;

        } else {
            $('#Autocomplete').addClass('Hidden');
        }
    });
    $('body').click(function (event) {
        var $target = $(event.target);
        if (!($target.is($('#Autocomplete, #Autocomplete *, #SearchEtabl')))) {/// Si click sur un element de la pg autre que le menu déroulant et ses éléments descendants ET autre que la zone de click 'Survoler ici pour trouver une info' pour déplier le menu
            //$target.css("background-color", "red");//TEST
            $("#Autocomplete").addClass('Hidden');
        }
    });
    ///--- Fin moteur de recherche ---///


    $('.ListeEtbl .Bt_Modif').on('click', Mdf);


    ///--- Fctions à faire ---///
    $('.ListeEtbl .Bt_Suppr').on('click', Sppr);
    $('.ListeEtbl .Bt_Details').on('click', Dtls);
    ///--- Fin ---///

    ///--- Quand Validation des modif sur une ligne ---///
    $('.ListeEtbl .Bt_Valid').on('click', function() {
        var Id_Lgn = GetLgnID(this);

        var ValSelectTypeTx = $('#' + Id_Lgn + ' .LstAdh_saisieTypeTx option:selected').val(); /// Pour déterminer le type de taux sélectionné (Fixe ou variable)
        var ChpSaisieTxRev = $('#' + Id_Lgn + ' .LstAdh_SaisieTx > input[type="text"]');     

        /// Validation de saisie : On checke si certains champs ne sont pas vides.
        var txtErreur = '';
        /// Champs 'Destinataire réversion'
        $('#' + Id_Lgn + ' .DataDest input[type="text"]').each(function(i, el) {
            $(el).toggleClass('Error', ($.trim($(el).val()) == ''));  
        });
        if($('#' + Id_Lgn + ' .DataDest input[type="text"]').hasClass('Error')) {
            txtErreur = "Un/des champs sur le destinataire de la réversion non remplis";
        }
        /// Champ 'Taux de réversion' qd tx fixe
        if((ValSelectTypeTx == 1) && (ChpSaisieTxRev.val() == '')) {
            ChpSaisieTxRev.addClass('Error');
            txtErreur += '\nVeuillez remplir le champ de saisie du taux de réversion.\nMerci';
        }  else {
            ChpSaisieTxRev.removeClass('Error');
        }     

        if($('#' + Id_Lgn + ' input[type="text"]').hasClass('Error')) {
            alert(txtErreur); 
            return false; /// On interdit le traitement qui suit
        }

        

        EndModifLign(Id_Lgn);

        console.log(Id_Lgn); //TEST

        //console.log(Modif_LgnEtb + " / " + Modif_LgnGroup_GroupSection + " / " + Modif_LgnGroup_EtbSection); //TEST


        /// Affectation des données des champs de saisie ds l'objet 'InfosLgnModifiee' + ds champs d'affichage
        InfosLgnModifiee.NumeroAccord = ((Modif_LgnEtb == 1) ? $('#' + Id_Lgn).data('numaccord') : $('#' + Id_Lgn).closest('.Lgn_Group').data('numaccord'));
        InfosLgnModifiee.IsGroupe = ((Modif_LgnEtb == 1) ? false : true);
        InfosLgnModifiee.IDetablissement = ((Modif_LgnEtb == 1) ? $('#' + Id_Lgn).data('idetablissement') : ((Modif_LgnGroup_EtbSection == 1) ? $('#' + Id_Lgn).data('idgroupeetablismt') : null));
        InfosLgnModifiee.IDgroupe = ((Modif_LgnGroup_GroupSection == 1) ? $('#' + Id_Lgn).data('idgroupe') : null);
        InfosLgnModifiee.DestinataireReversion.NomPrenom = $('#' + Id_Lgn + ' .ChpNomDest').val();
        InfosLgnModifiee.DestinataireReversion.Adresse1 = $('#' + Id_Lgn + ' .ChpAdresseDest1').val();
        InfosLgnModifiee.DestinataireReversion.Adresse2 = $('#' + Id_Lgn + ' .ChpAdresseDest2').val();
        InfosLgnModifiee.DestinataireReversion.Adresse3 = $('#' + Id_Lgn + ' .ChpAdresseDest3').val();
        InfosLgnModifiee.DestinataireReversion.CP = $('#' + Id_Lgn + ' .ChpCPDest').val();
        InfosLgnModifiee.DestinataireReversion.Ville = $('#' + Id_Lgn + ' .ChpVilleDest').val();
        InfosLgnModifiee.TypeTauxReversion = $('#' + Id_Lgn + ' .LstAdh_saisieTypeTx option:selected').text();
        if(ValSelectTypeTx != 1) { ChpSaisieTxRev.val(''); } /// valeur du chp de saisie vide si pas selection d'un tx fixe lors de la validation 
        InfosLgnModifiee.TauxReversion = ChpSaisieTxRev.val();       
        InfosLgnModifiee.TauxReversionAdd = $('#' + Id_Lgn + ' .LstAdh_SaisieTxAdd > input[type="text"]').val();
        InfosLgnModifiee.PeriodeDebut = $('#' + Id_Lgn + ' .LstAdh_SaisiePeriode .ChpSaisieDateDebut').val();
        InfosLgnModifiee.PeriodeFin = $('#' + Id_Lgn + ' .LstAdh_SaisiePeriode .ChpSaisieDateFin').val();

        $('#' + Id_Lgn + ' .NomDest').text(InfosLgnModifiee.DestinataireReversion.NomPrenom);
        $('#' + Id_Lgn + ' .AdresseDest').text(InfosLgnModifiee.DestinataireReversion.Adresse);
        $('#' + Id_Lgn + ' .CPDest').text(InfosLgnModifiee.DestinataireReversion.CP);
        $('#' + Id_Lgn + ' .VilleDest').text(InfosLgnModifiee.DestinataireReversion.Ville);
        $('#' + Id_Lgn + ' .LstAdh_TypeTx').text(InfosLgnModifiee.TypeTauxReversion).attr('data-TypeTx', ValSelectTypeTx);
        $('#' + Id_Lgn + ' .LstAdh_Tx > span').text(InfosLgnModifiee.TauxReversion);
        $('#' + Id_Lgn + ' .LstAdh_TxAdd > span').text(InfosLgnModifiee.TauxReversionAdd).toggleClass('Empty', ($.trim(InfosLgnModifiee.TauxReversionAdd) == ''));
        $('#' + Id_Lgn + ' .LstAdh_Periode .DateDebut').text(InfosLgnModifiee.PeriodeDebut);
        $('#' + Id_Lgn + ' .LstAdh_Periode .DateFin').text(InfosLgnModifiee.PeriodeFin);

        /// Disparition champs de saisie
        $('#' + Id_Lgn + ' .DataDest .Chps, #' + Id_Lgn + ' .LstAdh_Periode, #' + Id_Lgn + ' .LstAdh_TxAdd, #' + Id_Lgn + ' .LstAdh_TypeTx').removeClass('Hidden');
        $('#' + Id_Lgn + ' .DataDest .ChpsSaisie, #' + Id_Lgn + ' .LstAdh_SaisiePeriode,  #' + Id_Lgn + ' .LstAdh_SaisieTx, #' + Id_Lgn + ' .LstAdh_SaisieTxAdd, #' + Id_Lgn + ' .LstAdh_saisieTypeTx').addClass('Hidden');
    
        if(ValSelectTypeTx == 1) { /// Si tx fixe, on fait réapparaitre le champ 'Taux'
            $('#' + Id_Lgn + ' .LstAdh_Tx').removeClass('Hidden');
        }

        /// Réinitialisation
        Modif_LgnEtb = -1;
        Modif_LgnGroup_GroupSection = -1;
        Modif_LgnGroup_EtbSection = -1;

        /////===== Ici, faire requête Ajax pour enregistrement données de l'objet ds bdd =====////

    });

    ///--- Quand Annulation des modif sur une ligne ---///
    $('.ListeEtbl .Bt_Undo').on('click', function() {
        var Id_Lgn = GetLgnID(this);
        EndModifLign(Id_Lgn);

        var ValSelectTypeTx = $('#' + Id_Lgn + ' .LstAdh_saisieTypeTx option:selected').val(); /// Pour déterminer le type de taux sélectionné (Fixe ou variable)
        
        /// Affectation data champs de saisie
        $('#' + Id_Lgn + ' .ChpNomDest').val('');
        $('#' + Id_Lgn + ' .ChpAdresseDest1, #' + Id_Lgn + ' .ChpAdresseDest2, #' + Id_Lgn + ' .ChpAdresseDest3').val('');
        $('#' + Id_Lgn + ' .ChpCPDest').val('');
        $('#' + Id_Lgn + ' .ChpVilleDest').val('');
        $('#' + Id_Lgn + ' .LstAdh_SaisiePeriode .ChpSaisieDateDebut').val('');
        $('#' + Id_Lgn + ' .LstAdh_SaisiePeriode .ChpSaisieDateFin').val('');
        $('#' + Id_Lgn + ' .LstAdh_saisieTypeTx option:eq(0)').prop('selected', 'selected');
        $('#' + Id_Lgn + ' .LstAdh_SaisieTx > input[type="text"]').val('');
        $('#' + Id_Lgn + ' .LstAdh_SaisieTxAdd > input[type="text"]').val('');

        /// Retrait signalement d'erreur sur champs de saisie
        $('#' + Id_Lgn + ' input[type="text"]').removeClass('Error'); 
        
        /// Disparition champs de saisie
        $('#' + Id_Lgn + ' .DataDest .Chps, #' + Id_Lgn + ' .LstAdh_Periode, #' + Id_Lgn + ' .LstAdh_TypeTx, #' + Id_Lgn + ' .LstAdh_TxAdd').removeClass('Hidden');
        $('#' + Id_Lgn + ' .DataDest .ChpsSaisie, #' + Id_Lgn + ' .LstAdh_SaisiePeriode, #' + Id_Lgn + ' .LstAdh_saisieTypeTx, #' + Id_Lgn + ' .LstAdh_SaisieTx, #' + Id_Lgn + ' .LstAdh_SaisieTxAdd').addClass('Hidden');
    
        if(ValSelectTypeTx == 1) { /// Si tx fixe, on laisse le champ 'Taux' visible
            $('#' + Id_Lgn + ' .LstAdh_Tx').removeClass('Hidden');
        }
});


    /// Qd sélection avec liste déroulante du Taux de réversion
    $('.LstAdh_saisieTypeTx').on('change', function() {
        LstDer = $(this);
        if(LstDer.val() == 1) { /// si sélection Tx fixe...
            LstDer.next('.LstAdh_SaisieTx').removeClass('Hidden');    
        } else { /// si sélection Tx variable...
            LstDer.next('.LstAdh_SaisieTx').addClass('Hidden');    
        }
    });


    $('.ChpCPDest, .LstAdh_SaisieTx > input[type="text"], .LstAdh_SaisieTxAdd > input[type="text"]').on('keyup paste cut dragend focus', function() {
        /// Pour n'autoriser que la saisie des chiffres
        var Ceci = $(this);
        Ceci.val(Ceci.val().replace(/\D/g,''));
        /// Pour ne pas saisir + de 100%
        if(Ceci.val() > 100 && Ceci.attr('class') != 'ChpCPDest') { Ceci.val(100); }
    });



});


function Mdf() {
    var Id_Lgn = GetLgnID(this);
    var ThisLgn = $(this);

    /// Si pas d'autre(s) ligne(s) en cours de modif.
    if($('.ModifEnCours').length == 0) {
        /// Gestion de l'affichage ou non des boutons
        ThisLgn.addClass('Hidden');

        $('.bandeauHaut input[type="text"]').prop('disabled', true); /// Désactivation des chps dans BandeauHaut       
        $('.Bt_Modif, .Bt_Suppr, .Bt_Details').addClass('Disabled'); /// Désactivation des boutons
        $('.Bt_Modif').off('click', Mdf);
        
        $('#' + Id_Lgn).addClass('ModifEnCours'); /// Ajout d'un marqueur identifiant la ligne en cours de modif
        $('.Lgn:not(.ModifEnCours):not(.Enteteliste)').addClass('Disabled'); /// Ajout de marqueurs sur les autres lignes que celle en cours de modif.        


        /// On détermine sur quelle type de ligne l'utilisateur a cliqué
        Modif_LgnEtb = ThisLgn.parents('.Lgn_Etb').length;
        Modif_LgnGroup_GroupSection = ThisLgn.parents('.LgnGroupSection').length;
        Modif_LgnGroup_EtbSection = ThisLgn.parents('.LgnEtbSection').length;
        
         var SelectorPart = '#' + Id_Lgn;

        /// Apparition boutons
        $(SelectorPart + ' .Bt_Valid, ' + SelectorPart + ' .Bt_Undo, ' + SelectorPart + ' .Bt_gestionFnrs').removeClass('Hidden');


        if(Modif_LgnEtb || Modif_LgnGroup_GroupSection) {

            /// Affectation data champs de saisie
            $(SelectorPart + ' .ChpNomDest').val($(SelectorPart + ' .NomDest').text());
            $(SelectorPart + ' .ChpAdresseDest1').val($.trim($(SelectorPart + ' .AdresseDest > div:eq(0)').text()));
            $(SelectorPart + ' .ChpAdresseDest2').val($.trim($(SelectorPart + ' .AdresseDest > div:eq(1)').text()));
            $(SelectorPart + ' .ChpAdresseDest3').val($.trim($(SelectorPart + ' .AdresseDest > div:eq(2)').text()));            
            $(SelectorPart + ' .ChpCPDest').val($(SelectorPart + ' .CPDest').text());
            $(SelectorPart + ' .ChpVilleDest').val($(SelectorPart + ' .VilleDest').text());
            $(SelectorPart + ' .ChpSaisieDateDebut').val($(SelectorPart + ' .LstAdh_Periode .DateDebut').text());
            $(SelectorPart + ' .ChpSaisieDateFin').val($(SelectorPart + ' .LstAdh_Periode .DateFin').text()); 
            $(SelectorPart + ' .LstAdh_SaisieTxAdd > input[type="text"]').val($(SelectorPart + ' .LstAdh_TxAdd > span').text());
                    
            /// Pour liste déroulante sur Chp 'Taux de réversion' : Sélection de la bonne 'option'
            var TypeTx = $(SelectorPart + ' .LstAdh_TypeTx').attr('data-TypeTx'); 
            var IdxOption = $(SelectorPart + ' .LstAdh_saisieTypeTx option[value="' + TypeTx + '"]').index();
            //console.log('TypeTx : ' + TypeTx + ' / IdxOption : ' + IdxOption); //TEST
            $(SelectorPart + ' .LstAdh_saisieTypeTx option:eq(' + IdxOption + ')').prop('selected', 'selected');
            if( TypeTx == 1 ) { /// Si taux fixe... 
                /// Récupération de la valeur du chp 'Taux' pour affectation ds chp de saisie correspondant
                $(SelectorPart + ' .LstAdh_SaisieTx > input[type="text"]').val($(SelectorPart + ' .LstAdh_Tx > span').text()); 
                /// On fait apparaitre le chp de saisie 'Taux'
                $(SelectorPart + ' .LstAdh_Tx').addClass('Hidden');
                $(SelectorPart + ' .LstAdh_SaisieTx').removeClass('Hidden');
            }

            /// Apparition champs de saisie
            $(SelectorPart + ' .DataDest .Chps, ' + SelectorPart + ' .LstAdh_Periode, ' + SelectorPart + ' .LstAdh_TxAdd, ' + SelectorPart + ' .LstAdh_TypeTx').addClass('Hidden');
            $(SelectorPart + ' .DataDest .ChpsSaisie, ' + SelectorPart + ' .LstAdh_SaisiePeriode, ' + SelectorPart + ' .LstAdh_SaisieTxAdd, ' + SelectorPart + ' .LstAdh_saisieTypeTx').removeClass('Hidden');
       


            /// Gestion des datePicker
            var DatePickerDebut = $(SelectorPart + " .ChpSaisieDateDebut");
            var DatePickerFin = $(SelectorPart + " .ChpSaisieDateFin");
            
            DatePickerDebut.datepicker({
                showAnim: "slideDown",
                dayNamesMin: ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"],
                minDate: "-24m", /// La date minimum selectionnable : 24 mois avant la date d'aujourd'hui, donc ici "-24m". On peut mettre aussi un objet Date ou un String. Si la promotion est obsolète, date min. est = à la date déjà inscrite ds ce champ (sinon bug), sinon date du jour. 
                maxDate: ($.trim(DatePickerFin.val()) != "" ? DatePickerFin.val() : "+24m"), /// La date max. selectionnable : ici si 'Date de Fin' rempli, maxDate de 'Date Début' = valeur de 'date de Fin', sinon 24 mois après la date du jour ("+24m"). On peut mettre aussi un objet Date ou un nombre
                changeMonth: true,
                changeYear: true,
                onClose: function (selectedDate) {
                    /// Sur l'ev. OnClose de la 'Date de Départ', le minDate du champ 'Date de Fin' est égal au lendemain de la date du jour (+1) si pas de date ds 'Date de Départ', sinon date sélectionnée ds 'Date de Départ'
                    DatePickerFin.datepicker("option", "minDate", ($.trim($(this).val()) == "" ? +1 : DatePlusOneDay(selectedDate)));
                }
            });

            DatePickerFin.datepicker({
                showAnim: "slideDown",
                dayNamesMin: ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"],
                minDate: ($.trim(DatePickerDebut.val()) != "" ? DatePickerDebut.val() : +1), /// La date minimum selectionnable : A number of days from today. Donc ici +1 = demain. On peut mettre aussi un objet Date ou un String
                maxDate: "+24m", /// La date max. selectionnable : ici 24 mois après la date du jour. On peut mettre aussi un objet Date ou un nombre       
                changeMonth: true,
                changeYear: true,
                onClose: function (selectedDate) {
                    /// Sur l'ev. OnClose de la 'Date de Fin', le maxDate du champ 'Date de Début' est égal à la date sélectionnée ds 'Date de Fin'
                    DatePickerDebut.datepicker("option", "maxDate", selectedDate);
                }
            });


        } else if(Modif_LgnGroup_EtbSection) {

            $(SelectorPart + ' .LstAdh_SaisieTxAdd > input[type="text"]').val($(SelectorPart + ' .LstAdh_TxAdd > span').text());
            $(SelectorPart + ' .LstAdh_TxAdd').addClass('Hidden');
            $(SelectorPart + ' .LstAdh_SaisieTxAdd').removeClass('Hidden');
        }

    }

}

///--- Fctions à faire ---///
function Sppr() {}
function Dtls() {}


function GetLgnID(Bt) {
   // console.log(Id_Lgn); //TEST
   return $(Bt).closest('.Lgn').attr('id');
}


function EndModifLign(Id_Lgn) {
    /// gestion des boutons à cacher et à afficher
    $('#' + Id_Lgn + ' .Bt_Valid, #' + Id_Lgn + ' .Bt_Undo, #' + Id_Lgn + ' .Bt_gestionFnrs').addClass('Hidden');
    $('#' + Id_Lgn + ' .Bt_Modif').removeClass('Hidden');
    /// Réactivation
    $('.bandeauHaut input[type="text"]').prop('disabled', false); /// Bandeau haut
    
    //$('.Bt_Modif, .Bt_Suppr, .Bt_Details').removeClass('Disabled').bind('click'); /// Boutons sur toutes les lignes
    $('.Bt_Modif, .Bt_Suppr, .Bt_Details').removeClass('Disabled'); /// Boutons sur toutes les lignes
    $('.Bt_Modif').on('click', Mdf);
            
    // Retrait des marqueurs
    $('#' + Id_Lgn).removeClass('ModifEnCours'); /// Retrait du marqueur identifiant la ligne en cours de modif
    $('.Lgn').removeClass('Disabled'); /// Retrait des marqueurs sur les autres lignes que celle en cours de modif.
}



function DatePlusOneDay(dt) {
    tab_dt = (dt.split(/[- //]/));
    result = new Date(tab_dt[2], parseInt(tab_dt[1]) - 1, tab_dt[0]);
    result.setDate(result.getDate() + 1);
    return result;
}


function CreateEnteteFlottante() {
    $('.Enteteliste').clone(true).addClass('clone').prependTo('.ListeEtbl');
}


function AddAccordQuery(Saisie) {

    $.ajax({
        method: "POST",
        url: "/RechercheAccords",
        data: {SaisieRecherche: Saisie},
        //contentType: "application/json; charset=utf-8",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        ifModified: true,
        beforeSend: function () {
            $('.masque').removeClass('Hidden');
        }
    })
    .done(function (data) {
        //console.log("La data est : " + data); //TEST
        if($.trim(data) != "") {
            $('#Autocomplete.Hidden').removeClass('Hidden');
            $('#AC_content').html(data);
            $('#AC_content *[data-tohighlight]').highlight(Saisie);
        } else {
            $('#Autocomplete').addClass('Hidden');
            $('#AC_content').html("");
        }
    })
    .fail(function () {
        /// Affichage erreur
        $('.Popin').removeClass('Hidden').addClass('Error').html("");
    })
    .always(function () {
        /// Retrait masque
        $('.masque').addClass('Hidden');
    })

        
}





/* En cours de codage : Pour entete flottante sur nom Groupe */
/*function CreateRappelLignesGroupe() {
    $('.ListeEtbl .LgnGroupSection').each(function() {
        var NomGrp = $.trim($(this).find('.DataEtbl').text());
        $('.Enteteliste:not(.clone) + div').prepend("<div class='EnteteFlottanteRappelNomGrp'>" + NomGrp + "</div>");
    });
}
$(window).scroll(function() {
    console.log($(this).scrollTop());
});*/