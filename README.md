# wasmx-as-contracts

Core system contracts for wasmX: https://github.com/ark-us/wasmx

## monorepo

* npm install for all packages
```
npm run install-all
npm run reinstall-all
```

* build all packages
```
npm run build
```

## dev

```
cd proj
npm run asbuild
npm test

npm start
```

## create new project

```
mkdir newproj && cd newproj
npm init
npm install --save-dev assemblyscript
npx asinit .
```

## License

See [./LICENSE](./LICENSE), [./COPYRIGHT](./COPYRIGHT) and [./MORAL_LICENSE](./MORAL_LICENSE)

The Moral License is not yet legally binding, but one of our projects is to make such a license legally binding and computable. And we will use wasmX to manage such licensing.
