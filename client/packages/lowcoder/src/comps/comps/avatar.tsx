import { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { RecordConstructorToView } from "lowcoder-core";
import { styleControl } from "comps/controls/styleControl";
import _ from "lodash";
import {
  AvatarStyle,
  IconStyle,
  IconStyleType,
  heightCalculator,
  widthCalculator,
} from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { withDefault } from "../generators";
import {
  NameConfig,
  NameConfigHidden,
  withExposingConfigs,
} from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { NumberControl } from "comps/controls/codeControl";
import { IconControl } from "comps/controls/iconControl";
import ReactResizeDetector from "react-resize-detector";
import { AutoHeightControl } from "../controls/autoHeightControl";
import {
  clickEvent,
  eventHandlerControl,
} from "../controls/eventHandlerControl";
import { Avatar, Badge } from "antd";
import { dropdownControl } from "../controls/dropdownControl";
import { numberExposingStateControl, stringExposingStateControl } from "../controls/codeStateControl";
import { BoolControl } from "../controls/boolControl";
import { BudgeBasicSection, budgeChildren } from "./budgeComp/budgeConstants";

// const Container = styled.div<{ $style: IconStyleType | undefined }>`
//   // height: 100%;
//   // width: 100%;
//   // display: flex;
//   // align-items: center;
//   // justify-content: center;
//   // cursor: pointer;
//   // svg {
//   //   object-fit: contain;
//   //   pointer-events: auto;
//   // }
//   ${(props) => props.$style && getStyle(props.$style)}
// `;

// const getStyle = (style: IconStyleType) => {
//   return css`
//     svg {
//       color: ${style.fill};
//     }
//     padding: ${style.padding};
//     border: 1px solid ${style.border};
//     border-radius: ${style.radius};
//     margin: ${style.margin};
//     max-width: ${widthCalculator(style.margin)};
//     max-height: ${heightCalculator(style.margin)};
//   `;
// };

const EventOptions = [clickEvent] as const;
const sharpOptions = [
  { label: trans("avatarComp.square"), value: "square" },
  { label: trans("avatarComp.circle"), value: "circle" },
] as const;

const childrenMap = {
  style: styleControl(AvatarStyle),
  icon: withDefault(IconControl, "/icon:solid/user"),
  // autoHeight: withDefault(AutoHeightControl, "auto"),
  // iconSize: withDefault(NumberControl, 20),
  onEvent: eventHandlerControl(EventOptions),
  shape: dropdownControl(sharpOptions, "circle"),
  title: stringExposingStateControl("title", ""),
  src: stringExposingStateControl("src", ""),
  cursorPointer: BoolControl,
  ...budgeChildren,
};

const IconView = (props: RecordConstructorToView<typeof childrenMap>) => {
  const { shape, title, src } = props;
  const conRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [counts, setCounts] = useState(0);

  useEffect(() => {
    setCounts(props.budgeCount.value)
  }, [props.budgeCount.value])

  useEffect(() => {
    if (height && width) {
      console.log("!!", height, width);
      onResize();
    }
  }, [height, width]);

  const onResize = () => {
    const container = conRef.current;
    console.log(container?.clientWidth, container?.clientHeight)
    setWidth(container?.clientWidth ?? 0);
    setHeight(container?.clientHeight ?? 0);
  };

  return (
    <ReactResizeDetector onResize={onResize}>
      <div
        ref={conRef}
        style={{
          width: "100%",
          height: "100%",
          padding: '0px',
        }}
      >
        <Badge
          count={props.budgeCount.value}
          dot={props.budgeType === 'dot'}
          size={props.budgeSize}
          overflowCount={props.overflowCount}
          title={props.budgeTitle}
        >
          <Avatar
            size={width < height ? width - 5 : height}
            icon={title.value !== '' ? null : props.icon}
            shape={shape}
            style={{
              background: props.style.background,
              color: props.style.fill,
              cursor: props.cursorPointer ? 'pointer' : '',
            }}
            src={src.value}
            onClick={() => props.onEvent("click")}

          >
            {title.value}
          </Avatar>
        </Badge>
      </div>
    </ReactResizeDetector>
  );
};

let IconBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props) => <IconView {...props} />)
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.src.propertyView({
            label: trans("avatarComp.src"),
            placeholder: "http://xxxx/xx.jpg",
            tooltip: trans("avatarComp.avatarCompTooltip"),
          })}
          {children.title.propertyView({
            label: trans("avatarComp.title"),
            tooltip: trans("avatarComp.avatarCompTooltip"),
          })}
          {children.icon.propertyView({
            label: trans("avatarComp.icon"),
            IconType: "All",
            tooltip: trans("avatarComp.avatarCompTooltip"),
          })}
          {children.shape.propertyView({
            label: trans("avatarComp.shape"),
            radioButton: true,
          })}
          {
            children.cursorPointer.propertyView({
              label: trans("avatarComp.cursorPointer"),
            })}
        </Section>
        {children.shape.getView() === 'square' && <BudgeBasicSection {...children} />}
        <Section name={sectionNames.interaction}>
          {children.onEvent.getPropertyView()}
        </Section>
        <Section name={sectionNames.layout}>
          {hiddenPropertyView(children)}
        </Section>
        <Section name={sectionNames.style}>
          {children.style.getPropertyView()}
        </Section>
      </>
    ))
    .build();
})();

IconBasicComp = class extends IconBasicComp {
  override autoHeight(): boolean {
    return false;
  }
};

export const AvatarComp = withExposingConfigs(IconBasicComp, [
  NameConfigHidden,
  new NameConfig("budgeCount", trans("button.textDesc")),
]);
