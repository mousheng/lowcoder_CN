import { StringControl } from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { MultiCompBuilder } from "comps/generators/multi";
import { BranchDiv, notificationInstance } from "lowcoder-design";
import { trans } from "i18n";
import { millisecondsControl } from "../millisecondControl";
import { messageInstance } from "lowcoder-design";

const childrenMap = {
  messageType: dropdownControl(
    [
      { label: trans("message"), value: "message" },
      { label: trans("notification"), value: "notification" }
    ] as const,
    'message'
  ),
  placement: dropdownControl(
    [
      { "label": trans('top'), "value": "top" },
      { "label": trans('bottom'), "value": "bottom" },
      { "label": trans('topLeft'), "value": "topLeft" },
      { "label": trans('topRight'), "value": "topRight" },
      { "label": trans('bottomLeft'), "value": "bottomLeft" },
      { "label": trans('bottomRight'), "value": "bottomRight" },
    ] as const,
    'top'
  ),
  text: StringControl,
  description: StringControl,
  level: dropdownControl(
    [
      { label: trans("information"), value: "info" },
      { label: trans("success"), value: "success" },
      { label: trans("warning"), value: "warning" },
      { label: trans("error"), value: "error" },
    ] as const,
    "info"
  ),
  duration: millisecondsControl({ left: 0, right: 10, defaultValue: 3, unit: "s" }),
};

export const MessageAction = new MultiCompBuilder(
  childrenMap,
  (props) => () => {
    if (props.messageType === 'message')
      messageInstance[props.level](props.text, props.duration / 1000)
    else {
      notificationInstance[props.level]({
        message: props.text,
        description: props.description,
        placement: props.placement,
        duration: props.duration / 1000,
      })
    }
  }
)
  .setPropertyViewFn((children) => (
    <>
      <BranchDiv>
        {children.messageType.propertyView({
          label: trans("eventHandler.messageType"),
        })}
      </BranchDiv>
      <BranchDiv>
        {children.text.propertyView({
          label: trans("eventHandler.text"),
          layout: "vertical",
        })}
      </BranchDiv>
      {children.messageType.getView() === "notification" && <BranchDiv>
        {children.description.propertyView({
          label: trans("eventHandler.description"),
          layout: "vertical",
        })}
      </BranchDiv>}
      <BranchDiv $type={"inline"}>
        {children.level.propertyView({
          label: trans("eventHandler.level"),
        })}
      </BranchDiv>
      {children.messageType.getView() === "notification" && <BranchDiv $type={"inline"}>
        {children.placement.propertyView({
          label: trans("eventHandler.placement"),
        })}
      </BranchDiv>}
      <BranchDiv>
        {children.duration.propertyView({
          label: trans("eventHandler.duration"),
          layout: "vertical",
          placeholder: "3s",
          tooltip: trans("eventHandler.notifyDurationTooltip", { max: 10 }),
        })}
      </BranchDiv>
    </>
  ))
  .build();
