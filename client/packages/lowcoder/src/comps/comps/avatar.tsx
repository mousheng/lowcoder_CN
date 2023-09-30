import styled from "styled-components";
import { RecordConstructorToView } from "lowcoder-core";
import { styleControl } from "comps/controls/styleControl";
import _ from "lodash";
import {
  AvatarStyle,
  AvatarStyleType,
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
import {
  clickEvent,
  eventHandlerControl,
} from "../controls/eventHandlerControl";
import { Avatar, AvatarProps, Badge } from "antd";
import { dropdownControl } from "../controls/dropdownControl";
import { stringExposingStateControl } from "../controls/codeStateControl";
import { BoolControl } from "../controls/boolControl";
import { BudgeBasicSection, budgeChildren } from "./budgeComp/budgeConstants";

const AvatarWrapper = styled(Avatar) <AvatarProps & { cursorPointer: boolean, $style: AvatarStyleType }>`
  background: ${(props) => props.$style.background};
  color: ${(props) => props.$style.fill};
  cursor: ${(props) => props.cursorPointer ? 'pointer' : ''};
`;

const Warpper = styled.div <{ iconSize: number }>`
    width: ${(props) => props.iconSize}px;
    height: ${(props) => props.iconSize}px;
    inset-block-end: ${(props) => props.iconSize / 2}px;
    inset-inline-start: -${(props) => props.iconSize / 2}px;
    position: relative;
    padding: 0px;
    z-index: 11;
`
const EventOptions = [clickEvent] as const;
const sharpOptions = [
  { label: trans("avatarComp.square"), value: "square" },
  { label: trans("avatarComp.circle"), value: "circle" },
] as const;

const childrenMap = {
  style: styleControl(AvatarStyle),
  icon: withDefault(IconControl, "/icon:solid/user"),
  iconSize: withDefault(NumberControl, 40),
  onEvent: eventHandlerControl(EventOptions),
  shape: dropdownControl(sharpOptions, "circle"),
  title: stringExposingStateControl("title", ""),
  src: stringExposingStateControl("src", ""),
  cursorPointer: BoolControl,
  ...budgeChildren,
};

const IconView = (props: RecordConstructorToView<typeof childrenMap>) => {
  const { shape, title, src, iconSize } = props;
  return (
    <Warpper iconSize={props.iconSize}>
      <Badge
        count={props.budgeCount.value}
        dot={props.budgeType === 'dot'}
        size={props.budgeSize}
        overflowCount={props.overflowCount}
        title={props.budgeTitle}
      >
        <AvatarWrapper
          size={iconSize}
          icon={title.value !== '' ? null : props.icon}
          shape={shape}
          $style={props.style}
          src={src.value}
          cursorPointer={props.cursorPointer}
          onClick={() => props.onEvent("click")}
        >
          {title.value}
        </AvatarWrapper>
      </Badge>
    </Warpper>
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
          {
            children.iconSize.propertyView({
              label: trans("avatarComp.iconSize"),
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
