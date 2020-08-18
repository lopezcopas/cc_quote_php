//Global
var itemID = 0,
    itemCount = 0,
    currentItem = 0,
    services = [],
    serviceID = 0,
    counts = {
        "print-color":0,
        "print-bw":0,
        "service-bind":0
    },
    breakTiers = {
        "Color":0,
        "BW":0
    }

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

//Confirm Item
$('#btn-newItem').click(() => {
    if($('#input-newItem').val().trim() != ''){
        //If input is not empty
        $('#item-list').append(`<div itemid="${itemID}" class="item"><div class="item-header"><h1>${$('#input-newItem').val().trim()}</h1><div class="item-pricing"><input type="number" class="item-quantity" value="1"><p>@</p><input type="number" class="per-item-subtotal"> = <input type="number" class="item-subtotal"></div><button class="btn-addService">+</button></div><div class="item-services"></div></div>`);
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

//Confirm Service
$('#btn-newService').click(() => {
    //If Empty, return
    if($('#input-newService').val().trim() == ''){
        $('#newService').css({
            "display":"none"
        });
    }
    $(services).each((index, service) => {
        if($('#input-newService').val() == service['Name']){
            var elementInputs = '';
            $(service['Inputs']).each((inputIndex, serviceInput) => {
                elementInputs += `<label>${serviceInput['Label']}</label><input exclude="false" inputeffect="${serviceInput['Effect']}" class="service-input" type="${serviceInput['Type']}">`
            });
            $(`[itemid=${currentItem}]`).find('.item-services').append(`<div serviceindex="${index}" duplex="false" quantity="0" serviceid="${serviceID}" servicetype="${service['Type']}" class="service">${service['Name']}<div class="service-inputs">${elementInputs}</div></div>`);
        }
        serviceID++;
    });
    $('#input-newService').val('');
    updateAllPPU();
});

//Update Item Multiplier
$(document).on('change', '.item-quantity', () => {
    updateAllPPU();
});

//Change Duplex
$(document).on('change', '[inputeffect=4]', () => {
    if(event.target.checked){
        $(event.target).closest('.service').attr('duplex', 'true');
    }else{
        $(event.target).closest('.service').attr('duplex', 'false');
    }
    //Should the PPU change
    if($(event.target).siblings('[inputeffect=1]').attr('exclude') == 'false'){
        $(event.target).siblings('[inputeffect=1]').val(getPPU($(event.target).closest('.service')).toFixed(2));
    }
});

//Update PPU
$(document).on('change', '[inputeffect=1]', () => {
    var ppu = getPPU($(event.target).closest('.service'));
    if(ppu != $(event.target).val()){
        //Custom Value
        $(event.target).attr('exempt', true);
    }else{
        $(event.target).attr('exempt', false);
    }
    console.log(ppu);
});

//Range Update
$(document).on('change', '[inputeffect=3]', () => {
    var quantity = parseRange($(event.target).val());
    $(event.target).closest('.service').attr('quantity', quantity);
    updateAllPPU();
});

//Exclude Impressions
$(document).on('change', '[inputeffect=5]', () => {
    //Check if impressions should be excluded
    var shouldExclude = false;
    $(event.target).closest('.service').siblings().each((index, sibling) => {
        if($(sibling).attr('servicetype') == 'print-color'){
            shouldExclude = true;
        }
    });
    if(shouldExclude == event.target.checked){
        $(event.target).attr('exclude', 'false');
        updateAllPPU();
    }else{
        $(event.target).attr('exclude', 'true');
        updateAllPPU();
    }
});

//Update Quantity
$(document).on('change', '[inputeffect=6]', () => {
    $(event.target).closest('.service').attr('quantity', $(event.target).val());
});

//Functions
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

function getPPU(service){
    var totalImpressions = counts[service.attr('servicetype')],
        ppu = services[service.attr('serviceindex')]['Minimum'];
    if(services[service.attr('serviceindex')]['hasBreaks']){
        if(totalImpressions == 0){
            if($(service).attr('duplex') == 'true'){
                ppu = services[$(service).attr('serviceindex')]['Breaks'][0]['Front'] + services[$(service).attr('serviceindex')]['Breaks'][0]['Back'];
            }else{
                ppu = services[$(service).attr('serviceindex')]['Breaks'][0]['Front'];
            }
        }
        $(services[service.attr('serviceindex')]['Breaks']).each((index, currentBreak) => {
            if(totalImpressions >= currentBreak['Start'] && totalImpressions <= currentBreak['End']){
                if(service.attr('servicetype').includes('print')){
                    //Check if there should be a back price
                    if(service.attr('duplex') == "true"){
                        ppu = currentBreak['Front'] + currentBreak['Back'];
                    }else{
                        ppu = currentBreak['Front'];
                    }
                }else{
                    ppu = currentBreak['Front'];
                }
            }
        });
    }

    return ppu;
}

function updateAllPPU(){
    counts = {
        "print-color":0,
        "print-bw":0,
        "service-bind":0
    };
    $('.service').each((index, service) => {
        //Get Item multiplier
        var itemMult = parseInt($(service).closest('.item').find('.item-quantity').val());
        if(itemMult == 0){
            itemMult = 1;
        }
        if($(service).attr('servicetype') == 'print-bw' && $(service).find('[inputeffect=5]').attr('exclude') == 'false'){
            //Check if impressions should be excluded and it isn't overrided by user
            var shouldExclude = false;
            $(service).siblings().each((index, sibling) => {
                if($(sibling).attr('servicetype') == 'print-color'){
                    shouldExclude = true;
                }
            });
            
            if(shouldExclude){
                $(service).find('[inputeffect=5]').prop('checked', true);
            }else{
                counts[$(service).attr('servicetype')] += (itemMult * parseInt($(service).attr('quantity')));
            }
        }else{
            counts[$(service).attr('servicetype')] += (itemMult * parseInt($(service).attr('quantity')));
        }
    });
    $('.item-services').each((index, item) => {
        var perItemTotal = 0,
            itemTotal = 0,
            itemMult = $(item).closest('.item').find('.item-quantity').val();
        $(item).children().each((index, service) => {
            var totalImpressions = counts[$(service).attr('servicetype')],
            ppu = services[$(service).attr('serviceindex')]['Minimum'];
            if(services[$(service).attr('serviceindex')]['hasBreaks']){
                if(totalImpressions == 0){
                    if($(service).attr('duplex') == 'true'){
                        ppu = services[$(service).attr('serviceindex')]['Breaks'][0]['Front'] + services[$(service).attr('serviceindex')]['Breaks'][0]['Back'];
                    }else{
                        ppu = services[$(service).attr('serviceindex')]['Breaks'][0]['Front'];
                    }
                }
                $(services[$(service).attr('serviceindex')]['Breaks']).each((index, currentBreak) => {
                    if(totalImpressions >= currentBreak['Start'] && totalImpressions <= currentBreak['End']){
                        if($(service).attr('servicetype').includes('print-bw')){
                            if($(service).find('[inputeffect=5]').prop('checked')){
                                if($(service).attr('duplex') == "true"){
                                    ppu = services[$(service).attr('serviceindex')]['Breaks'][0]['Front'] + services[$(service).attr('serviceindex')]['Breaks'][0]['Back'];
                                }else{
                                    ppu = services[$(service).attr('serviceindex')]['Breaks'][0]['Front'];
                                }
                            }else{
                                //Check if there should be a back price
                                if($(service).attr('duplex') == "true"){
                                    ppu = currentBreak['Front'] + currentBreak['Back'];
                                }else{
                                    ppu = currentBreak['Front'];
                                }
                            }                     
                        }else if($(service).attr('servicetype').includes('print-color')){
                            //Check if there should be a back price
                            if($(service).attr('duplex') == "true"){
                                ppu = currentBreak['Front'] + currentBreak['Back'];
                            }else{
                                ppu = currentBreak['Front'];
                            }
                        }else{
                            ppu = currentBreak['Front'];
                        }
                    }
                });
            }
            $(service).find('[inputeffect=1]').val(ppu.toFixed(2));
            if($(service).find('[inputeffect=2]').attr('exclude') == 'false'){
                if($(service).attr('duplex') == 'false'){
                    $(service).find('[inputeffect=2]').val((parseFloat($(service).attr('quantity')) * parseFloat($(service).find('[inputeffect=1]').val())).toFixed(2));
                }else{
                    $(service).find('[inputeffect=2]').val((Math.floor(parseFloat($(service).attr('quantity')) / 2) * parseFloat($(service).find('[inputeffect=1]').val())).toFixed(2));
                }
            }

            if($(service).find('[inputeffect=2]').val() == 0){
                $(service).find('[inputeffect=2]').val($(service).find('[inputeffect=1]').val());
            }
            perItemTotal += parseFloat($(service).find('[inputeffect=2]').val());
        });
        $(item).closest('.item').find('.per-item-subtotal').val(perItemTotal.toFixed(2));
        itemTotal = perItemTotal * itemMult;
        $(item).closest('.item').find('.item-subtotal').val(itemTotal.toFixed(2));
        perItemTotal = 0;
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
            quantity += 1;
        }
        
    });
    return quantity;
}