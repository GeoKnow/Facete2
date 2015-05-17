var ContextMenuUtils = {

    /**
     * Process options and update the scope object
     *
     * TODO Possibly separate validation
     * @param options
     * @param scope
     */
    initScope: function(options, scope) {
        scope.doClick = function(itemScope) {
            if(itemScope.callback) {
                itemScope.callback(itemScope);
            }
        };

        if(!options) {
            throw new Error('Context menu options have not been set, is: ' + options);
        }

        if(typeof(options) === 'function') {
            options = options(scope);
        }

        if (options instanceof Array) {
            scope.items = options;
        } else {
            throw new Error('"' + options + '" not an array');
        }
    },

    renderContextMenu: function(fetchContentFn, event) {
        if (!$) { var $ = angular.element; }
        $(event.target).addClass('context');

        var $overlay = $('<div>');
        $overlay.addClass('dropdown clearfix');
        $overlay.css({
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 9999
        });

        return fetchContentFn()
            .then(function($content) {

                $content.css({
                    display: 'block',
                    position: 'absolute',
                    left: event.pageX + 'px',
                    top: event.pageY + 'px'
                });
                $overlay.append($content);

                var $body = $(document).find('body');
                $body.append($overlay);

                $overlay
                    .on("click", function (e) {
                        $(event.target).removeClass('context');
                        $overlay.remove();
                    })
                    .on('contextmenu', function (event) {
                        $(event.target).removeClass('context');
                        event.preventDefault();
                        $overlay.remove();
                    });

                return $overlay;
            }, function (err) {
                console.log('Cannot load template: ' + contentUrl);
            });
    }
};



angular.module('Facete2')

.factory('ngContextMenuFactory', ['$compile', '$templateCache', '$http', function($compile, $templateCache, $http) {
    var createContentPromise = function(options) {
        var r;
        if(options == null) {
            throw new Error('No options provided');
        }
        else if(options instanceof Array) {
            var contentUrl = 'directives/ng-context-menu.html';
            r = $http.get(contentUrl, {cache: $templateCache}).then(function(x) {
                return x.data;
            });
        }
        else if(options.template)
            r = $q.when(options.template);
        else if(options.templateUrl) {
            r = $http.get(options.templateUrl, {cache: $templateCache});
        } else {
            throw new Error('No content for context menu provided');
        }
        return r;
    };

    var fetchContent = function(options, scope) {
        return createContentPromise(options).then(function(contentStr) {
            var r = $compile(contentStr)(scope);
            return r;
        });
    };

    var createFetchContentFn = function(options, scope) {
        return function() {
            return fetchContent(options, scope);
        };
    };

    return function(options, scope, event) {
        if(typeof(options) === 'function') {
            options = options(scope);
        }

        ContextMenuUtils.initScope(options, scope);
        var fetchContentFn = createFetchContentFn(options, scope);
        ContextMenuUtils.renderContextMenu(fetchContentFn, event);
    };
}])

.directive('ngContextMenu', ['ngContextMenuFactory', function(ngContextMenuFactory) {

//    var renderContextMenu = function(fetchContentFn, event) {
//        renderContextMenu(fetchContentFn), event.target, event.pageX, event.pageY
//    }

    return {
        restrict: 'EA',
        //scope: true,
        compile: function() {
            return {
                pre: function (scope, element, attrs) {

                    var showContextMenu = function(event) {
                        scope.$apply(function () {
                            event.preventDefault();

                            var options = scope.$eval(attrs.ngContextMenu);
                            //ContextMenuUtils.initScope(options, scope);
                            ngContextMenuFactory(options, scope, event);
                        });
                    };


                    element.on('click', showContextMenu);
                }
            };
        }
    };
}])

;
