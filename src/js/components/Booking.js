import { templates, select, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
class Booking{
    constructor(element){
        const thisBooking = this;
        thisBooking.selectedTables = null;
        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
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
        bookings:           settings.db.url + '/' + settings.db.bookings
                                           + '?' + params.bookings.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.event
                                           + '?' + params.eventsCurrent.join('&'),
            eventsRepeat:  settings.db.url + '/' + settings.db.event
                                           + '?' + params.eventsRepeat.join('&'),
        };
        //console.log('getData urls', urls);

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
    
        console.log('thisBooking.booked', thisBooking.booked);
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
          thisBooking.dom.form.addEventListener('submit', function (event) {
            event.preventDefault();
            thisBooking.sendBooking();
            for(let table of thisBooking.dom.tables){
              table.classList.remove(classNames.booking.tableSelected);
            }
          });
        }
      
        initTables(event){
          const thisBooking = this;
      
          const clickedElement = event.target;
      
            // Check that clickedElement contains class 'booked'
           if(clickedElement.classList.contains(classNames.booking.table)){
            // get Id of the table
           const tableId = clickedElement.getAttribute(settings.booking.tableIdAttribute);
           // check if there any tables already selected at selectedTables and contains 'selected' class
      
            if(thisBooking.selectedTables != 0 && clickedElement.classList.contains(classNames.booking.tableSelected)){
              clickedElement.classList.remove(classNames.booking.tableBooked);
              thisBooking.selectedTables = 0;
            }
            // if table is booked return alert
            else if (clickedElement.classList.contains(classNames.booking.tableBooked)){
            alert('This table is already booked');
            } 
            // Check if the table is already selected
            else if (clickedElement.classList.contains(classNames.booking.tableSelected)){
            // If the table is already selected, remove the "selected" class
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
             /* Method to reset selected table after update at date/hour/hours amount/people amount */
              resetSelectedTables() {
             // Select all tables with class 'selected'
             const selectedTables = document.querySelectorAll(select.booking.selected);
              selectedTables.forEach(table => {
               // Remove class 'selected' from every table'
               table.classList.remove(classNames.booking.tableSelected);
               });
            }
            sendBooking(){
              const thisBooking = this;
          
              // Connecting to app.json bookings {} object
              const url = settings.db.url + '/' + settings.db.bookings;
          
              // Creating const which sets parameteters which will be send as order
              const payload = {
                date: thisBooking.date,
                hour: thisBooking.hourPicker.value,
                table: parseInt(thisBooking.selectedTable),
                duration: parseInt(thisBooking.dom.hours.value),
                ppl: parseInt(thisBooking.dom.ppl.value),
                phone: thisBooking.dom.phone.value,
                address: thisBooking.dom.address.value,
                starters: [],
              };
          
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
                });
            }

}
export default Booking;