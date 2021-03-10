console.log("index.js loaded");

$.when($.ready)
.then((() => {
    // state and appManifest constants are templated in the pug file so the server can set them

    $("#github-app-form").attr("action",
        // @ts-ignore
        `https://github.com/settings/apps/new?state=${state}`
    );

    // @ts-ignore
    $("#github-manifest-data").val(JSON.stringify(appManifest));
}));

$("#github-app-form").on("click", (e) => {
    $("body").css("cursor", "progress");
});
