import { RecordConstructorToComp } from "lowcoder-core";
import { BoolCodeControl } from "../../controls/codeControl";
import { LabelControl } from "../../controls/labelControl";
import {
  arrayStringExposingStateControl,
  stringExposingStateControl,
} from "../../controls/codeStateControl";
import { Section, sectionNames } from "lowcoder-design";
import { SelectInputOptionControl } from "../../controls/optionsControl";
import { ChangeEventHandlerControl } from "../../controls/eventHandlerControl";
import {
  SelectInputValidationChildren,
  SelectInputValidationSection,
} from "./selectInputConstants";
import { formDataChildren, FormDataPropertyView } from "../formComp/formDataConstants";
import { styleControl } from "comps/controls/styleControl";
import { RadioStyle } from "comps/controls/styleControlConstants";
import { dropdownControl } from "../../controls/dropdownControl";
import { hiddenPropertyView, disabledPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { RefControl } from "comps/controls/refControl";

import { useContext } from "react";
import { EditorContext } from "comps/editorState";

export const RadioLayoutOptions = [
  { label: trans("radio.horizontal"), value: "horizontal" },
  { label: trans("radio.vertical"), value: "vertical" },
  { label: trans("radio.autoColumns"), value: "auto_columns" },
] as const;

export const RadioChildrenMap = {
  value: stringExposingStateControl("value"),
  label: LabelControl,
  disabled: BoolCodeControl,
  onEvent: ChangeEventHandlerControl,
  options: SelectInputOptionControl,
  style: styleControl(RadioStyle),
  layout: dropdownControl(RadioLayoutOptions, "horizontal"),
  viewRef: RefControl<HTMLDivElement>,

  ...SelectInputValidationChildren,
  ...formDataChildren,
};

export const RadioPropertyView = (
  children: RecordConstructorToComp<
    typeof RadioChildrenMap & { hidden: typeof BoolCodeControl } & {
      value:
        | ReturnType<typeof stringExposingStateControl>
        | ReturnType<typeof arrayStringExposingStateControl>;
    }
  >
) => (
  <>
    <Section name={sectionNames.basic}>
      {children.options.propertyView({})}
      {children.value.propertyView({ label: trans("prop.defaultValue") })}
    </Section>

    {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
      <><SelectInputValidationSection {...children} />
      <FormDataPropertyView {...children} />
      <Section name={sectionNames.interaction}>
        {children.onEvent.getPropertyView()}
        {disabledPropertyView(children)}
        {hiddenPropertyView(children)}
      </Section></>
    )}

    {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
      <Section name={sectionNames.layout}>
        {children.layout.propertyView({
          label: trans("radio.options"),
          tooltip: (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>{trans("radio.horizontalTooltip")}</div>
              <div>{trans("radio.verticalTooltip")}</div>
              <div>{trans("radio.autoColumnsTooltip")}</div>
            </div>
          ),
        })}
      </Section>
    )}

    {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && ( 
      children.label.getPropertyView() 
    )}

    {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
      <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
    )}
  </>
);
