import dotenv from "dotenv";
import { defineConfig, ServerOptions, UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";
import checker from "vite-plugin-checker";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";
import chalk from "chalk";
import { createHtmlPlugin } from "vite-plugin-html";
import { ensureLastSlash } from "./src/dev-utils/util";
import { buildVars } from "./src/dev-utils/buildVars";
import { globalDepPlugin } from "./src/dev-utils/globalDepPlguin";

dotenv.config();
!process.env.LOWCODER_API_SERVICE_URL && console.log("默认连接http://localhost:3000,您可以使用以下启动命令指定地址：LOWCODER_API_SERVICE_URL=http://自定义地址:端口 yarn start");
const apiProxyTarget = process.env.LOWCODER_API_SERVICE_URL ?? "http://localhost:3000";
const nodeServiceApiProxyTarget = process.env.NODE_SERVICE_API_PROXY_TARGET;
const nodeEnv = process.env.NODE_ENV ?? "development";
const edition = process.env.REACT_APP_EDITION;
const isEEGlobal = edition === "enterprise-global";
const isEE = edition === "enterprise" || isEEGlobal;
const isDev = nodeEnv === "development";
const isVisualizerEnabled = !!process.env.ENABLE_VISUALIZER;
// the file was never created
// const browserCheckFileName = `browser-check-${process.env.REACT_APP_COMMIT_ID}.js`;
const browserCheckFileName = `browser-check.js`;
const base = ensureLastSlash(process.env.PUBLIC_URL);

if (!apiProxyTarget && isDev) {
  console.log();
  console.log(chalk.red`LOWCODER_API_SERVICE_URL is required.\n`);
  console.log(chalk.cyan`Start with command: LOWCODER_API_SERVICE_URL=\{backend-api-addr\} yarn start`);
  console.log();
  process.exit(1);
}

const proxyConfig: ServerOptions["proxy"] = {
  "/api": {
    target: apiProxyTarget,
    changeOrigin: false,
  },
};

if (nodeServiceApiProxyTarget) {
  proxyConfig["/node-service"] = {
    target: nodeServiceApiProxyTarget,
  };
}

const define = {};
buildVars.forEach(({ name, defaultValue }) => {
  define[name] = JSON.stringify(process.env[name] || defaultValue);
});

// https://vitejs.dev/config/
export const viteConfig: UserConfig = {
  define,
  assetsInclude: ["**/*.md"],
  resolve: {
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
    alias: {
      "@lowcoder-ee": path.resolve(
        __dirname,
        isEE ? `../lowcoder/src/${isEEGlobal ? "ee-global" : "ee"}` : "../lowcoder/src"
      ),
    },
  },
  base,
  build: {
    manifest: true,
    target: "es2015",
    cssTarget: "chrome63",
    outDir: "build",
    assetsDir: "static",
    emptyOutDir: false,
    rollupOptions: {
      output: {
        chunkFileNames: "[hash].js",
      },
    },
    commonjsOptions: {
      defaultIsModuleExports: (id) => {
        if (id.indexOf("antd/lib") !== -1) {
          return false;
        }
        return "auto";
      },
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          "@primary-color": "#3377FF",
          "@link-color": "#3377FF",
          "@border-color-base": "#D7D9E0",
          "@border-radius-base": "4px",
        },
        javascriptEnabled: true,
      },
    },
  },
  server: {
    open: true,
    cors: true,
    port: 8000,
    host: "0.0.0.0",
    proxy: proxyConfig,
  },
  plugins: [
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint --quiet "./src/**/*.{ts,tsx}"',
        dev: {
          logLevel: ["error"],
        },
      },
    }),
    react({
      babel: {
        parserOpts: {
          plugins: ["decorators-legacy"],
        },
      },
    }),
    viteTsconfigPaths({
      projects: ["../lowcoder/tsconfig.json", "../lowcoder-design/tsconfig.json"],
    }),
    svgrPlugin({
      svgrOptions: {
        exportType: "named",
        prettier: false,
        svgo: false,
        titleProp: true,
        ref: true,
      },
    }),
    globalDepPlugin(),
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          browserCheckScript: isDev ? "" : `<script src="${base}${browserCheckFileName}"></script>`,
        },
      },
    }),
    isVisualizerEnabled && visualizer(),
  ].filter(Boolean),
};

const browserCheckConfig: UserConfig = {
  ...viteConfig,
  define: {
    ...viteConfig.define,
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    ...viteConfig.build,
    manifest: false,
    copyPublicDir: false,
    emptyOutDir: true,
    lib: {
      formats: ["iife"],
      name: "BrowserCheck",
      entry: "./src/browser-check.ts",
      fileName: () => {
        return browserCheckFileName;
      },
    },
  },
};

const buildTargets = {
  main: viteConfig,
  browserCheck: browserCheckConfig,
};

const buildTarget = buildTargets[process.env.BUILD_TARGET || "main"];

export default defineConfig(buildTarget || viteConfig);
