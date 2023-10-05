通过使用 SDK，您可以在已有系统中嵌入Lowcoder应用或模块。

## 安装

通过 yarn 安装

```bash
yarn add openblocks-sdk
```

通过 npm 安装

```bash
npm install openblocks-sdk
```

## 向已有应用添加Lowcoder应用/模块

1. 在Lowcoder上发布应用/模块。
2. 确认应用/模块权限，在未登录或者没有权限的情况下会自动跳转到登录页面。
3. 在应用中添加以下代码。

### 引入 CSS 文件

```javascript
import "openblocks-sdk/dist/style.css";
```

### 面向 React 应用

```javascript
import { OpenblocksAppView } from "openblocks-sdk";
<OpenblocksAppView appId="{YOUR_APPLICATION_ID}" />;
```

#### 组件属性列表

|**名称**|**类型**|**是否必填**|**描述**|
| ------------------------| -----------------------------| ---------------------| -------------------------------------------------------------------------------------------------|
|appId|string|未指定 DSL 时必填|Lowcoder应用的 ID。|
|dsl|Object|未指定 appId 时必填|离线应用的 DSL，即导出的应用 JSON 中的 applicationDsl 字段的值。只有在未设置 appId 的时候生效。|
|baseUrl|string|是|Lowcoder API 的 base url。|
|webUrl|string|非公开应用必填|Lowcoder平台的 URL，用于跳转登录页面。|
|moduleDsl|Object|否|如果应用中包含 Module，通过该字段设置 module 的 DSL，key 是 moduleId，value 是 mdoule 的 DSL。|
|onModuleEventTriggered|(eventName: string) => void|否|当模块的自定义事件触发时调用该方法。此方法仅适用于模块。|
|onModuleOutputChange|(output: any) => void|否|当模块的输出值改变时调用该方法。此方法仅适用于模块。|

> ##### 💡说明
>
> 离线 DSL 目前只适用于纯 UI 的 APP/Module 嵌入，不支持后端 Query 的执行。

#### 调用模块方法

```javascript
import { useRef } from "ref";
import { OpenblocksAppView } from "openblocks-sdk";

function MyExistingAppPage() {
    const appRef = useRef();
    return (
        <div>
            <OpenblocksAppView appId={YOUR_APPLICATION_ID} ref={appRef} />;
            <button onClick={() => appRef.current?.invokeMethod("some-method-name")}>
                Invoke method
            </button>
        </div>
    );
}
```

### 面向原生 JS

```javascript
import { bootstrapAppAt } from "openblocks-sdk";
const node = document.querySelector("#my-app");
async function bootstrap() {
    const instance = await bootstrapAppAt(YOUR_APPLICATION_ID, node);
  
    // 设置模块输入值
    instance.setModuleInputs({ input1: "xxx", input2: "xxx" });
  
    // 触发模块方法
    instance.setModuleInputs({ input1: "xxx", input2: "xxx" });
  
    // 监听模块事件触发器
    instance.on("moduleEventTriggered", (eventName) => {
        console.info("event triggered:", eventName);
    });
  
    // 监听模块输出值变化
    instance.on("moduleOutputChange", (data) => {
        console.info("output data:", data);
    });
}
```