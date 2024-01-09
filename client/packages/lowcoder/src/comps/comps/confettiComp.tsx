import { RecordConstructorToView } from "lowcoder-core";
import { BoolControl } from "comps/controls/boolControl";
import { NameConfig, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { language, trans } from "i18n";
import { jsonControl } from "comps/controls/codeControl";
import styled from "styled-components";
import { useEffect, useState } from "react";
import Confetti from 'react-dom-confetti';
import { check } from "@lowcoder-ee/util/convertUtils";
import { UICompBuilder } from "../generators/uiCompBuilder";

const Warpper = styled.div`
  position: absolute;
  top: 30%;
  left: 50%;
  z-index: 999;
`;

const defaultConfig = {
  angle: 90,
  spread: 360,
  startVelocity: 40,
  elementCount: 70,
  dragFriction: 0.12,
  duration: 2000,
  stagger: 3,
  width: "10px",
  height: "10px",
  perspective: "500px",
  colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
};

function convertTreeData(data: any) {
  if (data === "") return {}
  check(data.angle, ["number"], "angle")
  check(data.spread, ["number"], "spread")
  check(data.startVelocity, ["number"], "startVelocity")
  check(data.elementCount, ["number"], "elementCount")
  check(data.dragFriction, ["number"], "dragFriction")
  check(data.duration, ["number"], "duration")
  check(data.stagger, ["number"], "stagger")
  check(data.width, ["string"], "width")
  check(data.height, ["string"], "height")
  check(data.perspective, ["string"], "perspective")
  check(data.colors, ["array"], "colors")
  return data
}


const childrenMap = {
  active: BoolControl,
  config: jsonControl(convertTreeData, defaultConfig),
};

const ConfettiView = (props: RecordConstructorToView<typeof childrenMap>) => {
  const [ConfettiActive, setConfettiActive] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setConfettiActive(false);
    }, 100);
  }, [ConfettiActive])

  return (
    <Warpper>
      <Confetti active={props.active} config={props.config}></Confetti>
    </Warpper>
  );
};

let ConfettiBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props) => <ConfettiView {...props} />)
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.config.propertyView({
            label: trans("confetti.config"),
            tooltip: language === 'zh' ? configDescCN : configDescEn,
          })}
        </Section>
      </>
    ))
    .setExposeMethodConfigs([
      {
        method: {
          name: "celebrate",
          description: trans("confetti.celebrate"),
          params: [],
        },
        execute: async (comp, params) => {
          comp.children.active.dispatch(comp.children.active.changeValueAction(true));
          setTimeout(() => {
            comp.children.active.dispatch(comp.children.active.changeValueAction(false));
          }, 100);
        },
      }])
    .build();
})();

export const ConfettiComp = withExposingConfigs(ConfettiBasicComp, [
  new NameConfig("active", trans("confetti.active")),
  new NameConfig("config", trans("confetti.config")),
]);

const configDescEn = <li>
  angle: direction of the explosion in degrees, defaults to 90. <br />
  spread: spread of the explosion in degrees, defaults to 45.<br />
  startVelocity: Initial velocity of the particles, defaults to 45.<br />
  elementCount - Number of particle elements, defaults to 50.<br />
  dragFriction: Decrease in velocity proportional to current velocity, default to 0.1<br />
  duration: The duration from explosion to disappearance. <br />
  stagger: Delay for each fetti in milliseconds, defaults to 0.<br />
  width: width of the confetti elements<br />
  height: height of the confetti elements<br />
  perspective: Depth of perspective effect.<br />
  colors: An array of color codes, defaults to ['#a864fd', '#29cdff', '#78ff44', '#ff718d' '#fdff6a']<br />
</li>

const configDescCN = <li>
  angle: 爆炸的方向，单位为度，默认为90度。<br />
  spread: 爆炸的扩散程度，单位为度，默认为45度。<br />
  startVelocity: 粒子的初始速度，默认为45。<br />
  elementCount: 粒子元素的数量，默认为50。<br />
  dragFriction: 速度减小与当前速度成比例的比例，默认为0.1。<br />
  duration: 从爆炸到消失的持续时间。 <br />
  stagger: 每个碎屑的延迟时间，单位为毫秒，默认为0。<br />
  width: 碎屑元素的宽度。<br />
  height: 碎屑元素的高度。<br />
  perspective: 透视效果的深度.<br />
  colors: 一组颜色代码的数组，默认为['#a864fd', '#29cdff', '#78ff44', '#ff718d' '#fdff6a']。<br />
</li>