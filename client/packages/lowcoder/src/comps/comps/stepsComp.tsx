import { CompAction, RecordConstructorToView, changeChildAction } from "lowcoder-core";
import { styleControl } from "comps/controls/styleControl";
import { heightCalculator, stepsStyle, stepsStyleType } from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { Steps } from "antd";
import { countdownEvent, eventHandlerControl, pauseEvent, resetEvent, resumeEvent, startEvent } from "../controls/eventHandlerControl";
import styled from "styled-components";
import { useContext, useState, useEffect, ReactElement } from "react";
import { stateComp, MultiCompBuilder } from "../generators";
import { EditorContext } from "comps/editorState";
import { dropdownControl } from "../controls/dropdownControl";
import { StringControl } from "comps/controls/codeControl";
import { IconControl } from "../controls/iconControl";
import { BoolControl, numberExposingStateControl, optionsControl, stringExposingStateControl } from "@lowcoder-ee/index.sdk";

const Container = styled.div<{ $style: stepsStyleType | undefined, stepsType: string }>`
  background-color: ${props => props.$style?.background};
  border: 1px solid ${props => props.$style?.border};
  border-radius: ${props => props.$style?.radius};
  padding: ${props => props.$style?.padding};
  height: ${props => props.stepsType === 'inline' ? heightCalculator(props.$style?.padding as string) : 'auto'};
  .ant-steps.ant-steps-inline .ant-steps-item-content {
    margin-top: ${props => props.stepsType === 'inline' ? '-10px' : 'auto'};
  }
`;

const EventOptions = [countdownEvent, startEvent, pauseEvent, resumeEvent, resetEvent] as const;

const DropdownOption = new MultiCompBuilder(
  {
    label: StringControl,
    icon: IconControl,
    description: StringControl,
    subTitle: StringControl,
  },
  (props) => props
)
  .setPropertyViewFn((children) => {
    return (
      <>
        {children.label.propertyView({ label: trans("steps.title"), placeholder: "" })}
        {children.subTitle.propertyView({ label: trans("steps.subTitle"), placeholder: "" })}
        {children.description.propertyView({
          label: trans("steps.description"),
        })}
        {children.icon.propertyView({
          label: trans("avatarComp.icon"),
          IconType: "All",
          tooltip: trans("avatarComp.avatarCompTooltip"),
        })}
      </>
    )
  })
  .build();

const TypeOptions = [
  { label: trans("steps.default"), value: "default" },
  { label: trans("steps.small"), value: "small" },
] as const;

const layoutOptions = [
  { label: trans("descriptions.horizontal"), value: "horizontal" },
  { label: trans("descriptions.vertical"), value: "vertical" },
] as const;

const stepsTypeOptions = [
  { label: trans("steps.default"), value: "default" },
  { label: trans("steps.navigation"), value: "navigation" },
  { label: trans("steps.inline"), value: "inline" },
] as const;

const childrenMap = {
  style: styleControl(stepsStyle),
  onEvent: eventHandlerControl(EventOptions),
  options: optionsControl(DropdownOption, {
    initOptions: [
      { label: "Finished", description: "This is a description.", subTitle: "1" },
      { label: "In Progress", description: "This is a description.", subTitle: "2" },
      { label: "Waiting", description: "This is a description.", subTitle: "3" },
    ],
  }),
  size: dropdownControl(TypeOptions, 'default'),
  direction: dropdownControl(layoutOptions, 'horizontal'),
  status: stringExposingStateControl('status', 'process'),
  hideButton: BoolControl,
  allowClick: BoolControl.DEFAULT_TRUE,
  currentIndex: numberExposingStateControl('current', 1),
  currentTitle: stateComp<string>(''),
  stepsType: dropdownControl(stepsTypeOptions, 'default'),
  percent: numberExposingStateControl('percent', 60),
};

type statusType = 'wait' | 'process' | 'finish' | 'error'

const StepsView = (props: RecordConstructorToView<typeof childrenMap> & { dispatch: (action: CompAction) => void; }) => {

  const [items, setItems] = useState([])
  const onChange = (value: number) => {
    console.log('onChange:', value);
    props.currentIndex.onChange(value);
  };
  useEffect(() => {
    if (props.currentIndex.value <= props.options.length)
      props.dispatch(changeChildAction("currentTitle", props.options[props.currentIndex.value].label, true));
  }, [props.currentIndex.value])
  useEffect(() => {
    setItems(props.options.map(x => {
      let ret = { ...x, title: x.label }
      if ((x.icon as ReactElement)?.props.value === '') delete ret.icon
      return ret
    }) as any)
  }, [props.options])
  return (
    <Container
      $style={props.style}
      stepsType={props.stepsType}
    >
      <Steps
        percent={props.percent.value ? props.percent.value : undefined}
        size={props.size}
        current={props.currentIndex.value}
        items={items}
        direction={props.direction}
        status={['wait', 'process', 'finish', 'error'].includes(props.status.value) ? props.status.value as statusType : 'process'}
        onChange={props.allowClick ? onChange : undefined}
        type={props.stepsType}
      >
      </Steps>
    </Container >
  );
};

let AvatarGroupBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props, dispatch) => <StepsView {...props} dispatch={dispatch} />)
    .setPropertyViewFn((children) => (
      <>
        {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <>
            <Section name={sectionNames.basic}>
              {children.stepsType.propertyView({ label: trans('steps.stepsType') })}
              {children.size.propertyView({ label: trans('steps.size') })}
              {children.options.propertyView({})}
              {children.stepsType.getView() !== 'inline' && children.direction.propertyView({ label: trans('steps.direction') })}
              {children.status.propertyView({ label: trans('steps.status'), tooltip: trans('steps.statusDesc') })}
              {children.currentIndex.propertyView({ label: trans('steps.currentIndex') })}
              {children.percent.propertyView({ label: trans('steps.percent') })}
              {children.allowClick.propertyView({ label: trans('steps.allowClick') })}
            </Section>
            <Section name={sectionNames.interaction}>
              {hiddenPropertyView(children)}
              {children.onEvent.propertyView({})}
            </Section>
          </>
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <Section name={sectionNames.style}>
            {children.style.getPropertyView()}
          </Section>
        )}
      </>
    ))
    .setExposeMethodConfigs([
      {
        method: {
          name: "next",
          description: trans("steps.nextStep"),
          params: [],
        },
        execute: async (comp, params) => {
          let currentIndex = comp.children.currentIndex.getView().value
          if (currentIndex < comp.children.options.getView().length - 1) {
            comp.children.currentIndex.getView().onChange(currentIndex + 1)
          }
        },
      },
      {
        method: {
          name: "Previous",
          description: trans("steps.PreviousStep"),
          params: [],
        },
        execute: async (comp, params) => {
          let currentIndex = comp.children.currentIndex.getView().value
          if (currentIndex > 0) {
            comp.children.currentIndex.getView().onChange(currentIndex - 1)
          }
        },
      },
    ])
    .build();
})();

export const StepsComp = withExposingConfigs(AvatarGroupBasicComp, [
  new NameConfig("currentIndex", trans("steps.currentIndex")),
  new NameConfig("currentTitle", trans("steps.currentTitle")),
  new NameConfig("percent", trans("steps.percent")),
  NameConfigHidden,
]);
