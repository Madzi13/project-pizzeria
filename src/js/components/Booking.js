import { templates, select, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
class Booking{
    constructor(element){
        const thisBooking = this;
        thisBooking.selectedTables = null;
        thisBooking.starters = [];
        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
        thisBooking.initTables();
    }

    getData(){
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

        const params = {
            bookings: [
                startDateParam,
                endDateParam,
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam,
            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam,
            ],
        };

        //console.log('getData params', params);

        const urls = {
          booking:        settings.db.url + '/' +
                          settings.db.bookings + '?' + 
                          params.booking.join('&'),
          eventsCurrent: settings.db.url + '/' + 
                         settings.db.events + '?' + 
                         params.eventsCurrent.join('&'),
          eventsRepeat:  settings.db.url + '/' + 
                         settings.db.events + '?' + 
                        params.eventsRepeat.join('&'),
        };

        Promise.all([
            fetch(urls.bookings),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ])
            .then(function(allResponses){
                const bookingsResponse = allResponses[0];
                const eventsCurrentResponse = allResponses[1];
                const eventsRepeatResponse = allResponses[2];
                
                return Promise.all([
                    bookingsResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ]);
            })
            .then(function([bookings, eventsCurrent, eventsRepeat]){
              //  console.log(bookings);
              //  console.log(eventsCurrent);
              //  console.log(eventsRepeat);
            thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
            });
    }

    parseData(bookings, eventsCurrent, eventsRepeat){
        const thisBooking = this;
    
        thisBooking.booked = {};
    
        for(let item of bookings){
          thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }
    
        for(let item of eventsCurrent){
          thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }
    
        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;
    
        for(let item of eventsRepeat){
          if(item.repeat == 'daily'){
            for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
              thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
            }
          }
        }
    
        thisBooking.updateDOM();
      }
    
      makeBooked(date, hour, duration, table){
        const thisBooking = this;
    
        if(typeof thisBooking.booked[date] == 'undefined'){
          thisBooking.booked[date] = {};
        }
    
        const startHour = utils.hourToNumber(hour);
    
        for(let hourBlock = startHour; hourBlock < startHour + duration ; hourBlock += 0.5){
          //console.log('loop', hourBlock);
          if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
            thisBooking.booked[date][hourBlock] = [];
          }
    
          // thisBooking.booked - object , where we finding date with key "hour" and add table to this
          thisBooking.booked[date][hourBlock].push(table);
        }
      }
    
      updateDOM(){
        const thisBooking = this;
    
        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);
    
        let allAvailable = false;
    
        if(
          typeof thisBooking.booked[thisBooking.date] == 'undefined'
          ||
          typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ){
          allAvailable = true;
        }
    
        for(let table of thisBooking.dom.tables){
          let tableId = table.getAttribute(settings.booking.tableIdAttribute);
    
          //check is tableId is number
          if(!isNaN(tableId)){
            tableId = parseInt(tableId);
          }
    
          if(
            // is this table is available
            !allAvailable
            &&
            thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
          ){
            table.classList.add(classNames.booking.tableBooked);
          } else {
            table.classList.remove(classNames.booking.tableBooked);
          }
        }
      }
    render(element){
        const thisBooking = this;
        const generatedHTML = templates.bookingWidget();
        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;
        thisBooking.dom.peopleAmount = element.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = element.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePicker = element.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = element.querySelector(select.widgets.hourPicker.wrapper);
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
        thisBooking.dom.floorPlan = thisBooking.dom.wrapper.querySelector(select.booking.floorPlan);
        thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
        thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
        thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
        thisBooking.dom.ppl = thisBooking.dom.wrapper.querySelector(select.booking.ppl);
        thisBooking.dom.hours = thisBooking.dom.wrapper.querySelector(select.booking.hours);
        thisBooking.dom.starters = thisBooking.dom.wrapper.querySelector(select.booking.starters);
        thisBooking.dom.orderButton = thisBooking.dom.wrapper.querySelector(select.booking.orderButton);
    }
    initWidgets(){
        const thisBooking = this;

        thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.datePickerWidget = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.hourPickerWidget = new HourPicker(thisBooking.dom.hourPicker);   

        thisBooking.dom.peopleAmount.addEventListener('updated', function(){
          thisBooking.resetSelectedTables();
          });

        thisBooking.dom.hoursAmount.addEventListener('updated', function(){
          thisBooking.resetSelectedTables();
          });

          thisBooking.dom.datePicker.addEventListener('updated', function(){
            thisBooking.resetSelectedTables();
        });

        thisBooking.dom.hourPicker.addEventListener('updated', function(){
          thisBooking.resetSelectedTables();

        });

          thisBooking.dom.wrapper.addEventListener('updated', function(){
          thisBooking.updateDOM();
          });

          thisBooking.dom.floorPlan.addEventListener('click', function(event){
            thisBooking.initTables(event);
          });

          thisBooking.dom.starters.addEventListener('click', function(event){

            const clickedElement = event.target;
      
            const tagName = clickedElement.tagName;
            const type = clickedElement.getAttribute('type');
            const name = clickedElement.getAttribute('name');
      
            if(tagName == 'INPUT' && type == 'checkbox' && name == 'starter'){
              console.log('click');
              if(clickedElement.checked) {
                thisBooking.starters.push(clickedElement.value);
                console.log(clickedElement.value);
              } else {
                const starterNumber = thisBooking.starters.indexOf(clickedElement.value);
                thisBooking.starters.splice(starterNumber, 1);
              }
            }
            console.log(thisBooking.starters);
          });

          thisBooking.dom.form.addEventListener('submit', function (event) {
            event.preventDefault();

            thisBooking.sendBooking();
            for(let table of thisBooking.dom.tables){
              table.classList.remove(classNames.booking.tableSelected);
            }
            thisBooking.dom.form.reset();
          });
        }
      
        initTables(event){
          const thisBooking = this;
      
          const clickedElement = event.target;
      
           if(clickedElement.classList.contains(classNames.booking.table)){
           const tableId = clickedElement.getAttribute(settings.booking.tableIdAttribute);
                
            if(thisBooking.selectedTables != 0 && clickedElement.classList.contains(classNames.booking.tableSelected)){
              clickedElement.classList.remove(classNames.booking.tableBooked);
              thisBooking.selectedTables = 0;
            }
            
            else if (clickedElement.classList.contains(classNames.booking.tableBooked)){
            alert('This table is already booked');
            } 
           
            else if (clickedElement.classList.contains(classNames.booking.tableSelected)){
              clickedElement.classList.remove(classNames.booking.tableSelected);
            }

            else {
              for(let table of thisBooking.dom.tables){
                if(table.classList.contains(classNames.booking.tableSelected)){

                  table.classList.remove(classNames.booking.tableSelected);
                }
              }
              clickedElement.classList.add(classNames.booking.tableSelected);
              thisBooking.selectedTable = tableId;
              console.log('thisBooking.selectedTable',thisBooking.selectedTable);
            }
          }
        }
           
            resetSelectedTables() {
             
             const selectedTables = document.querySelectorAll(select.booking.selected);
              selectedTables.forEach(table => {
               
                table.classList.remove(classNames.booking.tableSelected);
              });
            }

            sendBooking(){
              const thisBooking = this;
          
              const url = settings.db.url + '/' + settings.db.bookings;
          
              const payload = {};
              payload.date = thisBooking.date;
              payload.hour = thisBooking.hourPicker.value;
              payload.table = parseInt(thisBooking.selectedTable);
              payload.duration = parseInt(thisBooking.dom.hours.value);
              payload.ppl = parseInt(thisBooking.dom.ppl.value);
              payload.phone = thisBooking.dom.phone.value;
              payload.address = thisBooking.dom.address.value;
              payload.starters = thisBooking.starters,
          
              thisBooking.makeBooked(
                payload.date,
                payload.hour,
                payload.duration,
                payload.table
              );
          
              const options = {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
              };
              fetch(url, options)
                .then(function(response){
                  return response.json();
                }).then(function(parsedResponse){
                  console.log('parsedResponse: ', parsedResponse);

                  thisBooking.getData();

                const popup = document.getElementById(select.booking.popup);
                popup.style.display = 'block';
                setTimeout(function(){
                 popup.style.display = 'none';
                }, 3000);
              });
            }
}
export default Booking;