all: build

build:
	yarn parcel build src/index.html

server:
	yarn parcel src/index.html

clean:
	rm -rf dist