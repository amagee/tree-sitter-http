const NL = token.immediate(/[\r\n]+/);

module.exports = grammar({
    name: "http",

    word: ($) => $.identifier,
    extras: ($) => [NL],

    rules: {
        document: ($) =>
            repeat(
                choice(
                    $.variable,
                    $.script_variable,
                    $.variable_declaration,
                    $.comment,
                    $.request,
                ),
            ),

        comment: (_) => token(seq("#", /.*/)),

        // LIST http verb is arbitrary and required to use vaultproject
        method: ($) =>
            choice(
                /(OPTIONS|GET|HEAD|POST|PUT|DELETE|TRACE|CONNECT|PATCH|LIST)/,
                $.const_spec,
            ),

        host: ($) => seq($.identifier, optional($.port)),
        port: ($) => seq(":", /\d+/),
        path: ($) =>
            repeat1(
                choice(
                    "/",
                    seq("/", $.identifier, optional("/")),
                    $.variable,
                ),
            ),
        scheme: (_) =>
            choice(
                "about",
                "acct",
                "arcp",
                "cap",
                "cid",
                "coap+tcp",
                "coap+ws",
                "coaps+tcp",
                "coaps+ws",
                "data",
                "dns",
                "example",
                "file",
                "ftp",
                "geo",
                "h323",
                "http",
                "https",
                "im",
                "info",
                "ipp",
                "mailto",
                "mid",
                "ni",
                "nih",
                "payto",
                "pkcs11",
                "pres",
                "reload",
                "secret-token",
                "session",
                "sms",
                "tag",
                "telnet",
                "urn",
                "ws",
                "wss",
            ),

        authority: ($) => seq(optional($.pair), "@"),
        http_version: (_) => seq("HTTP/", /[\d\.]+/),

        target_url: ($) => prec(2,
            choice(
                seq($.path, repeat($.query_param)),
                seq(
                    optional(seq($.scheme, "://")),
                    optional($.authority),
                    $.host,
                    optional($.path),
                    optional(
                        seq("?", repeat1($.query_param)),
                    ),
                ),
                seq(
                    $.variable,
                    optional($.authority),
                    optional($.path),
                    optional(
                        seq("?", repeat1($.query_param)),
                    ),
                ),
            ),
        ),

        request: ($) =>
            prec.right(
                seq(
                    $.method,
                    $._whitespace,
                    $.target_url,
                    optional(seq($._whitespace, $.http_version)),
                    NL,
                    repeat($.header),
                    repeat(
                        choice(
                            $.form_data,
                            $.external_body,
                            $.xml_body,
                            $.json_body,
                            $.graphql_body,
                            $.params_body,
                        ),
                    ),
                ),
            ),

        pair: ($) =>
            seq(field("name", $.identifier), ":", field("value", $.identifier)),

        query_param: ($) =>
            prec.right(
                seq(
                    optional("&"),
                    field("key", alias($.identifier, $.key)),
                    "=",
                    field("value", alias($.param, $.value)),
                ),
            ),

        host_url: ($) =>
            seq(
                optional(seq($.scheme, "://")),
                optional($.authority),
                $.host,
            ),

        header: ($) =>
            choice(
                prec.left(seq(
                    field("name", alias($.identifier, $.name)),
                    ":",
                    optional($._whitespace),
                    field("value", $.variable),
                )),
                seq(
                    field("name", alias($.identifier, $.name)),
                    ":",
                    optional($._whitespace),
                    field("value", alias(choice(
                        /[a-zA-Z0-9_\-\/\s]+\n/,
                        $.host_url
                    ), $.value)),
                ),
                seq(
                    field("name", alias($.identifier, $.name)),
                    ":",
                    optional($._whitespace),
                    field("value", alias(seq(
                        /[a-zA-Z0-9_\-\/]+/,
                        $._whitespace,
                        $.variable,
                    ), $.value)),
                ),
            ),

        // {{foo}} {{$bar}} {{ fizzbuzz }}
        variable: ($) => seq(
            "{{",
            optional($._whitespace),
            field("name", $.identifier),
            optional($._whitespace),
            "}}"
        ),

        script_variable: ($) =>
            seq(token(/--\{%\n/), repeat1($._line), token(/--%\}\n/)),

        variable_declaration: ($) =>
            seq(
                "@",
                field("name", $.identifier),
                seq(
                    optional($._whitespace),
                    "=",
                    optional($._whitespace),
                    field("value", choice($.number, $.boolean, $.string)),
                ),
            ),

        // the final optional is for improving readability just in case
        xml_body: ($) =>
            seq(
                /<\?xml.*\?>/,
                NL,
                repeat1($._line),
                /<\/.*>\n/,
                optional(/\n/),
            ),

        // the final optional is for improving readability just in case
        json_body: ($) => seq(choice(/\{\n/, /\[\n/), repeat1($._line), choice(/\}\n/, /\]\n/), optional(/\n/)),

        // the final optional is for improving readability just in case
        params_body: ($) =>
            seq(
              "params[",
              repeat1($._line),
              /]\n/,
              optional(/\n/),
            ),


        graphql_body: ($) =>
            seq(
                "query",
                $._whitespace,
                "(",
                repeat1($._line),
                /\}\n/,
                optional(/\n/),
            ),

        // the final optional is for improving readability just in case
        external_body: ($) =>
            seq(
                "<",
                optional(seq("@", $.identifier)),
                $._whitespace,
                field("file_path", alias($._line, $.path)),
                optional(/\n/),
            ),

        // the final optional is for improving readability just in case
        form_data: ($) => seq(
            seq(
                field("name", $.identifier),
                "=",
                field("value", alias(choice($.string, $.identifier, $.number, $.boolean), $.value)),
            ),
            repeat(seq(
                choice(repeat1(/\n/), "&"),
                seq(
                    field("name", $.identifier),
                    "=",
                    field("value", alias(choice($.string, $.identifier, $.number, $.boolean), $.value)),
                ),
            )),
        ),

        const_spec: (_) => /[A-Z][A-Z\\d_]+/,
        identifier: (_) => /[A-Za-z_.\$\d\u00A1-\uFFFF-]+/,
        param: (_) => /[A-Za-z_.\$\d\u00A1-\uFFFF-\t\v% ]+/,
        number: (_) => /[0-9]+/,
        string: (_) => /"[^"]*"/,
        boolean: (_) => choice("true", "false"),
        _whitespace: (_) => repeat1(/[\t\v ]/),
        _newline: (_) => repeat1(/[\n]/),
        _line: (_) => /[^\n]+/,
    },
});
