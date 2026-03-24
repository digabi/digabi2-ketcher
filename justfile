export PATH := "./node_modules/.bin:" + env_var('PATH')

mod? digabi2-companion-app

gh := require("gh")
jq := require("jq")

default:
    @just --list

dev:
    node build.ts serve

lint *args:
    eslint . --ext .ts,.tsx {{ args }}
    tsc --noEmit

test:
    playwright test

build: fetch
    @just digabi2-companion-app build

dev-release version: fetch
    @just digabi2-companion-app dev-release "{{ version }}"

prod-release: fetch
    @just digabi2-companion-app prod-release

[private]
fetch:
    @{{ gh }} api repos/digabi/digabi2-companion-app-shared/contents/digabi2-companion-app.just | \
    {{ jq }} -r '.download_url' | \
    wget --quiet --input-file - --output-document digabi2-companion-app.just
