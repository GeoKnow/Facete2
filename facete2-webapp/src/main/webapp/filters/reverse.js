angular.module('Facete2')

.filter('reverse', function() {
    return function(items) {
        return items.slice().reverse();
    };
})

;
