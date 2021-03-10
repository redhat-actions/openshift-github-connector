console.log("index.js loaded");

$.when($.ready)
    .then((() => {
        // state and appManifest constants are templated in the pug file so the server can set them

        // @ts-ignore
        // eslint-disable-next-line no-undef
        $("#github-app-form").attr("action", `https://github.com/settings/apps/new?state=${state}`);

        // @ts-ignore
        // eslint-disable-next-line no-undef
        $("#github-manifest-data").val(JSON.stringify(appManifest));
    }));

$("#github-app-form").on("click", (_e) => {
    $("body").css("cursor", "progress");
});
