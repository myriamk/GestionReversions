var fnrsSelected = [];
$(function () {

    /// Gestion bouton pour ouvrir/fermer popin d'exclusion des fournisseurs
    $('.Bt_gestionFnrs').click(function() {
        var Id_Lgn = $(this).closest('.Lgn').attr('id');
        var html = $('#' + Id_Lgn + ' .DataEtbl').html();
        $('.Popin_ExclusionFnrs .NomCat').html(html);

        $('.Masque').removeClass('Hidden');
        $('.Popin_ExclusionFnrs').addClass('Display');
    });


    /// gestion des fnrs cochés dans le popin --> Récupération dans un objet les idfnr cochés puis les envoyer en ajax à la validation
    /// Au chargement de la page --> Allez chercher les fnrs cochés soit en Ajax, soit stockés quelque part ds le HTML lors du chargement de la page et mis à jour qd validation de la popin.
    $('.Popin_ExclusionFnrs li input[type="checkbox"]:checked').each(function() {
        GestionSelectionFnrs($(this));
    });
    /// Lorsque click sur un Fnr
    $('.Popin_ExclusionFnrs li input[type="checkbox"]').click(function() {
        GestionSelectionFnrs($(this));
    });

    /// Boutons Annulation du popin
    $('#AnnulationSelectionFnrs, .Popin_ExclusionFnrs .ClosePopin').click(function() {
        $('.Popin_ExclusionFnrs li input[type="checkbox"]').removeAttr('checked');
        $('.Popin_ExclusionFnrs li span').removeClass('Selected');
        fnrsSelected = [];
        ClosePopin('.Popin_ExclusionFnrs');
    });
    /// Boutons Validation du popin
    $('#ValidationSelectionFnrs').click(function() {
        /// Créer fonction Ajax qui envoie la variable 'fnrsSelected' du type :
        /*
        $.ajax({
            url: "",
            type: "POST",
            async: false,
            data: "{'Contenu' : '" + JSON.stringify(fnrsSelected) + "' }",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            beforeSend: function () {
                $('.masque').addClass('Over'); /// Masque à mettre au 1er plan
            },
            success: function (response) {
                $('.masque').removeClass('Over'); /// Masque à mettre au 1er plan
                ClosePopin('.Popin_ExclusionFnrs');
            },
            error: function (jqXHR) {
            }
        });
        */

        ClosePopin('.Popin_ExclusionFnrs');
    });


});


function GestionSelectionFnrs(ThisChbx) {
    var liTag = ThisChbx.closest('li');

    /// Stockage des idfnr ds un tableau
    if(ThisChbx.is(':checked')) {
        fnrsSelected.push(ThisChbx.attr('id'));
        $(liTag).find('span').addClass('Selected');
    } else {
        fnrsSelected.splice( fnrsSelected.indexOf(ThisChbx.attr('id')), 1);
        $(liTag).find('span').removeClass('Selected');
    }
}


function ClosePopin(popin) {
    $('.Masque').addClass('Hidden');
    $(popin).removeClass('Display');
}