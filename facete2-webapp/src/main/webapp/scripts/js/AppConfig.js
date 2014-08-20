var AppConfig = {

    storeApiUrl: 'api/store',

    resizableConfig: {
        enabled: {
            handles: 'n, e, ne',
            containment: 'parent',

            create: function(event, ui) {
                jQuery(event.target).on('resize', function (e, ui) {
                    // Prevent the top attribute from getting set
                    jQuery(event.target).css('top', '');
                });
            },

            // Resize might not working properly, if there are parent elements with pointer-events: none involved
            start: function(event, ui) {
                var el = jQuery(event.target);

                this.pointerEventsResets = el.parents().filter(function() {
                    var attrVal = jQuery(this).css('pointer-events');
                    var r = attrVal === 'none';
                    //console.log('resize', this, attrVal, r)
                    return r;
                });

                this.pointerEventsResets.css('pointer-events', 'auto');
            },
            stop: function(event, ui) {
                this.pointerEventsResets.css('pointer-events', 'none');
            }
        },

        disabled: {
            handles: 'none', disabled: true
        },
    },

};

