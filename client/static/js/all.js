console.log("all.js loaded");

$.when($.ready)
    .then((() => {
        $(".navbar-nav")
            .attr("data-placement", "bottom");

        $("[title]")
        // .attr('data-placement', 'top')
            // @ts-ignore
            .tooltip();
    }));
