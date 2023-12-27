import _ from "lodash";
import dayjs from "dayjs";
import { RecordConstructorToComp, RecordConstructorToView } from "lowcoder-core";
import {
  BoolCodeControl,
  CustomRuleControl,
  RangeControl,
  StringControl,
} from "../../controls/codeControl";
import { BoolControl } from "../../controls/boolControl";
import {
  blurEvent,
  changeEvent,
  eventHandlerControl,
  focusEvent,
} from "../../controls/eventHandlerControl";
import { stringExposingStateControl } from "../../controls/codeStateControl";
import { LabelControl } from "../../controls/labelControl";
import { UICompBuilder, withDefault } from "../../generators";
import {
  CommonNameConfig,
  depsConfig,
  NameConfig,
  withExposingConfigs,
} from "../../generators/withExposing";
import { formDataChildren, FormDataPropertyView } from "../formComp/formDataConstants";
import { styleControl } from "comps/controls/styleControl";
import { DateTimeStyle, DateTimeStyleType } from "comps/controls/styleControlConstants";
import { withMethodExposing } from "../../generators/withMethodExposing";
import {
  disabledPropertyView,
  formatPropertyView,
  hiddenPropertyView,
  hourStepPropertyView,
  maxTimePropertyView,
  minTimePropertyView,
  minuteStepPropertyView,
  requiredPropertyView,
  SecondStepPropertyView,
} from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { TIME_FORMAT, TimeParser } from "util/dateTimeUtils";
import React, { ReactNode, useState, useContext } from "react";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";
import { Section, sectionNames } from "components/Section";
import { dateRefMethods, disabledTime, handleDateChange } from "comps/comps/dateComp/dateCompUtil";
import { TimeUIView } from "./timeUIView";
import { TimeRangeUIView } from "comps/comps/dateComp/timeRangeUIView";
import { RefControl } from "comps/controls/refControl";
import { CommonPickerMethods } from "antd/lib/date-picker/generatePicker/interface";
import { TimePickerProps } from "antd";

import { EditorContext } from "comps/editorState";

const EventOptions = [changeEvent, focusEvent, blurEvent] as const;

const validationChildren = {
  required: BoolControl,
  minTime: StringControl,
  maxTime: StringControl,
  customRule: CustomRuleControl,
};

const commonChildren = {
  label: LabelControl,
  placeholder: withDefault(StringControl, trans("time.placeholder")),
  format: StringControl,
  disabled: BoolCodeControl,
  onEvent: eventHandlerControl(EventOptions),
  showTime: BoolControl,
  use12Hours: BoolControl,
  hourStep: RangeControl.closed(1, 24, 1),
  minuteStep: RangeControl.closed(1, 60, 1),
  secondStep: RangeControl.closed(1, 60, 1),
  style: styleControl(DateTimeStyle),
  suffixIcon: withDefault(IconControl, "/icon:regular/clock"),
  viewRef: RefControl<CommonPickerMethods>,
  ...validationChildren,
};

const timePickerComps = (props: RecordConstructorToView<typeof commonChildren>) =>
  _.pick(props, "format", "use12Hours", "minuteStep", "secondStep", "placeholder");

/* const commonBasicSection = (children: RecordConstructorToComp<typeof commonChildren>) => [
  formatPropertyView({ children }),
  children.use12Hours.propertyView({ label: trans("prop.use12Hours") }),
]; */

const commonAdvanceSection = (children: RecordConstructorToComp<typeof commonChildren>) => [
  hourStepPropertyView(children),
  minuteStepPropertyView(children),
  SecondStepPropertyView(children),
];

function validate(
  props: RecordConstructorToView<typeof validationChildren> & {
    value: { value: string };
  }
): {
  validateStatus: "success" | "warning" | "error";
  help?: string;
} {
  if (props.customRule) {
    return { validateStatus: "error", help: props.customRule };
  }

  const current = dayjs(props.value.value, TimeParser);
  if ((props.required && props.value.value==='') ||  !current.isValid()) {
    return { validateStatus: "error", help: trans("prop.required") };
  }
  return { validateStatus: "success" };
}

const childrenMap = {
  value: stringExposingStateControl("value"),
  ...commonChildren,
  ...formDataChildren,
};

type hourStepType =  TimePickerProps['hourStep'];
type minuteStepType =  TimePickerProps['minuteStep'];
type secondStepType =  TimePickerProps['secondStep'];

export type TimeCompViewProps = Pick<
  RecordConstructorToView<typeof childrenMap>,
  "disabled" | "use12Hours" | "format" | "viewRef"
> & Pick<
  TimePickerProps, "hourStep" | "minuteStep" | "secondStep"
> & {
  onFocus: () => void;
  onBlur: () => void;
  $style: DateTimeStyleType;
  disabledTime: () => ReturnType<typeof disabledTime>;
  suffixIcon?: ReactNode | false;
  placeholder?: string | [string, string];
};

export const timePickerControl = new UICompBuilder(childrenMap, (props) => {
  let time = dayjs(null);
  if(props.value.value !== '') {
    time = dayjs(props.value.value, TimeParser);
  }
  const [activate , setActivate] =useState(false)
  return props.label({
    required: props.required,
    style: props.style,
    children: (
      <TimeUIView
        viewRef={props.viewRef}
        $style={props.style}
        disabled={props.disabled}
        value={time.isValid() ? time : null}
        disabledTime={() => disabledTime(props.minTime, props.maxTime)}
        {...timePickerComps(props)}
        hourStep={props.hourStep as hourStepType}
        minuteStep={props.minuteStep as minuteStepType}
        secondStep={props.secondStep as secondStepType}
        placeholder={props.placeholder}
        onChange={(time) => {
          handleDateChange(
            time && time.isValid() ? time.format(TIME_FORMAT) : "",
            props.value.onChange,
            props.onEvent
          );
        }}
        onFocus={() => {props.onEvent("focus");setActivate(true)}}
        onBlur={() => props.onEvent("blur")}
        suffixIcon={hasIcon(props.suffixIcon) && props.suffixIcon}
      />
    ),
    ... activate ? validate(props) : undefined,
  });
})
  .setPropertyViewFn((children) => (
    <>
      <Section name={sectionNames.basic}>
        {children.value.propertyView({
          label: trans("prop.defaultValue"),
          tooltip: trans("time.formatTip"),
        })}
        
      </Section>

      <FormDataPropertyView {...children} />

      {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
        <><Section name={sectionNames.validation}>
          {requiredPropertyView(children)}
          {minTimePropertyView(children)}
          {maxTimePropertyView(children)}
          {children.customRule.propertyView({})}
        </Section>
        <Section name={sectionNames.interaction}>
          {children.onEvent.getPropertyView()}
          {disabledPropertyView(children)}
          {hiddenPropertyView(children)}
        </Section></>
      )}

      {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && children.label.getPropertyView()}
      {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
        <Section name={sectionNames.layout}>
          {children.format.propertyView({ label: trans("time.format") })}
          {children.placeholder.propertyView({ label: trans("time.placeholderText") })}
        </Section>
      )}

      {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
        <Section name={sectionNames.advanced}>
          {commonAdvanceSection(children)}
          {children.use12Hours.propertyView({ label: trans("prop.use12Hours") })}
          {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
        </Section>
      )}

      {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
        <Section name={sectionNames.style}>
          {children.style.getPropertyView()}
        </Section>
      )}
    </>
  ))
  .setExposeMethodConfigs(dateRefMethods)
  .build();

export const timeRangeControl = (function () {
  const childrenMap = {
    start: stringExposingStateControl("start"),
    end: stringExposingStateControl("end"),
    ...commonChildren,
  };

  return new UICompBuilder(childrenMap, (props) => {
    let start = null;
    if(props.start.value !== '') {
      start = dayjs(props.start.value, TimeParser);
    }
    let end = null;
    if(props.end.value !== '') {
      end = dayjs(props.end.value, TimeParser);
    }

    const children = (
      <TimeRangeUIView
        viewRef={props.viewRef}
        $style={props.style}
        disabled={props.disabled}
        start={start?.isValid() ? start : null}
        end={end?.isValid() ? end : null}
        disabledTime={() => disabledTime(props.minTime, props.maxTime)}
        {...timePickerComps(props)}
        hourStep={props.hourStep as hourStepType}
        minuteStep={props.minuteStep as minuteStepType}
        secondStep={props.secondStep as secondStepType}
        placeholder={[props.placeholder, props.placeholder]}
        onChange={(start, end) => {
          props.start.onChange(start && start.isValid() ? start.format(TIME_FORMAT) : "");
          props.end.onChange(end && end.isValid() ? end.format(TIME_FORMAT) : "");
          props.onEvent("change");
        }}
        onFocus={() => props.onEvent("focus")}
        onBlur={() => props.onEvent("blur")}
        suffixIcon={hasIcon(props.suffixIcon) && props.suffixIcon}
      />
    );

    const startResult = validate({ ...props, value: props.start });
    const endResult = validate({ ...props, value: props.end });

    return props.label({
      required: props.required,
      style: props.style,
      children: children,
      ...(startResult.validateStatus !== "success"
        ? startResult
        : endResult.validateStatus !== "success"
        ? endResult
        : startResult),
    });
  })
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.start.propertyView({
            label: trans("time.start"),
            tooltip: trans("time.formatTip"),
          })}
          {children.end.propertyView({
            label: trans("time.end"),
            tooltip: trans("time.formatTip"),
          })}
        </Section>

        {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
          <><Section name={sectionNames.validation}>
            {requiredPropertyView(children)}
            {minTimePropertyView(children)}
            {maxTimePropertyView(children)}
            {children.customRule.propertyView({})}
          </Section>
          <Section name={sectionNames.interaction}>
            {children.onEvent.getPropertyView()}
            {disabledPropertyView(children)}
            {hiddenPropertyView(children)}
          </Section></>
        )}

        {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && children.label.getPropertyView()}
        {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={sectionNames.layout}>
            {children.format.propertyView({ label: trans("time.format") })}
            {children.placeholder.propertyView({ label: trans("time.placeholderText") })}
          </Section>
        )}

        {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={sectionNames.advanced}>
            {commonAdvanceSection(children)}
            {children.use12Hours.propertyView({ label: trans("prop.use12Hours") })}
            {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
          </Section>
        )}

        {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
          <Section name={sectionNames.style}>
            {children.style.getPropertyView()}
          </Section>
        )}
      </>
    ))
    .build();
})();

export const TimePickerComp = withExposingConfigs(timePickerControl, [
  new NameConfig("value", trans("export.timePickerValueDesc")),
  depsConfig({
    name: "formattedValue",
    desc: trans("export.timePickerFormattedValueDesc"),
    depKeys: ["value", "format"],
    func: (input) => {
      const mom = dayjs(input.value, TimeParser);
      return mom.isValid() ? mom.format(input.format) : "";
    },
  }),
  depsConfig({
    name: "invalid",
    desc: trans("export.invalidDesc"),
    depKeys: ["value", "required", "minTime", "maxTime", "customRule"],
    func: (input) =>
      validate({
        ...input,
        value: { value: input.value },
      } as any).validateStatus !== "success",
  }),
  ...CommonNameConfig,
]);

export let TimeRangeComp = withExposingConfigs(timeRangeControl, [
  new NameConfig("start", trans("export.timeRangeStartDesc")),
  new NameConfig("end", trans("export.timeRangeEndDesc")),
  depsConfig({
    name: "formattedValue",
    desc: trans("export.timeRangeFormattedValueDesc"),
    depKeys: ["start", "end", "format"],
    func: (input) => {
      const start = dayjs(input.start, TimeParser);
      const end = dayjs(input.end, TimeParser);
      return [
        start.isValid() && start.format(input.format),
        end.isValid() && end.format(input.format),
      ]
        .filter((item) => item)
        .join(" - ");
    },
  }),
  depsConfig({
    name: "formattedStartValue",
    desc: trans("export.timeRangeFormattedStartValueDesc"),
    depKeys: ["start", "format"],
    func: (input) => {
      const start = dayjs(input.start, TimeParser);
      return start.isValid() && start.format(input.format);
    },
  }),
  depsConfig({
    name: "formattedEndValue",
    desc: trans("export.timeRangeFormattedEndValueDesc"),
    depKeys: ["end", "format"],
    func: (input) => {
      const end = dayjs(input.end, TimeParser);
      return end.isValid() && end.format(input.format);
    },
  }),
  depsConfig({
    name: "invalid",
    desc: trans("export.invalidDesc"),
    depKeys: ["start", "end", "required", "minTime", "maxTime", "customRule"],
    func: (input) =>
      validate({
        ...input,
        value: { value: input.start },
      }).validateStatus !== "success" ||
      validate({
        ...input,
        value: { value: input.end },
      }).validateStatus !== "success",
  }),
  ...CommonNameConfig,
]);

TimeRangeComp = withMethodExposing(TimeRangeComp, [
  ...dateRefMethods,
  {
    method: {
      name: "clearAll",
      description: trans("date.clearAllDesc"),
      params: [],
    },
    execute: (comp) => {
      comp.children.start.getView().onChange("");
      comp.children.end.getView().onChange("");
    },
  },
  {
    method: {
      name: "resetAll",
      description: trans("date.resetAllDesc"),
      params: [],
    },
    execute: (comp) => {
      comp.children.start.getView().reset();
      comp.children.end.getView().reset();
    },
  },
]);
