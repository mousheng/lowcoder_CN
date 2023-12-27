import { trans } from "i18n";
import { green, red, yellow } from "@ant-design/colors";
import { FormItemProps } from "antd";
import { BoolControl } from "comps/controls/boolControl";
import { NumberControl, StringControl } from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { withDefault } from "comps/generators";
import { MultiCompBuilder } from "comps/generators/multi";
import { labelCss, Section, Tooltip, UnderlineCss } from "lowcoder-design";
import { ValueFromOption } from "lowcoder-design";
import { isEmpty } from "lodash";
import { ReactNode } from "react";
import styled, { css } from "styled-components";
import { AlignLeft } from "lowcoder-design";
import { AlignRight } from "lowcoder-design";
import { StarIcon } from "lowcoder-design";

import { heightCalculator, widthCalculator } from "./styleControlConstants";

type LabelViewProps = Pick<FormItemProps, "required" | "help" | "validateStatus"> & {
  children: ReactNode;
  style?: Record<string, string>;
};

const StyledStarIcon = styled(StarIcon)`
  margin-left: 4px;
  flex-shrink: 0;
`;

function getStyle(style: any) {
  return css`
    > div:nth-of-type(1) {
      > div:nth-of-type(1) > span {
        color: ${style.label};
      }
    }
    > div:nth-of-type(2) {
      color: ${style.validate};
    }
  `;
}

const LabelViewWrapper = styled.div<{ $style: any }>`
  ${(props) => props.$style && getStyle(props.$style)}
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const MainWrapper = styled.div<{
  position: PositionOptionsValue;
  hasLabel: boolean;
}>`
  flex-direction: ${(props) => props.position};
  flex-grow: 1;
  width: 100%;
  margin-top: ${(props) => (props.position === "column" && props.hasLabel ? "4px" : 0)};
  height: ${(props) =>
    props.position === "column" && props.hasLabel ? "calc(100% - 4px)" : "100%"};
  display: flex;
  align-items: ${(props) => (props.position === "row" ? "center" : "start")};
  flex-shrink: 0;
`;

const LabelWrapper = styled.div<{
  align: AlignOptionsValue;
  position: PositionOptionsValue;
  hasToolTip: boolean;
}>`
  display: flex;
  align-items: center;
  margin-right: 8px;
  margin-bottom: ${(props) => (props.position === "row" ? 0 : "3.5px")};
  justify-content: ${(props) => (props.align === "left" ? "start" : "end")};
  max-width: ${(props) => (props.position === "row" ? "80%" : "100%")};
  flex-shrink: 0;
`;

const Label = styled.span<{ border: boolean }>`
  ${labelCss};
  ${(props) => props.border && UnderlineCss};
  width: fit-content;
  user-select: text;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  display: inline-block;
`;

const ChildrenWrapper = styled.div`
  flex-grow: 1;
  min-width: calc(30% - 8px);
`;

const HelpWrapper = styled.div<{
  marginLeft: string;
  color?: string;
  position?: string;
}>`
  ${labelCss};
  margin-top: ${(props) => props.position === 'row' ? '8px' : ''};
  margin-left: ${(props) => props.marginLeft};
  color: ${(props) => props.color};
  display: block;
  font-size: 13px;
`;

const TooltipWrapper = styled.span`
  word-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
`;

const PositionOptions = [
  { label: trans("labelProp.left"), value: "row" },
  { label: trans("labelProp.top"), value: "column" },
] as const;
type PositionOptionsValue = ValueFromOption<typeof PositionOptions>;

const AlignOptions = [
  { label: <AlignLeft />, value: "left" },
  { label: <AlignRight />, value: "right" },
] as const;
type AlignOptionsValue = ValueFromOption<typeof AlignOptions>;

const WidthUnitOptions = [
  { label: "px", value: "px" },
  { label: "%", value: "%" },
];

function getLabelWidth(width: number, widthUnit: string): string {
  if (width <= 0 || isNaN(width)) {
    return "0%";
  }
  return width + widthUnit;
}

export const LabelControl = (function () {
  const childrenMap = {
    text: withDefault(StringControl, trans("label")),
    tooltip: StringControl,
    hidden: BoolControl,
    width: withDefault(NumberControl, 33),
    widthUnit: dropdownControl(WidthUnitOptions, "%"),
    position: dropdownControl(PositionOptions, "row"),
    align: dropdownControl(AlignOptions, "left"),
  };
  return new MultiCompBuilder(childrenMap, (props) => (args: LabelViewProps) => (
    <LabelViewWrapper $style={args.style}>
      <MainWrapper
        position={props.position}
        hasLabel={!!props.text}
        style={{
          margin: args && args.style ? args?.style?.margin : 0,
          // padding: args && args.style ? args?.style?.padding : 0,	
          width: widthCalculator(
            args && args.style ? args?.style?.margin : "0px"
          ),
          height: heightCalculator(
            args && args.style ? args?.style?.margin : "0px"
          ),
        }}
      >
        {!props.hidden && !isEmpty(props.text) && (
          <LabelWrapper
            align={props.align}
            style={{
              width:
                props.position === "row" ? getLabelWidth(props.width, props.widthUnit) : "100%",
              maxWidth: props.position === "row" ? "70%" : "100%",
            }}
            position={props.position}
            hasToolTip={!!props.tooltip}
          >
            <Tooltip
              title={props.tooltip && <TooltipWrapper>{props.tooltip}</TooltipWrapper>}
              arrow={{
                pointAtCenter: true,
              }}
              placement="top"
              color="#2c2c2c"
              getPopupContainer={(node: any) => node.closest(".react-grid-item")}
            >
              <Label border={!!props.tooltip}>{props.text}</Label>
            </Tooltip>
            {args.required && <StyledStarIcon />}
            {args.help && props.position === 'column' && (
              <HelpWrapper
                marginLeft={'3px'}
                position={props.position}
                color={
                  args.validateStatus === "error"
                    ? red.primary
                    : args.validateStatus === "warning"
                      ? yellow.primary
                      : green.primary
                }
              >
                {args.help}
              </HelpWrapper>
            )}
          </LabelWrapper>
        )}
        <ChildrenWrapper
          style={{
            width:
              props.position === "row"
                ? `calc(100% - ${getLabelWidth(props.width, props.widthUnit)} - 8px)`
                : "100%",
            height: props.position === "column" && !!props.text ? "calc(100% - 22px)" : "100%",
          }}
        >
          {args.children}
        </ChildrenWrapper>
      </MainWrapper>

      {args.help && props.position === 'row' && (
        <HelpWrapper
          marginLeft={
            `calc(min(${getLabelWidth(props.width, props.widthUnit)} , 70%) + 8px)`
          }
          color={
            args.validateStatus === "error"
              ? red.primary
              : args.validateStatus === "warning"
                ? yellow.primary
                : green.primary
          }
        >
          {args.help}
        </HelpWrapper>
      )}
    </LabelViewWrapper>
  ))
    .setPropertyViewFn((children) => (
      <Section name={trans("label")}>
        {children.text.propertyView({ label: trans("labelProp.text") })}
        {children.tooltip.propertyView({ label: trans("labelProp.tooltip") })}
        {children.position.propertyView({ label: trans("labelProp.position"), radioButton: true })}
        {children.align.propertyView({ label: trans("labelProp.align"), radioButton: true })}
        {children.position.getView() !== "column" &&
          children.width.propertyView({
            label: trans("labelProp.width"),
            tooltip: trans("labelProp.widthTooltip"),
            lastNode: children.widthUnit.propertyView({}),
          })}
      </Section>
    ))
    .build();
})();
