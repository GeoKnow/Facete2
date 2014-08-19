angular.module('Facete2')

.directive('ngContextMenu', function ($parse) {
    var renderContextMenu = function ($scope, event, options) {
        if (!$) { var $ = angular.element; }
        $(event.target).addClass('context');
        var $contextMenu = $('<div>');
        $contextMenu.addClass('dropdown clearfix');
        var $ul = $('<ul>');
        $ul.addClass('dropdown-menu');
        $ul.attr({ 'role': 'menu' });
        $ul.css({
            display: 'block',
            position: 'absolute',
            left: event.pageX + 'px',
            top: event.pageY + 'px'
        });
        angular.forEach(options, function (item, i) {
            var $li = $('<li>');
            if (item === null) {
                $li.addClass('divider');
            } else {
                $a = $('<a>');
                $a.attr({ tabindex: '-1', href: '#' });

                if(item.linkAttrs) {
                    $a.attr(item.linkAttrs);
                }


                $a.text(item.text);
                $li.append($a);
                $li.on('click', function () {
                    $scope.$apply(function() {
                        if(item.callback) {
                            item.callback.call($scope, $scope);
                        }
                    });
                });
            }
            $ul.append($li);
        });
        $contextMenu.append($ul);
        $contextMenu.css({
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 9999
        });
        $(document).find('body').append($contextMenu);

        $contextMenu
            .on("click", function (e) {
                $(event.target).removeClass('context');
                $contextMenu.remove();
            })
            .on('contextmenu', function (event) {
                $(event.target).removeClass('context');
                event.preventDefault();
                $contextMenu.remove();
            });
    };

    return {
        restrict: 'EA',
        //scope: true,
        compile: function() {
            return {
                pre: function ($scope, element, attrs) {
                    //element.on('contextmenu', function (event) {
                    element.on('click', function (event) {
                        $scope.$apply(function () {
                            event.preventDefault();
                            var options = $scope.$eval(attrs.ngContextMenu);
                            if(!options) {
                                throw 'Context menu options have not been set, is: ' + options;
                            }

                            if(typeof(options) === 'function') {
                                options = options($scope);
                            }

                            if (options instanceof Array) {
                                renderContextMenu($scope, event, options);
                            } else {
                                throw '"' + attrs.ngContextMenu + '" not an array';
                            }
                        });
                    })
                }
            };
        }
    };
})

;
