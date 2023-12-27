import { Divider, DividerProps } from "antd";
import { StringControl } from "comps/controls/codeControl";
import { BoolControl } from "comps/controls/boolControl";
import { alignControl } from "comps/controls/alignControl";
import { UICompBuilder } from "comps/generators";
import { NameConfig, NameConfigHidden } from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import _ from "lodash";
import styled from "styled-components";
import { styleControl } from "comps/controls/styleControl";
import { DividerStyle, DividerStyleType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import { migrateOldData } from "comps/generators/simpleGenerators";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";

import { useContext } from "react";
import { EditorContext } from "comps/editorState";

type IProps = DividerProps & { $style: DividerStyleType; dashed: boolean };

// TODO: find out how to set border style when text is active
// TODO: enable type "vertical" https://ant.design/components/divider

const StyledDivider = styled(Divider)<IProps>`
  margin-top: 3.5px;
  .ant-divider-inner-text {
    height: 32px;
    display: flex;
    align-items: center;
    font-size: ${(props) => props.$style.textSize};
  }
  min-width: 0;	
  width: ${(props) => {	
    return widthCalculator(props.$style.margin);	
  }};	
  min-height: ${(props) => {	
    return heightCalculator(props.$style.margin);	
  }};	
  margin: ${(props) => {	
    return props.$style.margin;	
  }};	
  padding: ${(props) => props.$style.padding};
  
  border-top: ${(props) => (props.$style.borderWidth ? props.$style.borderWidth : "1px")} ${(props) => (props.dashed ? "dashed" : "solid")} ${(props) => props.$style.color};

  .ant-divider-inner-text::before, .ant-divider-inner-text::after {
    border-block-start: ${(props) => (props.$style.borderWidth ? props.$style.borderWidth : "1px")} ${(props) => (props.dashed ? "dashed" : "solid")} ${(props) => props.$style.color} !important;
    border-block-start-color: inherit;
    border-block-end: 0;
  }

  &.ant-divider-horizontal.ant-divider-with-text {
    margin: 0;
    border-top-color: ${(props) => props.$style.color};
    color: ${(props) => props.$style.text};
  }
`;

const childrenMap = {
  title: StringControl,
  dashed: BoolControl,
  align: alignControl(),
  style: styleControl(DividerStyle),
};

function fixOldStyleData(oldData: any) {
  if (oldData && oldData.hasOwnProperty("color")) {
    return {
      ...oldData,
      style: {
        color: oldData.color,
        text: "",
      },
    };
  }
  return oldData;
}

// Compatible with historical style data 2022-8-26
export const DividerComp = migrateOldData(
  new UICompBuilder(childrenMap, (props) => {
    return (
      <StyledDivider orientation={props.align} dashed={props.dashed} $style={props.style}>
        {props.title}
      </StyledDivider>
    );
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.title.propertyView({ label: trans("divider.title") })}
          </Section>

          {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <Section name={sectionNames.interaction}>
              {hiddenPropertyView(children)}
            </Section>
          )}

          {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <>
              <Section name={sectionNames.layout}>
                {!_.isEmpty(children.title.getView()) &&
                  children.align.propertyView({
                    label: trans("divider.align"),
                    radioButton: true,
                  })}
              </Section>
              <Section name={sectionNames.style}>
                {children.dashed.propertyView({ label: trans("divider.dashed") })}
                {children.style.getPropertyView()}
              </Section>
            </>
          )}
        </>
      );
    })
    .setExposeStateConfigs([
      new NameConfig("dashed", trans("divider.dashedDesc")),
      new NameConfig("title", trans("divider.titleDesc")),
      new NameConfig("align", trans("divider.alignDesc")),
      NameConfigHidden,
    ])
    .build(),
  fixOldStyleData
);
