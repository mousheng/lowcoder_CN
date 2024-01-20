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
import { Avatar, AvatarProps, Badge, Dropdown, Menu } from "antd";
import { LeftRightControl, dropdownControl } from "../controls/dropdownControl";
import { stringExposingStateControl } from "../controls/codeStateControl";
import { BoolControl } from "../controls/boolControl";
import { BudgeBasicSection, budgeChildren } from "./budgeComp/budgeConstants";
import { DropdownOptionControl } from "../controls/optionsControl";
import { ReactElement } from "react";

const AvatarWrapper = styled(Avatar) <AvatarProps & { $cursorPointer: boolean, $style: AvatarStyleType }>`
  background: ${(props) => props.$style.background};
  color: ${(props) => props.$style.fill};
  cursor: ${(props) => props.$cursorPointer ? 'pointer' : ''};
`;

const Warpper = styled.div <{ iconSize: number, labelPosition: string }>`
display: flex;
width: 100%;
height: 100%;
padding: 0px;
align-items: center;
flex-direction: ${(props) => props.labelPosition === 'left' ? 'row' : 'row-reverse'};
`

const LabelWarpper = styled.div<{ iconSize: number, alignmentPosition: string }>`
width: calc(100% - ${(props) => props.iconSize}px);
display: flex;
padding-left: 5px;
padding-right: 5px;
flex-direction: column;
justify-content: flex-end;
align-items: ${(props) => props.alignmentPosition === 'left' ? 'flex-start' : 'flex-end'};
`
const LabelSpan = styled.span<{ color: string }>`
max-width: 100%;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
font-weight: bold;
color: ${(props) => props.color};
`
const CaptionSpan = styled.span<{ color: string }>`
max-width: 100%;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
color: ${(props) => props.color};
`
const EventOptions = [clickEvent] as const;
const sharpOptions = [
  { label: trans("avatarComp.square"), value: "square" },
  { label: trans("avatarComp.circle"), value: "circle" },
] as const;

const sideOptions = [
  { label: trans('tabbedContainer.left'), value: "left" },
  { label: trans('tabbedContainer.right'), value: "right" },
] as const;

const childrenMap = {
  style: styleControl(AvatarStyle),
  icon: withDefault(IconControl, "/icon:solid/user"),
  iconSize: withDefault(NumberControl, 40),
  onEvent: eventHandlerControl(EventOptions),
  shape: dropdownControl(sharpOptions, "circle"),
  title: stringExposingStateControl("title", ""),
  src: stringExposingStateControl("src", ""),
  avatarLabel: stringExposingStateControl("avatarLabel", "{{currentUser.name}}"),
  avatarCatption: stringExposingStateControl("avatarCatption", "{{currentUser.email}}"),
  labelPosition: dropdownControl(sideOptions, 'left'),
  alignmentPosition: withDefault(LeftRightControl, 'left'),
  cursorPointer: BoolControl,
  enableDropdownMenu: BoolControl,
  options: DropdownOptionControl,
  ...budgeChildren,
};

const IconView = (props: RecordConstructorToView<typeof childrenMap>) => {
  const { shape, title, src, iconSize } = props;
  const hasIcon =
    props.options.findIndex((option) => (option.prefixIcon as ReactElement)?.props.value) > -1;
  const items = props.options
    .filter((option) => !option.hidden)
    .map((option, index) => ({
      title: option.label,
      label: option.label,
      key: option.label + " - " + index,
      disabled: option.disabled,
      icon: hasIcon && <span>{option.prefixIcon}</span>,
      onEvent: option.onEvent,
    }));
  const menu = (
    <Menu
      items={items}
      onClick={({ key }) => items.find((o) => o.key === key)?.onEvent("click")}
    />
  );
  return (
    <Dropdown
      menu={{ items }}
      placement={props.labelPosition === 'left' ? "bottomLeft" : "bottomRight"}
      arrow
      disabled={!props.enableDropdownMenu}
      dropdownRender={() => menu}
    >
      <Warpper iconSize={props.iconSize} labelPosition={props.labelPosition}>
        <Badge
          count={props.budgeCount.value}
          dot={props.budgeType === 'dot'}
          size={props.budgeSize}
          overflowCount={props.overflowCount}
          title={props.budgeTitle}
          offset={props.shape === 'circle' ? [-2, 6] : [0, 0]}
        >
          <AvatarWrapper
            size={iconSize}
            icon={title.value !== '' ? null : props.icon}
            shape={shape}
            $style={props.style}
            src={src.value}
            $cursorPointer={props.cursorPointer}
            onClick={() => props.onEvent("click")}
          >
            {title.value}
          </AvatarWrapper>
        </Badge>
        <LabelWarpper iconSize={props.iconSize} alignmentPosition={props.alignmentPosition}>
          <LabelSpan color={props.style.label}>{props.avatarLabel.value}</LabelSpan>
          <CaptionSpan color={props.style.caption}>{props.avatarCatption.value}</CaptionSpan>
        </LabelWarpper>
      </Warpper>
    </Dropdown>
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
          {
            children.enableDropdownMenu.propertyView({
              label: trans("avatarComp.enableDropDown")
            })}
          {children.enableDropdownMenu.getView() && children.options.propertyView({})}
        </Section>
        <Section name={trans('avatarComp.label')}>
          {
            children.avatarLabel.propertyView({
              label: trans("avatarComp.label"),
            })}
          {
            children.avatarCatption.propertyView({
              label: trans("avatarComp.caption"),
            })}
          {
            children.labelPosition.propertyView({
              label: trans("avatarComp.labelPosition"),
              radioButton: true,
            })}
          {
            children.alignmentPosition.propertyView({
              label: trans("avatarComp.alignmentPosition"),
              radioButton: true,
            })}
        </Section>
        {<BudgeBasicSection {...children} />}
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


export const AvatarComp = withExposingConfigs(IconBasicComp, [
  NameConfigHidden,
  new NameConfig("budgeCount", trans("button.textDesc")),
]);
