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

## API e banco de dados

O projeto agora inclui uma API Flask com SQLite para desenvolvimento. Ela oferece autenticação por token, contas, fichas, campanhas e histórico de acontecimentos.

```bash
python -m venv backend/.venv
backend/.venv/Scripts/activate
pip install -r backend/requirements.txt
python backend/app.py
```

A API fica em `http://127.0.0.1:5000`. Para apontar o frontend para outro endereço, defina `VITE_API_URL`, por exemplo:

```bash
$env:VITE_API_URL="http://127.0.0.1:5000/api"
npm run dev
```

O SQLite é adequado para desenvolvimento local. Para publicar com múltiplos usuários, use PostgreSQL e configure `TOCA_DATABASE`, além de colocar o backend atrás de HTTPS.

## Hospedagem gratuita

O frontend já é publicado pelo GitHub Pages. Para publicar a API gratuitamente no Render:

1. Crie um `Web Service` no Render apontando para este repositório.
2. Use o arquivo `render.yaml` ou configure `pip install -r backend/requirements.txt` como build e `gunicorn --chdir backend app:app --bind 0.0.0.0:$PORT` como start.
3. Configure `TOCA_CORS_ORIGIN` com `https://julioaiublima-ui.github.io`.
4. No GitHub, abra `Settings > Secrets and variables > Actions > Variables` e crie `VITE_API_URL` com a URL da API Render terminando em `/api`.

O plano gratuito do Render pode dormir após inatividade. O SQLite configurado no exemplo serve para teste; para não perder contas e fichas em reinícios, conecte um PostgreSQL gerenciado antes de usar em produção.

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
