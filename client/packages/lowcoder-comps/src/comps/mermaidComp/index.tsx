import {
  UICompBuilder,
  Section,
  sectionNames,
  withExposingConfigs,
  stringExposingStateControl,
  NameConfig,
  eventHandlerControl,
  withMethodExposing,
} from "lowcoder-sdk";

import Mermaid from "./mermaid";

const childrenMap = {
  code: stringExposingStateControl(
    "code",
    `graph LR
   Start --> Stop`
  ),
  onEvent: eventHandlerControl([
    {
      label: "onChange",
      value: "change",
      description: "",
    },
  ]),
};

const CompBase = new UICompBuilder(childrenMap, (props: any) => {
  const code = props.code.value;
  return <Mermaid code={code} />;
})
  .setPropertyViewFn((children: any) => {
    return (
      <>
        {/* 美人鱼组件属性设置页国际化标题 */}
        <Section name={sectionNames.basic}>{children.code.propertyView({ label: "code" })}</Section>
        <Section name={sectionNames.interaction}>{children.onEvent.propertyView()}</Section>
      </>
    );
  })
  .build();

const AppViewCompTemp = withMethodExposing(CompBase, []);

export const MermaidComp = withExposingConfigs(AppViewCompTemp, [new NameConfig("code", "")]);
