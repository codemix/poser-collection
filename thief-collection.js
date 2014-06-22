/*! collection- v0.0.0 - MIT license */

"use strict";
var c = (function( poser ) {

  var Collection = poser( "Array" );
  var cp = Collection.prototype;

  function isCollection( obj ) {
    return obj instanceof Collection;
  }

  function isFunction( obj ) {
    return typeof obj === "function";
  }

  // Should match Array as well as correctly subtyped classes from any execution context.
  // Perhaps use more robust solution (kindof?)
  function isArrayLike( obj ) {
    return Object.prototype.toString.call( obj ) === "[object Array]";
  }

  function matches( against, obj ) {
    for ( var prop in against ) {
      if ( obj[prop] !== against[prop] ) { 
        return false;
      }
    }
    return true;
  }

  function flip( fn ) {
    return function() {
      return fn.apply( this, cp.slice.call( arguments ).reverse() );
    }
  }

  function partial( fn ) {
    var args = cp.slice.call( arguments, 1 );
    return function() {
       return fn.apply( this, args.concat( cp.slice.call( arguments ) ) );
    };
  }

  function get( prop ) {
    return function( obj ) {
      return obj[prop];
    }
  }

  function not( fn ) {
    return function() {
      return !fn.apply( this, arguments );
    }
  }

  function contains( obj, value ) {
    return cp.indexOf.call( obj, value ) > -1;
  }

  function isTruthy( value ) {
    return !!value;
  }

  function breakableEach( obj, callback ) {
    var result;
    for ( var i = 0; i < obj.length; i++ ) {
      result = callback( obj[i], i, obj );
      if ( result === false ) {
        return result;
      }
    }
    return null;
  }

  // helpers
  var slice = Function.prototype.call.bind( cp.slice );

  // create chainable versions of these native methods
  ["push", "pop", "shift", "unshift"].forEach( function( method ) {
    // new methods will be named cPush, cPop, cShift, cUnshift
    var name = "c" + method.charAt( 0 ).toUpperCase() + method.slice( 1 );
    Array.prototype[name] = function() {
      Array.prototype[method].apply( this, arguments );
      return this;
    };
  });

  // aliases for native methods.
  cp.each = cp.forEach;
  cp.collect = cp.map;
  cp.select = cp.filter;

  cp.forEachRight = function( fn ) {
    this.slice().reverse().each( fn );
  };
  cp.eachRight = cp.forEachRight;

  cp.where = function( obj ) {
    return this.filter( partial( matches, obj ) );
  };

  cp.whereNot = function( obj ) {
    return this.filter( not( partial( matches, obj ) ) );
  };

  cp.find = function( testFn ) {
    var result = null;
    breakableEach( this, function( el, i, arr ) {
      if ( testFn( el, i, arr ) ) {
        result = el;
        return false;
      }
    });
    return result
    // return breakableEach( this,  function( el, i, arr ) {
    //   if ( testFn.apply( null, arguments ) ) return false
    // });
  };

  cp.findNot = function( testFn ) {
    return this.find( not( testFn ) );
  };

  cp.findWhere = function( obj ) {
    return this.find( partial( matches, obj ) );
  };

  cp.findWhereNot = function( obj ) {
    return this.find( not( partial( matches, obj ) ) );
  };

  cp.pluck = function( prop ) {
    return this.map( get( prop ) );
  };

  cp.pick = function() {
    return this.map( function( el ) {
      var obj = {};
      breakableEach( arguments, function( prop ) {
        obj[prop] = el[prop];
      });
      return obj;
    });
  };

  cp.reject = function( testFn ) {
    return this.filter( not( testFn ) );
  };

  cp.invoke = function( fnOrMethod ) {
    var args = slice( arguments, 1 );
    this.forEach( function( el ) {
      ( isFunction( fnOrMethod ) ? fnOrMethod : el[fnOrMethod] ).apply( el, args );
    });
    return this;
  };

  cp.without = function() {
    var args = slice( arguments );
    return this.reject( partial( contains, args ) )
  };
  cp.remove = cp.without;

  cp.contains = function( obj ) {
    return contains( this, obj );
  };

  cp.tap = function( fn ) {
    fn( this );
    return this;
  };

  cp.clone = function() {
    return this.slice();
  };

  // todo
  cp.cloneDeep = function() {

  };

  cp.first = function( num ) {
    if ( num == null ) {
      return this[0];
    }
    return this.slice( 0, num );
  };
  cp.head = cp.first;
  cp.take = cp.first;

  cp.initial = function( num ) {
    if ( num == null ) {
      num = 1;
    }
    return this.slice( 0, this.length - num );
  };

  cp.last = function( num ) {
    if ( num == null ) {
      return this[this.length - 1];
    }
    return this.slice( 0, -1 * num );
  };

  cp.rest = function( num ) {
    if ( num == null ) {
      num = 1;
    }
    return this.slice( num );
  };
  cp.tail = cp.rest;
  cp.drop = cp.rest;

  cp.compact = function() {
    return this.filter( isTruthy );
  };

  // TODO
  // cp.flatten = function() {

  // };

  cp.partition = function( testFn ) {
    var pass = new Collection();
    var fail = new Collection();
    this.each( function( el, i, arr ) {
      ( testFn( el, i, arr ) ? pass : fail ).push( el );
    });
    return factory([ pass, fail ]);
  };

  cp.union = function() {
    var result = new Collection();
    var args = slice( arguments );
    result.push.apply( this );
    args.each( function( argArr ) {
      argArr.forEach( function( item ) {
        if ( !result.contains( item ) ) {
          result.push( item );
        }
      });
    });
    return result;
  };

  cp.intersection = function() { 
    var result = new Collection();
    var args = slice( arguments );
    this.each( function( el ) {
      var has = args.every( function( arr ) {
        return arr.indexOf( el ) > -1;
      });
      if ( has ) {
        result.push( el );
      }
    });
    return result;
  };

  cp.difference = function() {
    var result = new Collection();
    var args = slice( arguments );
    this.each( function( el ) {
      var has = args.some( function( arr ) {
        return arr.indexOf( el ) > -1;
      });
      if ( !has ) {
        result.push( el );
      }
    });
    return result;
  };
  
  cp.unique = function() {
    var found = new Collection();
    this.each( function( el ) {
      if ( !found.contains( el ) ) {
        found.push( el );
      }
    });
    return found;
  };
  cp.uniq = cp.unique;

  // TODO
  // cp.zip = function() {
  // };

  cp.min = function( prop ) {
    if ( prop ) {
      return cp.min.call( this.pluck( prop ) );
    }
    return Math.min.apply( Math, this );
  };

  cp.max = function( prop ) {
    if ( prop ) {
      return cp.max.call( this.pluck( prop ) );
    }
    return Math.max.apply( Math, this );
  };

  cp.toArray = function() {
    return Array.prototype.slice.call( this );
  };

  var factory = function( arr ) {
    if ( arr == null ) {
      arr = [];
    }
    return new Collection().concat( arr );
  };

  // args: ["name", "age", "gender"], [["joe", 30, "male"], ["jane", 35, "female"]] =>
  // return: [{name: "joe", age: 30, gender: "male"}, {name: "jane", age: 35, gender: "female"}];
  function collectifyHeaders( headers, values ) {
    var collection = new Collection();
    var i, j, obj;
    i = 0;
    while ( i < values.length ) {
      obj = {};
      j = 0;
      while ( j < headers.length ) {
        obj[headers[j]] = values[i][j];
        j += 1;
      }
      collection.push( obj );
      i += 1;
    }
    return collection;
  }

  // arg: [["name", "age", "gender"], ["joe", 30, "male"], ["jane", 35, "female"]] =>
  // return: [{name: "joe", age: 30, gender: "male"}, {name: "jane", age: 35, gender: "female"}];
  function collectifyTable( rows, headerIndex ) {
    if ( headerIndex == null ) {
      headerIndex = 0;
    }
    var headers = rows.splice( headerIndex, 1 )[0];
    return collectifyHeaders( headers, rows );
  }

  factory.collectify = function() {
    // should sniff out various types of structured data and return a collection
  };

  factory.ctor = Collection;
  factory.proto = cp;
  factory.isCollection = isCollection;

  return factory;

})( poser );