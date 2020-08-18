//Globals
var itemID = 0,
    itemCount = 0,
    currentItem = 0,
    services = [],
    serviceID = 0,
    counts = {
        "Color":0,
        "BW":0
    },
    breakTiers = {
        "Color":0,
        "BW":0
    }

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
            $(`[itemid=${currentItem}]`).find('.item-services').append(`<div serviceindex="${index}" quantity="0" serviceid="${serviceID}" class="service">${service['Name']}<div class="service-inputs"></div></div>`);
            $(service['Inputs']).each((index, currentInput) => {
                if(currentInput['Effect'] == 2){
                    //Check for Breaks and set PPU
                    if(service['hasBreaks']){
                        $(`[serviceid=${serviceID}]`).find('.service-inputs').append(`<input inputflag="${currentInput['Effect']}" value="${service['Breaks'][breakTiers[service['BreakType']]]['Front'].toFixed(2)}" class="service-input" type="${currentInput['Type']}" placeholder="${currentInput['Label']}">`);
                    }else{
                        $(`[serviceid=${serviceID}]`).find('.service-inputs').append(`<input inputflag="${currentInput['Effect']}" value="${service['Minimum'].toFixed(2)}" class="service-input" type="${currentInput['Type']}" placeholder="${currentInput['Label']}">`);
                    }
                }else{
                    $(`[serviceid=${serviceID}]`).find('.service-inputs').append(`<input inputflag="${currentInput['Effect']}" class="service-input" type="${currentInput['Type']}" placeholder="${currentInput['Label']}">`);
                }
            });
            $('#newService').css({
                "display":"none"
            });
            serviceID++;
        }
    });
    $('#input-newService').val('');
});

//Quantity Updates
$(document).on('change', '[inputflag=1]', () => {
    var service = services[$(event.target).closest('.service').attr('serviceindex')];
    $(event.target).closest('.service').find('[inputflag=3]').val(($(event.target).closest('.service').find('[inputflag=2]').val() * $(event.target).val()).toFixed(2));
    $(event.target).closest('.service').attr('quantity', $(event.target).val());
});

$(document).on('change', '[inputflag=4]', () => {
    //Range Update
    var quantity = parseRange($(event.target).val());
    $(event.target).closest('.service').attr('quantity', quantity);
    setImpressions();
});

//Update Total Impressions
function setImpressions(){
    counts = {
        "Color":0,
        "BW":0
    };
    //Print Impressions
    $('.service').each((index, service) => {
        console.log(services[$(service).attr('serviceindex')]['BreakType']);
        if(parseInt($(service).attr('quantity')) != 0){
            counts[services[$(service).attr('serviceindex')]['BreakType']] += parseInt($(service).attr('quantity'));
        }
    });
    $('.service').each((index, service) => {
        updateService($(service).attr('serviceid'));
    });
    
    console.log(counts);
}

function updateService(serviceID){
    service = $(`[serviceid=${serviceID}]`);
    //Update PPU
    $(services[service.attr('serviceindex')]['Breaks']).each((index, currentBreak) => {
        if(counts[services[service.attr('serviceindex')]['BreakType']] >= currentBreak['Start'] && counts[services[service.attr('serviceindex')]['BreakType']] <= currentBreak['End']){
            service.find('[inputflag=2]').val(currentBreak['Front']);
        }
    });

    //Update Subtotal
    service.find('[inputflag=3]').val((service.find('[inputflag=2]').val() * service.attr('quantity')).toFixed(2));
}

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

function parseRange(range){
    if(range.trim() == ''){
        return 0;
    }
    var quantity = 0;
    range = range.split(',');
    $(range).each((index, section) => {
        section = section.trim().split('-');
        if(section.length > 1){
            quantity += (parseInt(section[1]) - parseInt(section[0]) + 1);
        }else{
            quantity += parseInt(section[0]);
        }
        
    });
    return quantity;
}