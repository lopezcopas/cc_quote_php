//Globals
var itemID = 0,
    itemCount = 0,
    currentItem = 0,
    services = [];

//Ready
$(document).ready(() => {
    getServices();
});

//Add Item
$('#btn-addItem').click(() => {
    //Show Item Name
    $('#input-newItem').val('');
    $('#newItem').css({
        "display":"block"
    });
    $('#input-newItem').focus();
});

$('#btn-newItem').click(() => {
    if($('#input-newItem').val().trim() != ''){
        //If input is not empty
        $('#item-list').append(`<div itemid="${itemID}" class="item"><div class="item-header"><h1>${$('#input-newItem').val().trim()}</h1><button class="btn-addService">+</button></div><div class="item-services"></div></div>`);
        itemID++;
        itemCount++;
        $('#newItem').css({
            "display":"none"
        })
    }
});

//Add Service
$(document).on('click', '.btn-addService', () => {
    //Show Services
    $('#newService').css({
        "display":"block"
    });
    currentItem = $(event.target).closest('.item').attr('itemid');
});
$('#btn-newService').click(() => {
    //If Empty, return
    if($('#input-newService').val().trim() == ''){
        return;
    }
    //Confirm that entry exists
    $(services).each((index, service) => {
        if($('#input-newService').val() == service['Name']){
            $(`[itemid=${currentItem}]`).find('.item-services').append(`<div class="service">${service['Name']}</div>`);
        }
    });
    $('#input-newService').val('');
});

async function getServices(){
    let response = await fetch('./json/services.json',{
        method:'post',
        headers:{
            'Content-Type':'application/json'
        },
        body:"",
        mode:'cors'
    });

    let data = await response.json();

    services = data;
    $(services).each((index, service) => {
        $('#service-list').append(`<option value="${service['Name']}"></option>`);
    });
}