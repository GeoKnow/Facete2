angular.module('Facete2')

.directive('dynAttrs', [function() {
    return {
        priority: 500,
        //terminal: true,
        scope: {
            'dynAttrs': '='
        },
        link: function(scope, elem, attrs) {
            elem.removeAttr('dynAttrs');

            angular.forEach(scope.dynAttrs, function(val, key) {
                elem.attr(key, val);
            });

            //$compile(elem)(scope);
        }
    };
}])

;
