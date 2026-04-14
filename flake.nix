{
  description = "gaqno development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ self.overlay ];
        };
      in
      {
        packages = pkgs;

        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
            corepack_22
            uv
            python312
            docker
            docker-compose
            nixfmt-rfc-style
            just
          ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
          '';
        };
      }
    ) // {
      overlay = final: prev: {
        nodejs_22 = prev.nodejs_22;
        uv = prev.uv;
      };
    };
}