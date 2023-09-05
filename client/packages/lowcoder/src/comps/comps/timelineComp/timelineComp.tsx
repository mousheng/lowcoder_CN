import { useEffect, useRef, useState } from "react";
import { Button } from "antd";
// 渲染组件到编辑器
import {
  changeChildAction,
  CompAction,
  RecordConstructorToView,
} from "lowcoder-core";
// 文字国际化转换api
import { trans } from "i18n";
// 右侧属性栏总框架
import { UICompBuilder, withDefault } from "../../generators";
// 右侧属性子框架
import { Section, sectionNames } from "lowcoder-design";
// 指示组件是否隐藏的开关
import { hiddenPropertyView } from "comps/utils/propertyUtils";
// 右侧属性开关

import { BoolControl } from "comps/controls/boolControl";
import { jsonExposingStateControl, numberExposingStateControl, } from "comps/controls/codeStateControl"; //文本并暴露值
import { dropdownControl } from "comps/controls/dropdownControl";
import { styleControl } from "comps/controls/styleControl"; //样式输入框
import {
  jsonControl,
  NumberControl,
  StringControl,
} from "comps/controls/codeControl";
// 事件控制
import {
  clickEvent,
  eventHandlerControl,
} from "comps/controls/eventHandlerControl";

// 引入样式
import {
  TimeLineStyle,
  heightCalculator,
  widthCalculator,
  TimeLineType,
} from "comps/controls/styleControlConstants";
// 初始化暴露值
import { stateComp, valueComp } from "comps/generators/simpleGenerators";
// 组件对外暴露属性的api
import {
  NameConfig,
  NameConfigHidden,
  withExposingConfigs,
} from "comps/generators/withExposing";

import { timelineDate, timelineNode, TimelineDataTooltip } from "./timelineConstants";
import { convertTimeLineData } from "./timelineUtils";
import { Timeline } from "antd";
import { ANTDICON } from "./antIcon";
import styled from "styled-components";
import { debounce } from "lodash";


const Wrapper = styled.div<{ $style: TimeLineType, mode: string, offset: number }>`
  padding-top: 15px!important;
  margin: ${(props) => props.$style.margin};
  padding: ${(props) => props.$style.padding};
  width: ${(props) => widthCalculator(props.$style.margin)};
  height: ${(props) => heightCalculator(props.$style.margin)};
  background-color: ${(props) => props.$style.background};
  border: 1px solid ${(props) => props.$style.border};
  overflow: auto;
  overflow-x: hidden;
  border-radius: ${(props) => props.$style.radius};
  .ant-timeline.ant-timeline-label .ant-timeline-item-label {
    width: calc(${(props) => props.mode === "alternate" ? 50 : (50 - props.offset)}% - 12px);
  }
  .ant-timeline.ant-timeline-alternate .ant-timeline-item-tail, .ant-timeline.ant-timeline-right .ant-timeline-item-tail, .ant-timeline.ant-timeline-label .ant-timeline-item-tail, .ant-timeline.ant-timeline-alternate .ant-timeline-item-head, .ant-timeline.ant-timeline-right .ant-timeline-item-head, .ant-timeline.ant-timeline-label .ant-timeline-item-head, .ant-timeline.ant-timeline-alternate .ant-timeline-item-head-custom, .ant-timeline.ant-timeline-right .ant-timeline-item-head-custom, .ant-timeline.ant-timeline-label .ant-timeline-item-head-custom {
    inset-inline-start: ${(props) => props.mode === "alternate" ? 50 : (props.mode === "left" ? (50 - props.offset) + "%" : (50 + props.offset) + "%")};
  }
  .ant-timeline.ant-timeline-alternate .ant-timeline-item-left .ant-timeline-item-content, .ant-timeline.ant-timeline-right .ant-timeline-item-left .ant-timeline-item-content, .ant-timeline.ant-timeline-label .ant-timeline-item-left .ant-timeline-item-content {
    inset-inline-start: calc(${(props) => props.mode === "alternate" ? 50 : (50 - props.offset)}% - 4px);
  }
  .ant-timeline.ant-timeline-label .ant-timeline-item-right .ant-timeline-item-label {
    inset-inline-start: calc(${(props) => props.mode === "alternate" ? 50 : (50 + props.offset)}% + 12px);
    width: calc(50% - 12px);
    text-align: start;
  }
  .ant-timeline.ant-timeline-alternate .ant-timeline-item-right .ant-timeline-item-content, .ant-timeline.ant-timeline-right .ant-timeline-item-right .ant-timeline-item-content, .ant-timeline.ant-timeline-label .ant-timeline-item-right .ant-timeline-item-content {
    width: calc(${(props) => props.mode === "alternate" ? 50 : (50 + props.offset)}% - 12px);
    text-align: end;
  }
`

const EventOptions = [
  clickEvent,
] as const;

const modeOptions = [
  { label: trans("timeLine.left"), value: "left" },
  { label: trans("timeLine.right"), value: "right" },
  { label: trans("timeLine.alternate"), value: "alternate" },
] as const;

const childrenMap = {
  value: jsonExposingStateControl("value", convertTimeLineData, timelineDate),
  mode: dropdownControl(modeOptions, "alternate"),
  reverse: BoolControl,
  pending: withDefault(StringControl, trans("timeLine.defaultPending")),
  onEvent: eventHandlerControl(EventOptions),
  style: styleControl(TimeLineStyle),
  clickedObject: valueComp<timelineNode>({ title: "" }),
  clickedIndex: valueComp<number>(0),
  offset: withDefault(NumberControl, 0),
  scrollTo: numberExposingStateControl("scrollTo", 99999),
};

const TimelineComp = (
  props: RecordConstructorToView<typeof childrenMap> & {
    dispatch: (action: CompAction) => void;
  }
) => {
  const divRef = useRef<HTMLDivElement>(null);
  const { dispatch, style, mode, reverse, onEvent, scrollTo } = props;
  const [scroll, setScroll] = useState(0)
  const [value, setValue] = useState(props.value.value)
  const [scrollHeight, setScrollHeight] = useState(0)

  useEffect(() => {
    setValue(props.value.value);
    setTimeout(() => {
      setScroll(Math.min(scrollTo.value, scrollHeight))
      if (divRef.current) {
        setScrollHeight(divRef.current.scrollHeight)
        divRef.current.scrollTop = Math.min(scrollTo.value, divRef.current.scrollHeight);
      }
    }, 20);
  }, [props.value.value, scrollTo.value])
  const timelineItems = value.map((value: timelineNode, index: number) => ({
    key: index,
    color: value?.color,
    dot: value?.dot && ANTDICON.hasOwnProperty(value?.dot.toLowerCase())
      ? ANTDICON[value?.dot.toLowerCase() as keyof typeof ANTDICON]
      : "",
    label: (
      <span style={{ color: value?.lableColor || style?.lableColor }}>
        {value?.label}
      </span>
    ),
    children: (
      <>
        <div
          onClick={(e) => {
            e.preventDefault();
            dispatch(changeChildAction("clickedObject", value, false));
            dispatch(changeChildAction("clickedIndex", index, false));
            onEvent("click");
          }}
          style={{
            cursor: "pointer",
            color: value?.titleColor || style?.titleColor,
          }}
        >
          <b>{value?.title}</b>
        </div>
        <p style={{ color: value?.subTitleColor || style?.subTitleColor }}>
          {value?.subTitle && value.subTitle.split('\n').map((item, index) => (<>{index !== 0 ? <br /> : ''}{item}</>))}
        </p>
      </>
    )
  }
  ))



  return (
    <Wrapper $style={props.style}
      mode={mode}
      offset={props.offset}
      ref={divRef}
      onScrollCapture={
        debounce(() => {
          if (divRef.current)
            props.scrollTo.onChange(divRef.current.scrollTop)
        }, 300, {
          'trailing': true
        })
      }
    >
      <Timeline
        mode={props?.mode || "left"}
        reverse={props?.reverse}
        pending={
          props?.pending && (
            <span style={{ color: style?.titleColor }}>
              {props?.pending || ""}
            </span>
          )
        }
        items={timelineItems}
      />
    </Wrapper>
  );
};

let TimeLineBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props, dispatch) => (
    <TimelineComp {...props} dispatch={dispatch} />
  ))
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.value.propertyView({
            label: trans("timeLine.value"),
            tooltip: TimelineDataTooltip,
            placeholder: "[]",
          })}
          {children.mode.propertyView({
            label: trans("timeLine.mode"),
            tooltip: trans("timeLine.modeTooltip"),
          })}
          {children.mode.getView() !== "alternate" && children.offset.propertyView({
            label: trans("timeLine.offset"),
            tooltip: trans("timeLine.offsetDes"),
          })}
          {children.reverse.propertyView({
            label: trans("timeLine.reverse"),
          })}
          {children.pending.propertyView({
            label: trans("timeLine.pending"),
          })}
        </Section>
        <Section name={sectionNames.layout}>
          {children.onEvent.getPropertyView()}
          {hiddenPropertyView(children)}
        </Section>
        <Section name={sectionNames.style}>
          {children.style.getPropertyView()}
        </Section>
      </>
    ))
    .build();
})();

TimeLineBasicComp = class extends TimeLineBasicComp {
  override autoHeight(): boolean {
    return false;
  }
};

export const TimeLineComp = withExposingConfigs(TimeLineBasicComp, [
  new NameConfig("value", trans("timeLine.valueDesc")),
  new NameConfig("clickedObject", trans("timeLine.clickedObjectDesc")),
  new NameConfig("clickedIndex", trans("timeLine.clickedIndexDesc")),
  new NameConfig("scrollTo", trans("timeLine.scrollTo")),
  NameConfigHidden,
]);
