# HTTP tree-sitter parser

HTTP grammar for [tree-sitter](https://github.com/tree-sitter/tree-sitter)


# How to contribute

You can get a development environment with
`nix develop`
then run:

```
npm install # will install most stuff but ultimately fail
npm run gen # will create the stuff for npm install to then succeed
npm install # now this will work
```

If running `make build` you get `make: 'build' is up to date`, try
`make build -B`.

To copy the built parser to be picked up by neovim (assuming you are using `lazy`),
try

````
cp parser/http.so ~/.local/share/nvim/lazy/nvim-treesitter/parser
```

# Tasks

- [x] variable
- [x] comment
- [x] request
    - [x] method
    - [x] target_url
        - [x] scheme
        - [x] authority
        - [x] host
        - [x] path /
        - [x] query ?
        - [ ] fragment #
    - [x] http-version
    - [x] params
    - [x] header
    - [x] body
        - [x] json
        - [x] xml
        - [x] file
        - [x] graphq
- [ ] cli
