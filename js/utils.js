/*global d3*/
var Utils = {
    numberFormat: d3.format("1,.2r"),
    smooth: function (sel) {
        'use strict';
        return sel.transition().duration(500).ease("easeInOutCubic");
    },
    fieldSort: function (field, desc) {
        'use strict';
        if (desc) {
            return function (a, b) {
                if (a[field] < b[field]) {
                    return 1;
                }
                if (a[field] > b[field]) {
                    return -1;
                }
                return 0;
            };
        }
        return function (a, b) {
            if (a[field] > b[field]) {
                return 1;
            }
            if (a[field] < b[field]) {
                return -1;
            }
            return 0;
        };
    },
    onlyUnique: function (value, index, self) {
        'use strict';
        return self.indexOf(value) === index;
    }
};

(function () {
    'use strict';
    var i;
    if (!Array.prototype.findIndex) {
        Array.prototype.findIndex = function (predicate) {
            if (this === null) {
                throw new TypeError('Array.prototype.findIndex called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = this,
                length = list.length,
                value;
            
            for (i = 0; i < length; i += 1) {
                value = list[i];
                if (predicate.call(this, value, i, list)) {
                    return i;
                }
            }
            return -1;
        };
    }
    
    if (!Array.prototype.find) {
        Array.prototype.find = function (predicate) {
            if (this === null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = this,
                length = list.length,
                value,
                i;

            for (i = 0; i < length; i += 1) {
                value = list[i];
                if (predicate.call(this, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        };
    }
}());


