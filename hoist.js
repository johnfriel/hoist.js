( function() {
  'use strict';

  // Minimal bind / trigger event implementation, inspired by Backbone.Events
  var EventHandling = {
    bind: function(eventname, callback) {
      var callbackTable = this._callbacks || (this._callbacks = {});
      var callbacks = this._callbacks[eventname] || (this._callbacks[eventname] = []);
      callbacks.push(callback);
      return this;
    },
    trigger: function(eventname) {
      var callbacks, callbackTable, i, l;
      
      callbackTable = this._callbacks;
      
      if (!callbackTable) return this;
      
      if (callbacks = callbackTable[eventname]) {
        for (i = 0, l = callbacks.length; i < l; i++) {
          callbacks[i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
      }
      return this;
    },
    addEvents: function(obj) {
      obj.prototype.trigger = this.trigger;
      obj.prototype.bind    = this.bind;
    }
  }


  // Virtual Elements
  function VirtualElement (options) { this.initialize(options) };
  
  EventHandling.addEvents(VirtualElement);
  
  VirtualElement.prototype.initialize = function(options) {
    this.state = 'initial';
    this.data  = options.data;
    
    if (options.url) {
      this.url = options.url;
    } else {
      this.url = options.data.url;
    }

    this.hoister  = options.hoister;

    this.bind('load',      this.handleLoad)
    this.bind('loadError', this.handleLoadError)
  }
  
  VirtualElement.prototype.handleLoad = function() {
    this.hoister.trigger('virtElLoaded', this)
  };
  
  VirtualElement.prototype.handleLoadError = function() {
    this.hoister.trigger('virtElImgNotFound', this)
  };
  // End Virtual Elements
  
  
  // Begin Hoist
  function Hoist (options) { this.initialize(options) };
  
  EventHandling.addEvents(Hoist);

  Hoist.prototype.initialize = function (options) {
    this.state              = 'initial';

    // Get urls if they weren't passed in
    if (options.urls) {
      this.urls = options.urls;
    } else if (options.url_path) {
      this.url_path = options.url_path;

      // XMLHttpRequest isn't supported by IE 5 & 6
      var xhr = new XMLHttpRequest();

      xhr.open('GET', this.url_path, false);
      xhr.send();
      
      this.urlResp = JSON.parse(xhr.response);
    
      if (this.urlResp[0] === 'string') {
        this.urls = this.urlResp;
      } else {
        this.srcObjs = this.urlResp;
      } 

    } else {
      throw "Must initialize with either urls or url_path"
    }
    
    this.standardChunkSize  = options.chunkSize || 4;
    this.container          = options.container || document.getElementById('container');
    this.append             = options.append    || this.defaultAppend;
    this.virtualElements    = [];
    this.virtElIndex        = 0;

    this.bind('virtElLoaded', this.elementLoaded)
    this.bind('virtElImgNotFound', this.elementLoaded)
    
    // create virtual elemets
    for (var i = 0; i < this.urlResp.length; i++) { 
      var virtEl, el;

      if (typeof this.urlResp[i] === 'string') {
        virtEl = new VirtualElement({
          url:      this.urlResp[i],
          hoister:  this
        });
      
      } else {
        virtEl = new VirtualElement({
          data:     this.urlResp[i],
          hoister:  this
        });
      }

      this.virtualElements.push(virtEl);
    }
    
    this.state = 'ready';
  };
  
  Hoist.prototype.elementLoaded = function() {
    this.loadedCount += 1;
    this.maybeAppend();
  }
  
  Hoist.prototype.maybeAppend = function() {
    // only execute if everything we're going to load has loaded
    if (this.loadedCount === this.chunkSize) {
      
      for (var i = 0; i < this.chunkSize; i++) {
        var virtEl = this.virtualElements[this.virtElIndex + i];
        this.append(virtEl);
      }
      
      this.virtElIndex = this.virtElIndex + this.chunkSize;
      this.state = 'ready';
      this.next();

    } 
  };

  Hoist.prototype.defaultAppend = function(virtEl) {
    this.container.appendChild(virtEl.image);
  }
  
  Hoist.prototype.next = function() {
    if (this.state !== 'ready') {
      return false
    }

    if (this.virtElIndex === this.virtualElements.length) {
      return false
    } 
    if (this.virtElIndex + this.standardChunkSize > this.virtualElements.length) {
      // For the case where, e.g., the standard chunk size is 4 but there are only 3 left to fetch
      this.chunkSize = this.virtualElements.length - this.virtElIndex;
    } else {
      this.chunkSize = this.standardChunkSize;
    }
    
    this.state = 'loading chunk';
    this.loadedCount = 0;

    for (var i = 0; i < this.chunkSize; i++) {

      var virtEl = this.virtualElements[this.virtElIndex + i];
     
      if (virtEl.url) {
        virtEl.image = new Image();
        
        virtEl.image.onload = function() {
          virtEl.imgHeight = virtEl.image.height;
          virtEl.imgWidth  = virtEl.image.width;
          virtEl.trigger('load');
        }
        virtEl.image.onerror = function() {
          virtEl.trigger('loadError');
        }
        
        virtEl.image.src = virtEl.url;
      } else {
        // virtual element doesn't have an associated image to load
        virtEl.trigger('load');
      }
    }
  };
    
  Hoist.prototype.launch = function() {
    this.next();

    return true;
  };

  window.Hoist = Hoist;

  return Hoist;
})();
