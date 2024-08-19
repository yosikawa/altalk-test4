# Firebase + Vite + Vue + TypeScript 環境構築

- 作成 2024/8/19
- ディレクトリ D:\WORK\GCP\PROJ\altalk-test4
- 前提ソフト
  - Node.js 18
  - vscode
  - npm install -g firebase-tools
- 以下の手順は Windows10 で試したときのもの。Mac でも可能と思う

1. vite+vue+ts 環境構築

    コマンドプロンプト（管理者でない方）を開いて以下を入力する

    - %DIR% はプロジェクトディレクトリの一つ上のディレクトリで置き換える
    - %PROJ% は Firebase プロジェクトID (ex. hello-12345 のような名前)で置き換える

    ``` command.com
    cd %DIR%
    npm create vite %PROJ% --template vue-ts
    ```

    質問への回答例

    - Select a framework: Vue
    - Select a variant: (なし)

    ``` command.com
    cd %PROJ%
    npm install
    npm run dev
    ```

    画面に表示されたURLをブラウザで開くとデモページが表示される
    (Ctrl-C を入力して終了する)

1. firebase 環境構築

    コマンドプロンプトを開いて以下を入力する

    ``` command.com
    firebase init
    ```

    - コマンドが見つからない場合: 'firebase' コマンドは npm でインストールした firebase-tools の中にある。私の場合、パス名は C:\\Users\\<ユーザ名>\\AppData\\Roaming\\npm\\firebase
    - 認証エラーの場合: firebase logout と入力して一旦ログアウトし、再度 firebase login でログインする

    質問への回答例（ほとんどはデフォルトのまま）

    - Are you ready to proceed?: Y
    - Which Firebase features do you want to set up for this directory?: Firestore, Functions, Hosting, Storage, Emulators, Remote Config を有効(*)にする
    - Project Setup: Use an existing project
    - Select a default Firebase project for this directory: (project name)
    - What file should be used for Firestore Rules?: firestore.rules
    - What file should be used for Firestore indexes?: firestore.indexes.json
    - What language would you like to use to write Cloud Functions?: TypeScript
    - Do you want to use ESLint to catch probable bugs and enforce style?: Y
    - Do you want to install dependencies with npm now?: Y
    - What do you want to use as your public directory?: public
    - Configure as a single-page app (rewrite all urls to /index.html)?: N
    - Set up automatic builds and deploys with GitHub?: N
    - What file should be used for Storage Rules?: storage.rules
    - Which Firebase emulators do you want to set up?: Functions, Firestore, Hosting, Storage を有効(*)にする
    - Which port do you want to use for the functions emulator?: 5001
    - Which port do you want to use for the firestore emulator?: 8080
    - Which port do you want to use for the hosting emulator?: 5000
    - Which port do you want to use for the storage emulator?: 9199
    - Would you like to enable the Emulator UI?: Y
    - Which port do you want to use for the Emulator UI (leave empty to use any available port)?: (enter)
    - Would you like to download the emulators now?: Y
    - What file should be used for your Remote Config template?: remoteconfig.template.json

    firebase hosting と functions の実行

    - テストのため functions/src/index.ts 内に以下のプログラムを追加する (ないしコメントを外す)

    ``` JavaScript
    export const helloWorld = onRequest((request, response) => {
      logger.info("Hello logs!", {structuredData: true});
      response.send("Hello from Firebase!");
    });
    ```

    - コマンドプロンプトを開いて以下を入力する

    ``` command.com
    cd functions
    npm run serve
    ```

    - ブラウザで helloWorld を呼び出す。URL はコマンドプロンプトの出力に表示されている。[http://127.0.0.1:5001/project-id/us-central1/helloWorld] のようなものになる
    - 成功すれば "Hello from Firebase!" と表示される

1. vite と Firebase を連携させる

    vite と Firebase を同じディレクトリに環境構築したが、このままでは独立していて、例えば vite 環境の TypeScript プログラムから直接 Firebase Functions の関数を呼ぶといったことができない。

    - ブラウザで実行される TypeScript プログラムは ./src ディレクトリ、画像やHTMLなどは ./public ディレクトリに配置する
    - Firebase Functions によりサーバーで実行される TypeScript プログラムは ./functions/src ディレクトリに配置する
    - Firebase Hosting のディレクトリを ./public から ./dist に変更する。Hosting エミュレータは ./dist 内のファイルをブラウザに配信する
    - 本番用のビルドをすると、vite はプログラムや css 等をコンパイル・バンドル等して、結果を ./dist/assets に配置する。また、vite は ./public 以下のファイルを ./dist にコピーする。本番サーバーにアップロードするときは ./dist の内容を丸ごとアップロードすればよい
    - vite のテストサーバーは、まるで ./dist 内のファイルをブラウザに配信しているかのように動作する。ただし実際のビルドは行われず、./dist 内のファイルも更新されない。見かけ上、(ビルドしたら生成されるはずの) ./dist の内容を見ているかのような動作をする。このため Hosting と vite のどちらにアクセスしても ./dist の内容を見ることになる
    - ブラウザで vite のテストサーバーのURL [http://localhost:5173/] を開くと、HTML/CSS/Vue/TypeScript で作られたページが表示される。しかしここで直接 Firebase の機能を使うことはできない。テスト用の Firebase は Firebase エミュレータによって実現されていて、それは別のポート番号で実行しているからだ
    - vite のプラグイン機能を利用して、vite へのアクセスを Firebase Hosting へリダイレクトする。後述の firebaseRedirect.js がこの処理を行う。URL で判定して、処理を振り分ける。URL のドメインパートの後に続くローカルパス名が '/\_\_/' ないし '/fn/' で始まる場合は Firebase の機能を呼び出していると判定する。例えば /\_\_/firebase/init.js は Firebase のプロジェクトIDなどの構成情報が含まれているが、このファイルは実際には存在しなくて、Firebase エミュレータにアクセスしたときだけ見ることができる。また、Functions の機能で REST サーバーなどを作るときは、必ず URL の先頭が '/fn/' になるようにする
    - firebaseRedirect は vite から Hosting へとリダイレクトする。Functions を呼び出すにはさらに、Hosting から Functions へリダイレクトする必要がある。この機能は Hosting が正式にサポートしていて、 [rewrite ルール](https://firebase.google.com/docs/hosting/functions?hl=ja) という機能を利用する。リダイレクトする代わりに、Functions のURLを直接呼び出すこともできるが、この場合は異なるオリジンへの呼び出しになるため、クロスオリジンリソース共有 (CORS)の対策が必要になる
    - なお、firebaseRedirect を使用するのは vite のテストサーバーを使うときであり、本番稼働するときは vite を使わないので firebaseRedirect も使用しない

    以上の連携動作のため、次の設定をする。

    1. 以下の通り、 firebaseRedirect.js ファイルを作成する。

        ``` JavaScript
        import axios from 'axios';
        export const redirector = async function(req, res) {
          try {
            const url = req.originalUrl;
            // const cookie = req.headers['cookie'] ?? '';
            const args = {
              baseURL: 'http://127.0.0.1:5000',
              transformResponse: (res) => res,
              responseType: 'json',
              // headers: {cookie},
              headers: req.headers,
              maxRedirects: 0,
              validateStatus: null,
            };
            console.log(`firebaseRedirect: url='${url}', args=${JSON.stringify(args)} `);
            const ax = await axios.get(url, args);
            const status = ax.status;
            Object.keys(ax.headers).forEach((key) => {
              res.setHeader(key, ax.headers[key]);
            });
            console.log(`fetch firebase: url='${url}', length=${ax.data.length}, status=${status}`);
            res.statusCode = status;
            res.end(ax.data);
          } catch (err) {
            console.log('error:');
            console.dir(err);
          }
        };
        export const firebaseRedirect = () => ({
          name: 'firebase-redirect',
          configureServer(server) {
            server.middlewares.use('/__/', redirector);
            server.middlewares.use('/fn/', redirector);
          },
        });
        ```

    1. firebaseRedirect が使用するモジュールを追加する

        ``` command.com
        npm i @types/node --save-dev
        npm i axios --save-dev
        ```

    1. firebaseRedirect プラグインを登録する。
    vite.config.ts ファイルを以下のように修正する。

        ``` TypeScript
        import { defineConfig } from 'vite'
        import vue from '@vitejs/plugin-vue'
        // @ts-ignore
        import { firebaseRedirect } from './firebaseRedirect.js'

        export default defineConfig({
          plugins: [vue(), firebaseRedirect()],
        })
        ```

    1. Firebase Hosting のディレクトリを ./public から ./dist に変更するため、firebase.json の hosting.public を修正する。また、Hosting から Functions へのリダイレクトを登録する。firebase.json の hosting.rewrites を追加する

        ``` JavaScript
        {
          "hosting": {
            "public": "dist",
            "rewrites": [ {
              "source": "/fn/helloWorld",
              "function": "helloWorld",
              "region": "us-central1"
            } ],
            ...
        ```

    1. テストのため src/components/HelloWorld.vue を以下のように修正する

        ``` JavaScript
        // scriptタグの中に以下を追加する
        const hello = ref('')
        const fetchHello = async () => {
          hello.value = await (await fetch('/fn/helloWorld')).text();
        }
        ```

        ``` HTML
        <!-- HTMLテンプレート内に以下を追加する -->
        <button type="button" @click="fetchHello">call hello</button>
        <button type="button" @click="hello=''">clear</button>
        <p>{{ hello }}</p>
        ```

    ブラウザでvite のテストサーバー [http://localhost:5173/] を開いて、ボタンの動作を確認する

    参考

    - Functions を直接呼び出すURL: [http://127.0.0.1:5001/project-id/us-central1/helloWorld] (project-idを適宜置き換える)
    - Hosting 経由で Functions を呼ぶURL: [http://127.0.0.1:5000/fn/helloWorld]
    - vite と Hosting 経由で Functions を呼ぶURL: [http://localhost:5173/fn/helloWorld]

1. ESLint と vscode を連携させる

    以下の内容で workspace.code-workspace ファイルを作成する （又は設定を追加する）vscode でこのワークスペースを開くと、ESLint が動作するはず （[VS Code ESLint extension プラグイン](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)が必要）

    ``` JavaScript
    {
      "folders": [
        {
          "path": "."
        }
      ],
      "settings": {
        "eslint.nodePath": ".",
        "eslint.workingDirectories": [".", "./functions"],
        "eslint.format.enable": true,
        "typescript.validate.enable": true,
        "javascript.format.enable": false,
        "[javascript]": {
          "editor.defaultFormatter": "dbaeumer.vscode-eslint",
          "editor.insertSpaces": true
        },
        "[typescript]": {
          "editor.defaultFormatter": "dbaeumer.vscode-eslint",
          "editor.insertSpaces": true,
        },
        "[vue]": {
          "editor.defaultFormatter": "dbaeumer.vscode-eslint",
        },
      },
    }
    ```

1. デバッガを設定する

    ブラウザ内で実行されるプログラムは、ブラウザの機能でデバッグする。また、[Vue.js devtools](https://devtools.vuejs.org/)を使うと Vue 固有の機能のデバッグもできる。

    Functions のプログラムをデバッグするには、以下の内容で ./.vscode/launch.json ファイルを作成する。

    ``` JavaScript
    {
      "version": "0.2.0",
      "configurations": [
        {
          "type": "node",
          "request": "attach",
          "name": "Debug",
          "port": 9229
        }
      ]
    }
    ```

    Firebase エミュレータを --inspect-functions オプション付きで起動する

    ``` command.com
    firebase emulators:start --inspect-functions
    ```

    vscode の Run and Debug view を表示して（Ctrl+Shift+D）左上の緑の三角アイコンをクリック(F5)してデバッグモードにする。

    Functions の任意のソースファイル functions/src/index.ts を開いて、適当な行の行番号のすぐ左をクリックしてブレークポイントを設定する。ブラウザのアプリ画面から Functions の機能を呼び出せば、ブレークポイントで停止するはず。

    準備が整うまで数秒～10秒くらい、やや待たされることがある。
