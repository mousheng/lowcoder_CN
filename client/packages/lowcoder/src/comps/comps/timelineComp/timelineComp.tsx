import React, { useEffect, useState, useContext, useRef } from "react";
import { default as Button } from "antd/es/button";
import {
  changeChildAction,
  CompAction,
  RecordConstructorToView,
} from "lowcoder-core";
import { trans } from "i18n";
import { UICompBuilder, withDefault } from "../../generators";
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { BoolControl } from "comps/controls/boolControl";
import { jsonExposingStateControl, numberExposingStateControl, } from "comps/controls/codeStateControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { styleControl } from "comps/controls/styleControl";
import { alignControl } from "comps/controls/alignControl";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import { jsonValueExposingStateControl } from "comps/controls/codeStateControl";
import {
  jsonControl,
  NumberControl,
  StringControl,
} from "comps/controls/codeControl";
import {
  clickEvent,
  eventHandlerControl,
} from "comps/controls/eventHandlerControl";
import {
  TimeLineStyle,
  heightCalculator,
  widthCalculator,
  TimeLineType,
} from "comps/controls/styleControlConstants";
import { stateComp, valueComp } from "comps/generators/simpleGenerators";
import {
  NameConfig,
  NameConfigHidden,
  withExposingConfigs,
} from "comps/generators/withExposing";
import { timelineDate, timelineNode, TimelineDataTooltip } from "./timelineConstants";
import { convertTimeLineData } from "./timelineUtils";
import { default as Timeline } from "antd/es/timeline";

import styled from "styled-components";
import { debounce } from "lodash";

import { EditorContext } from "comps/editorState";


const Wrapper = styled.div<{ $style: TimeLineType, mode: string, offset: number }>`
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
    padding-top: 15px;
    width: calc(${(props) => props.mode === "alternate" ? 50 : (50 - props.offset)}% - 12px);
  }
  .ant-timeline.ant-timeline-alternate .ant-timeline-item-tail, .ant-timeline.ant-timeline-right .ant-timeline-item-tail, .ant-timeline.ant-timeline-label .ant-timeline-item-tail, .ant-timeline.ant-timeline-alternate .ant-timeline-item-head, .ant-timeline.ant-timeline-right .ant-timeline-item-head, .ant-timeline.ant-timeline-label .ant-timeline-item-head, .ant-timeline.ant-timeline-alternate .ant-timeline-item-head-custom, .ant-timeline.ant-timeline-right .ant-timeline-item-head-custom, .ant-timeline.ant-timeline-label .ant-timeline-item-head-custom {
    margin-top: 15px;
    inset-inline-start: ${(props) => props.mode === "alternate" ? 50 : (props.mode === "left" ? (50 - props.offset) + "%" : (50 + props.offset) + "%")};
  }
  .ant-timeline.ant-timeline-alternate .ant-timeline-item-left .ant-timeline-item-content, .ant-timeline.ant-timeline-right .ant-timeline-item-left .ant-timeline-item-content, .ant-timeline.ant-timeline-label .ant-timeline-item-left .ant-timeline-item-content {
    padding-top: 15px;
    inset-inline-start: calc(${(props) => props.mode === "alternate" ? 50 : (50 - props.offset)}% - 4px);
    width: calc(${(props) => props.mode === "alternate" ? 50 : (50 + props.offset)}% - 12px);
  }
  .ant-timeline.ant-timeline-label .ant-timeline-item-right .ant-timeline-item-label {
    padding-top: 15px;
    inset-inline-start: calc(${(props) => props.mode === "alternate" ? 50 : (50 + props.offset)}% + 12px);
    width: calc(${(props) => props.mode === "alternate" ? 50 : (50 - props.offset)}% - 12px);
    text-align: start;
  }
  .ant-timeline.ant-timeline-alternate .ant-timeline-item-right .ant-timeline-item-content, .ant-timeline.ant-timeline-right .ant-timeline-item-right .ant-timeline-item-content, .ant-timeline.ant-timeline-label .ant-timeline-item-right .ant-timeline-item-content {
    padding-top: 15px;
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

// Utility function to dynamically load Ant Design icons
const loadIcon = async (iconName: string) => {
  if (!iconName) return null;
  try {
    const module = await import(`@ant-design/icons`);
    const IconComponent = (module as any)[iconName];
    return IconComponent ? <IconComponent /> : null;
  } catch (error) {
    console.error(`Error loading icon ${iconName}:`, error);
    return null;
  }
};

const TimelineComp = (
  props: RecordConstructorToView<typeof childrenMap> & {
    dispatch: (action: CompAction) => void;
  }
) => {
  const { value, dispatch, style, mode, reverse, onEvent, scrollTo } = props;
  const [icons, setIcons] = useState<React.ReactNode[]>([]);
  const divRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState(0)

  useEffect(() => {
    const loadIcons = async () => {
      const iconComponents = await Promise.all(
        value.value.map((node: timelineNode) =>
          node.dot ? loadIcon(node.dot) : Promise.resolve(null)
        )
      );
      setIcons(iconComponents);
    };

    loadIcons();
  }, [value]);

  const timelineItems = value.value.map((value: timelineNode, index: number) => ({
    color: value?.color,
    dot: icons[index] || "",
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
  }));

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
        </Section>

        {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <Section name={sectionNames.interaction}>
            {children.onEvent.getPropertyView()}
            {hiddenPropertyView(children)}
          </Section>
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <><Section name={sectionNames.layout}>
            {children.mode.propertyView({
              label: trans("timeLine.mode"),
              tooltip: trans("timeLine.modeTooltip"),
            })}
            {children.mode.getView() !== "alternate" && children.offset.propertyView({
              label: trans("timeLine.offset"),
              tooltip: trans("timeLine.offsetDes"),
            })}
            {children.pending.propertyView({
              label: trans("timeLine.pending"),
              tooltip: trans("timeLine.pendingDescription"),
            })}
            {children.reverse.propertyView({
              label: trans("timeLine.reverse"),
            })}
          </Section>
            <Section name={sectionNames.style}>
              {children.style.getPropertyView()}
            </Section>
          </>
        )}
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
