# Toca do Coelho

Interface de uma plataforma de RPG paranormal inspirada em fichas de personagem, com campanha, rituais e mesa virtual.

![Carimbo de Julio Thiago Colares de Lima](src/assets/carimbo.jpeg)

## O que já funciona

- Dashboard da campanha com acesso rápido à ficha, rituais e mesa.
- Ficha de personagem com atributos, vida, esforço, sanidade e inventário.
- Biblioteca pesquisável de rituais.
- Painel do mestre para cadastrar novos rituais no navegador.
- Mesa virtual com mapa em grid, tokens selecionáveis, jogadores online e rolagem de d20.
- Layout responsivo para desktop e celular.

## Executar localmente

```bash
npm install
npm run dev
```

Para validar uma build de produção:

```bash
npm run build
npm run lint
```

Os dados ainda são demonstrativos e ficam apenas no estado local da página. Para transformar a mesa em multiplayer real, o próximo passo é conectar autenticação, banco de dados e sincronização em tempo real, por exemplo com Supabase ou Firebase.

## Publicar no GitHub

O código pode ser publicado em qualquer repositório GitHub com:

```bash
git add .
git commit -m "feat: criar plataforma de rpg paranormal"
git push origin main
```
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
