import { dropdownControl } from "comps/controls/dropdownControl";
import { stringExposingStateControl } from "comps/controls/codeStateControl";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import { Section, sectionNames } from "lowcoder-design";
import styled, { css } from "styled-components";
import { AlignCenter } from "lowcoder-design";
import { AlignLeft } from "lowcoder-design";
import { AlignRight } from "lowcoder-design";
import { UICompBuilder } from "../generators";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "../generators/withExposing";
import { markdownCompCss, TacoMarkDown } from "lowcoder-design";
import { styleControl } from "comps/controls/styleControl";
import { TextStyle, TextStyleType } from "comps/controls/styleControlConstants";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { alignWithJustifyControl } from "comps/controls/alignControl";
import { BoolControl } from "../controls/boolControl";

import { MarginControl } from "../controls/marginControl";
import { PaddingControl } from "../controls/paddingControl";

import React, { useContext } from "react";
import { EditorContext } from "comps/editorState";

const getStyle = (style: TextStyleType) => {
  return css`
    border-radius: ${(style.radius ? style.radius : "4px")};
    border: ${(style.borderWidth ? style.borderWidth : "0px")} solid ${style.border};
    color: ${style.text};
    font-size: ${style.textSize} !important;
    font-weight: ${style.textWeight} !important;
    font-family: ${style.fontFamily} !important;
    background-color: ${style.background};
    .markdown-body a {
      color: ${style.links};
    }
    .markdown-body {
      h1 {
        line-height: 32px;
      }
      h2 {
        line-height: 25px;
      }
      h3 {
        line-height: 14px;
      }
      h4 {
        line-height: 10px;
      }
      h5 {
        line-height: 10px;
      }
      h6 {
        line-height: 10px;
      }
      p {
        line-height: 11px!important;
      }
    }

    .markdown-body {
      &,
      p,
      div,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        color: ${style.text};
      }
      img,
      pre {
        background-color: ${style.background};
        code {
          color: #000000;
        }
      }
    }
  `;
};

const TextContainer = styled.div<{ $type: string; $styleConfig: TextStyleType }>`
  height: 100%;
  overflow: auto;
  margin: 0;
  ${(props) =>
    props.$type === "text" && "white-space:break-spaces;line-height: 1.9;padding: 3px 0;"};
  ${(props) => props.$styleConfig && getStyle(props.$styleConfig)}
  display: flex;
  ${markdownCompCss};
  overflow-wrap: anywhere;
  .markdown-body {
    overflow-wrap: anywhere;
  }
`;
const AlignTop = styled(AlignLeft)`
  transform: rotate(90deg);
`;
const AlignBottom = styled(AlignRight)`
  transform: rotate(90deg);
`;
const AlignVerticalCenter = styled(AlignCenter)`
  transform: rotate(90deg);
`;

const typeOptions = [
  {
    label: "Markdown",
    value: "markdown",
  },
  {
    label: trans("text"),
    value: "text",
  },
] as const;

const fontSizeOptions = [
  {
    label: "S",
    value: "0.875rem",
  },
  {
    label: "M",
    value: "1rem",
  },
  {
    label: "L",
    value: "1.25rem",
  },
  {
    label: "XL",
    value: "1.875rem",
  },
  {
    label: "XXL",
    value: "3rem",
  },
  {
    label: "3XL",
    value: "3.75rem",
  },
] as const;

const VerticalAlignmentOptions = [
  { label: <AlignTop />, value: "flex-start" },
  { label: <AlignVerticalCenter />, value: "center" },
  { label: <AlignBottom />, value: "flex-end" },
] as const;


let TextTmpComp = (function () {  

  const childrenMap = {
    text: stringExposingStateControl(
      "text",
      trans("textShow.text", { name: "{{currentUser.name}}" })
    ),
    autoHeight: AutoHeightControl,
    type: dropdownControl(typeOptions, "markdown"),
    horizontalAlignment: alignWithJustifyControl(),
    verticalAlignment: dropdownControl(VerticalAlignmentOptions, "center"),
    style: styleControl(TextStyle),
    fontSize: dropdownControl(fontSizeOptions, "0.875rem"),
    bold: BoolControl,
    italic: BoolControl,
  };
  return new UICompBuilder(childrenMap, (props) => {
    const value = props.text.value;
    const calcLineHeight = (fontSize: string) => {
      if (fontSize === '0.875rem')
        return '18px';
      else if (fontSize === '1rem')
        return '18px'
      else if (fontSize === '1.25rem')
        return '24px'
      else if (fontSize === '1.875rem')
        return '40px'
      else if (fontSize === '3rem')
        return '66px'
      else if (fontSize === '3.75rem')
        return '80px'
    }
    return (
      <TextContainer
        $type={props.type}
        $styleConfig={props.style}
        style={{
          justifyContent: props.horizontalAlignment,
          alignItems: props.autoHeight ? "center" : props.verticalAlignment,
          textAlign: props.horizontalAlignment,
          fontSize: props.fontSize,
          fontWeight: props.bold ? "bold" : "normal",
          fontStyle: props.italic ? "italic" : "normal",
          lineHeight: calcLineHeight(props.fontSize),
        }}
      >
        {props.type === "markdown" ? <TacoMarkDown>{value}</TacoMarkDown> : value}
      </TextContainer>
    );
  })
    .setPropertyViewFn((children) => {
      return (
        <>
        
          <Section name={sectionNames.basic}>
            {children.type.propertyView({
              label: trans("value"),
              tooltip: trans("textShow.valueTooltip"),
              radioButton: true,
            })}
            {children.text.propertyView({})}
          </Section>

          {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <Section name={sectionNames.interaction}>
              {hiddenPropertyView(children)}
            </Section>
          )}
        
          {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <>
              <Section name={sectionNames.layout}>
                {children.autoHeight.getPropertyView()}
                {!children.autoHeight.getView() &&
                  children.verticalAlignment.propertyView({
                    label: trans("textShow.verticalAlignment"),
                    radioButton: true,
                  })}
                {children.horizontalAlignment.propertyView({
                  label: trans("textShow.horizontalAlignment"),
                  radioButton: true,
                })}
              </Section>
              <Section name={sectionNames.style}>
                {children.style.getPropertyView()}
              </Section>
            </>
          )}
          {children.type.getView() === 'text' &&
            (<Section name={trans("textShow.fontStyle")}>
              {children.fontSize.propertyView({
                label: trans("textShow.fontSize"),
              })}
              {children.bold.propertyView({
                label: trans("textShow.bold"),
              })}
              {children.italic.propertyView({
                label: trans("textShow.italic"),
              })}
            </Section>)}

          {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <Section name={sectionNames.interaction}>
              {hiddenPropertyView(children)}
            </Section>
          )}
        
          {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <>
              <Section name={sectionNames.layout}>
                {children.autoHeight.getPropertyView()}
                {!children.autoHeight.getView() &&
                  children.verticalAlignment.propertyView({
                    label: trans("textShow.verticalAlignment"),
                    radioButton: true,
                  })}
                {children.horizontalAlignment.propertyView({
                  label: trans("textShow.horizontalAlignment"),
                  radioButton: true,
                })}
              </Section>
              <Section name={sectionNames.style}>
                {children.style.getPropertyView()}
              </Section>
            </>
          )}
        </>
      );
    })
    .build();
})();

TextTmpComp = class extends TextTmpComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

export const TextComp = withExposingConfigs(TextTmpComp, [
  new NameConfig("text", trans("textShow.textDesc")),
  NameConfigHidden,
]);
