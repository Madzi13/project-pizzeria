/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', 
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };
  
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, 
    cart: {
      defaultDeliveryFee: 20,
    },
  };
  
  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),

    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  
  };

  class Product {
    constructor(id, data){
      const thisProduct = this;
  
      thisProduct.id = id;
      thisProduct.data = data;
       
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
       
      // console.log('new Product:', thisProduct); 
    }
  
   
    renderInMenu() {
      const thisProduct = this;
        
      /* generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);
      console.log('generated HTML', generatedHTML);
  
      /* create element using utils.createElementFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
  
      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);
  
      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);
    }

    getElements(){
      const thisProduct = this;
    
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }
    
    initAccordion(){
      const thisProduct = this;

      /* START: add event listener to clickable trigger on event click */
      thisProduct.accordionTrigger.addEventListener('click', function(event) {      
       
        /* prevent default action for event */
        event.preventDefault();

        /* find active product (product that has active class) */
        const activeProduct = document.querySelector(select.all.menuProductsActive);

        /* if there is active product and it's not thisProduct.element, remove class active from it */
        if(activeProduct !== null && activeProduct !== thisProduct.element){
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
        /* toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }

    initOrderForm(){
      const thisProduct = this;
       // console.log(thisProduct); 

      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      
      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      
      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    processOrder() {
      const thisProduct = this;
    
      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);
       // console.log('formData', formData); 
    
      // set price to default price
      let price = thisProduct.data.price;
    
      // for every category (param)...
      for(let paramId in thisProduct.data.params) {        
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        // console.log(paramId, param);
    
        // for every option in this category
        for(let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          // console.log(optionId, option); 
         // check if there is param with a name of paramId in formData and if it includes optionId
         if(formData[paramId] && formData[paramId].includes(optionId)) {
          if(!option.default) {
          // check if the option is not default
          price += option.price;
        }
          }else {
           // check if the option is default
           if(option.default) {
            // reduce price variable
            price -= option.price;
          }
        }
        const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        if(optionImage) {
          if(optionSelected) {
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          } else {
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
      }
       // multiply price by amount
       price *= thisProduct.amountWidget.value;
       thisProduct.priceSingle = price;
       // update calculated price in the HTML
       thisProduct.priceElem.innerHTML = price;
     } 
     }

    initAmountWidget(){
      const thisProduct = this;
  
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      });
    }
    addToCart(){
      const thisProduct = this;
      app.cart.add(thisProduct.prepareCartProduct);
        }
  
    prepareCartProduct(){
      const thisProduct = this;
  
      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        priceSingle: thisProduct.priceSingle,
        price: thisProduct.priceSingle * thisProduct.amountWidget.value,
        params: thisProduct.prepareCartProductParams(),
      };
      return (productSummary);
    }  
    prepareCartProductParams() {
      const thisProduct = this;
  
      const formData = utils.serializeFormToObject(thisProduct.form);
      const params = {};
  
      // for very category (param)
      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
  
        // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
        params[paramId] = {
          label: param.label,
          options: {}
        }
  
        // for every option in this category
        for(let optionId in param.options) {
          const option = param.options[optionId];
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
  
          if(optionSelected) {
            // option is selected!
            params[paramId].options[optionId] = option.label;
          }
        }
      }
  
      return params;
    }
  }
  class AmountWidget {
    constructor(element) {
      const thisWidget = this;

      thisWidget.getElements(element);
      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.initActions();
    }
    // console.log('AmountWidget:', thisWidget);
    // console.log('constructor arguments:', element);
  

    getElements(element){
      const thisWidget = this;
  
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }
  
    setValue(value){
      const thisWidget = this;
  
      const newValue = parseInt(value);
  
      /*TODO: Add validation*/
      if(thisWidget.value !== newValue && !isNaN(newValue)) {
        if(newValue <= settings.amountWidget.defaultMax +1) {
          if(newValue >= settings.amountWidget.defaultMin -1) {
            thisWidget.value = newValue;
          }
        }
      }
  
      thisWidget.input.value = thisWidget.value;
      thisWidget.announce();
    }

    announce(){
      const thisWidget = this;
      const event = new Event('updated');
      thisWidget.element.dispatchEvent(event);
    }

    initActions(){
      const thisWidget = this;
      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }

    addToCart(){
      const thisProduct = this;
      app.cart.add(thisProduct.prepareCartProduct);    
    }
  }

    class Cart{
      constructor(element) {
        const thisCart = this;

        thisCart.products = [];
        thisCart.getElements(element);
        thisCart.initActions();

        // console.log('new Cart', thisCart);
      }

      getElements(element){
        const thisCart = this;

        thisCart.dom = {};

        thisCart.dom.wrapper = element;
        thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
        thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      }

      initActions(){
        const thisCart = this;
        thisCart.dom.toggleTrigger.addEventListener('click', function(event){
          event.preventDefault();
          thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
        });
      }
      add(menuProduct){
        const thisCart = this;
      //  thisCart.products.push(menuProduct);
        /*generate HTML based on template*/

    const generatedHTML = templates.cartProduct(menuProduct);

    /*create element using utils.createElementFromHTML*/

    const generatedDOM = utils.createDOMFromHTML(generatedHTML);

    /*add element */

    thisCart.dom.productList.appendChild(generatedDOM);
      }
    }
    
    const app = {
      initMenu: function(){
       const thisApp = this;
        // console.log('thisApp.data:', thisApp.data);

        for (let productData in thisApp.data.products) {
         new Product(productData, thisApp.data.products[productData]);
        }
      },
      initData: function(){
        const thisApp = this;
    
        thisApp.data = dataSource;
      },
      
      initCart(){
        const thisApp = this;
  
        const cartElem = document.querySelector(select.containerOf.cart);
        thisApp.cart = new Cart(cartElem);
      },

      init: function(){
        const thisApp = this;
        //console.log('*** App starting ***');
        //console.log('thisApp:', thisApp);
        //console.log('classNames:', classNames);
        //console.log('settings:', settings);
        //console.log('templates:', templates);
  
      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },
  };
   
  app.init(); 
}