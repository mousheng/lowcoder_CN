import { CompAction, RecordConstructorToView, changeChildAction } from "lowcoder-core";
import { BoolControl } from "comps/controls/boolControl";
import { stringExposingStateControl } from "comps/controls/codeStateControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { styleControl } from "comps/controls/styleControl";
import { QRCodeStyle, QRCodeStyleType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { NameConfig, NameConfigHidden, withExposingConfigs } from "comps/generators/withExposing";
import { Section, messageInstance, sectionNames } from "lowcoder-design";
import { hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { StringControl } from "comps/controls/codeControl";
import { QRCode } from "antd";
import ReactResizeDetector from "react-resize-detector";
import { clickEvent, eventHandlerControl, refreshEvent } from "../controls/eventHandlerControl";
import styled, { css } from "styled-components";
import { useEffect, useRef, useState, useContext } from "react";
import { stateComp, withDefault } from "../generators";
import { EditorContext } from "comps/editorState";

// TODO: add styling for image (size)
// TODO: add styling for bouding box (individual backround)

const Container = styled.div<{ $style: QRCodeStyleType | undefined }>`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  svg {
    object-fit: contain;
    pointer-events: auto;
  }
  ${(props) => props.$style && getStyle(props.$style)}
`;

const getStyle = (style: QRCodeStyleType) => {
  return css`
    svg {
     color: ${style.color};
    }
    padding: ${style.padding};
    border-radius: ${style.radius};
    margin: ${style.margin};
    max-width: ${widthCalculator(style.margin)};
    max-height: ${heightCalculator(style.margin)};
  `;
};

const levelOptions = [
  { label: trans("QRCode.L"), value: "L" },
  { label: trans("QRCode.M"), value: "M" },
  { label: trans("QRCode.Q"), value: "Q" },
  { label: trans("QRCode.H"), value: "H" },
] as const;

const statusOptions = [
  { label: trans("QRCode.active"), value: "active" },
  { label: trans("QRCode.expired"), value: "expired" },
  { label: trans("QRCode.loading"), value: "loading" },
] as const;

const typeOptions = [
  { label: "canvas", value: "canvas" },
  { label: "svg", value: "svg" },
] as const;

const EventOptions = [clickEvent, refreshEvent] as const;

const childrenMap = {
  value: withDefault(stringExposingStateControl("value"), 'https://lowcoder.mousheng.top'),
  level: dropdownControl(levelOptions, "M"),
  includeMargin: BoolControl.DEFAULT_TRUE,
  image: StringControl,
  style: styleControl(QRCodeStyle),
  statusOption: dropdownControl(statusOptions, 'active'),
  status: stringExposingStateControl('status', 'active'),
  renderType: dropdownControl(typeOptions, 'canvas'),
  onEvent: eventHandlerControl(EventOptions),
  dataURL: stateComp<string>(""),
  compID: stateComp<string>(Math.random().toString()),
};

const downloadQR = (dataURL: string, fileName: string): void => {
  const a = document.createElement('a');
  a.download = fileName;
  a.href = dataURL;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const getImagesData = (value: string, image: string, compID: string, renderType: string, dispatch: (action: CompAction) => void, download = false, fileName = "qrcoder") => {
  var dataURL = ''
  if (image === '' && value !== '') {
    const element = document.getElementById(compID)
    if (renderType === 'canvas') {
      const canvas = element?.querySelector<HTMLCanvasElement>('canvas');
      dataURL = canvas?.toDataURL ? canvas?.toDataURL() : ''
    } else {
      const svg = element?.querySelector('svg')
      dataURL = svg ? 'data:image/svg+xml;base64,' + window.btoa(new XMLSerializer().serializeToString(svg)) : ''
    }
    dispatch(changeChildAction("dataURL", dataURL, false));
  } else {
    dispatch(changeChildAction("dataURL", '', false));
    if (download && image) {
      messageInstance.error(trans("QRCode.fail"), 2)
    }
    return
  }
  download && downloadQR(dataURL, fileName)
}

const QRCodeView = (props: RecordConstructorToView<typeof childrenMap> & { dispatch: (action: CompAction) => void; }) => {
  const value = props.value.value;
  const { renderType, image } = props;
  const conRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    setTimeout(() => {
      getImagesData(props.value.value, props.image, props.compID, props.renderType, props.dispatch)
    }, 10);
  }, [value, props.image, props.renderType, props.style.background, props.style.color])
  useEffect(() => {
    if (height && width) {
      onResize();
    }
  }, [height, width]);

  useEffect(() => {
    props.status.onChange(props.statusOption)
  }, [props.statusOption])

  const onResize = () => {
    const container = conRef.current;
    setWidth(container?.clientWidth ?? 0);
    setHeight(container?.clientHeight ?? 0);
  };
  if (value.length > 2953) {
    return <>{trans("QRCode.maxLength")}</>;
  }
  const onRefresh = () => {
    props.onEvent('refresh');
  }
  return (
    <ReactResizeDetector onResize={onResize}>
      <Container
        id={props.compID}
        ref={conRef}
        $style={props.style}
        onClick={(e) => {
          props.onEvent("click")
        }}
      >
        {
          (
            <QRCode
              value={value || '-'}
              icon={image}
              status={props.status.value as "active" | "expired" | "loading"}
              bordered={props.includeMargin}
              onRefresh={onRefresh}
              color={props.style.color}
              bgColor={props.style.background}
              errorLevel={props.level}
              type={renderType}
              size={height > width ? width - 5 : height}
              iconSize={height > width ? width / 4 : height / 4}
              style={{
                borderRadius: props.style.radius,
              }}
            />
          )}
      </Container>
    </ReactResizeDetector >
  );
};

let QRCodeBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props, dispatch) => <QRCodeView {...props} dispatch={dispatch} />)
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.renderType.propertyView({
            label: trans("QRCode.renderType"),
            radioButton: true,
          })}
          {children.value.propertyView({
            label: trans("QRCode.value"),
            tooltip: trans("QRCode.valueTooltip"),
            placeholder: "https://example.com",
          })}
        </Section>

        {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <><Section name={sectionNames.interaction}>
            {hiddenPropertyView(children)}
          </Section>
            <Section name={sectionNames.advanced}>
              {children.level.propertyView({
                label: trans("QRCode.level"),
                tooltip: trans("QRCode.levelTooltip"),
              })}
              {children.image.propertyView({
                label: trans("QRCode.image"),
                placeholder: "http://logo.jpg",
              })}
              {children.statusOption.propertyView({ label: trans("QRCode.status") })}
            </Section>
          </>
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <Section name={sectionNames.style}>
            {children.style.getPropertyView()}
            {children.includeMargin.propertyView({ label: trans("QRCode.includeMargin") })}
            {children.onEvent.propertyView()}

          </Section>
        )}
      </>
    ))
    .setExposeMethodConfigs([
      {
        method: {
          name: "download",
          description: trans("QRCode.downloadQR"),
          params: [{ name: trans("QRCode.fileName"), type: "string", description: trans("QRCode.fileName") }],
        },
        execute: async (comp, params) => {
          getImagesData(
            comp.children.value.getView().value,
            comp.children.image.getView(),
            comp.children.compID.getView(),
            comp.children.renderType.getView(),
            comp.dispatch,
            true,
            params[0] as string
          )
        },
      }])
    .build();
})();

QRCodeBasicComp = class extends QRCodeBasicComp {
  override autoHeight(): boolean {
    return false;
  }
};

export const QRCodeComp = withExposingConfigs(QRCodeBasicComp, [
  new NameConfig("value", trans("QRCode.valueDesc")),
  new NameConfig("dataURL", trans("QRCode.dataURL")),
  new NameConfig("status", trans("QRCode.status")),
  NameConfigHidden,
]);
