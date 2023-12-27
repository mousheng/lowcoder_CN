import { Tooltip } from "antd";
import { getThemeDetailName, isThemeColorKey, ThemeDetail } from "api/commonSettingApi";
import { ControlItemCompBuilder } from "comps/generators/controlCompBuilder";
import { childrenToProps, ToConstructor } from "comps/generators/multi";
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { ThemeContext } from "comps/utils/themeContext";
import { trans } from "i18n";
import _ from "lodash";
import {
  controlItem,
  IconRadius,
  IconReset,
  ExpandIcon,
  CompressIcon,
  TextSizeIcon,
} from "lowcoder-design";
import { useContext } from "react";
import styled from "styled-components";
import { useIsMobile } from "util/hooks";
import { RadiusControl, StringControl } from "./codeControl";
import { ColorControl } from "./colorControl";
import {
  defaultTheme,
  DepColorConfig,
  DEP_TYPE,
  RadiusConfig,
  SimpleColorConfig,
  SingleColorConfig,
  MarginConfig,
  PaddingConfig,
  TextSizeConfig,
  BorderWidthConfig,
} from "./styleControlConstants";

function isSimpleColorConfig(config: SingleColorConfig): config is SimpleColorConfig {
  return config.hasOwnProperty("color");
}

function isDepColorConfig(config: SingleColorConfig): config is DepColorConfig {
  return config.hasOwnProperty("depName") || config.hasOwnProperty("depTheme");
}

function isRadiusConfig(config: SingleColorConfig): config is RadiusConfig {
  return config.hasOwnProperty("radius");
}

function isBorderWidthConfig(config: SingleColorConfig): config is BorderWidthConfig {
  return config.hasOwnProperty("borderWidth");
}

function isTextSizeConfig(config: SingleColorConfig): config is TextSizeConfig {
  return config.hasOwnProperty("textSize");
}

function isMarginConfig(config: SingleColorConfig): config is MarginConfig {	
  return config.hasOwnProperty("margin");	
}	

function isPaddingConfig(config: SingleColorConfig): config is PaddingConfig {	
  return config.hasOwnProperty("padding");	
}

// function styleControl(colorConfig: Array<SingleColorConfig>) {
type Names<T extends readonly SingleColorConfig[]> = T[number]["name"];
export type StyleConfigType<T extends readonly SingleColorConfig[]> = { [K in Names<T>]: string };

// Options[number]["value"]
function isEmptyColor(color: string) {
  return _.isEmpty(color);
}

function isEmptyRadius(radius: string) {
  return _.isEmpty(radius);
}
function isEmptyBorderWidth(borderWidth: string) {
  return _.isEmpty(borderWidth);
}
function isEmptyTextSize(textSize: string) {
  return _.isEmpty(textSize);
}

function isEmptyMargin(margin: string) {	
  return _.isEmpty(margin);	
}	
function isEmptyPadding(padding: string) {	
  return _.isEmpty(padding);	
}

/**
 * Calculate the actual used color from the dsl color
 */
function calcColors<ColorMap extends Record<string, string>>(
  props: ColorMap,
  colorConfigs: readonly SingleColorConfig[],
  theme?: ThemeDetail,
  bgColor?: string
) {
  const themeWithDefault = (theme || defaultTheme) as unknown as Record<string, string>;
  // Cover what is not there for the first pass
  let res: Record<string, string> = {};
  colorConfigs.forEach((config) => {
    const name = config.name;
    if (!isEmptyRadius(props[name]) && isRadiusConfig(config)) {	
      res[name] = props[name];	
      return;	
    }
    if (!isEmptyBorderWidth(props[name]) && isBorderWidthConfig(config)) {	
      res[name] = props[name];	
      return;	
    }
    if (!isEmptyTextSize(props[name]) && isTextSizeConfig(config)) {	
      res[name] = props[name];	
      return;	
    }	
    if (!isEmptyMargin(props[name]) && isMarginConfig(config)) {	
      res[name] = props[name];	
      return;	
    }	
    if (!isEmptyPadding(props[name]) && isPaddingConfig(config)) {	
      res[name] = props[name];	
      return;	
    }
    if (!isEmptyColor(props[name])) {
      if (isThemeColorKey(props[name])) {
        res[name] = themeWithDefault[props[name]];
      } else {
        res[name] = props[name];
      }
      return;
    }
    if (isSimpleColorConfig(config)) {
      res[name] = config.color;
    }
    if (isRadiusConfig(config)) {
      res[name] = themeWithDefault[config.radius];
    }
    if (isBorderWidthConfig(config)) {
      res[name] = '0px';
    }
    if (isTextSizeConfig(config)) {
      // TODO: remove default textSize after added in theme in backend.
      res[name] = themeWithDefault[config.textSize] || '14px';
    }
    if (isMarginConfig(config)) {	
      res[name] = themeWithDefault[config.margin];	
    }	
    if (isPaddingConfig(config)) {	
      res[name] = themeWithDefault[config.padding];	
    }
  });
  // The second pass calculates dep
  colorConfigs.forEach((config) => {
    const name = config.name;
    if (!isEmptyColor(props[name])) {
      return;
    }
    if (isDepColorConfig(config)) {
      if (config.depType && config.depType === DEP_TYPE.CONTRAST_TEXT) {
        // bgColor is the background color of the container component, equivalent to canvas
        let depKey = config.depName ? res[config.depName] : themeWithDefault[config.depTheme!];
        if (bgColor && config.depTheme === "canvas") {
          depKey = bgColor;
        }
        res[name] = config.transformer(
          depKey,
          themeWithDefault.textDark,
          themeWithDefault.textLight
        );
      } else if (config?.depType === DEP_TYPE.SELF && config.depTheme === "canvas" && bgColor) {
        res[name] = bgColor;
      } else {
        const rest = [];
        config.depName && rest.push(res[config.depName]);
        config.depTheme && rest.push(themeWithDefault[config.depTheme]);
        res[name] = config.transformer(rest[0], rest[1]);
      }
    }
  });
  return res as ColorMap;
}

const TitleDiv = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  line-height: 1;

  span:nth-of-type(2) {
    cursor: pointer;
    color: #8b8fa3;
    display: inline-flex;
    align-items: center;
  }
`;

const StyleContent = styled.div`
  border: 1.07px solid #d7d9e0;
  border-radius: 6px;

  .cm-editor,
  .cm-editor:hover,
  .cm-editor.cm-focused {
    border: none;
    box-shadow: none;
  }

  > div {
    padding: 1px 0 1px 12px;
    border-bottom: 1px solid #d7d9e0;

    &:hover,
    &:focus {
      background: #fafafa;

      .cm-content {
        background: #fafafa;
      }
    }

    > div {
      align-items: center;
      flex-direction: row;
      gap: 0;

      > div:nth-of-type(1) {
        flex: 0 0 96px;

        div {
          line-height: 30px;
        }
      }

      > svg {
        height: 30px;
      }

      > div:nth-of-type(2) {
        flex: 1 1 auto;
      }
    }
  }

  > div:nth-of-type(1) {
    border-radius: 6px 6px 0 0;
  }

  > div:nth-last-of-type(1) {
    border: none;
    border-radius: 0 0 6px 6px;
  }
`;

const RadiusIcon = styled(IconRadius)`
  margin: 0 8px 0 -2px;
`;

const MarginIcon = styled(ExpandIcon)`	
margin: 0 8px 0 -2px;	
`;	
const PaddingIcon = styled(CompressIcon)`	
margin: 0 8px 0 -2px;	
`;
const StyledTextSizeIcon = styled(TextSizeIcon)`	
margin: 0 8px 0 -2px;	
`;
const ResetIcon = styled(IconReset)`
  &:hover g g {
    stroke: #315efb;
  }
`;

export function styleControl<T extends readonly SingleColorConfig[]>(colorConfigs: T, label?: string) {
  type ColorMap = { [K in Names<T>]: string };
  const childrenMap: any = {};
  colorConfigs.map((config) => {
    const name: Names<T> = config.name;
    if (	
      name === "radius" ||
      name === "borderWidth" ||
      name === "cardRadius" ||
      name === "fontSize" ||
      name === "textSize"
    ) {	
      childrenMap[name] = StringControl;	
    } else if (name === "margin" || name === "padding" || name==="containerheaderpadding" || name==="containerfooterpadding" || name==="containerbodypadding") {	
      childrenMap[name] = StringControl;	
    } else {	
      childrenMap[name] = ColorControl;	
    }
  });
  // [K in Names<T>]: new (params: CompParams<any>) => ColorControl;
  label = label ?? trans("prop.style");
  return new ControlItemCompBuilder(
    childrenMap as ToConstructor<{ [K in Names<T>]: ColorControl }>,
    (props) => {
      // const x = useContext(CompNameContext);
      const theme = useContext(ThemeContext);
      const bgColor = useContext(BackgroundColorContext);
      return calcColors(props as ColorMap, colorConfigs, theme?.theme, bgColor);
    }
  )
    .setControlItemData({ filterText: label, searchChild: true })
    .setPropertyViewFn((children) => {
      const theme = useContext(ThemeContext);
      const bgColor = useContext(BackgroundColorContext);
      const isMobile = useIsMobile();

      const props = calcColors(
        childrenToProps(children) as ColorMap,
        colorConfigs,
        theme?.theme,
        bgColor
      );
      const showReset = Object.values(childrenToProps(children)).findIndex((item) => item) > -1;
      return (
        <>
          <TitleDiv>
            <span>{label}</span>
            {showReset && (
              <span
                onClick={() => {
                  colorConfigs.map((item) => {
                    const name: Names<T> = item.name;
                    if (	
                      name === "radius" ||	
                      name === "margin" ||	
                      name === "padding" ||
                      name==="containerheaderpadding"	||
                      name==="containerfooterpadding"	||
                      name==="containerbodypadding"
                    ) {
                      children[name]?.dispatchChangeValueAction("");
                    } else {
                      children[name] &&
                        children[name].dispatch(children[name].changeValueAction(""));
                    }
                  });
                }}
              >
                <Tooltip placement="topRight" title={trans("style.resetTooltip")}>
                  <ResetIcon title="" />
                </Tooltip>
              </span>
            )}
          </TitleDiv>
          <StyleContent>
            {colorConfigs
              .filter(
                (config) =>
                  !config.platform ||
                  (isMobile && config.platform === "mobile") ||
                  (!isMobile && config.platform === "pc")
              )
              .map((config, index) => {
                const name: Names<T> = config.name;
                let depMsg = (config as SimpleColorConfig)["color"];
                if (isDepColorConfig(config)) {
                  if (config.depType === DEP_TYPE.CONTRAST_TEXT) {
                    depMsg = trans("style.contrastText");
                  } else if (config.depType === DEP_TYPE.SELF && config.depTheme) {
                    depMsg = getThemeDetailName(config.depTheme);
                  } else {
                    depMsg = trans("style.generated");
                  }
                }
                return controlItem(
                  { filterText: config.label },
                  <div key={index}>	
                    {(name === "radius" ||
                    name === "borderWidth" ||
                    name === "gap" ||	
                    name === "cardRadius")
                      ? (	
                          children[name] as InstanceType<typeof StringControl>	
                        ).propertyView({	
                          label: config.label,	
                          preInputNode: <RadiusIcon title="" />,	
                          placeholder: props[name],	
                        })	
                      : name === "margin"	
                      ? (	
                          children[name] as InstanceType<typeof StringControl>	
                        ).propertyView({	
                          label: config.label,	
                          preInputNode: <MarginIcon title="" />,	
                          placeholder: props[name],	
                        })	
                      : (name === "padding" ||
                      name === "containerheaderpadding"	||
                      name === "containerfooterpadding"	||
                      name === "containerbodypadding")
                      ? (	
                          children[name] as InstanceType<typeof StringControl>	
                        ).propertyView({	
                          label: config.label,	
                          preInputNode: <PaddingIcon title="" />,	
                          placeholder: props[name],	
                        })	
                      : name === "textSize"
                      ? (	
                          children[name] as InstanceType<typeof StringControl>	
                        ).propertyView({	
                          label: config.label,	
                          preInputNode: <StyledTextSizeIcon title="" />,	
                          placeholder: props[name],	
                        })
                      : children[name].propertyView({	
                          label: config.label,	
                          panelDefaultColor: props[name],	
                          // isDep: isDepColorConfig(config),	
                          isDep: true,	
                          depMsg: depMsg,	
                        })}	
                  </div>
                );
              })}
          </StyleContent>
        </>
      );
    })
    .build();
}

export function useStyle<T extends readonly SingleColorConfig[]>(colorConfigs: T) {
  const theme = useContext(ThemeContext);
  const bgColor = useContext(BackgroundColorContext);
  type ColorMap = { [K in Names<T>]: string };
  const props = {} as ColorMap;
  colorConfigs.forEach((config) => {
    props[config.name as Names<T>] = "";
  });
  return calcColors(props, colorConfigs, theme?.theme, bgColor);
}
