import React from "react";

function layout({ children }: { children: React.ReactNode }): JSX.Element {
    return (
        <html>
            <head>
                <title>OSAC</title>
                <link rel="icon" href="/favicon.png" />
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css"
                    integrity="sha384-B0vP5xmATw1+K9KRQjQERJvTumQW0nPEzvF6L/Z6nronJ3oUOFUFpCjEUQouq2+l"
                    crossOrigin="anonymous"
                />
                <link rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.2/css/all.min.css"
                    integrity="sha512-HK5fgLBL+xu6dm/Ii3z4xhlSUyZgTT9tuc/hSrtw6uzJOvgRr2a9jyxxT1ely+B+xFAmJKVSTbpM/CuL7qxO8w=="
                    crossOrigin="anonymous"
                />

                <link rel="stylesheet" href="/css/index.css"/>
                <link rel="stylesheet" href="/css/colors.css"/>
            </head>
            <body>
                <div id="wrapper" className="d-flex w-100 justify-content-center">
                    <main>
                        {children}
                    </main>
                </div>
                <script
                    src="https://code.jquery.com/jquery-3.6.0.min.js"
                    integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4="
                    crossOrigin="anonymous">
                </script>
                <script src="/client.js"/>
            </body>
        </html>
    );
}

export default layout;
