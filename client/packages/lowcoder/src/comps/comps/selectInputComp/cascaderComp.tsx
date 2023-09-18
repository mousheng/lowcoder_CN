import { Cascader } from "antd";
import { CascaderStyleType } from "comps/controls/styleControlConstants";
import { blurMethod, focusMethod } from "comps/utils/methodUtils";
import { trans } from "i18n";
import styled from "styled-components";
import { UICompBuilder, withDefault } from "../../generators";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import { CascaderChildren, CascaderPropertyView, defaultDataSource } from "./cascaderContants";
import { getStyle } from "./selectCompConstants";
import { refMethods } from "comps/generators/withMethodExposing";
import { JSONObject } from "@lowcoder-ee/index.sdk";
import _ from "lodash";
import { SelectInputInvalidConfig, useSelectInputValidate } from "./selectInputConstants";

const CascaderStyle = styled(Cascader) <{ $style: CascaderStyleType }>`
  width: 100%;
  ${(props) => props.$style && getStyle(props.$style)}
`;

let CascaderBasicComp = (function () {
  const childrenMap = CascaderChildren;

  return new UICompBuilder(childrenMap, (props) => {
    const [validateState, handleValidate] = useSelectInputValidate(props);

    return props.label({
      required: props.required,
      style: props.style,
      children: (
        <CascaderStyle
          ref={props.viewRef}
          value={props.value.value}
          disabled={props.disabled}
          defaultValue={props.value.value}
          options={props.options}
          allowClear={props.allowClear}
          placeholder={props.placeholder}
          showSearch={props.showSearch}
          $style={props.style}
          onFocus={() => props.onEvent("focus")}
          onBlur={() => props.onEvent("blur")}
          onChange={(value: (string | number)[], selectOptions) => {
            handleValidate(value);
            props.value.onChange(value as string[]);
            props.selectedObject.onChange(selectOptions?.map(x => {
              let ret = _.cloneDeep(x)
              ret?.children && delete ret.children
              return ret
            }) as JSONObject[]);
            props.onEvent("change");
          }}
        />
      ),
      ...validateState,
    });
  })
    .setPropertyViewFn((children) => (
      <>
        <CascaderPropertyView {...children} />
      </>
    ))
    .setExposeMethodConfigs(refMethods([focusMethod, blurMethod]))
    .build();
})();

const CascaderComp = withExposingConfigs(CascaderBasicComp, [
  new NameConfig("value", trans("selectInput.valueDesc")),
  new NameConfig("selectedObject", trans("selectInput.selectedObjectDesc")),
  SelectInputInvalidConfig,
  ...CommonNameConfig,
]);

export const CascaderWithDefault = withDefault(CascaderComp, {
  options: defaultDataSource,
});
